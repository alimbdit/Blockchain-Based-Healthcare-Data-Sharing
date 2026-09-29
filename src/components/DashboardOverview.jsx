import React from "react";
import { 
  Users, 
  Stethoscope, 
  Building2, 
  FileText, 
  ShieldCheck, 
  Zap, 
  Lock, 
  Clock, 
  ArrowRight,
  Database,
  KeyRound,
  FileCheck2
} from "lucide-react";
import contractData from "../contracts/contractData.json";

export default function DashboardOverview({
  stats,
  account,
  currentRole,
  userProfile,
  onNavigateTab
}) {
  return (
    <div>
      {/* Welcome Banner */}
      <div className="glass-panel" style={{ padding: "2rem", marginBottom: "2rem", position: "relative", overflow: "hidden" }}>
        <div style={{ maxWidth: "800px", position: "relative", zIndex: 2 }}>
          <div className="badge badge-sky" style={{ marginBottom: "0.75rem" }}>
            <ShieldCheck size={14} />
            <span>Smart Contract Live & Verified</span>
          </div>
          <h1 style={{ fontSize: "2.2rem", marginBottom: "0.5rem" }}>
            Blockchain-Based Healthcare Data Sharing & Audit
          </h1>
          <p style={{ color: "var(--text-secondary)", fontSize: "1rem", lineHeight: "1.7", marginBottom: "1.5rem" }}>
            A decentralized, patient-controlled electronic healthcare management system (EHR). Eliminates data silos,
            mitigates single points of failure, secures medical files with AES-256-GCM client-side encryption, and logs
            every access immutably on the Ethereum blockchain.
          </p>
          <div style={{ display: "flex", gap: "1rem", flexWrap: "wrap" }}>
            <button onClick={() => onNavigateTab("PATIENT")} className="btn btn-primary">
              <span>Patient Portal</span>
              <ArrowRight size={16} />
            </button>
            <button onClick={() => onNavigateTab("PERFORMANCE")} className="btn btn-emerald">
              <Zap size={16} />
              <span>Performance Benchmarks</span>
            </button>
            <button onClick={() => onNavigateTab("REPORT")} className="btn btn-secondary">
              <FileCheck2 size={16} />
              <span>15-Page Report Draft</span>
            </button>
          </div>
        </div>
      </div>

      {/* Metric Counters Grid */}
      <div className="metrics-grid">
        <div className="metric-card glass-panel accent-emerald">
          <div>
            <div className="metric-label">Registered Patients</div>
            <div className="metric-val">{stats.totalPatients || 0}</div>
            <span style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>Patient-controlled ownership</span>
          </div>
          <div className="metric-icon-wrap" style={{ color: "var(--accent-emerald)" }}>
            <Users size={24} />
          </div>
        </div>

        <div className="metric-card glass-panel">
          <div>
            <div className="metric-label">Registered Doctors</div>
            <div className="metric-val">{stats.totalDoctors || 0}</div>
            <span style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>Verified practitioners</span>
          </div>
          <div className="metric-icon-wrap" style={{ color: "var(--accent-sky)" }}>
            <Stethoscope size={24} />
          </div>
        </div>

        <div className="metric-card glass-panel accent-purple">
          <div>
            <div className="metric-label">Hospital Facilities</div>
            <div className="metric-val">{stats.totalHospitals || 0}</div>
            <span style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>Accredited institutions</span>
          </div>
          <div className="metric-icon-wrap" style={{ color: "var(--accent-purple)" }}>
            <Building2 size={24} />
          </div>
        </div>

        <div className="metric-card glass-panel accent-amber">
          <div>
            <div className="metric-label">Medical Records</div>
            <div className="metric-val">{stats.totalRecords || 0}</div>
            <span style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>AES-256 + IPFS CIDs</span>
          </div>
          <div className="metric-icon-wrap" style={{ color: "var(--accent-amber)" }}>
            <FileText size={24} />
          </div>
        </div>

        <div className="metric-card glass-panel accent-rose">
          <div>
            <div className="metric-label">On-Chain Audit Events</div>
            <div className="metric-val">{stats.totalAuditEvents || 0}</div>
            <span style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>Tamper-proof logs</span>
          </div>
          <div className="metric-icon-wrap" style={{ color: "var(--accent-rose)" }}>
            <Clock size={24} />
          </div>
        </div>
      </div>

      {/* System Architecture & Workflow Cards */}
      <h2 style={{ fontSize: "1.4rem", marginBottom: "1rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
        <Zap size={20} className="text-sky-400" />
        <span>Core Architectural Capabilities</span>
      </h2>

      <div className="grid-3" style={{ marginBottom: "2rem" }}>
        <div className="glass-panel" style={{ padding: "1.5rem" }}>
          <div style={{ width: "42px", height: "42px", borderRadius: "10px", background: "rgba(56, 189, 248, 0.15)", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--accent-sky)", marginBottom: "1rem" }}>
            <Lock size={22} />
          </div>
          <h3 style={{ fontSize: "1.1rem", marginBottom: "0.5rem" }}>Client-Side Encryption</h3>
          <p style={{ color: "var(--text-secondary)", fontSize: "0.875rem", lineHeight: "1.6" }}>
            Files are encrypted in the user's browser via AES-256-GCM before transmission. Only ciphertext is sent to decentralized IPFS storage.
          </p>
        </div>

        <div className="glass-panel" style={{ padding: "1.5rem" }}>
          <div style={{ width: "42px", height: "42px", borderRadius: "10px", background: "rgba(16, 185, 129, 0.15)", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--accent-emerald)", marginBottom: "1rem" }}>
            <KeyRound size={22} />
          </div>
          <h3 style={{ fontSize: "1.1rem", marginBottom: "0.5rem" }}>Patient-Controlled Access</h3>
          <p style={{ color: "var(--text-secondary)", fontSize: "0.875rem", lineHeight: "1.6" }}>
            Patients grant fine-grained, time-bounded access to specific doctors or hospitals. Permissions can be revoked immediately on-chain.
          </p>
        </div>

        <div className="glass-panel" style={{ padding: "1.5rem" }}>
          <div style={{ width: "42px", height: "42px", borderRadius: "10px", background: "rgba(168, 85, 247, 0.15)", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--accent-purple)", marginBottom: "1rem" }}>
            <Database size={22} />
          </div>
          <h3 style={{ fontSize: "1.1rem", marginBottom: "0.5rem" }}>Immutable Audit Trail</h3>
          <p style={{ color: "var(--text-secondary)", fontSize: "0.875rem", lineHeight: "1.6" }}>
            Every view, grant, revocation, and break-glass emergency access is timestamped and recorded in smart contract state for compliance.
          </p>
        </div>
      </div>

      {/* Contract & Environment Info */}
      <div className="glass-panel" style={{ padding: "1.5rem" }}>
        <h3 style={{ fontSize: "1.1rem", marginBottom: "1rem" }}>Smart Contract Deployment Details</h3>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "1rem" }}>
          <div>
            <div style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>Contract Address</div>
            <div className="mono-text" style={{ wordBreak: "break-all", display: "inline-block", marginTop: "0.25rem" }}>
              {contractData.address}
            </div>
          </div>
          <div>
            <div style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>Deployment Gas Used</div>
            <div style={{ fontWeight: 600, color: "var(--text-primary)", marginTop: "0.25rem" }}>
              {Number(contractData.deploymentStats.gasUsed).toLocaleString()} units
            </div>
          </div>
          <div>
            <div style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>Deployment Cost</div>
            <div style={{ fontWeight: 600, color: "var(--accent-emerald)", marginTop: "0.25rem" }}>
              {contractData.deploymentStats.costEth} ETH
            </div>
          </div>
          <div>
            <div style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>Active Account</div>
            <div className="mono-text" style={{ wordBreak: "break-all", display: "inline-block", marginTop: "0.25rem" }}>
              {account}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
