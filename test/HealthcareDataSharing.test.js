import { expect } from "chai";
import hardhat from "hardhat";
const { ethers } = hardhat;

describe("HealthcareDataSharing System Tests & Benchmarks", function () {
  let healthcare;
  let admin, patient1, patient2, doctor1, doctor2, hospitalAdmin, unauthorized;
  let deploymentTxReceipt;

  before(async function () {
    [admin, patient1, patient2, doctor1, doctor2, hospitalAdmin, unauthorized] = await ethers.getSigners();

    const Healthcare = await ethers.getContractFactory("HealthcareDataSharing");
    healthcare = await Healthcare.deploy();
    await healthcare.waitForDeployment();

    const deploymentTx = healthcare.deploymentTransaction();
    if (deploymentTx) {
      deploymentTxReceipt = await deploymentTx.wait();
      console.log(`\n========================================`);
      console.log(`CONTRACT DEPLOYMENT BENCHMARK`);
      console.log(`Contract Address: ${await healthcare.getAddress()}`);
      console.log(`Deployment Gas Used: ${deploymentTxReceipt.gasUsed.toString()}`);
      console.log(`Gas Price: ${deploymentTxReceipt.gasPrice.toString()} wei`);
      const totalCostWei = deploymentTxReceipt.gasUsed * deploymentTxReceipt.gasPrice;
      console.log(`Deployment Cost (ETH): ${ethers.formatEther(totalCostWei)} ETH`);
      console.log(`========================================\n`);
    }
  });

  describe("1. Patient Registration", function () {
    it("should allow a user to register as a patient", async function () {
      const tx = await healthcare.connect(patient1).registerPatient(
        "John Doe",
        "1990-05-15",
        "Male",
        "O+",
        "+1234567890",
        "+0987654321"
      );
      const receipt = await tx.wait();
      console.log(`[Gas] registerPatient: ${receipt.gasUsed.toString()} units`);

      const p = await healthcare.getPatient(patient1.address);
      expect(p.isRegistered).to.be.true;
      expect(p.name).to.equal("John Doe");
      expect(p.bloodGroup).to.equal("O+");
    });

    it("should reject duplicate patient registration", async function () {
      await expect(
        healthcare.connect(patient1).registerPatient(
          "Duplicate", "1990-01-01", "Male", "A+", "123", "456"
        )
      ).to.be.revertedWith("Patient already registered");
    });
  });

  describe("2. Doctor Registration and Admin Approval", function () {
    it("should register a doctor with pending approval", async function () {
      const tx = await healthcare.connect(doctor1).registerDoctor(
        "Dr. Alice Smith",
        "MED-LIC-98765",
        "Cardiology",
        "General Metropolitan Hospital"
      );
      const receipt = await tx.wait();
      console.log(`[Gas] registerDoctor: ${receipt.gasUsed.toString()} units`);

      const d = await healthcare.getDoctor(doctor1.address);
      expect(d.isRegistered).to.be.true;
      expect(d.isApproved).to.be.false;
      expect(d.licenseNumber).to.equal("MED-LIC-98765");
    });

    it("should allow admin to approve a doctor", async function () {
      const tx = await healthcare.connect(admin).approveDoctor(doctor1.address, true);
      const receipt = await tx.wait();
      console.log(`[Gas] approveDoctor: ${receipt.gasUsed.toString()} units`);

      const d = await healthcare.getDoctor(doctor1.address);
      expect(d.isApproved).to.be.true;
    });
  });

  describe("3. Hospital Registration and Admin Approval", function () {
    it("should register a hospital and approve it", async function () {
      const tx1 = await healthcare.connect(hospitalAdmin).registerHospital(
        "Metropolitan Health Center",
        "HOSP-REG-4432",
        "100 Medical Plaza Blvd, New York, NY",
        "+1-800-555-0199"
      );
      const receipt1 = await tx1.wait();
      console.log(`[Gas] registerHospital: ${receipt1.gasUsed.toString()} units`);

      const tx2 = await healthcare.connect(admin).approveHospital(hospitalAdmin.address, true);
      await tx2.wait();

      const h = await healthcare.getHospital(hospitalAdmin.address);
      expect(h.isRegistered).to.be.true;
      expect(h.isApproved).to.be.true;
    });
  });

  describe("4. Medical Record Upload (Encrypted Data & Hashes)", function () {
    let recordId;

    it("should allow registered patient to upload an encrypted medical record", async function () {
      const startTime = performance.now();
      const tx = await healthcare.connect(patient1).uploadRecord(
        "Cardiovascular Stress Test & MRI",
        "Diagnostic Imaging",
        "QmXoypizjW3WknFiJnKLwHCnL72vedxjQkDDP1mXWo6uco",
        "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
        "enc-aes-key-blob-sha256-reference",
        2048576,
        "application/pdf"
      );
      const receipt = await tx.wait();
      const endTime = performance.now();
      console.log(`[Gas] uploadRecord: ${receipt.gasUsed.toString()} units (Tx latency: ${(endTime - startTime).toFixed(2)} ms)`);

      recordId = 1n;
      const rec = await healthcare.connect(patient1).getRecordDetails(recordId);
      expect(rec.title).to.equal("Cardiovascular Stress Test & MRI");
      expect(rec.patient).to.equal(patient1.address);
      expect(rec.fileSize).to.equal(2048576n);
    });

    it("should prevent unauthorized users from viewing record metadata without permission", async function () {
      await expect(
        healthcare.connect(unauthorized).getRecordDetails(1)
      ).to.be.revertedWith("Unauthorized record metadata");
    });
  });

  describe("5. Permission Granting & Secure Access Control", function () {
    it("should allow patient to grant record access to an approved doctor", async function () {
      const start = performance.now();
      // Grant access for 24 hours (86400 seconds)
      const tx = await healthcare.connect(patient1).grantRecordAccess(1, doctor1.address, 86400, false);
      const receipt = await tx.wait();
      const end = performance.now();
      console.log(`[Gas] grantRecordAccess: ${receipt.gasUsed.toString()} units (Latency: ${(end - start).toFixed(2)} ms)`);

      const [hasAccess, canWrite] = await healthcare.checkAccess(1, doctor1.address);
      expect(hasAccess).to.be.true;
      expect(canWrite).to.be.false;

      // Doctor can now view the record
      const rec = await healthcare.connect(doctor1).getRecordDetails(1);
      expect(rec.title).to.equal("Cardiovascular Stress Test & MRI");
    });

    it("should log access when doctor accesses the record", async function () {
      const tx = await healthcare.connect(doctor1).accessRecord(1, "Pre-operative cardiology assessment");
      const receipt = await tx.wait();
      console.log(`[Gas] accessRecord: ${receipt.gasUsed.toString()} units`);
    });
  });

  describe("6. Permission Revocation", function () {
    it("should allow patient to instantly revoke access", async function () {
      const start = performance.now();
      const tx = await healthcare.connect(patient1).revokeRecordAccess(1, doctor1.address);
      const receipt = await tx.wait();
      const end = performance.now();
      console.log(`[Gas] revokeRecordAccess: ${receipt.gasUsed.toString()} units (Latency: ${(end - start).toFixed(2)} ms)`);

      const [hasAccess] = await healthcare.checkAccess(1, doctor1.address);
      expect(hasAccess).to.be.false;

      // Doctor can no longer access record
      await expect(
        healthcare.connect(doctor1).getRecordDetails(1)
      ).to.be.revertedWith("Unauthorized record metadata");
    });
  });

  describe("7. Emergency Access (Break-Glass Protocol)", function () {
    it("should allow an approved doctor to trigger emergency break-glass access", async function () {
      const tx = await healthcare.connect(doctor1).emergencyAccess(1, "Acute myocardial infarction - ER resuscitation");
      const receipt = await tx.wait();
      console.log(`[Gas] emergencyAccess: ${receipt.gasUsed.toString()} units`);

      const totalLogs = await healthcare.getTotalAuditLogs();
      const logs = await healthcare.getAuditLogs(totalLogs - 1n, 1);
      expect(logs[0].action).to.equal("EMERGENCY_ACCESS");
      expect(logs[0].details).to.include("Break-glass emergency");
    });
  });

  describe("8. Medical History & Audit Trail", function () {
    it("should return the patient medical record history", async function () {
      const recordIds = await healthcare.getPatientRecordIds(patient1.address);
      expect(recordIds.length).to.equal(1);
      expect(recordIds[0]).to.equal(1n);
    });

    it("should return complete immutable audit logs", async function () {
      const totalLogs = await healthcare.getTotalAuditLogs();
      expect(totalLogs).to.be.greaterThan(5n);

      const logs = await healthcare.getAuditLogs(0, 10);
      console.log(`\nTotal On-Chain Audit Events: ${logs.length}`);
      logs.forEach((log) => {
        console.log(`  [Block #${log.blockNumber}] Role: ${log.role.padEnd(8)} Action: ${log.action.padEnd(16)} Record: ${log.recordId} Msg: ${log.details.substring(0, 45)}...`);
      });
    });

    it("should return system dashboard statistics", async function () {
      const stats = await healthcare.getSystemStats();
      expect(stats.totalPatients).to.equal(1n);
      expect(stats.totalDoctors).to.equal(1n);
      expect(stats.totalHospitals).to.equal(1n);
      expect(stats.totalRecords).to.equal(1n);
      expect(stats.totalAuditEvents).to.be.greaterThan(5n);
    });
  });
});
