import hardhat from "hardhat";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const { ethers } = hardhat;
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function main() {
  console.log("Starting HealthcareDataSharing deployment...");

  const [deployer, patientAlice, patientBob, drSmith, drPatel, metroHospital] = await ethers.getSigners();

  console.log(`Deployer address: ${deployer.address}`);

  const Healthcare = await ethers.getContractFactory("HealthcareDataSharing");
  const healthcare = await Healthcare.deploy();
  await healthcare.waitForDeployment();

  const contractAddress = await healthcare.getAddress();
  const deploymentTx = await healthcare.deploymentTransaction().wait();

  console.log(`HealthcareDataSharing deployed to: ${contractAddress}`);
  console.log(`Deployment gas used: ${deploymentTx.gasUsed.toString()}`);
  console.log(`Gas price: ${deploymentTx.gasPrice.toString()} wei`);

  // Calculate deployment cost
  const deploymentCostWei = deploymentTx.gasUsed * deploymentTx.gasPrice;
  const deploymentCostEth = ethers.formatEther(deploymentCostWei);
  console.log(`Deployment Cost (ETH): ${deploymentCostEth} ETH`);

  // Seed initial demo data for immediate interactive evaluation
  console.log("\n--- Seeding Initial Demo Data ---");

  // 1. Patient Alice
  const tx1 = await healthcare.connect(patientAlice).registerPatient(
    "Alice Johnson",
    "1988-11-23",
    "Female",
    "A+",
    "+1-555-0143",
    "+1-555-9988"
  );
  await tx1.wait();
  console.log(`Registered Patient: Alice (${patientAlice.address})`);

  // 2. Patient Bob
  const tx2 = await healthcare.connect(patientBob).registerPatient(
    "Robert Davis",
    "1975-04-12",
    "Male",
    "O-",
    "+1-555-0188",
    "+1-555-7722"
  );
  await tx2.wait();
  console.log(`Registered Patient: Bob (${patientBob.address})`);

  // 3. Dr. Alice Smith
  const tx3 = await healthcare.connect(drSmith).registerDoctor(
    "Dr. Alice Smith, MD",
    "LIC-MD-90210",
    "Cardiology & Internal Medicine",
    "Metropolitan General Hospital"
  );
  await tx3.wait();
  // Admin approves Dr. Smith
  const tx4 = await healthcare.connect(deployer).approveDoctor(drSmith.address, true);
  await tx4.wait();
  console.log(`Registered & Approved Doctor: Dr. Smith (${drSmith.address})`);

  // 4. Dr. Sarah Patel (pending approval for demo)
  const tx5 = await healthcare.connect(drPatel).registerDoctor(
    "Dr. Sarah Patel, MD",
    "LIC-MD-33412",
    "Neurology",
    "St. Jude Neuroscience Center"
  );
  await tx5.wait();
  console.log(`Registered Doctor (Pending Approval): Dr. Patel (${drPatel.address})`);

  // 5. Hospital: Metropolitan Health
  const tx6 = await healthcare.connect(metroHospital).registerHospital(
    "Metropolitan General Hospital",
    "HOSP-NYC-8820",
    "450 Lexington Ave, New York, NY",
    "+1-212-555-0100"
  );
  await tx6.wait();
  const tx7 = await healthcare.connect(deployer).approveHospital(metroHospital.address, true);
  await tx7.wait();
  console.log(`Registered & Approved Hospital: Metro Hospital (${metroHospital.address})`);

  // 6. Alice uploads sample encrypted records
  const tx8 = await healthcare.connect(patientAlice).uploadRecord(
    "Annual Comprehensive Cardiology MRI Scan",
    "Radiology / Imaging",
    "QmZ4tDuvesekSs4qM5ZBKpXiZGun7S2CYtEZRB3DYXkjGx",
    "9f86d081884c7d659a2feaa0c55ad015a3bf4f1b2b0b822cd15d6c15b0f00a08",
    "aes256_enc_key_ref_alice_c01",
    3547120,
    "application/pdf"
  );
  await tx8.wait();
  console.log("Uploaded Medical Record #1 for Alice");

  const tx9 = await healthcare.connect(patientAlice).uploadRecord(
    "Lipid Panel & Complete Blood Count (CBC)",
    "Lab Report",
    "QmPZ9gcCEpqKTo6aq61g2nXGUhM49NY75U2dn2gWCdH5mr",
    "5e884898da28047151d0e56f8dc6292773603d0d6aabbdd62a11ef721d1542d8",
    "aes256_enc_key_ref_alice_c02",
    428500,
    "application/pdf"
  );
  await tx9.wait();
  console.log("Uploaded Medical Record #2 for Alice");

  // 7. Alice grants access to Record #1 to Dr. Smith for 7 days
  const tx10 = await healthcare.connect(patientAlice).grantRecordAccess(
    1,
    drSmith.address,
    7 * 24 * 3600, // 7 days
    false
  );
  await tx10.wait();
  console.log("Alice granted Record #1 access to Dr. Smith for 7 days");

  // Export contract address and ABI to src for frontend
  const artifactPath = path.join(__dirname, "../artifacts/contracts/HealthcareDataSharing.sol/HealthcareDataSharing.json");
  const artifact = JSON.parse(fs.readFileSync(artifactPath, "utf8"));

  const contractData = {
    address: contractAddress,
    abi: artifact.abi,
    network: "localhost",
    chainId: 31337,
    deploymentStats: {
      gasUsed: deploymentTx.gasUsed.toString(),
      gasPriceWei: deploymentTx.gasPrice.toString(),
      costEth: deploymentCostEth,
      deployer: deployer.address,
      deployedAt: new Date().toISOString()
    },
    demoAccounts: [
      { role: "ADMIN", name: "System Admin", address: deployer.address, privateKey: "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80" },
      { role: "PATIENT", name: "Alice Johnson (Patient)", address: patientAlice.address, privateKey: "0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d" },
      { role: "PATIENT", name: "Robert Davis (Patient)", address: patientBob.address, privateKey: "0x5de4111afa1a4b94908f83103eb1f1706367c2e68ca870fc3fb9a804cdab365a" },
      { role: "DOCTOR", name: "Dr. Alice Smith (Approved)", address: drSmith.address, privateKey: "0x7c852118294e51e653712a81e05800f419141751be58f605c371e15141b007a6" },
      { role: "DOCTOR", name: "Dr. Sarah Patel (Pending)", address: drPatel.address, privateKey: "0x47e179ec197488593b187f80a00eb0da91f1b9d0b13f8733639f19c30a34926a" },
      { role: "HOSPITAL", name: "Metropolitan General Hospital", address: metroHospital.address, privateKey: "0x8b3a350cf5c34c9194ca85829a2df0ec3153be0318b5e2d3348e872092edffba" }
    ]
  };

  const outputDir = path.join(__dirname, "../src/contracts");
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  fs.writeFileSync(
    path.join(outputDir, "contractData.json"),
    JSON.stringify(contractData, null, 2)
  );

  console.log(`\nContract data and ABI saved to src/contracts/contractData.json successfully!`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
