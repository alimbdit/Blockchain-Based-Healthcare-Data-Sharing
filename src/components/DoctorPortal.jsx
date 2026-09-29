import React, { useState } from "react";
import { 
  Stethoscope, 
  UserCheck, 
  FileText, 
  Eye, 
  AlertTriangle, 
  ShieldAlert, 
  CheckCircle, 
  Clock, 
  Download, 
  PlusCircle,
  Building2,
  Lock
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

export default function DoctorPortal({
  account,
  contract,
  doctorData,
  patients,
  records,
  onRefreshData,
  onNotify
}) {
  // Registration form state
  const [regForm, setRegForm] = useState({
    name: "Dr. Alice Smith, MD",
    licenseNumber: "LIC-MD-90210",
    specialization: "Cardiology & Internal Medicine",
    hospitalAffiliation: "Metropolitan General Hospital"
  });
  const [isRegistering, setIsRegistering] = useState(false);

  // Decryption / View State
  const [previewData, setPreviewData] = useState(null);
  const [isDecrypting, setIsDecrypting] = useState(false);

  // Emergency Break-Glass Modal State
  const [emergencyModalOpen, setEmergencyModalOpen] = useState(false);
  const [selectedRecordForEmergency, setSelectedRecordForEmergency] = useState(null);
  const [emergencyJustification, setEmergencyJustification] = useState("");
  const [isSubmittingEmergency, setIsSubmittingEmergency] = useState(false);

  // Add Consultation Note State
  const [consultModalOpen, setConsultModalOpen] = useState(false);
  const [consultForm, setConsultForm] = useState({
    patientAddress: "",
    title: "",
    recordType: "Clinical Consultation",
    notes: ""
  });
  const [isSubmittingConsult, setIsSubmittingConsult] = useState(false);

  // Handle Doctor Registration
  const handleRegister = async (e) => {
    e.preventDefault();
    if (!contract) return;
    try {
      setIsRegistering(true);
      onNotify("info", "Submitting doctor registration transaction to blockchain...");

      const tx = await contract.registerDoctor(
        regForm.name,
        regForm.licenseNumber,
        regForm.specialization,
        regForm.hospitalAffiliation
      );
      const receipt = await tx.wait();
      onNotify("success", `Doctor registered! Approval pending from Admin. Gas: ${receipt.gasUsed.toString()}`);
      await onRefreshData();
    } catch (err) {
      console.error(err);
      onNotify("error", err.reason || err.message || "Failed to register doctor");
    } finally {
      setIsRegistering(false);
    }
  };

  // Handle Decrypt and View Patient Record
  const handleViewRecord = async (rec) => {
    try {
      setIsDecrypting(true);
      onNotify("info", `Verifying doctor credentials & access permissions for Record #${rec.id}...`);

      // 1. Log access on-chain
      const tx = await contract.accessRecord(rec.id, "Clinical diagnostic review by attending physician");
      await tx.wait();

      // 2. Retrieve payload from IPFS simulator
      const ipfsItem = retrieveFromIpfsSimulator(rec.ipfsHash);
      if (!ipfsItem) {
        setPreviewData({
          record: rec,
          isSimulated: true,
          content: `Simulated Clinical Record Content for Record #${rec.id}: ${rec.title}`
        });
        return;
      }

      // 3. Retrieve key
      const keyHex = localStorage.getItem(`key_${rec.ipfsHash}`);
      if (!keyHex) {
        setPreviewData({
          record: rec,
          isSimulated: true,
          content: `Simulated Clinical Record Content for Record #${rec.id}: ${rec.title}`
        });
        return;
      }

      const key = await importKeyFromHex(keyHex);
      const decryptedBuffer = await decryptData(ipfsItem.data.buffer, key, ipfsItem.iv);
      const blob = new Blob([decryptedBuffer], { type: rec.mimeType });
      const previewUrl = URL.createObjectURL(blob);

      setPreviewData({
        record: rec,
        blob,
        previewUrl,
        isIntegrityVerified: true,
        fileName: ipfsItem.fileName || "patient-record.pdf"
      });

      onNotify("success", `Record #${rec.id} accessed and logged on Ethereum!`);
    } catch (err) {
      console.error(err);
      onNotify("error", err.reason || err.message || "Access denied or unauthorized");
    } finally {
      setIsDecrypting(false);
    }
  };

  // Handle Emergency Break-Glass Access
  const handleTriggerEmergency = async (e) => {
    e.preventDefault();
    if (!contract || !selectedRecordForEmergency || !emergencyJustification) return;

    try {
      setIsSubmittingEmergency(true);
      onNotify("info", "Executing emergency break-glass protocol on Ethereum...");

      const tx = await contract.emergencyAccess(
        selectedRecordForEmergency.id,
        emergencyJustification
      );
      const receipt = await tx.wait();
      onNotify("success", `EMERGENCY ACCESS LOGGED ON-CHAIN! Block #${receipt.blockNumber}, Gas: ${receipt.gasUsed.toString()}`);

      setEmergencyModalOpen(false);
      setEmergencyJustification("");

      // Open preview
      await handleViewRecord(selectedRecordForEmergency);
      await onRefreshData();
    } catch (err) {
      console.error(err);
      onNotify("error", err.reason || err.message || "Emergency access failed");
    } finally {
      setIsSubmittingEmergency(false);
    }
  };

  // If Doctor not registered
  if (!doctorData || !doctorData.isRegistered) {
    return (
      <div className="glass-panel" style={{ maxWidth: "680px", margin: "2rem auto", padding: "2.5rem" }}>
        <div style={{ textAlign: "center", marginBottom: "2rem" }}>
          <div style={{ width: "56px", height: "56px", borderRadius: "50%", background: "rgba(56, 189, 248, 0.15)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 1rem auto", color: "var(--accent-sky)" }}>
            <Stethoscope size={28} />
          </div>
          <h2 style={{ fontSize: "1.6rem", marginBottom: "0.5rem" }}>Doctor Registration</h2>
          <p style={{ color: "var(--text-secondary)", fontSize: "0.9rem" }}>
            Register your medical credentials and hospital affiliation. Admin approval is required before clinical access is granted.
          </p>
        </div>

        <form onSubmit={handleRegister}>
          <div className="form-group">
            <label className="form-label">Full Name & Credentials</label>
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
              <label className="form-label">Medical License Number</label>
              <input
                type="text"
                className="form-control"
                value={regForm.licenseNumber}
                onChange={(e) => setRegForm({ ...regForm, licenseNumber: e.target.value })}
                required
              />
            </div>
            <div className="form-group">
              <label className="form-label">Specialization</label>
              <input
                type="text"
                className="form-control"
                value={regForm.specialization}
                onChange={(e) => setRegForm({ ...regForm, specialization: e.target.value })}
                required
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Hospital Affiliation</label>
            <input
              type="text"
              className="form-control"
              value={regForm.hospitalAffiliation}
              onChange={(e) => setRegForm({ ...regForm, hospitalAffiliation: e.target.value })}
              required
            />
          </div>

          <button
            type="submit"
            className="btn btn-primary"
            style={{ width: "100%", marginTop: "1rem" }}
            disabled={isRegistering}
          >
            {isRegistering ? "Broadcasting to Ethereum..." : "Register Doctor Credentials"}
          </button>
        </form>
      </div>
    );
  }

  // Registered Doctor View
  return (
    <div>
      {/* Doctor Profile Header */}
      <div className="glass-panel" style={{ padding: "1.5rem", marginBottom: "1.5rem", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "1rem" }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "0.35rem" }}>
            <h2 style={{ fontSize: "1.4rem" }}>{doctorData.name}</h2>
            <span className={`badge ${doctorData.isApproved ? "badge-emerald" : "badge-amber"}`}>
              {doctorData.isApproved ? "Approved Practitioner" : "Pending Verification"}
            </span>
          </div>
          <div style={{ color: "var(--text-secondary)", fontSize: "0.85rem", display: "flex", gap: "1.5rem", flexWrap: "wrap" }}>
            <span>License: <strong>{doctorData.licenseNumber}</strong></span>
            <span>Specialty: <strong>{doctorData.specialization}</strong></span>
            <span>Hospital: <strong>{doctorData.hospitalAffiliation}</strong></span>
          </div>
        </div>

        <div style={{ display: "flex", gap: "0.5rem" }}>
          {!doctorData.isApproved && (
            <div className="badge badge-amber" style={{ padding: "0.5rem 1rem" }}>
              <AlertTriangle size={14} />
              <span>Awaiting Admin Approval for full EHR access</span>
            </div>
          )}
        </div>
      </div>

      {/* Accessible Medical Records Section */}
      <div className="glass-panel" style={{ padding: "1.5rem" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem", flexWrap: "wrap", gap: "1rem" }}>
          <div>
            <h3 style={{ fontSize: "1.2rem", marginBottom: "0.25rem" }}>Patient Records Available For Review</h3>
            <p style={{ fontSize: "0.85rem", color: "var(--text-secondary)" }}>
              Access is strictly governed by patient-granted smart contract permissions or break-glass emergency protocols.
            </p>
          </div>
        </div>

        {(!records || records.length === 0) ? (
          <div style={{ textAlign: "center", padding: "2.5rem", color: "var(--text-muted)" }}>
            <FileText size={40} style={{ margin: "0 auto 1rem auto" }} />
            <p>No patient records currently active in the system.</p>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
            {records.map((rec) => (
              <div key={rec.id} className="glass-panel" style={{ padding: "1.2rem", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "1rem" }}>
                <div>
                  <div style={{ display: "flex", alignItems: "center", gap: "0.6rem", marginBottom: "0.3rem" }}>
                    <span className="badge badge-sky">{rec.recordType}</span>
                    <h4 style={{ fontSize: "1.05rem" }}>{rec.title}</h4>
                    <span style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>Record #{rec.id}</span>
                  </div>
                  <div style={{ fontSize: "0.8rem", color: "var(--text-muted)", display: "flex", gap: "1.2rem", flexWrap: "wrap" }}>
                    <span>Patient Wallet: <span className="mono-text" style={{ fontSize: "0.75rem" }}>{rec.patient.substring(0, 10)}...</span></span>
                    <span>Size: {(Number(rec.fileSize) / 1024).toFixed(1)} KB</span>
                    <span>Date: {new Date(Number(rec.timestamp) * 1000).toLocaleDateString()}</span>
                  </div>
                </div>

                <div style={{ display: "flex", gap: "0.5rem" }}>
                  <button
                    onClick={() => handleViewRecord(rec)}
                    className="btn btn-primary btn-sm"
                  >
                    <Eye size={15} />
                    <span>View & Decrypt</span>
                  </button>
                  <button
                    onClick={() => {
                      setSelectedRecordForEmergency(rec);
                      setEmergencyModalOpen(true);
                    }}
                    className="btn btn-danger btn-sm"
                    title="Break-glass Emergency Protocol"
                  >
                    <ShieldAlert size={15} />
                    <span>Break-Glass Access</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* EMERGENCY BREAK-GLASS MODAL */}
      {emergencyModalOpen && selectedRecordForEmergency && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header" style={{ borderColor: "rgba(244, 63, 94, 0.4)" }}>
              <h3 style={{ display: "flex", alignItems: "center", gap: "0.5rem", color: "var(--accent-rose)" }}>
                <ShieldAlert size={20} />
                <span>Emergency Break-Glass Protocol</span>
              </h3>
              <button onClick={() => setEmergencyModalOpen(false)} className="btn btn-sm btn-secondary">✕</button>
            </div>
            <form onSubmit={handleTriggerEmergency}>
              <div className="modal-body">
                <div style={{ padding: "0.85rem", background: "rgba(244, 63, 94, 0.1)", border: "1px solid rgba(244, 63, 94, 0.3)", borderRadius: "var(--radius-sm)", marginBottom: "1rem" }}>
                  <strong style={{ color: "var(--accent-rose)", display: "block", marginBottom: "0.25rem" }}>
                    WARNING: EMERGENCY OVERRIDE
                  </strong>
                  <p style={{ fontSize: "0.825rem", color: "var(--text-secondary)", lineHeight: "1.5" }}>
                    Break-glass access bypasses normal patient access grants for life-critical medical interventions.
                    Your identity, timestamp, and justification will be IMMUTABLY written to the Ethereum blockchain audit log.
                  </p>
                </div>

                <div className="form-group">
                  <label className="form-label">Medical Justification (Required for Audit Compliance)</label>
                  <textarea
                    rows={3}
                    className="form-control"
                    placeholder="e.g. Unresponsive patient in ER, acute trauma resuscitation, immediate allergy and blood group review required."
                    value={emergencyJustification}
                    onChange={(e) => setEmergencyJustification(e.target.value)}
                    required
                  ></textarea>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" onClick={() => setEmergencyModalOpen(false)} className="btn btn-secondary">
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-danger"
                  disabled={isSubmittingEmergency || !emergencyJustification}
                >
                  {isSubmittingEmergency ? "Broadcasting Emergency Log..." : "Execute Break-Glass Access"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* PREVIEW / DECRYPTED MODAL */}
      {previewData && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: "800px" }}>
            <div className="modal-header">
              <h3 style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                <CheckCircle size={18} className="text-emerald-400" />
                <span>Clinical View: {previewData.record.title}</span>
              </h3>
              <button onClick={() => setPreviewData(null)} className="btn btn-sm btn-secondary">✕</button>
            </div>
            <div className="modal-body">
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
                  <span>Download File</span>
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
