import React, { useState } from "react";
import { Building2, ShieldCheck, MapPin, Phone, Award, Users, AlertCircle, FileText } from "lucide-react";

export default function HospitalPortal({
  account,
  contract,
  hospitalData,
  doctors,
  records,
  onRefreshData,
  onNotify
}) {
  const [regForm, setRegForm] = useState({
    name: "Metropolitan General Hospital",
    licenseId: "HOSP-NYC-8820",
    physicalAddress: "450 Lexington Ave, New York, NY",
    contactPhone: "+1-212-555-0100"
  });
  const [isRegistering, setIsRegistering] = useState(false);

  const handleRegister = async (e) => {
    e.preventDefault();
    if (!contract) return;
    try {
      setIsRegistering(true);
      onNotify("info", "Registering hospital on blockchain...");

      const tx = await contract.registerHospital(
        regForm.name,
        regForm.licenseId,
        regForm.physicalAddress,
        regForm.contactPhone
      );
      const receipt = await tx.wait();
      onNotify("success", `Hospital registered! Awaiting Admin authorization. Gas: ${receipt.gasUsed.toString()}`);
      await onRefreshData();
    } catch (err) {
      console.error(err);
      onNotify("error", err.reason || err.message || "Failed to register hospital");
    } finally {
      setIsRegistering(false);
    }
  };

  if (!hospitalData || !hospitalData.isRegistered) {
    return (
      <div className="glass-panel" style={{ maxWidth: "680px", margin: "2rem auto", padding: "2.5rem" }}>
        <div style={{ textAlign: "center", marginBottom: "2rem" }}>
          <div style={{ width: "56px", height: "56px", borderRadius: "50%", background: "rgba(168, 85, 247, 0.15)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 1rem auto", color: "var(--accent-purple)" }}>
            <Building2 size={28} />
          </div>
          <h2 style={{ fontSize: "1.6rem", marginBottom: "0.5rem" }}>Hospital Organization Registration</h2>
          <p style={{ color: "var(--text-secondary)", fontSize: "0.9rem" }}>
            Register your clinical hospital or healthcare center into the HealthChain verified network.
          </p>
        </div>

        <form onSubmit={handleRegister}>
          <div className="form-group">
            <label className="form-label">Healthcare Facility Name</label>
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
              <label className="form-label">Hospital Registration License ID</label>
              <input
                type="text"
                className="form-control"
                value={regForm.licenseId}
                onChange={(e) => setRegForm({ ...regForm, licenseId: e.target.value })}
                required
              />
            </div>
            <div className="form-group">
              <label className="form-label">Official Contact Phone</label>
              <input
                type="text"
                className="form-control"
                value={regForm.contactPhone}
                onChange={(e) => setRegForm({ ...regForm, contactPhone: e.target.value })}
                required
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Physical Address</label>
            <input
              type="text"
              className="form-control"
              value={regForm.physicalAddress}
              onChange={(e) => setRegForm({ ...regForm, physicalAddress: e.target.value })}
              required
            />
          </div>

          <button
            type="submit"
            className="btn btn-primary"
            style={{ width: "100%", marginTop: "1rem" }}
            disabled={isRegistering}
          >
            {isRegistering ? "Broadcasting to Ethereum..." : "Register Hospital Entity"}
          </button>
        </form>
      </div>
    );
  }

  return (
    <div>
      {/* Hospital Profile Header */}
      <div className="glass-panel" style={{ padding: "1.5rem", marginBottom: "1.5rem", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "1rem" }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "0.35rem" }}>
            <h2 style={{ fontSize: "1.4rem" }}>{hospitalData.name}</h2>
            <span className={`badge ${hospitalData.isApproved ? "badge-emerald" : "badge-amber"}`}>
              {hospitalData.isApproved ? "Accredited Health Center" : "Pending Admin Accreditation"}
            </span>
          </div>
          <div style={{ color: "var(--text-secondary)", fontSize: "0.85rem", display: "flex", gap: "1.5rem", flexWrap: "wrap" }}>
            <span>License: <strong>{hospitalData.licenseId}</strong></span>
            <span>Address: <strong>{hospitalData.physicalAddress}</strong></span>
            <span>Phone: <strong>{hospitalData.contactPhone}</strong></span>
          </div>
        </div>
      </div>

      {/* Hospital Facility Overview */}
      <div className="grid-2">
        <div className="glass-panel" style={{ padding: "1.5rem" }}>
          <h3 style={{ fontSize: "1.1rem", marginBottom: "1rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <Users size={18} className="text-sky-400" />
            <span>Affiliated Clinical Practitioners</span>
          </h3>
          <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
            {doctors && doctors.length > 0 ? (
              doctors.map((doc, idx) => (
                <div key={idx} style={{ padding: "0.75rem", background: "rgba(255,255,255,0.03)", borderRadius: "var(--radius-sm)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div>
                    <div style={{ fontWeight: 600 }}>{doc.name}</div>
                    <div style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>
                      {doc.specialization} | License: {doc.licenseNumber}
                    </div>
                  </div>
                  <span className={`badge ${doc.isApproved ? "badge-emerald" : "badge-amber"}`}>
                    {doc.isApproved ? "Active" : "Pending"}
                  </span>
                </div>
              ))
            ) : (
              <p style={{ color: "var(--text-muted)" }}>No affiliated doctors registered yet.</p>
            )}
          </div>
        </div>

        <div className="glass-panel" style={{ padding: "1.5rem" }}>
          <h3 style={{ fontSize: "1.1rem", marginBottom: "1rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <FileText size={18} className="text-purple-400" />
            <span>HealthChain Interoperability Status</span>
          </h3>
          <p style={{ fontSize: "0.85rem", color: "var(--text-secondary)", lineHeight: "1.6", marginBottom: "1rem" }}>
            This hospital node operates on the Ethereum decentralized network with zero single points of failure.
            All cross-institutional patient transfers can be verified instantaneously with patient digital signatures.
          </p>
          <div style={{ padding: "0.75rem", background: "rgba(16, 185, 129, 0.1)", border: "1px solid rgba(16, 185, 129, 0.2)", borderRadius: "var(--radius-sm)" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", color: "var(--accent-emerald)", fontWeight: 600, fontSize: "0.85rem" }}>
              <ShieldCheck size={16} />
              <span>HIPAA & GDPR Technical Safeguards Active</span>
            </div>
            <div style={{ fontSize: "0.75rem", color: "var(--text-secondary)", marginTop: "0.25rem" }}>
              Encrypted at rest, in transit, and during access verification via smart contract modifiers.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
