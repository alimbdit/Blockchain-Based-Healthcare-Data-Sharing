import React, { useState, useEffect, useCallback } from "react";
import confetti from "canvas-confetti";
import { ethers } from "ethers";
import Header from "./components/Header";
import DashboardOverview from "./components/DashboardOverview";
import PatientPortal from "./components/PatientPortal";
import DoctorPortal from "./components/DoctorPortal";
import HospitalPortal from "./components/HospitalPortal";
import AdminDashboard from "./components/AdminDashboard";
import PerformanceEvaluation from "./components/PerformanceEvaluation";
import ReportGuide from "./components/ReportGuide";

import { 
  isMetaMaskAvailable, 
  connectMetaMask, 
  switchOrAddHardhatNetwork, 
  getHealthcareContract, 
  getDemoSigner,
  getFallbackProvider,
  HARDHAT_CHAIN_ID
} from "./utils/web3";
import contractData from "./contracts/contractData.json";

export default function App() {
  // Navigation
  const [activeTab, setActiveTab] = useState("OVERVIEW"); // OVERVIEW, PATIENT, DOCTOR, HOSPITAL, ADMIN, PERFORMANCE, REPORT

  // Web3 State
  const [account, setAccount] = useState("");
  const [balance, setBalance] = useState(null);
  const [chainId, setChainId] = useState(null);
  const [isMetaMaskConnected, setIsMetaMaskConnected] = useState(false);
  const [isDemoMode, setIsDemoMode] = useState(true);
  const [selectedPersona, setSelectedPersona] = useState(contractData.demoAccounts[1].address); // default to Patient Alice
  const [contractInstance, setContractInstance] = useState(null);

  // Application Data State
  const [currentRole, setCurrentRole] = useState("PATIENT");
  const [stats, setStats] = useState({
    totalPatients: 0,
    totalDoctors: 0,
    totalHospitals: 0,
    totalRecords: 0,
    totalAuditEvents: 0
  });

  const [patientData, setPatientData] = useState(null);
  const [doctorData, setDoctorData] = useState(null);
  const [hospitalData, setHospitalData] = useState(null);
  const [patientRecords, setPatientRecords] = useState([]);
  const [allDoctors, setAllDoctors] = useState([]);
  const [allHospitals, setAllHospitals] = useState([]);
  const [auditLogs, setAuditLogs] = useState([]);

  // Toast Notifications
  const [toasts, setToasts] = useState([]);

  const addToast = useCallback((type, message) => {
    const id = Date.now() + Math.random();
    setToasts((prev) => [...prev, { id, type, message }]);
    if (type === "success") {
      try {
        confetti({ particleCount: 40, spread: 60, origin: { y: 0.85 } });
      } catch (e) {}
    }
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 5000);
  }, []);

  // Initialize Contract and Signer based on mode
  const setupSignerAndContract = useCallback(async (personaVal) => {
    try {
      const provider = getFallbackProvider();

      if (personaVal === "METAMASK") {
        if (!isMetaMaskAvailable()) {
          addToast("error", "MetaMask extension not found. Please install MetaMask or use Demo Mode.");
          setSelectedPersona(contractData.demoAccounts[1].address);
          return;
        }
        const { signer, account: mmAccount, chainId: mmChainId } = await connectMetaMask();
        setAccount(mmAccount);
        setChainId(mmChainId);
        setIsMetaMaskConnected(true);
        setIsDemoMode(false);

        const contract = getHealthcareContract(signer);
        setContractInstance(contract);

        // Fetch balance
        const bal = await provider.getBalance(mmAccount);
        setBalance(ethers.formatEther(bal));
        return contract;
      } else {
        // Find persona
        const found = contractData.demoAccounts.find(
          (a) => a.address.toLowerCase() === personaVal.toLowerCase()
        ) || contractData.demoAccounts[1];

        const signer = getDemoSigner(found.privateKey);
        setAccount(found.address);
        setChainId(HARDHAT_CHAIN_ID);
        setIsDemoMode(true);

        const contract = getHealthcareContract(signer);
        setContractInstance(contract);

        const bal = await provider.getBalance(found.address);
        setBalance(ethers.formatEther(bal));
        return contract;
      }
    } catch (err) {
      console.error("Error configuring signer:", err);
      addToast("error", err.message || "Failed to initialize wallet connection");
      return null;
    }
  }, [addToast]);

  // Load All Contract State Data
  const loadBlockchainData = useCallback(async (activeContract, currentAccount) => {
    if (!activeContract || !currentAccount) return;

    try {
      // 1. System stats
      const [pCount, dCount, hCount, rCount, aCount] = await activeContract.getSystemStats();
      setStats({
        totalPatients: Number(pCount),
        totalDoctors: Number(dCount),
        totalHospitals: Number(hCount),
        totalRecords: Number(rCount),
        totalAuditEvents: Number(aCount)
      });

      // 2. Determine current role
      const adminAddr = await activeContract.admin();
      const p = await activeContract.getPatient(currentAccount);
      const d = await activeContract.getDoctor(currentAccount);
      const h = await activeContract.getHospital(currentAccount);

      let detectedRole = "GUEST";
      if (currentAccount.toLowerCase() === adminAddr.toLowerCase()) {
        detectedRole = "ADMIN";
      } else if (p.isRegistered) {
        detectedRole = "PATIENT";
      } else if (d.isRegistered) {
        detectedRole = "DOCTOR";
      } else if (h.isRegistered) {
        detectedRole = "HOSPITAL";
      } else {
        detectedRole = "GUEST";
      }
      setCurrentRole(detectedRole);

      // Save entity profiles
      setPatientData({
        wallet: currentAccount,
        name: p.name,
        dateOfBirth: p.dateOfBirth,
        gender: p.gender,
        bloodGroup: p.bloodGroup,
        contact: p.contact,
        emergencyContact: p.emergencyContact,
        isRegistered: p.isRegistered,
        registrationTime: p.registrationTime,
        recordIds: p.recordIds
      });

      setDoctorData({
        wallet: currentAccount,
        name: d.name,
        licenseNumber: d.licenseNumber,
        specialization: d.specialization,
        hospitalAffiliation: d.hospitalAffiliation,
        isRegistered: d.isRegistered,
        isApproved: d.isApproved,
        registrationTime: d.registrationTime
      });

      setHospitalData({
        wallet: currentAccount,
        name: h.name,
        licenseId: h.licenseId,
        physicalAddress: h.physicalAddress,
        contactPhone: h.contactPhone,
        isRegistered: h.isRegistered,
        isApproved: h.isApproved,
        registrationTime: h.registrationTime
      });

      // 3. Load Records
      const totalRecs = Number(rCount);
      const fetchedRecords = [];
      for (let i = 1; i <= totalRecs; i++) {
        try {
          const rec = await activeContract.records(i);
          if (rec.id > 0) {
            fetchedRecords.push({
              id: Number(rec.id),
              patient: rec.patient,
              uploader: rec.uploader,
              title: rec.title,
              recordType: rec.recordType,
              ipfsHash: rec.ipfsHash,
              fileChecksum: rec.fileChecksum,
              encryptedKeyHash: rec.encryptedKeyHash,
              fileSize: rec.fileSize,
              mimeType: rec.mimeType,
              timestamp: rec.timestamp
            });
          }
        } catch (e) {
          console.warn(`Could not read record ${i}:`, e);
        }
      }
      setPatientRecords(fetchedRecords);

      // 4. Load all Doctors
      const docAddrs = await activeContract.getAllDoctors();
      const docList = [];
      for (const addr of docAddrs) {
        const docInfo = await activeContract.getDoctor(addr);
        docList.push({
          wallet: addr,
          name: docInfo.name,
          licenseNumber: docInfo.licenseNumber,
          specialization: docInfo.specialization,
          hospitalAffiliation: docInfo.hospitalAffiliation,
          isRegistered: docInfo.isRegistered,
          isApproved: docInfo.isApproved
        });
      }
      setAllDoctors(docList);

      // 5. Load all Hospitals
      const hospAddrs = await activeContract.getAllHospitals();
      const hospList = [];
      for (const addr of hospAddrs) {
        const hospInfo = await activeContract.getHospital(addr);
        hospList.push({
          wallet: addr,
          name: hospInfo.name,
          licenseId: hospInfo.licenseId,
          physicalAddress: hospInfo.physicalAddress,
          contactPhone: hospInfo.contactPhone,
          isRegistered: hospInfo.isRegistered,
          isApproved: hospInfo.isApproved
        });
      }
      setAllHospitals(hospList);

      // 6. Load Audit Logs
      const totalLogs = Number(aCount);
      if (totalLogs > 0) {
        const logs = await activeContract.getAuditLogs(0, Math.min(totalLogs, 50));
        setAuditLogs(logs.map((l) => ({
          id: Number(l.id),
          timestamp: l.timestamp,
          actor: l.actor,
          role: l.role,
          action: l.action,
          recordId: l.recordId,
          details: l.details,
          blockNumber: Number(l.blockNumber)
        })).reverse()); // newest first
      }
    } catch (err) {
      console.error("Error loading blockchain state:", err);
    }
  }, []);

  // Initial Load
  useEffect(() => {
    let isMounted = true;
    (async () => {
      const contract = await setupSignerAndContract(selectedPersona);
      if (contract && isMounted) {
        await loadBlockchainData(contract, account || selectedPersona);
      }
    })();
    return () => { isMounted = false; };
  }, [selectedPersona, setupSignerAndContract, loadBlockchainData, account]);

  // MetaMask Event Listeners
  useEffect(() => {
    if (!isMetaMaskAvailable()) return;

    const handleAccountsChanged = (accounts) => {
      if (accounts.length === 0) {
        setIsMetaMaskConnected(false);
        addToast("info", "MetaMask account disconnected");
      } else if (selectedPersona === "METAMASK") {
        setAccount(accounts[0]);
        setupSignerAndContract("METAMASK");
        addToast("info", `MetaMask account switched: ${accounts[0].substring(0, 8)}...`);
      }
    };

    const handleChainChanged = (newChainId) => {
      setChainId(parseInt(newChainId, 16));
      if (selectedPersona === "METAMASK") {
        setupSignerAndContract("METAMASK");
      }
    };

    window.ethereum.on("accountsChanged", handleAccountsChanged);
    window.ethereum.on("chainChanged", handleChainChanged);

    return () => {
      if (window.ethereum?.removeListener) {
        window.ethereum.removeListener("accountsChanged", handleAccountsChanged);
        window.ethereum.removeListener("chainChanged", handleChainChanged);
      }
    };
  }, [selectedPersona, setupSignerAndContract, addToast]);

  // Persona Selection Change Handler
  const handleSelectPersona = async (val) => {
    setSelectedPersona(val);
    const contract = await setupSignerAndContract(val);
    if (contract) {
      const newAcc = val === "METAMASK" ? account : val;
      await loadBlockchainData(contract, newAcc);
      addToast("info", `Switched persona to: ${val === "METAMASK" ? "MetaMask" : val.substring(0, 8) + "..."}`);
    }
  };

  // Connect MetaMask Handler
  const handleConnectMetaMask = async () => {
    handleSelectPersona("METAMASK");
  };

  // Switch Network Handler
  const handleSwitchNetwork = async () => {
    try {
      await switchOrAddHardhatNetwork();
      addToast("success", "Switched network to Hardhat Localhost (31337)!");
    } catch (err) {
      console.error(err);
      addToast("error", err.message || "Failed to switch network");
    }
  };

  // Refresh data helper
  const handleRefresh = async () => {
    if (contractInstance && account) {
      await loadBlockchainData(contractInstance, account);
    }
  };

  return (
    <div>
      {/* Header with Wallet & Persona Control */}
      <Header
        account={account}
        balance={balance}
        chainId={chainId}
        isMetaMaskConnected={isMetaMaskConnected}
        isDemoMode={isDemoMode}
        selectedPersona={selectedPersona}
        currentRole={currentRole}
        onConnectMetaMask={handleConnectMetaMask}
        onSwitchNetwork={handleSwitchNetwork}
        onSelectPersona={handleSelectPersona}
      />

      <main className="app-container">
        {/* Navigation Tabs */}
        <nav className="nav-tabs-container">
          {[
            { id: "OVERVIEW", label: "Dashboard Overview" },
            { id: "PATIENT", label: "Patient Portal" },
            { id: "DOCTOR", label: "Doctor Portal" },
            { id: "HOSPITAL", label: "Hospital Portal" },
            { id: "ADMIN", label: "Admin Dashboard" },
            { id: "PERFORMANCE", label: "Performance Evaluation" },
            { id: "REPORT", label: "15-Page Report Draft & Video Guide" }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`nav-tab-btn ${activeTab === tab.id ? "active" : ""}`}
            >
              <span>{tab.label}</span>
            </button>
          ))}
        </nav>

        {/* Tab Content Panes */}
        {activeTab === "OVERVIEW" && (
          <DashboardOverview
            stats={stats}
            account={account}
            currentRole={currentRole}
            userProfile={patientData}
            onNavigateTab={setActiveTab}
          />
        )}

        {activeTab === "PATIENT" && (
          <PatientPortal
            account={account}
            contract={contractInstance}
            patientData={patientData}
            records={patientRecords.filter(r => r.patient.toLowerCase() === account.toLowerCase())}
            doctors={allDoctors}
            hospitals={allHospitals}
            auditLogs={auditLogs.filter(l => l.actor.toLowerCase() === account.toLowerCase() || l.role === "PATIENT")}
            onRefreshData={handleRefresh}
            onNotify={addToast}
          />
        )}

        {activeTab === "DOCTOR" && (
          <DoctorPortal
            account={account}
            contract={contractInstance}
            doctorData={doctorData}
            patients={allDoctors}
            records={patientRecords}
            onRefreshData={handleRefresh}
            onNotify={addToast}
          />
        )}

        {activeTab === "HOSPITAL" && (
          <HospitalPortal
            account={account}
            contract={contractInstance}
            hospitalData={hospitalData}
            doctors={allDoctors}
            records={patientRecords}
            onRefreshData={handleRefresh}
            onNotify={addToast}
          />
        )}

        {activeTab === "ADMIN" && (
          <AdminDashboard
            contract={contractInstance}
            stats={stats}
            doctors={allDoctors}
            hospitals={allHospitals}
            auditLogs={auditLogs}
            onRefreshData={handleRefresh}
            onNotify={addToast}
          />
        )}

        {activeTab === "PERFORMANCE" && (
          <PerformanceEvaluation
            onNotify={addToast}
          />
        )}

        {activeTab === "REPORT" && (
          <ReportGuide />
        )}
      </main>

      {/* Floating Toast Alerts */}
      <div className="toast-container">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={`toast ${
              t.type === "success" ? "toast-success" :
              t.type === "error" ? "toast-error" : "toast-info"
            }`}
          >
            <span>{t.message}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
