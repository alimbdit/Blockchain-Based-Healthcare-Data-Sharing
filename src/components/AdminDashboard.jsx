import React, { useState } from "react";
import { 
  Shield, 
  CheckCircle, 
  XCircle, 
  Search, 
  Filter, 
  Activity, 
  Users, 
  Stethoscope, 
  Building2, 
  Clock,
  Layers,
  FileCheck
} from "lucide-react";
import contractData from "../contracts/contractData.json";

export default function AdminDashboard({
  contract,
  stats,
  doctors,
  hospitals,
  auditLogs,
  onRefreshData,
  onNotify
}) {
  const [activeTab, setActiveTab] = useState("DOCTORS"); // DOCTORS, HOSPITALS, AUDIT, CONTRACT
  const [auditFilter, setAuditFilter] = useState("ALL");
  const [searchTerm, setSearchTerm] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);

  // Approve / Revoke Doctor
  const handleToggleDoctorApproval = async (doctorAddress, currentStatus) => {
    if (!contract) return;
    try {
      setIsProcessing(true);
      const newStatus = !currentStatus;
      onNotify("info", `Submitting doctor approval status (${newStatus ? "APPROVE" : "REVOKE"}) to blockchain...`);

      const tx = await contract.approveDoctor(doctorAddress, newStatus);
      const receipt = await tx.wait();
      onNotify("success", `Doctor status updated on-chain! Gas: ${receipt.gasUsed.toString()}`);
      await onRefreshData();
    } catch (err) {
      console.error(err);
      onNotify("error", err.reason || err.message || "Failed to update doctor approval");
    } finally {
      setIsProcessing(false);
    }
  };

  // Approve / Revoke Hospital
  const handleToggleHospitalApproval = async (hospitalAddress, currentStatus) => {
    if (!contract) return;
    try {
      setIsProcessing(true);
      const newStatus = !currentStatus;
      onNotify("info", `Submitting hospital accreditation status (${newStatus ? "APPROVE" : "REVOKE"}) to blockchain...`);

      const tx = await contract.approveHospital(hospitalAddress, newStatus);
      const receipt = await tx.wait();
      onNotify("success", `Hospital accreditation updated on-chain! Gas: ${receipt.gasUsed.toString()}`);
      await onRefreshData();
    } catch (err) {
      console.error(err);
      onNotify("error", err.reason || err.message || "Failed to update hospital approval");
    } finally {
      setIsProcessing(false);
    }
  };

  // Filter Audit Logs
  const filteredAuditLogs = auditLogs ? auditLogs.filter((log) => {
    const matchesRole = auditFilter === "ALL" || log.role === auditFilter;
    const matchesSearch = !searchTerm || 
      log.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.details.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.actor.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesRole && matchesSearch;
  }) : [];

  return (
    <div>
      {/* Admin Header */}
      <div className="glass-panel" style={{ padding: "1.5rem", marginBottom: "1.5rem", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "1rem" }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "0.35rem" }}>
            <div style={{ width: "36px", height: "36px", borderRadius: "8px", background: "rgba(245, 158, 11, 0.2)", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--accent-amber)" }}>
              <Shield size={20} />
            </div>
            <h2 style={{ fontSize: "1.4rem" }}>System Administrator Dashboard</h2>
            <span className="badge badge-amber">Super Admin</span>
          </div>
          <p style={{ color: "var(--text-secondary)", fontSize: "0.85rem" }}>
            Credential verification authority, network parameter monitoring, and tamper-proof audit trail governance.
          </p>
        </div>

        {/* Tab Switcher */}
        <div style={{ display: "flex", gap: "0.5rem" }}>
          <button
            onClick={() => setActiveTab("DOCTORS")}
            className={`btn btn-sm ${activeTab === "DOCTORS" ? "btn-primary" : "btn-secondary"}`}
          >
            <Stethoscope size={15} />
            <span>Doctors ({doctors ? doctors.length : 0})</span>
          </button>
          <button
            onClick={() => setActiveTab("HOSPITALS")}
            className={`btn btn-sm ${activeTab === "HOSPITALS" ? "btn-primary" : "btn-secondary"}`}
          >
            <Building2 size={15} />
            <span>Hospitals ({hospitals ? hospitals.length : 0})</span>
          </button>
          <button
            onClick={() => setActiveTab("AUDIT")}
            className={`btn btn-sm ${activeTab === "AUDIT" ? "btn-primary" : "btn-secondary"}`}
          >
            <Activity size={15} />
            <span>Audit Trail ({auditLogs ? auditLogs.length : 0})</span>
          </button>
        </div>
      </div>

      {/* SUB-SECTION 1: DOCTORS APPROVAL QUEUE */}
      {activeTab === "DOCTORS" && (
        <div className="glass-panel table-responsive">
          <div style={{ padding: "1.25rem 1.5rem", borderBottom: "1px solid var(--border-subtle)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <h3 style={{ fontSize: "1.1rem" }}>Doctor Credential Verification Registry</h3>
            <span style={{ fontSize: "0.85rem", color: "var(--text-muted)" }}>
              Only approved doctors can access shared EHRs
            </span>
          </div>

          <table className="data-table">
            <thead>
              <tr>
                <th>Doctor Name</th>
                <th>License #</th>
                <th>Specialization</th>
                <th>Hospital Affiliation</th>
                <th>Wallet Address</th>
                <th>Status</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {doctors && doctors.length > 0 ? (
                doctors.map((doc, idx) => (
                  <tr key={idx}>
                    <td><strong>{doc.name}</strong></td>
                    <td className="mono-text">{doc.licenseNumber}</td>
                    <td>{doc.specialization}</td>
                    <td>{doc.hospitalAffiliation}</td>
                    <td className="mono-text" style={{ fontSize: "0.75rem" }}>
                      {doc.wallet.substring(0, 8)}...{doc.wallet.substring(36)}
                    </td>
                    <td>
                      <span className={`badge ${doc.isApproved ? "badge-emerald" : "badge-amber"}`}>
                        {doc.isApproved ? "Approved" : "Pending"}
                      </span>
                    </td>
                    <td>
                      <button
                        onClick={() => handleToggleDoctorApproval(doc.wallet, doc.isApproved)}
                        className={`btn btn-sm ${doc.isApproved ? "btn-danger" : "btn-emerald"}`}
                        disabled={isProcessing}
                      >
                        {doc.isApproved ? (
                          <>
                            <XCircle size={14} />
                            <span>Revoke</span>
                          </>
                        ) : (
                          <>
                            <CheckCircle size={14} />
                            <span>Approve</span>
                          </>
                        )}
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="7" style={{ textAlign: "center", padding: "2rem", color: "var(--text-muted)" }}>
                    No doctors registered yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* SUB-SECTION 2: HOSPITALS APPROVAL QUEUE */}
      {activeTab === "HOSPITALS" && (
        <div className="glass-panel table-responsive">
          <div style={{ padding: "1.25rem 1.5rem", borderBottom: "1px solid var(--border-subtle)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <h3 style={{ fontSize: "1.1rem" }}>Hospital Facilities Accreditation</h3>
            <span style={{ fontSize: "0.85rem", color: "var(--text-muted)" }}>
              Institutional node authorization
            </span>
          </div>

          <table className="data-table">
            <thead>
              <tr>
                <th>Hospital Name</th>
                <th>License / Reg ID</th>
                <th>Physical Address</th>
                <th>Contact Phone</th>
                <th>Wallet Address</th>
                <th>Status</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {hospitals && hospitals.length > 0 ? (
                hospitals.map((hosp, idx) => (
                  <tr key={idx}>
                    <td><strong>{hosp.name}</strong></td>
                    <td className="mono-text">{hosp.licenseId}</td>
                    <td>{hosp.physicalAddress}</td>
                    <td>{hosp.contactPhone}</td>
                    <td className="mono-text" style={{ fontSize: "0.75rem" }}>
                      {hosp.wallet.substring(0, 8)}...{hosp.wallet.substring(36)}
                    </td>
                    <td>
                      <span className={`badge ${hosp.isApproved ? "badge-emerald" : "badge-amber"}`}>
                        {hosp.isApproved ? "Accredited" : "Pending"}
                      </span>
                    </td>
                    <td>
                      <button
                        onClick={() => handleToggleHospitalApproval(hosp.wallet, hosp.isApproved)}
                        className={`btn btn-sm ${hosp.isApproved ? "btn-danger" : "btn-emerald"}`}
                        disabled={isProcessing}
                      >
                        {hosp.isApproved ? (
                          <>
                            <XCircle size={14} />
                            <span>Revoke</span>
                          </>
                        ) : (
                          <>
                            <CheckCircle size={14} />
                            <span>Accredit</span>
                          </>
                        )}
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="7" style={{ textAlign: "center", padding: "2rem", color: "var(--text-muted)" }}>
                    No hospitals registered yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* SUB-SECTION 3: GLOBAL AUDIT TRAIL EXPLORER */}
      {activeTab === "AUDIT" && (
        <div className="glass-panel">
          {/* Filter Bar */}
          <div style={{ padding: "1.25rem 1.5rem", borderBottom: "1px solid var(--border-subtle)", display: "flex", gap: "1rem", flexWrap: "wrap", alignItems: "center", justifyContent: "space-between" }}>
            <div style={{ display: "flex", gap: "0.75rem", alignItems: "center", flexWrap: "wrap" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                <Filter size={16} style={{ color: "var(--text-muted)" }} />
                <span style={{ fontSize: "0.85rem", color: "var(--text-secondary)" }}>Role:</span>
              </div>
              {["ALL", "PATIENT", "DOCTOR", "HOSPITAL", "ADMIN"].map((role) => (
                <button
                  key={role}
                  onClick={() => setAuditFilter(role)}
                  className={`btn btn-sm ${auditFilter === role ? "btn-primary" : "btn-secondary"}`}
                  style={{ padding: "0.3rem 0.7rem", fontSize: "0.75rem" }}
                >
                  {role}
                </button>
              ))}
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", minWidth: "240px" }}>
              <Search size={16} style={{ color: "var(--text-muted)" }} />
              <input
                type="text"
                placeholder="Search audit action, actor, details..."
                className="form-control"
                style={{ padding: "0.4rem 0.8rem", fontSize: "0.825rem" }}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>

          <div className="table-responsive">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Block</th>
                  <th>Timestamp</th>
                  <th>Actor Role</th>
                  <th>Action</th>
                  <th>Record #</th>
                  <th>Audit Message / Justification</th>
                  <th>Actor Address</th>
                </tr>
              </thead>
              <tbody>
                {filteredAuditLogs.length > 0 ? (
                  filteredAuditLogs.map((log) => (
                    <tr key={log.id} style={log.action === "EMERGENCY_ACCESS" ? { background: "rgba(244, 63, 94, 0.08)" } : {}}>
                      <td>#{log.blockNumber}</td>
                      <td style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>
                        {new Date(Number(log.timestamp) * 1000).toLocaleTimeString()}
                      </td>
                      <td>
                        <span className={`badge ${
                          log.role === "PATIENT" ? "badge-emerald" :
                          log.role === "DOCTOR" ? "badge-sky" :
                          log.role === "ADMIN" ? "badge-amber" : "badge-purple"
                        }`}>
                          {log.role}
                        </span>
                      </td>
                      <td>
                        <strong style={log.action === "EMERGENCY_ACCESS" ? { color: "var(--accent-rose)" } : {}}>
                          {log.action}
                        </strong>
                      </td>
                      <td>{log.recordId === 0n ? "-" : `#${log.recordId}`}</td>
                      <td style={{ maxWidth: "340px", wordBreak: "break-word" }}>{log.details}</td>
                      <td className="mono-text" style={{ fontSize: "0.75rem" }}>
                        {log.actor.substring(0, 8)}...{log.actor.substring(36)}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="7" style={{ textAlign: "center", padding: "2rem", color: "var(--text-muted)" }}>
                      No matching audit records found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
