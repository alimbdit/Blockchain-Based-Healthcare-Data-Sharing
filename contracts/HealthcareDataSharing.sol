// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title HealthcareDataSharing
 * @dev Decentralized, secure, patient-centric healthcare record management system.
 * Implements patient-controlled access, AES/IPFS hash verification, immutable audit logging,
 * and multi-role authorization (Patient, Doctor, Hospital, Admin).
 */
contract HealthcareDataSharing {
    address public admin;

    // Roles and Entities
    struct Patient {
        address wallet;
        string name;
        string dateOfBirth;
        string gender;
        string bloodGroup;
        string contact;
        string emergencyContact;
        bool isRegistered;
        uint256 registrationTime;
        uint256[] recordIds;
    }

    struct Doctor {
        address wallet;
        string name;
        string licenseNumber;
        string specialization;
        string hospitalAffiliation;
        bool isRegistered;
        bool isApproved;
        uint256 registrationTime;
    }

    struct Hospital {
        address wallet;
        string name;
        string licenseId;
        string physicalAddress;
        string contactPhone;
        bool isRegistered;
        bool isApproved;
        uint256 registrationTime;
    }

    struct MedicalRecord {
        uint256 id;
        address patient;
        address uploader;
        string title;
        string recordType;        // "Lab Report", "Prescription", "Radiology", "Discharge Summary"
        string ipfsHash;          // IPFS CID of encrypted file
        string fileChecksum;      // SHA-256 integrity hash
        string encryptedKeyHash;  // Encrypted symmetric key reference
        uint256 fileSize;         // in bytes
        string mimeType;
        uint256 timestamp;
        bool isRevoked;
    }

    struct AccessPermission {
        bool isGranted;
        bool canRead;
        bool canWrite;
        uint256 validUntil;       // 0 = perpetual until revoked
        uint256 grantedAt;
        uint256 revokedAt;
    }

    struct AuditLog {
        uint256 id;
        uint256 timestamp;
        address actor;
        string role;              // "ADMIN", "PATIENT", "DOCTOR", "HOSPITAL"
        string action;            // "REGISTER", "UPLOAD", "GRANT_ACCESS", "REVOKE_ACCESS", "VIEW_RECORD", "EMERGENCY_ACCESS"
        uint256 recordId;
        string details;
        uint256 blockNumber;
    }

    // Storage Mappings
    mapping(address => Patient) public patients;
    mapping(address => Doctor) public doctors;
    mapping(address => Hospital) public hospitals;
    mapping(uint256 => MedicalRecord) public records;

    // Permissions: recordId => accessor => AccessPermission
    mapping(uint256 => mapping(address => AccessPermission)) public recordPermissions;
    // Global patient permission: patient => accessor => AccessPermission
    mapping(address => mapping(address => AccessPermission)) public patientPermissions;

    // Arrays for enumeration
    address[] public patientAddresses;
    address[] public doctorAddresses;
    address[] public hospitalAddresses;
    AuditLog[] private auditLogs;

    uint256 public nextRecordId = 1;
    uint256 public nextAuditLogId = 1;

    // Events for DApp listeners and indexing
    event PatientRegistered(address indexed patient, string name, uint256 timestamp);
    event DoctorRegistered(address indexed doctor, string name, string licenseNumber, uint256 timestamp);
    event HospitalRegistered(address indexed hospital, string name, string licenseId, uint256 timestamp);
    event DoctorApprovalChanged(address indexed doctor, bool isApproved, uint256 timestamp);
    event HospitalApprovalChanged(address indexed hospital, bool isApproved, uint256 timestamp);
    event RecordUploaded(uint256 indexed recordId, address indexed patient, address indexed uploader, string ipfsHash, uint256 timestamp);
    event AccessGranted(uint256 indexed recordId, address indexed patient, address indexed accessor, uint256 validUntil, bool canWrite);
    event AccessRevoked(uint256 indexed recordId, address indexed patient, address indexed accessor, uint256 timestamp);
    event GlobalAccessGranted(address indexed patient, address indexed accessor, uint256 validUntil, bool canWrite);
    event GlobalAccessRevoked(address indexed patient, address indexed accessor, uint256 timestamp);
    event RecordAccessed(uint256 indexed recordId, address indexed accessor, string purpose, uint256 timestamp);
    event EmergencyAccessTriggered(uint256 indexed recordId, address indexed doctor, string justification, uint256 timestamp);
    event AuditLogged(uint256 indexed logId, address indexed actor, string action, uint256 indexed recordId, uint256 timestamp);

    // Modifiers
    modifier onlyAdmin() {
        require(msg.sender == admin, "Not admin");
        _;
    }

    modifier onlyRegisteredPatient() {
        require(patients[msg.sender].isRegistered, "Not registered patient");
        _;
    }

    modifier onlyRegisteredDoctor() {
        require(doctors[msg.sender].isRegistered, "Not registered doctor");
        _;
    }

    modifier onlyApprovedDoctor() {
        require(doctors[msg.sender].isRegistered && doctors[msg.sender].isApproved, "Doctor not approved");
        _;
    }

    modifier recordExists(uint256 _recordId) {
        require(_recordId > 0 && _recordId < nextRecordId, "Record not found");
        _;
    }

    constructor() {
        admin = msg.sender;
        _logAudit(msg.sender, "ADMIN", "SYSTEM_INIT", 0, "Healthcare contract deployed");
    }

    function changeAdmin(address _newAdmin) external onlyAdmin {
        require(_newAdmin != address(0), "Zero address");
        admin = _newAdmin;
        _logAudit(msg.sender, "ADMIN", "CHANGE_ADMIN", 0, "Admin changed");
    }

    // ==========================================
    // Registration Functions
    // ==========================================

    function registerPatient(
        string calldata _name,
        string calldata _dateOfBirth,
        string calldata _gender,
        string calldata _bloodGroup,
        string calldata _contact,
        string calldata _emergencyContact
    ) external {
        require(!patients[msg.sender].isRegistered, "Patient already registered");
        require(bytes(_name).length > 0, "Empty name");

        Patient storage p = patients[msg.sender];
        p.wallet = msg.sender;
        p.name = _name;
        p.dateOfBirth = _dateOfBirth;
        p.gender = _gender;
        p.bloodGroup = _bloodGroup;
        p.contact = _contact;
        p.emergencyContact = _emergencyContact;
        p.isRegistered = true;
        p.registrationTime = block.timestamp;

        patientAddresses.push(msg.sender);

        emit PatientRegistered(msg.sender, _name, block.timestamp);
        _logAudit(msg.sender, "PATIENT", "REGISTER", 0, string(abi.encodePacked("Registered: ", _name)));
    }

    function registerDoctor(
        string calldata _name,
        string calldata _licenseNumber,
        string calldata _specialization,
        string calldata _hospitalAffiliation
    ) external {
        require(!doctors[msg.sender].isRegistered, "Doctor already registered");
        require(bytes(_name).length > 0, "Empty name");
        require(bytes(_licenseNumber).length > 0, "Empty license");

        doctors[msg.sender] = Doctor({
            wallet: msg.sender,
            name: _name,
            licenseNumber: _licenseNumber,
            specialization: _specialization,
            hospitalAffiliation: _hospitalAffiliation,
            isRegistered: true,
            isApproved: false,
            registrationTime: block.timestamp
        });

        doctorAddresses.push(msg.sender);

        emit DoctorRegistered(msg.sender, _name, _licenseNumber, block.timestamp);
        _logAudit(msg.sender, "DOCTOR", "REGISTER", 0, string(abi.encodePacked("Doctor registered: ", _name)));
    }

    function registerHospital(
        string calldata _name,
        string calldata _licenseId,
        string calldata _physicalAddress,
        string calldata _contactPhone
    ) external {
        require(!hospitals[msg.sender].isRegistered, "Hospital already registered");
        require(bytes(_name).length > 0, "Empty name");

        hospitals[msg.sender] = Hospital({
            wallet: msg.sender,
            name: _name,
            licenseId: _licenseId,
            physicalAddress: _physicalAddress,
            contactPhone: _contactPhone,
            isRegistered: true,
            isApproved: false,
            registrationTime: block.timestamp
        });

        hospitalAddresses.push(msg.sender);

        emit HospitalRegistered(msg.sender, _name, _licenseId, block.timestamp);
        _logAudit(msg.sender, "HOSPITAL", "REGISTER", 0, string(abi.encodePacked("Hospital registered: ", _name)));
    }

    // ==========================================
    // Administrator Approvals
    // ==========================================

    function approveDoctor(address _doctor, bool _approved) external onlyAdmin {
        require(doctors[_doctor].isRegistered, "Doctor not registered");
        doctors[_doctor].isApproved = _approved;
        emit DoctorApprovalChanged(_doctor, _approved, block.timestamp);
        _logAudit(msg.sender, "ADMIN", _approved ? "APPROVE_DOCTOR" : "REVOKE_DOCTOR", 0, doctors[_doctor].name);
    }

    function approveHospital(address _hospital, bool _approved) external onlyAdmin {
        require(hospitals[_hospital].isRegistered, "Hospital not registered");
        hospitals[_hospital].isApproved = _approved;
        emit HospitalApprovalChanged(_hospital, _approved, block.timestamp);
        _logAudit(msg.sender, "ADMIN", _approved ? "APPROVE_HOSPITAL" : "REVOKE_HOSPITAL", 0, hospitals[_hospital].name);
    }

    // ==========================================
    // Medical Record Upload & Management
    // ==========================================

    function uploadRecord(
        string calldata _title,
        string calldata _recordType,
        string calldata _ipfsHash,
        string calldata _fileChecksum,
        string calldata _encryptedKeyHash,
        uint256 _fileSize,
        string calldata _mimeType
    ) external onlyRegisteredPatient returns (uint256) {
        require(bytes(_title).length > 0, "Empty title");
        require(bytes(_ipfsHash).length > 0, "Empty IPFS hash");
        require(bytes(_fileChecksum).length > 0, "Empty checksum");

        uint256 recordId = nextRecordId++;

        records[recordId] = MedicalRecord({
            id: recordId,
            patient: msg.sender,
            uploader: msg.sender,
            title: _title,
            recordType: _recordType,
            ipfsHash: _ipfsHash,
            fileChecksum: _fileChecksum,
            encryptedKeyHash: _encryptedKeyHash,
            fileSize: _fileSize,
            mimeType: _mimeType,
            timestamp: block.timestamp,
            isRevoked: false
        });

        patients[msg.sender].recordIds.push(recordId);

        emit RecordUploaded(recordId, msg.sender, msg.sender, _ipfsHash, block.timestamp);
        _logAudit(msg.sender, "PATIENT", "UPLOAD_RECORD", recordId, _title);

        return recordId;
    }

    function doctorUploadRecordForPatient(
        address _patient,
        string calldata _title,
        string calldata _recordType,
        string calldata _ipfsHash,
        string calldata _fileChecksum,
        string calldata _encryptedKeyHash,
        uint256 _fileSize,
        string calldata _mimeType
    ) external onlyApprovedDoctor returns (uint256) {
        require(patients[_patient].isRegistered, "Patient not registered");
        (bool hasAccess, bool canWrite) = checkPatientGlobalAccess(_patient, msg.sender);
        require(hasAccess && canWrite, "No doctor write access");

        uint256 recordId = nextRecordId++;

        records[recordId] = MedicalRecord({
            id: recordId,
            patient: _patient,
            uploader: msg.sender,
            title: _title,
            recordType: _recordType,
            ipfsHash: _ipfsHash,
            fileChecksum: _fileChecksum,
            encryptedKeyHash: _encryptedKeyHash,
            fileSize: _fileSize,
            mimeType: _mimeType,
            timestamp: block.timestamp,
            isRevoked: false
        });

        patients[_patient].recordIds.push(recordId);

        recordPermissions[recordId][msg.sender] = AccessPermission({
            isGranted: true,
            canRead: true,
            canWrite: true,
            validUntil: 0,
            grantedAt: block.timestamp,
            revokedAt: 0
        });

        emit RecordUploaded(recordId, _patient, msg.sender, _ipfsHash, block.timestamp);
        _logAudit(msg.sender, "DOCTOR", "DOCTOR_UPLOAD_RECORD", recordId, _title);

        return recordId;
    }

    // ==========================================
    // Patient-Controlled Access & Sharing
    // ==========================================

    function grantRecordAccess(
        uint256 _recordId,
        address _accessor,
        uint256 _durationInSeconds,
        bool _canWrite
    ) external recordExists(_recordId) {
        require(records[_recordId].patient == msg.sender, "Not record owner");
        require(_accessor != address(0) && _accessor != msg.sender, "Invalid accessor");

        uint256 validUntil = _durationInSeconds == 0 ? 0 : block.timestamp + _durationInSeconds;

        recordPermissions[_recordId][_accessor] = AccessPermission({
            isGranted: true,
            canRead: true,
            canWrite: _canWrite,
            validUntil: validUntil,
            grantedAt: block.timestamp,
            revokedAt: 0
        });

        emit AccessGranted(_recordId, msg.sender, _accessor, validUntil, _canWrite);
        _logAudit(msg.sender, "PATIENT", "GRANT_ACCESS", _recordId, "Record access granted");
    }

    function revokeRecordAccess(
        uint256 _recordId,
        address _accessor
    ) external recordExists(_recordId) {
        require(records[_recordId].patient == msg.sender, "Not record owner");
        require(recordPermissions[_recordId][_accessor].isGranted, "Access not granted");

        recordPermissions[_recordId][_accessor].isGranted = false;
        recordPermissions[_recordId][_accessor].canRead = false;
        recordPermissions[_recordId][_accessor].canWrite = false;
        recordPermissions[_recordId][_accessor].revokedAt = block.timestamp;

        emit AccessRevoked(_recordId, msg.sender, _accessor, block.timestamp);
        _logAudit(msg.sender, "PATIENT", "REVOKE_ACCESS", _recordId, "Record access revoked");
    }

    function grantGlobalPatientAccess(
        address _accessor,
        uint256 _durationInSeconds,
        bool _canWrite
    ) external onlyRegisteredPatient {
        require(_accessor != address(0) && _accessor != msg.sender, "Invalid accessor");

        uint256 validUntil = _durationInSeconds == 0 ? 0 : block.timestamp + _durationInSeconds;

        patientPermissions[msg.sender][_accessor] = AccessPermission({
            isGranted: true,
            canRead: true,
            canWrite: _canWrite,
            validUntil: validUntil,
            grantedAt: block.timestamp,
            revokedAt: 0
        });

        emit GlobalAccessGranted(msg.sender, _accessor, validUntil, _canWrite);
        _logAudit(msg.sender, "PATIENT", "GRANT_GLOBAL_ACCESS", 0, "Global access granted");
    }

    function revokeGlobalPatientAccess(address _accessor) external onlyRegisteredPatient {
        require(patientPermissions[msg.sender][_accessor].isGranted, "Global access not granted");

        patientPermissions[msg.sender][_accessor].isGranted = false;
        patientPermissions[msg.sender][_accessor].canRead = false;
        patientPermissions[msg.sender][_accessor].canWrite = false;
        patientPermissions[msg.sender][_accessor].revokedAt = block.timestamp;

        emit GlobalAccessRevoked(msg.sender, _accessor, block.timestamp);
        _logAudit(msg.sender, "PATIENT", "REVOKE_GLOBAL_ACCESS", 0, "Global access revoked");
    }

    // ==========================================
    // Access Verification & Audit Logging
    // ==========================================

    function checkAccess(uint256 _recordId, address _accessor) public view recordExists(_recordId) returns (bool hasAccess, bool canWrite) {
        MedicalRecord storage rec = records[_recordId];

        if (rec.patient == _accessor) {
            return (true, true);
        }

        if (_accessor == admin) {
            return (true, false);
        }

        AccessPermission storage recPerm = recordPermissions[_recordId][_accessor];
        if (recPerm.isGranted) {
            if (recPerm.validUntil == 0 || block.timestamp <= recPerm.validUntil) {
                return (true, recPerm.canWrite);
            }
        }

        AccessPermission storage patPerm = patientPermissions[rec.patient][_accessor];
        if (patPerm.isGranted) {
            if (patPerm.validUntil == 0 || block.timestamp <= patPerm.validUntil) {
                return (true, patPerm.canWrite);
            }
        }

        return (false, false);
    }

    function checkPatientGlobalAccess(address _patient, address _accessor) public view returns (bool hasAccess, bool canWrite) {
        if (_patient == _accessor || _accessor == admin) {
            return (true, true);
        }
        AccessPermission storage patPerm = patientPermissions[_patient][_accessor];
        if (patPerm.isGranted) {
            if (patPerm.validUntil == 0 || block.timestamp <= patPerm.validUntil) {
                return (true, patPerm.canWrite);
            }
        }
        return (false, false);
    }

    function accessRecord(uint256 _recordId, string calldata _purpose) external recordExists(_recordId) {
        (bool hasAccess, ) = checkAccess(_recordId, msg.sender);
        require(hasAccess, "Unauthorized record access");

        string memory role = "GUEST";
        if (msg.sender == records[_recordId].patient) role = "PATIENT";
        else if (doctors[msg.sender].isRegistered) role = "DOCTOR";
        else if (hospitals[msg.sender].isRegistered) role = "HOSPITAL";
        else if (msg.sender == admin) role = "ADMIN";

        emit RecordAccessed(_recordId, msg.sender, _purpose, block.timestamp);
        _logAudit(msg.sender, role, "VIEW_RECORD", _recordId, _purpose);
    }

    function emergencyAccess(uint256 _recordId, string calldata _justification) external onlyApprovedDoctor recordExists(_recordId) {
        require(bytes(_justification).length > 0, "Emergency justification required");

        emit EmergencyAccessTriggered(_recordId, msg.sender, _justification, block.timestamp);
        _logAudit(
            msg.sender,
            "DOCTOR",
            "EMERGENCY_ACCESS",
            _recordId,
            string(abi.encodePacked("Break-glass emergency: ", _justification))
        );
    }

    // ==========================================
    // Query / View Getters
    // ==========================================

    function getPatient(address _patient) external view returns (
        string memory name,
        string memory dateOfBirth,
        string memory gender,
        string memory bloodGroup,
        string memory contact,
        string memory emergencyContact,
        bool isRegistered,
        uint256 registrationTime,
        uint256[] memory recordIds
    ) {
        Patient storage p = patients[_patient];
        return (
            p.name,
            p.dateOfBirth,
            p.gender,
            p.bloodGroup,
            p.contact,
            p.emergencyContact,
            p.isRegistered,
            p.registrationTime,
            p.recordIds
        );
    }

    function getDoctor(address _doctor) external view returns (
        string memory name,
        string memory licenseNumber,
        string memory specialization,
        string memory hospitalAffiliation,
        bool isRegistered,
        bool isApproved,
        uint256 registrationTime
    ) {
        Doctor storage d = doctors[_doctor];
        return (
            d.name,
            d.licenseNumber,
            d.specialization,
            d.hospitalAffiliation,
            d.isRegistered,
            d.isApproved,
            d.registrationTime
        );
    }

    function getHospital(address _hospital) external view returns (
        string memory name,
        string memory licenseId,
        string memory physicalAddress,
        string memory contactPhone,
        bool isRegistered,
        bool isApproved,
        uint256 registrationTime
    ) {
        Hospital storage h = hospitals[_hospital];
        return (
            h.name,
            h.licenseId,
            h.physicalAddress,
            h.contactPhone,
            h.isRegistered,
            h.isApproved,
            h.registrationTime
        );
    }

    function getRecordDetails(uint256 _recordId) external view recordExists(_recordId) returns (
        uint256 id,
        address patient,
        address uploader,
        string memory title,
        string memory recordType,
        string memory ipfsHash,
        string memory fileChecksum,
        string memory encryptedKeyHash,
        uint256 fileSize,
        string memory mimeType,
        uint256 timestamp
    ) {
        (bool hasAccess, ) = checkAccess(_recordId, msg.sender);
        require(hasAccess, "Unauthorized record metadata");

        MedicalRecord storage r = records[_recordId];
        return (
            r.id,
            r.patient,
            r.uploader,
            r.title,
            r.recordType,
            r.ipfsHash,
            r.fileChecksum,
            r.encryptedKeyHash,
            r.fileSize,
            r.mimeType,
            r.timestamp
        );
    }

    function getPatientRecordIds(address _patient) external view returns (uint256[] memory) {
        return patients[_patient].recordIds;
    }

    function getTotalAuditLogs() external view returns (uint256) {
        return auditLogs.length;
    }

    function getAuditLogs(uint256 _offset, uint256 _limit) external view returns (AuditLog[] memory) {
        uint256 total = auditLogs.length;
        if (_offset >= total) {
            return new AuditLog[](0);
        }
        uint256 end = _offset + _limit;
        if (end > total) {
            end = total;
        }
        uint256 resultLength = end - _offset;
        AuditLog[] memory result = new AuditLog[](resultLength);
        for (uint256 i = 0; i < resultLength; i++) {
            result[i] = auditLogs[_offset + i];
        }
        return result;
    }

    function getAllPatients() external view returns (address[] memory) {
        return patientAddresses;
    }

    function getAllDoctors() external view returns (address[] memory) {
        return doctorAddresses;
    }

    function getAllHospitals() external view returns (address[] memory) {
        return hospitalAddresses;
    }

    function getSystemStats() external view returns (
        uint256 totalPatients,
        uint256 totalDoctors,
        uint256 totalHospitals,
        uint256 totalRecords,
        uint256 totalAuditEvents
    ) {
        return (
            patientAddresses.length,
            doctorAddresses.length,
            hospitalAddresses.length,
            nextRecordId - 1,
            auditLogs.length
        );
    }

    // ==========================================
    // Internal Utilities
    // ==========================================

    function _logAudit(
        address _actor,
        string memory _role,
        string memory _action,
        uint256 _recordId,
        string memory _details
    ) internal {
        uint256 logId = nextAuditLogId++;
        AuditLog memory log = AuditLog({
            id: logId,
            timestamp: block.timestamp,
            actor: _actor,
            role: _role,
            action: _action,
            recordId: _recordId,
            details: _details,
            blockNumber: block.number
        });
        auditLogs.push(log);
        emit AuditLogged(logId, _actor, _action, _recordId, block.timestamp);
    }
}
