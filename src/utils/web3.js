import { ethers } from "ethers";
import contractData from "../contracts/contractData.json";

export const HARDHAT_CHAIN_ID = 31337;
export const HARDHAT_CHAIN_ID_HEX = "0x7a69";
export const HARDHAT_RPC_URL = "http://127.0.0.1:8545";

export function isMetaMaskAvailable() {
  return typeof window !== "undefined" && Boolean(window.ethereum);
}

/**
 * Returns read-only JSON-RPC provider connected to local node
 */
export function getFallbackProvider() {
  return new ethers.JsonRpcProvider(HARDHAT_RPC_URL);
}

/**
 * Connect with MetaMask wallet
 */
export async function connectMetaMask() {
  if (!isMetaMaskAvailable()) {
    throw new Error("MetaMask is not detected. Please install the MetaMask extension or use Demo Wallet Mode.");
  }

  const browserProvider = new ethers.BrowserProvider(window.ethereum);
  const accounts = await browserProvider.send("eth_requestAccounts", []);
  const signer = await browserProvider.getSigner();
  const network = await browserProvider.getNetwork();

  return {
    provider: browserProvider,
    signer,
    account: accounts[0],
    chainId: Number(network.chainId)
  };
}

/**
 * Switch MetaMask to Hardhat Localhost (Chain ID: 31337)
 */
export async function switchOrAddHardhatNetwork() {
  if (!isMetaMaskAvailable()) return;

  try {
    await window.ethereum.request({
      method: "wallet_switchEthereumChain",
      params: [{ chainId: HARDHAT_CHAIN_ID_HEX }]
    });
  } catch (switchError) {
    // Error 4902 indicates chain has not been added to MetaMask
    if (switchError.code === 4902 || switchError?.data?.originalError?.code === 4902) {
      await window.ethereum.request({
        method: "wallet_addEthereumChain",
        params: [
          {
            chainId: HARDHAT_CHAIN_ID_HEX,
            chainName: "Hardhat Localhost",
            nativeCurrency: {
              name: "Ether",
              symbol: "ETH",
              decimals: 18
            },
            rpcUrls: [HARDHAT_RPC_URL],
            blockExplorerUrls: null
          }
        ]
      });
    } else {
      throw switchError;
    }
  }
}

/**
 * Get contract instance
 */
export function getHealthcareContract(signerOrProvider) {
  if (!signerOrProvider) {
    signerOrProvider = getFallbackProvider();
  }
  return new ethers.Contract(contractData.address, contractData.abi, signerOrProvider);
}

/**
 * Get pre-funded demo signer from local node
 */
export function getDemoSigner(privateKey) {
  const provider = getFallbackProvider();
  return new ethers.Wallet(privateKey, provider);
}
