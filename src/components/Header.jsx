import React from "react";
import { Shield, Wallet, Activity, RefreshCw, CheckCircle, AlertTriangle, UserCheck, Stethoscope, Building2 } from "lucide-react";
import contractData from "../contracts/contractData.json";

export default function Header({
  account,
  balance,
  chainId,
  isMetaMaskConnected,
  isDemoMode,
  selectedPersona,
  onConnectMetaMask,
  onSwitchNetwork,
  onSelectPersona,
  currentRole
}) {
  const formatAddress = (addr) => {
    if (!addr) return "Not Connected";
    return `${addr.substring(0, 6)}...${addr.substring(addr.length - 4)}`;
  };

  const getRoleIcon = (role) => {
    switch (role) {
      case "PATIENT": return <UserCheck size={16} className="text-emerald-400" />;
      case "DOCTOR": return <Stethoscope size={16} className="text-sky-400" />;
      case "HOSPITAL": return <Building2 size={16} className="text-purple-400" />;
      case "ADMIN": return <Shield size={16} className="text-amber-400" />;
      default: return <Activity size={16} />;
    }
  };

  return (
    <header className="app-header">
      <div className="header-content">
        {/* Brand */}
        <div className="brand-section">
          <div className="brand-logo-icon">
            <Shield size={26} />
          </div>
          <div>
            <div className="brand-title">HealthChain</div>
            <div className="brand-subtitle">Decentralized Healthcare Data Sharing</div>
          </div>
        </div>

        {/* Status & Wallet Actions */}
        <div className="header-actions">
          {/* Active Persona / Role Switcher */}
          <div className="persona-selector">
            <span style={{ fontSize: "0.8rem", color: "var(--text-secondary)", marginRight: "0.25rem" }}>
              Persona:
            </span>
            <select
              className="persona-dropdown-select"
              value={selectedPersona}
              onChange={(e) => onSelectPersona(e.target.value)}
            >
              <option value="METAMASK">🦊 MetaMask Connected</option>
              <option disabled>────────── Demo Roles ──────────</option>
              {contractData.demoAccounts.map((acc, idx) => (
                <option key={idx} value={acc.address}>
                  {acc.role}: {acc.name}
                </option>
              ))}
            </select>
          </div>

          {/* Role Badge */}
          <div className={`badge ${
            currentRole === "PATIENT" ? "badge-emerald" :
            currentRole === "DOCTOR" ? "badge-sky" :
            currentRole === "HOSPITAL" ? "badge-purple" : "badge-amber"
          }`}>
            {getRoleIcon(currentRole)}
            <span>{currentRole}</span>
          </div>

          {/* Network Indicator */}
          <div className="badge badge-sky" style={{ gap: "0.5rem" }}>
            <span className="live-dot"></span>
            <span>Localhost (31337)</span>
            {chainId && chainId !== 31337 && (
              <button
                onClick={onSwitchNetwork}
                className="btn btn-sm btn-outline-cyan"
                style={{ padding: "0.15rem 0.4rem", marginLeft: "0.3rem" }}
              >
                Switch
              </button>
            )}
          </div>

          {/* MetaMask / Wallet Button */}
          {isMetaMaskConnected && !isDemoMode ? (
            <div className="btn btn-secondary btn-sm" style={{ gap: "0.5rem" }}>
              <Wallet size={16} className="text-sky-400" />
              <span>{formatAddress(account)}</span>
              {balance !== null && (
                <span style={{ color: "var(--accent-sky)", fontWeight: 600 }}>
                  {parseFloat(balance).toFixed(3)} ETH
                </span>
              )}
            </div>
          ) : (
            <button
              onClick={onConnectMetaMask}
              className="btn btn-primary btn-sm"
              title="Connect MetaMask Wallet"
            >
              <Wallet size={16} />
              <span>{isDemoMode ? "Connect MetaMask" : "Connect Wallet"}</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
}
