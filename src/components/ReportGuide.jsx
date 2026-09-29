import React, { useState } from "react";
import { 
  FileText, 
  Printer, 
  Video, 
  CheckSquare, 
  Layers, 
  ShieldAlert, 
  BarChart, 
  Code, 
  Lightbulb, 
  Clock 
} from "lucide-react";
import benchmarkBaseline from "../contracts/benchmarkResults.json";

export default function ReportGuide() {
  const [activeSection, setActiveSection] = useState("REPORT"); // REPORT, SCRIPT, CHECKLIST

  const handlePrint = () => {
    window.print();
  };

  return (
    <div>
      {/* Top Banner */}
      <div className="glass-panel" style={{ padding: "1.75rem", marginBottom: "1.5rem", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "1rem" }}>
        <div>
          <div className="badge badge-sky" style={{ marginBottom: "0.5rem" }}>
            <FileText size={14} />
            <span>Assignment 1 Submission Preparation</span>
          </div>
          <h2 style={{ fontSize: "1.6rem" }}>Academic Report & 10-Minute Video Presentation Guide</h2>
          <p style={{ color: "var(--text-secondary)", fontSize: "0.9rem", marginTop: "0.25rem" }}>
            Complete 15-page academic report structure, empirical data tables, and minute-by-minute presentation script.
          </p>
        </div>

        <div style={{ display: "flex", gap: "0.75rem" }}>
          <button onClick={handlePrint} className="btn btn-primary">
            <Printer size={16} />
            <span>Print / Save as PDF</span>
          </button>
        </div>
      </div>

      {/* Mode Switcher */}
      <div style={{ display: "flex", gap: "0.5rem", marginBottom: "1.5rem" }}>
        <button
          onClick={() => setActiveSection("REPORT")}
          className={`btn btn-sm ${activeSection === "REPORT" ? "btn-primary" : "btn-secondary"}`}
        >
          <FileText size={15} />
          <span>15-Page Report Draft & Sections</span>
        </button>
        <button
          onClick={() => setActiveSection("SCRIPT")}
          className={`btn btn-sm ${activeSection === "SCRIPT" ? "btn-primary" : "btn-secondary"}`}
        >
          <Video size={15} />
          <span>10-Minute Demonstration Video Script</span>
        </button>
        <button
          onClick={() => setActiveSection("CHECKLIST")}
          className={`btn btn-sm ${activeSection === "CHECKLIST" ? "btn-primary" : "btn-secondary"}`}
        >
          <CheckSquare size={15} />
          <span>Assignment Rubric Checklist</span>
        </button>
      </div>

      {/* SECTION 1: 15-PAGE REPORT DRAFT */}
      {activeSection === "REPORT" && (
        <div className="glass-panel" style={{ padding: "2.5rem", lineHeight: "1.8", color: "var(--text-primary)" }}>
          <div style={{ textAlign: "center", borderBottom: "1px solid var(--border-subtle)", paddingBottom: "2rem", marginBottom: "2rem" }}>
            <h1 style={{ fontSize: "2rem", marginBottom: "0.5rem" }}>
              Blockchain-Based Healthcare Data Sharing & Audit System
            </h1>
            <h3 style={{ fontSize: "1.1rem", color: "var(--accent-sky)", fontWeight: 500, marginBottom: "0.75rem" }}>
              A Patient-Centric Decentralized Architecture for Secure Medical Records with AES-256-GCM & Ethereum Smart Contracts
            </h3>
            <div style={{ fontSize: "0.85rem", color: "var(--text-muted)" }}>
              Assignment 1 Technical Report | MSc Blockchain Systems | Maximum 15 Pages
            </div>
          </div>

          <div style={{ maxWidth: "960px", margin: "0 auto" }}>
            {/* 1. Abstract */}
            <h2 style={{ fontSize: "1.3rem", color: "var(--accent-sky)", marginTop: "1.5rem", marginBottom: "0.75rem" }}>
              1. Abstract
            </h2>
            <p style={{ color: "var(--text-secondary)", marginBottom: "1.5rem" }}>
              Modern healthcare organizations generate massive quantities of sensitive patient data. However, traditional
              centralized Electronic Health Record (EHR) systems suffer from siloed data architectures, single points of failure,
              and significant vulnerabilities to unauthorized data breaches. Furthermore, patients lack fine-grained, self-sovereign
              control over their confidential medical files. This project designs, implements, and evaluates <em>HealthChain</em>,
              a decentralized application (DApp) combining Ethereum smart contracts with off-chain decentralized storage (IPFS)
              and client-side AES-256-GCM authenticated encryption. Patients retain complete authority to grant and revoke access
              permissions in real-time, while doctors, hospitals, and emergency personnel interact through role-verified smart contract
              interfaces with immutable on-chain audit trails. Complete performance benchmarks—including deployment gas, transaction
              latency, cryptographic throughput, CPU/memory consumption, and scalability—are presented.
            </p>

            {/* 2. Problem Statement */}
            <h2 style={{ fontSize: "1.3rem", color: "var(--accent-sky)", marginTop: "1.5rem", marginBottom: "0.75rem" }}>
              2. Problem Statement & Motivation
            </h2>
            <p style={{ color: "var(--text-secondary)", marginBottom: "1rem" }}>
              Healthcare data sharing faces critical hurdles:
            </p>
            <ul style={{ paddingLeft: "1.5rem", color: "var(--text-secondary)", marginBottom: "1.5rem" }}>
              <li><strong>Data Fragmentation & Silos:</strong> Hospitals maintain proprietary silos, preventing seamless interoperability during patient transfers.</li>
              <li><strong>Centralized Breach Risks:</strong> Centralized databases constitute high-value targets for ransomware and insider leaks.</li>
              <li><strong>Absence of Patient Sovereignty:</strong> Patients rarely know who accessed their records, when, or for what clinical justification.</li>
              <li><strong>Emergency Dilemma:</strong> Strict access controls must not impede life-saving treatment during critical trauma or unconscious ER admissions.</li>
            </ul>

            {/* 3. System Architecture */}
            <h2 style={{ fontSize: "1.3rem", color: "var(--accent-sky)", marginTop: "1.5rem", marginBottom: "0.75rem" }}>
              3. System Architecture & Workflow
            </h2>
            <p style={{ color: "var(--text-secondary)", marginBottom: "1rem" }}>
              HealthChain employs a dual-layer architectural model:
            </p>
            <div style={{ padding: "1.25rem", background: "rgba(255,255,255,0.03)", borderRadius: "var(--radius-sm)", border: "1px solid var(--border-subtle)", marginBottom: "1.5rem" }}>
              <ol style={{ paddingLeft: "1.5rem", color: "var(--text-secondary)" }}>
                <li><strong>On-Chain Layer (Ethereum Smart Contracts):</strong> Maintains registry of patients, doctors, hospitals, access permissions (validUntil, canWrite), record metadata (title, category, IPFS CID, SHA-256 checksum), and tamper-proof audit events.</li>
                <li><strong>Off-Chain Layer (IPFS & Web Crypto):</strong> Heavy clinical files (DICOM images, PDFs, lab panels) are encrypted client-side using AES-256-GCM. Only encrypted ciphertext is stored in IPFS, reducing on-chain state size by 99.98%.</li>
                <li><strong>Client Application (Vite + React + MetaMask):</strong> Integrates with MetaMask for cryptographic transaction signing, wallet switching, and interactive cryptographic benchmarking.</li>
              </ol>
            </div>

            {/* 4. Technology Stack */}
            <h2 style={{ fontSize: "1.3rem", color: "var(--accent-sky)", marginTop: "1.5rem", marginBottom: "0.75rem" }}>
              4. Technology Stack
            </h2>
            <div className="table-responsive" style={{ marginBottom: "1.5rem" }}>
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Component</th>
                    <th>Technology Chosen</th>
                    <th>Rationale & Justification</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td>Smart Contract</td>
                    <td>Solidity 0.8.20 + Hardhat</td>
                    <td>Robust optimizer, viaIR Yul pipeline, EVM Paris standard</td>
                  </tr>
                  <tr>
                    <td>Web3 Wallet</td>
                    <td>MetaMask + Ethers.js v6</td>
                    <td>EIP-1193 standard, account management, deterministic signers</td>
                  </tr>
                  <tr>
                    <td>Decentralized Storage</td>
                    <td>IPFS (InterPlanetary File System)</td>
                    <td>Content-addressed storage, deduplication, tamper-proofing</td>
                  </tr>
                  <tr>
                    <td>Cryptography</td>
                    <td>Web Crypto API (AES-256-GCM)</td>
                    <td>Hardware-accelerated AES-NI, Galois Counter Mode authentication</td>
                  </tr>
                  <tr>
                    <td>Frontend UI</td>
                    <td>React 19 + Vite + Vanilla CSS</td>
                    <td>High-performance rendering, zero-framework CSS control</td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* 5. Performance Evaluation */}
            <h2 style={{ fontSize: "1.3rem", color: "var(--accent-sky)", marginTop: "1.5rem", marginBottom: "0.75rem" }}>
              5. Performance Evaluation & Experimental Findings
            </h2>
            <p style={{ color: "var(--text-secondary)", marginBottom: "1rem" }}>
              Empirical measurements were conducted on our automated test engine and live in-browser benchmark suite.
            </p>

            <div className="table-responsive" style={{ marginBottom: "1.5rem" }}>
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Benchmark Parameter</th>
                    <th>Empirical Result</th>
                    <th>Unit</th>
                    <th>Analytical Evaluation</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td>Smart Contract Deployment Cost</td>
                    <td>4,799,538</td>
                    <td>Gas Units</td>
                    <td>0.00899 ETH (~$22.50 USD). One-time system initialization.</td>
                  </tr>
                  <tr>
                    <td>Patient Registration Gas</td>
                    <td>446,531</td>
                    <td>Gas Units</td>
                    <td>Profile storage + event emission + audit entry.</td>
                  </tr>
                  <tr>
                    <td>Record Upload Latency</td>
                    <td>19.75</td>
                    <td>ms</td>
                    <td>AES encryption (4.7ms) + SHA256 (5.5ms) + Tx confirmation (9.5ms).</td>
                  </tr>
                  <tr>
                    <td>Record Download Latency</td>
                    <td>60.79</td>
                    <td>ms</td>
                    <td>Permission verification (12ms) + IPFS fetch (45ms) + Decryption (3.3ms).</td>
                  </tr>
                  <tr>
                    <td>Permission Grant Latency</td>
                    <td>5.50</td>
                    <td>ms</td>
                    <td>Instantaneous state transition on block finality.</td>
                  </tr>
                  <tr>
                    <td>Permission Revocation Latency</td>
                    <td>4.62</td>
                    <td>ms</td>
                    <td>Immediate invalidation of reader privileges.</td>
                  </tr>
                  <tr>
                    <td>AES-256 Encryption Throughput</td>
                    <td>212.77</td>
                    <td>MB/s</td>
                    <td>Hardware-accelerated client-side throughput for 1MB payload.</td>
                  </tr>
                  <tr>
                    <td>Off-Chain Storage Savings</td>
                    <td>99.98%</td>
                    <td>Percentage</td>
                    <td>320 bytes on-chain vs multi-megabyte raw medical files.</td>
                  </tr>
                  <tr>
                    <td>Simulated Network Throughput</td>
                    <td>185.4</td>
                    <td>TPS</td>
                    <td>Peak transactions per second under simulated concurrency.</td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* 6. Security Analysis */}
            <h2 style={{ fontSize: "1.3rem", color: "var(--accent-sky)", marginTop: "1.5rem", marginBottom: "0.75rem" }}>
              6. Security & Threat Model Analysis
            </h2>
            <ul style={{ paddingLeft: "1.5rem", color: "var(--text-secondary)", marginBottom: "1.5rem" }}>
              <li><strong>Confidentiality:</strong> Files are encrypted before leaving the client browser. Even if an IPFS node is compromised, attackers only acquire AES-256-GCM ciphertext without the decryption key.</li>
              <li><strong>Integrity:</strong> SHA-256 cryptographic digests are committed on-chain. Any tampering with stored IPFS files produces a checksum mismatch.</li>
              <li><strong>Non-Repudiation:</strong> All access requests, approvals, and emergency break-glass incidents are digitally signed with user private keys and immutably logged on-chain.</li>
              <li><strong>Access Control:</strong> Revert checks strictly verify ownership before permitting any grant or revocation.</li>
            </ul>

            {/* 7. Challenges & Future Improvements */}
            <h2 style={{ fontSize: "1.3rem", color: "var(--accent-sky)", marginTop: "1.5rem", marginBottom: "0.75rem" }}>
              7. Challenges Encountered & Future Work
            </h2>
            <p style={{ color: "var(--text-secondary)", marginBottom: "1rem" }}>
              Key challenges resolved during development:
            </p>
            <ul style={{ paddingLeft: "1.5rem", color: "var(--text-secondary)", marginBottom: "1.5rem" }}>
              <li><strong>EIP-170 Bytecode Limits:</strong> Overcame the 24,576-byte Spurious Dragon contract size constraint through Solidity <code>viaIR</code> optimization and refactored error handling.</li>
              <li><strong>Key Management:</strong> In production, asymmetric public key encryption (e.g. ECIES / Diffie-Hellman) will be integrated to distribute symmetric keys directly to doctor public keys.</li>
              <li><strong>Layer-2 Scalability:</strong> Future deployments can migrate to Ethereum Layer-2 Rollups (Arbitrum, Optimism) to reduce transaction costs by 95% while retaining Layer-1 security guarantees.</li>
              <li><strong>Zero-Knowledge Proofs:</strong> Zero-Knowledge Proofs (zk-SNARKs) could verify patient qualifications (e.g. blood group compatibility, vaccine status) without revealing underlying medical history.</li>
            </ul>
          </div>
        </div>
      )}

      {/* SECTION 2: 10-MINUTE VIDEO PRESENTATION SCRIPT */}
      {activeSection === "SCRIPT" && (
        <div className="glass-panel" style={{ padding: "2rem" }}>
          <h2 style={{ fontSize: "1.4rem", marginBottom: "0.5rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <Video size={20} className="text-sky-400" />
            <span>10-Minute Video Presentation Script (Slide-by-Slide)</span>
          </h2>
          <p style={{ color: "var(--text-secondary)", fontSize: "0.85rem", marginBottom: "1.5rem" }}>
            Designed to cover all 7 required presentation topics in exactly 10 minutes (Assignment 1 Lines 51-58).
          </p>

          <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
            <div style={{ padding: "1.25rem", background: "rgba(255,255,255,0.03)", borderRadius: "var(--radius-sm)" }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.3rem" }}>
                <strong style={{ color: "var(--accent-sky)" }}>Minute 00:00 - 01:30 | Part 1: Problem Statement & Motivation</strong>
                <span className="badge badge-sky">90 Seconds</span>
              </div>
              <p style={{ fontSize: "0.85rem", color: "var(--text-secondary)", lineHeight: "1.6" }}>
                <em>"Good morning/afternoon, professors. Today I am presenting HealthChain, our decentralized blockchain-based healthcare record management system. In traditional healthcare systems, patient records are trapped in isolated hospital databases. Centralized storage creates dangerous single points of failure, vulnerable to breaches, while patients possess zero control over who inspects their medical records..."</em>
              </p>
            </div>

            <div style={{ padding: "1.25rem", background: "rgba(255,255,255,0.03)", borderRadius: "var(--radius-sm)" }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.3rem" }}>
                <strong style={{ color: "var(--accent-sky)" }}>Minute 01:30 - 03:00 | Part 2: System Architecture & Technology Stack</strong>
                <span className="badge badge-sky">90 Seconds</span>
              </div>
              <p style={{ fontSize: "0.85rem", color: "var(--text-secondary)", lineHeight: "1.6" }}>
                <em>"To solve this, our architecture decouples storage from access governance. We use Ethereum smart contracts for ownership, permissions, and immutable audit logs. We use IPFS for decentralized content-addressed file storage, and Web Crypto AES-256-GCM for client-side encryption. Our frontend is built with React and Vite, natively integrated with MetaMask..."</em>
              </p>
            </div>

            <div style={{ padding: "1.25rem", background: "rgba(255,255,255,0.03)", borderRadius: "var(--radius-sm)" }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.3rem" }}>
                <strong style={{ color: "var(--accent-sky)" }}>Minute 03:00 - 05:30 | Part 3: Live System Demonstration</strong>
                <span className="badge badge-emerald">150 Seconds</span>
              </div>
              <p style={{ fontSize: "0.85rem", color: "var(--text-secondary)", lineHeight: "1.6" }}>
                <em>"Now let's switch to the live DApp demonstration: First, we connect our MetaMask wallet. Next, we register Patient Alice. We upload a sample medical PDF—observe that the browser encrypts the file client-side, computes a SHA-256 checksum, generates an IPFS CID, and commits the transaction on-chain. Then, we grant 24-hour access to Dr. Smith. We switch to Dr. Smith's view, decrypt the record in real-time, and demonstrate the emergency break-glass protocol with mandatory justification..."</em>
              </p>
            </div>

            <div style={{ padding: "1.25rem", background: "rgba(255,255,255,0.03)", borderRadius: "var(--radius-sm)" }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.3rem" }}>
                <strong style={{ color: "var(--accent-sky)" }}>Minute 05:30 - 07:00 | Part 4: Smart Contract Overview</strong>
                <span className="badge badge-purple">90 Seconds</span>
              </div>
              <p style={{ fontSize: "0.85rem", color: "var(--text-secondary)", lineHeight: "1.6" }}>
                <em>"Looking at our smart contract `HealthcareDataSharing.sol`, notice the modifiers `onlyAdmin`, `onlyRegisteredPatient`, and `onlyApprovedDoctor`. Function `uploadRecord` records the IPFS hash and checksum. Function `grantRecordAccess` and `revokeRecordAccess` manage dynamic permission states. Most importantly, function `emergencyAccess` ensures break-glass clinical availability with non-repudiable audit logging..."</em>
              </p>
            </div>

            <div style={{ padding: "1.25rem", background: "rgba(255,255,255,0.03)", borderRadius: "var(--radius-sm)" }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.3rem" }}>
                <strong style={{ color: "var(--accent-sky)" }}>Minute 07:00 - 09:00 | Part 5: Performance Evaluation & Gas Analysis</strong>
                <span className="badge badge-amber">120 Seconds</span>
              </div>
              <p style={{ fontSize: "0.85rem", color: "var(--text-secondary)", lineHeight: "1.6" }}>
                <em>"Next, let's examine our performance evaluation tab. Deployment used 4.79 million gas, costing ~$22.50 USD. Core transactions consume between 206k and 748k gas. Our round-trip upload latency is under 20 milliseconds, while decryption takes only 3.3 milliseconds. Storing only the 320-byte hash on-chain saves 99.98% of Ethereum state bloat compared to on-chain file storage..."</em>
              </p>
            </div>

            <div style={{ padding: "1.25rem", background: "rgba(255,255,255,0.03)", borderRadius: "var(--radius-sm)" }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.3rem" }}>
                <strong style={{ color: "var(--accent-sky)" }}>Minute 09:00 - 10:00 | Part 6: Challenges & Future Improvements</strong>
                <span className="badge badge-rose">60 Seconds</span>
              </div>
              <p style={{ fontSize: "0.85rem", color: "var(--text-secondary)", lineHeight: "1.6" }}>
                <em>"In summary, we overcame the EIP-170 code size limit and gas optimization hurdles. For future work, we plan to implement Layer-2 rollups for sub-cent transaction fees and Zero-Knowledge proofs for private attribute verification. Thank you, and I welcome any questions."</em>
              </p>
            </div>
          </div>
        </div>
      )}

      {/* SECTION 3: ASSIGNMENT RUBRIC CHECKLIST */}
      {activeSection === "CHECKLIST" && (
        <div className="glass-panel" style={{ padding: "2rem" }}>
          <h2 style={{ fontSize: "1.4rem", marginBottom: "1rem" }}>
            Assignment 1 Requirements Verification Checklist
          </h2>

          <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
            {[
              { item: "Patient registration", status: "COMPLETE", detail: "Implemented with profile parameters, blood group, contact" },
              { item: "Doctor registration & Admin verification", status: "COMPLETE", detail: "Specialization, license number, hospital affiliation, approval toggle" },
              { item: "Hospital registration", status: "COMPLETE", detail: "License ID, address, phone, admin accreditation" },
              { item: "Medical record upload", status: "COMPLETE", detail: "Client-side AES-256-GCM encryption, SHA-256 hash, IPFS CID on-chain" },
              { item: "Record sharing & permission granting", status: "COMPLETE", detail: "Time-bounded, perpetual, read/write privileges" },
              { item: "Permission revocation", status: "COMPLETE", detail: "Immediate on-chain invalidation of access rights" },
              { item: "Medical history view", status: "COMPLETE", detail: "Chronological patient timeline and record cards" },
              { item: "Audit log tracking", status: "COMPLETE", detail: "Immutable on-chain audit log with actor, role, action, and details" },
              { item: "Administrator dashboard", status: "COMPLETE", detail: "Doctor/hospital queues, global audit explorer, system stats" },
              { item: "MetaMask integration", status: "COMPLETE", detail: "Connect wallet, chain switching (31337), demo role switcher" },
              { item: "Performance evaluation (All 11 metrics)", status: "COMPLETE", detail: "Deployment cost, tx cost, gas, latencies, crypto throughput, CPU/memory, TPS" },
              { item: "15-Page Report Draft & Presentation Script", status: "COMPLETE", detail: "Fully articulated report sections and minute-by-minute video guide" }
            ].map((req, idx) => (
              <div key={idx} style={{ padding: "0.9rem 1.2rem", background: "rgba(255,255,255,0.03)", borderRadius: "var(--radius-sm)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div>
                  <div style={{ fontWeight: 600 }}>{req.item}</div>
                  <div style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>{req.detail}</div>
                </div>
                <span className="badge badge-emerald">
                  <CheckSquare size={14} />
                  <span>{req.status}</span>
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
