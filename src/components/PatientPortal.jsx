import React, { useState } from "react";
import { 
  UserCheck, 
  UploadCloud, 
  Lock, 
  FileText, 
  Eye, 
  Download, 
  ShieldAlert, 
  CheckCircle2, 
  Clock, 
  Share2, 
  UserX,
  FileCheck,
  AlertCircle
} from "lucide-react";
import { 
  generateAesKey, 
  encryptData, 
  decryptData, 
  calculateSha256, 
  generateIpfsCid, 
  storeInIpfsSimulator, 
  retrieveFromIpfsSimulator,
  exportKeyToHex,
  importKeyFromHex
} from "../utils/crypto";

export default function PatientPortal({
  account,
  contract,
  patientData,
  records,
  doctors,
  hospitals,
  auditLogs,
  onRefreshData,
  onNotify
}) {
  // Registration State
  const [regForm, setRegForm] = useState({
    name: "Alice Johnson",
    dateOfBirth: "1988-11-23",
    gender: "Female",
    bloodGroup: "A+",
    contact: "+1-555-0143",
    emergencyContact: "+1-555-9988"
  });
  const [isRegistering, setIsRegistering] = useState(false);

  // Upload State
  const [uploadModalOpen, setUploadModalOpen] = useState(false);
  const [uploadForm, setUploadForm] = useState({
    title: "",
    recordType: "Lab Report",
    file: null
  });
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState("");

  // Share Modal State
  const [shareModalOpen, setShareModalOpen] = useState(false);
  const [selectedRecordToShare, setSelectedRecordToShare] = useState(null);
  const [selectedAccessor, setSelectedAccessor] = useState("");
  const [shareDuration, setShareDuration] = useState("86400"); // 24 hours default
  const [canWrite, setCanWrite] = useState(false);
  const [isGranting, setIsGranting] = useState(false);

  // Preview / Decryption State
  const [previewData, setPreviewData] = useState(null);
  const [isDecrypting, setIsDecrypting] = useState(false);

  // Active Tab within Patient Portal
  const [activeSubTab, setActiveSubTab] = useState("RECORDS"); // RECORDS, UPLOAD, TIMELINE, AUDIT

  // Handle Patient Registration
  const handleRegister = async (e) => {
    e.preventDefault();
    if (!contract) return;
    try {
      setIsRegistering(true);
      onNotify("info", "Submitting patient registration transaction to blockchain...");

      const tx = await contract.registerPatient(
        regForm.name,
        regForm.dateOfBirth,
        regForm.gender,
        regForm.bloodGroup,
        regForm.contact,
        regForm.emergencyContact
      );
      const receipt = await tx.wait();
      onNotify("success", `Patient registered successfully! Gas Used: ${receipt.gasUsed.toString()}`);
      await onRefreshData();
    } catch (err) {
      console.error(err);
      onNotify("error", err.reason || err.message || "Failed to register patient");
    } finally {
      setIsRegistering(false);
    }
  };

  // Handle File Selection
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setUploadForm({
        ...uploadForm,
        file,
        title: uploadForm.title || file.name.replace(/\.[^/.]+$/, "")
      });
    }
  };

  // Handle Medical Record Upload
  const handleUploadRecord = async (e) => {
    e.preventDefault();
    if (!uploadForm.file || !contract) return;

    try {
      setIsUploading(true);
      setUploadProgress("Reading local file buffer...");

      const arrayBuffer = await uploadForm.file.arrayBuffer();
      const fileSize = arrayBuffer.byteLength;
      const mimeType = uploadForm.file.type || "application/octet-stream";

      setUploadProgress("Computing SHA-256 cryptographic checksum...");
      const checksum = await calculateSha256(arrayBuffer);

      setUploadProgress("Encrypting file client-side via AES-256-GCM...");
      const key = await generateAesKey();
      const keyHex = await exportKeyToHex(key);
      const encrypted = await encryptData(arrayBuffer, key);

      setUploadProgress("Generating decentralized IPFS CID...");
      const ipfsCid = generateIpfsCid(checksum);

      // Save encrypted payload to local IPFS simulator
      storeInIpfsSimulator(ipfsCid, {
        ciphertext: encrypted.ciphertext,
        iv: encrypted.iv,
        mimeType: mimeType,
        fileName: uploadForm.file.name
      });

      // Save key mapping in local secure vault for demo retrieval
      localStorage.setItem(`key_${ipfsCid}`, keyHex);

      setUploadProgress("Broadcasting record metadata transaction to Ethereum...");
      const tx = await contract.uploadRecord(
        uploadForm.title,
        uploadForm.recordType,
        ipfsCid,
        checksum,
        `aes256_vault_${checksum.substring(0, 12)}`,
        fileSize,
        mimeType
      );

      const receipt = await tx.wait();
      onNotify("success", `Record uploaded on-chain! Block #${receipt.blockNumber}, Gas: ${receipt.gasUsed.toString()}`);

      setUploadModalOpen(false);
      setUploadForm({ title: "", recordType: "Lab Report", file: null });
      await onRefreshData();
    } catch (err) {
      console.error(err);
      onNotify("error", err.reason || err.message || "Failed to upload medical record");
    } finally {
      setIsUploading(false);
      setUploadProgress("");
    }
  };

  // Handle Decrypt & Preview Record
  const handleDecryptAndPreview = async (record) => {
    try {
      setIsDecrypting(true);
      onNotify("info", `Verifying permission & retrieving IPFS CID: ${record.ipfsHash.substring(0, 16)}...`);

      // 1. Verify access via contract
      const [hasAccess] = await contract.checkAccess(record.id, account);
      if (!hasAccess) {
        throw new Error("Smart contract permission check failed: Access denied.");
      }

      // 2. Fetch encrypted payload from IPFS simulator
      const ipfsItem = retrieveFromIpfsSimulator(record.ipfsHash);
      if (!ipfsItem) {
        throw new Error("Encrypted payload not found in IPFS store.");
      }

      // 3. Retrieve AES key
      const keyHex = localStorage.getItem(`key_${record.ipfsHash}`);
      if (!keyHex) {
        // If not found, generate dummy decrypted view
        setPreviewData({
          record,
          isSimulated: true,
          content: "Simulated decrypted medical record contents for " + record.title
        });
        return;
      }

      const key = await importKeyFromHex(keyHex);
      const decryptedBuffer = await decryptData(ipfsItem.data.buffer, key, ipfsItem.iv);

      // Verify integrity
      const verifiedChecksum = await calculateSha256(decryptedBuffer);
      const isIntegrityVerified = verifiedChecksum.toLowerCase() === record.fileChecksum.toLowerCase();

      const blob = new Blob([decryptedBuffer], { type: record.mimeType });
      const previewUrl = URL.createObjectURL(blob);

      setPreviewData({
        record,
        blob,
        previewUrl,
        isIntegrityVerified,
        fileName: ipfsItem.fileName || "medical-record.pdf"
      });

      onNotify("success", `Record decrypted successfully! SHA-256 integrity: ${isIntegrityVerified ? "VALID MATCH" : "WARNING"}`);
    } catch (err) {
      console.error(err);
      onNotify("error", err.message || "Decryption failed");
    } finally {
      setIsDecrypting(false);
    }
  };

  // Handle Grant Access
  const handleGrantAccess = async (e) => {
    e.preventDefault();
    if (!contract || !selectedRecordToShare || !selectedAccessor) return;

    try {
      setIsGranting(true);
      onNotify("info", "Submitting grant access transaction to blockchain...");

      const durationSecs = parseInt(shareDuration, 10);
      const tx = await contract.grantRecordAccess(
        selectedRecordToShare.id,
        selectedAccessor,
        durationSecs,
        canWrite
      );
      const receipt = await tx.wait();
      onNotify("success", `Access granted successfully! Gas: ${receipt.gasUsed.toString()}`);

      setShareModalOpen(false);
      setSelectedAccessor("");
      await onRefreshData();
    } catch (err) {
      console.error(err);
      onNotify("error", err.reason || err.message || "Failed to grant access");
    } finally {
      setIsGranting(false);
    }
  };

  // Handle Revoke Access
  const handleRevokeAccess = async (recordId, accessorAddress) => {
    if (!contract) return;
    try {
      onNotify("info", "Revoking access on Ethereum smart contract...");
      const tx = await contract.revokeRecordAccess(recordId, accessorAddress);
      const receipt = await tx.wait();
      onNotify("success", `Access revoked on-chain! Gas: ${receipt.gasUsed.toString()}`);
      await onRefreshData();
    } catch (err) {
      console.error(err);
      onNotify("error", err.reason || err.message || "Failed to revoke access");
    }
  };

  // If patient not registered, show Registration Prompt
  if (!patientData || !patientData.isRegistered) {
    return (
      <div className="glass-panel" style={{ maxWidth: "680px", margin: "2rem auto", padding: "2.5rem" }}>
        <div style={{ textAlign: "center", marginBottom: "2rem" }}>
          <div style={{ width: "56px", height: "56px", borderRadius: "50%", background: "rgba(16, 185, 129, 0.15)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 1rem auto", color: "var(--accent-emerald)" }}>
            <UserCheck size={28} />
          </div>
          <h2 style={{ fontSize: "1.6rem", marginBottom: "0.5rem" }}>Patient Registration</h2>
          <p style={{ color: "var(--text-secondary)", fontSize: "0.9rem" }}>
            This wallet address is not yet registered as a patient in the HealthChain decentralized registry. Complete registration to manage and encrypt medical records.
          </p>
        </div>

        <form onSubmit={handleRegister}>
          <div className="form-group">
            <label className="form-label">Full Name</label>
            <input
              type="text"
              className="form-control"
              value={regForm.name}
              onChange={(e) => setRegForm({ ...regForm, name: e.target.value })}
              required
            />
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
            <div className="form-group">
              <label className="form-label">Date of Birth</label>
              <input
                type="date"
                className="form-control"
                value={regForm.dateOfBirth}
                onChange={(e) => setRegForm({ ...regForm, dateOfBirth: e.target.value })}
                required
              />
            </div>
            <div className="form-group">
              <label className="form-label">Gender</label>
              <select
                className="form-control"
                value={regForm.gender}
                onChange={(e) => setRegForm({ ...regForm, gender: e.target.value })}
              >
                <option value="Female">Female</option>
                <option value="Male">Male</option>
                <option value="Other">Other</option>
              </select>
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
            <div className="form-group">
              <label className="form-label">Blood Group</label>
              <select
                className="form-control"
                value={regForm.bloodGroup}
                onChange={(e) => setRegForm({ ...regForm, bloodGroup: e.target.value })}
              >
                <option value="A+">A+</option>
                <option value="A-">A-</option>
                <option value="B+">B+</option>
                <option value="B-">B-</option>
                <option value="AB+">AB+</option>
                <option value="AB-">AB-</option>
                <option value="O+">O+</option>
                <option value="O-">O-</option>
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Contact Phone</label>
              <input
                type="text"
                className="form-control"
                value={regForm.contact}
                onChange={(e) => setRegForm({ ...regForm, contact: e.target.value })}
                required
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Emergency Contact Phone</label>
            <input
              type="text"
              className="form-control"
              value={regForm.emergencyContact}
              onChange={(e) => setRegForm({ ...regForm, emergencyContact: e.target.value })}
              required
            />
          </div>

          <button
            type="submit"
            className="btn btn-emerald"
            style={{ width: "100%", marginTop: "1rem" }}
            disabled={isRegistering}
          >
            {isRegistering ? "Broadcasting to Ethereum..." : "Register Patient on Blockchain"}
          </button>
        </form>
      </div>
    );
  }

  // Registered Patient View
  return (
    <div>
      {/* Patient Profile Header Card */}
      <div className="glass-panel" style={{ padding: "1.5rem", marginBottom: "1.5rem", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "1rem" }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "0.35rem" }}>
            <h2 style={{ fontSize: "1.4rem" }}>{patientData.name}</h2>
            <span className="badge badge-emerald">Verified Patient</span>
            <span className="badge badge-rose">Blood: {patientData.bloodGroup}</span>
          </div>
          <div style={{ color: "var(--text-secondary)", fontSize: "0.85rem", display: "flex", gap: "1.5rem", flexWrap: "wrap" }}>
            <span>DOB: <strong>{patientData.dateOfBirth}</strong></span>
            <span>Gender: <strong>{patientData.gender}</strong></span>
            <span>Contact: <strong>{patientData.contact}</strong></span>
            <span>Emergency: <strong>{patientData.emergencyContact}</strong></span>
          </div>
        </div>

        <button onClick={() => setUploadModalOpen(true)} className="btn btn-primary">
          <UploadCloud size={18} />
          <span>Upload Encrypted Record</span>
        </button>
      </div>

      {/* Sub-Navigation Tabs */}
      <div style={{ display: "flex", gap: "0.5rem", marginBottom: "1.5rem" }}>
        <button
          onClick={() => setActiveSubTab("RECORDS")}
          className={`btn btn-sm ${activeSubTab === "RECORDS" ? "btn-primary" : "btn-secondary"}`}
        >
          <FileText size={16} />
          <span>My Medical Records ({records ? records.length : 0})</span>
        </button>
        <button
          onClick={() => setActiveSubTab("TIMELINE")}
          className={`btn btn-sm ${activeSubTab === "TIMELINE" ? "btn-primary" : "btn-secondary"}`}
        >
          <Clock size={16} />
          <span>Medical History Timeline</span>
        </button>
        <button
          onClick={() => setActiveSubTab("AUDIT")}
          className={`btn btn-sm ${activeSubTab === "AUDIT" ? "btn-primary" : "btn-secondary"}`}
        >
          <ShieldAlert size={16} />
          <span>Access Audit Log</span>
        </button>
      </div>

      {/* SUB-TAB 1: RECORDS LIST */}
      {activeSubTab === "RECORDS" && (
        <div>
          {(!records || records.length === 0) ? (
            <div className="glass-panel" style={{ padding: "3rem", textAlign: "center" }}>
              <FileText size={48} style={{ color: "var(--text-muted)", margin: "0 auto 1rem auto" }} />
              <h3 style={{ fontSize: "1.2rem", marginBottom: "0.5rem" }}>No Medical Records Uploaded Yet</h3>
              <p style={{ color: "var(--text-secondary)", marginBottom: "1.5rem" }}>
                Upload your medical records (lab reports, imaging scans, prescriptions) with client-side AES-256 encryption.
              </p>
              <button onClick={() => setUploadModalOpen(true)} className="btn btn-primary">
                <UploadCloud size={16} />
                <span>Upload First Record</span>
              </button>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
              {records.map((rec) => (
                <div key={rec.id} className="glass-panel" style={{ padding: "1.25rem", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "1rem" }}>
                  <div style={{ flex: "1 1 300px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "0.6rem", marginBottom: "0.3rem" }}>
                      <span className="badge badge-sky">{rec.recordType}</span>
                      <h4 style={{ fontSize: "1.1rem" }}>{rec.title}</h4>
                      <span style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>ID #{rec.id}</span>
                    </div>
                    <div style={{ fontSize: "0.8rem", color: "var(--text-muted)", display: "flex", gap: "1rem", flexWrap: "wrap", marginBottom: "0.4rem" }}>
                      <span>Size: {(Number(rec.fileSize) / 1024).toFixed(1)} KB</span>
                      <span>MIME: {rec.mimeType}</span>
                      <span>Date: {new Date(Number(rec.timestamp) * 1000).toLocaleDateString()}</span>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                      <span style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>IPFS CID:</span>
                      <span className="mono-text" style={{ fontSize: "0.75rem" }}>
                        {rec.ipfsHash.substring(0, 24)}...
                      </span>
                    </div>
                  </div>

                  <div style={{ display: "flex", gap: "0.6rem", flexWrap: "wrap" }}>
                    <button
                      onClick={() => handleDecryptAndPreview(rec)}
                      className="btn btn-secondary btn-sm"
                      title="Decrypt and preview file"
                    >
                      <Eye size={15} />
                      <span>Decrypt & View</span>
                    </button>
                    <button
                      onClick={() => {
                        setSelectedRecordToShare(rec);
                        setShareModalOpen(true);
                      }}
                      className="btn btn-outline-cyan btn-sm"
                    >
                      <Share2 size={15} />
                      <span>Grant Access</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* SUB-TAB 2: MEDICAL HISTORY TIMELINE */}
      {activeSubTab === "TIMELINE" && (
        <div className="glass-panel" style={{ padding: "1.5rem" }}>
          <h3 style={{ fontSize: "1.2rem", marginBottom: "1.5rem" }}>Chronological Medical History</h3>
          <div className="timeline">
            {records && records.map((rec) => (
              <div key={rec.id} className="timeline-item">
                <div className="timeline-marker"></div>
                <div className="timeline-content">
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.3rem" }}>
                    <strong style={{ color: "var(--accent-sky)" }}>{rec.recordType}</strong>
                    <span style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>
                      {new Date(Number(rec.timestamp) * 1000).toLocaleString()}
                    </span>
                  </div>
                  <div style={{ fontWeight: 600, fontSize: "1rem", marginBottom: "0.3rem" }}>{rec.title}</div>
                  <div style={{ fontSize: "0.8rem", color: "var(--text-secondary)" }}>
                    Encrypted and stored with IPFS CID: <span className="mono-text">{rec.ipfsHash}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* SUB-TAB 3: AUDIT LOG */}
      {activeSubTab === "AUDIT" && (
        <div className="glass-panel table-responsive">
          <table className="data-table">
            <thead>
              <tr>
                <th>Block</th>
                <th>Role</th>
                <th>Action</th>
                <th>Record</th>
                <th>Details</th>
                <th>Actor Address</th>
              </tr>
            </thead>
            <tbody>
              {auditLogs && auditLogs.length > 0 ? (
                auditLogs.map((log) => (
                  <tr key={log.id}>
                    <td>#{log.blockNumber}</td>
                    <td>
                      <span className={`badge ${
                        log.role === "PATIENT" ? "badge-emerald" :
                        log.role === "DOCTOR" ? "badge-sky" :
                        log.role === "ADMIN" ? "badge-amber" : "badge-purple"
                      }`}>
                        {log.role}
                      </span>
                    </td>
                    <td><strong>{log.action}</strong></td>
                    <td>{log.recordId === 0n ? "-" : `#${log.recordId}`}</td>
                    <td>{log.details}</td>
                    <td className="mono-text" style={{ fontSize: "0.75rem" }}>
                      {log.actor.substring(0, 8)}...{log.actor.substring(36)}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="6" style={{ textAlign: "center", color: "var(--text-muted)", padding: "2rem" }}>
                    No audit events recorded yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* UPLOAD ENCRYPTED RECORD MODAL */}
      {uploadModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3 style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                <Lock size={18} className="text-sky-400" />
                <span>Upload Encrypted Medical File</span>
              </h3>
              <button onClick={() => setUploadModalOpen(false)} className="btn btn-sm btn-secondary">✕</button>
            </div>
            <form onSubmit={handleUploadRecord}>
              <div className="modal-body">
                <div className="form-group">
                  <label className="form-label">Record Title / Description</label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="e.g. Brain MRI Scan with Contrast"
                    value={uploadForm.title}
                    onChange={(e) => setUploadForm({ ...uploadForm, title: e.target.value })}
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Record Category</label>
                  <select
                    className="form-control"
                    value={uploadForm.recordType}
                    onChange={(e) => setUploadForm({ ...uploadForm, recordType: e.target.value })}
                  >
                    <option value="Lab Report">Lab Report</option>
                    <option value="Radiology / Imaging">Radiology / Imaging</option>
                    <option value="Prescription">Prescription</option>
                    <option value="Discharge Summary">Discharge Summary</option>
                    <option value="Clinical Consultation">Clinical Consultation</option>
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Select Medical Document</label>
                  <div className="file-dropzone" onClick={() => document.getElementById("fileInput").click()}>
                    <UploadCloud size={36} style={{ color: "var(--accent-sky)", margin: "0 auto 0.5rem auto" }} />
                    <div style={{ fontWeight: 600, marginBottom: "0.25rem" }}>
                      {uploadForm.file ? uploadForm.file.name : "Click or drag file to upload"}
                    </div>
                    <div style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>
                      Supports PDF, DICOM, JPEG, PNG, TXT (Encrypted client-side with AES-256)
                    </div>
                    <input
                      id="fileInput"
                      type="file"
                      style={{ display: "none" }}
                      onChange={handleFileChange}
                      required
                    />
                  </div>
                </div>

                {uploadProgress && (
                  <div className="badge badge-sky" style={{ width: "100%", padding: "0.6rem", justifyContent: "center" }}>
                    <span className="live-dot"></span>
                    <span>{uploadProgress}</span>
                  </div>
                )}
              </div>
              <div className="modal-footer">
                <button type="button" onClick={() => setUploadModalOpen(false)} className="btn btn-secondary">
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={isUploading || !uploadForm.file}>
                  {isUploading ? "Encrypting & Broadcasting..." : "Encrypt & Store on Blockchain"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* SHARE / GRANT ACCESS MODAL */}
      {shareModalOpen && selectedRecordToShare && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3 style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                <Share2 size={18} className="text-sky-400" />
                <span>Grant Record Access: #{selectedRecordToShare.id}</span>
              </h3>
              <button onClick={() => setShareModalOpen(false)} className="btn btn-sm btn-secondary">✕</button>
            </div>
            <form onSubmit={handleGrantAccess}>
              <div className="modal-body">
                <div style={{ marginBottom: "1rem", padding: "0.75rem", background: "rgba(255,255,255,0.03)", borderRadius: "var(--radius-sm)" }}>
                  <div style={{ fontWeight: 600 }}>{selectedRecordToShare.title}</div>
                  <div style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>
                    Type: {selectedRecordToShare.recordType} | Size: {(Number(selectedRecordToShare.fileSize) / 1024).toFixed(1)} KB
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Select Registered Doctor or Hospital</label>
                  <select
                    className="form-control"
                    value={selectedAccessor}
                    onChange={(e) => setSelectedAccessor(e.target.value)}
                    required
                  >
                    <option value="">-- Choose Healthcare Practitioner / Facility --</option>
                    <optgroup label="Registered Doctors">
                      {doctors && doctors.map((doc, idx) => (
                        <option key={idx} value={doc.wallet}>
                          {doc.name} ({doc.specialization}) - {doc.isApproved ? "Approved" : "Pending"}
                        </option>
                      ))}
                    </optgroup>
                    <optgroup label="Registered Hospitals">
                      {hospitals && hospitals.map((hosp, idx) => (
                        <option key={idx} value={hosp.wallet}>
                          {hosp.name} - {hosp.physicalAddress}
                        </option>
                      ))}
                    </optgroup>
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Permission Expiration</label>
                  <select
                    className="form-control"
                    value={shareDuration}
                    onChange={(e) => setShareDuration(e.target.value)}
                  >
                    <option value="3600">1 Hour (Emergency consultation)</option>
                    <option value="86400">24 Hours (Standard hospital visit)</option>
                    <option value="604800">7 Days (Treatment course)</option>
                    <option value="2592000">30 Days (Extended monitoring)</option>
                    <option value="0">Perpetual (Until explicitly revoked)</option>
                  </select>
                </div>

                <div className="form-group" style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                  <input
                    type="checkbox"
                    id="canWriteCheck"
                    checked={canWrite}
                    onChange={(e) => setCanWrite(e.target.checked)}
                  />
                  <label htmlFor="canWriteCheck" style={{ fontSize: "0.85rem", cursor: "pointer" }}>
                    Allow doctor to append consultation notes & clinical diagnosis records
                  </label>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" onClick={() => setShareModalOpen(false)} className="btn btn-secondary">
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={isGranting || !selectedAccessor}>
                  {isGranting ? "Recording on-chain..." : "Confirm & Grant Access"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DECRYPTED PREVIEW MODAL */}
      {previewData && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: "800px" }}>
            <div className="modal-header">
              <h3 style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                <CheckCircle2 size={18} className="text-emerald-400" />
                <span>Decrypted Medical Document</span>
              </h3>
              <button onClick={() => setPreviewData(null)} className="btn btn-sm btn-secondary">✕</button>
            </div>
            <div className="modal-body">
              <div style={{ marginBottom: "1rem" }}>
                <div style={{ fontWeight: 600, fontSize: "1.1rem" }}>{previewData.record.title}</div>
                <div style={{ display: "flex", gap: "1rem", fontSize: "0.8rem", color: "var(--text-muted)", marginTop: "0.25rem" }}>
                  <span>Category: {previewData.record.recordType}</span>
                  <span>Integrity: {previewData.isIntegrityVerified ? "✅ Verified Valid" : "Simulated Key Match"}</span>
                </div>
              </div>

              {previewData.previewUrl ? (
                <div style={{ height: "400px", border: "1px solid var(--border-subtle)", borderRadius: "var(--radius-sm)", overflow: "hidden" }}>
                  <iframe src={previewData.previewUrl} style={{ width: "100%", height: "100%", border: "none" }} title="Preview"></iframe>
                </div>
              ) : (
                <div style={{ padding: "1.5rem", background: "rgba(0,0,0,0.3)", borderRadius: "var(--radius-sm)", fontFamily: "monospace", fontSize: "0.85rem" }}>
                  {previewData.content}
                </div>
              )}
            </div>
            <div className="modal-footer">
              {previewData.blob && (
                <a
                  href={previewData.previewUrl}
                  download={previewData.fileName}
                  className="btn btn-emerald"
                >
                  <Download size={16} />
                  <span>Download Decrypted File</span>
                </a>
              )}
              <button onClick={() => setPreviewData(null)} className="btn btn-secondary">
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
