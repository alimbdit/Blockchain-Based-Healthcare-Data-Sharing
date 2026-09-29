/**
 * Cryptographic utility for client-side encryption, decryption, and integrity hashing.
 * Uses Web Crypto API (AES-256-GCM and SHA-256).
 */

// In-browser decentralized storage simulator (Simulates IPFS peer node with persistent IndexedDB / localStorage)
const STORAGE_PREFIX = "healthchain_ipfs_";

export async function generateAesKey() {
  return await window.crypto.subtle.generateKey(
    { name: "AES-GCM", length: 256 },
    true,
    ["encrypt", "decrypt"]
  );
}

export async function exportKeyToHex(key) {
  const raw = await window.crypto.subtle.exportKey("raw", key);
  return Array.from(new Uint8Array(raw))
    .map(b => b.toString(16).padStart(2, "0"))
    .join("");
}

export async function importKeyFromHex(hexString) {
  const bytes = new Uint8Array(hexString.match(/.{1,2}/g).map(byte => parseInt(byte, 16)));
  return await window.crypto.subtle.importKey(
    "raw",
    bytes,
    { name: "AES-GCM" },
    true,
    ["encrypt", "decrypt"]
  );
}

export async function calculateSha256(arrayBuffer) {
  const hashBuffer = await window.crypto.subtle.digest("SHA-256", arrayBuffer);
  return Array.from(new Uint8Array(hashBuffer))
    .map(b => b.toString(16).padStart(2, "0"))
    .join("");
}

/**
 * Encrypt file buffer with AES-256-GCM
 */
export async function encryptData(arrayBuffer, key) {
  const iv = window.crypto.getRandomValues(new Uint8Array(12)); // 96-bit IV standard for GCM
  const ciphertext = await window.crypto.subtle.encrypt(
    { name: "AES-GCM", iv: iv },
    key,
    arrayBuffer
  );

  return {
    ciphertext,
    iv: Array.from(iv).map(b => b.toString(16).padStart(2, "0")).join("")
  };
}

/**
 * Decrypt file buffer with AES-256-GCM
 */
export async function decryptData(ciphertext, key, ivHex) {
  const iv = new Uint8Array(ivHex.match(/.{1,2}/g).map(byte => parseInt(byte, 16)));
  return await window.crypto.subtle.decrypt(
    { name: "AES-GCM", iv: iv },
    key,
    ciphertext
  );
}

/**
 * Generate standard IPFS CIDv1 formatted mock hash based on content hash
 */
export function generateIpfsCid(contentHashHex) {
  // Simulates base58 / base32 IPFS CID
  return "bafybeic" + contentHashHex.substring(0, 48) + "ipfs";
}

/**
 * Store encrypted payload into local IPFS storage simulator
 */
export function storeInIpfsSimulator(ipfsCid, data) {
  try {
    const serialized = JSON.stringify({
      cid: ipfsCid,
      data: Array.from(new Uint8Array(data.ciphertext)),
      iv: data.iv,
      mimeType: data.mimeType || "application/octet-stream",
      fileName: data.fileName || "record.bin",
      storedAt: new Date().toISOString()
    });
    localStorage.setItem(STORAGE_PREFIX + ipfsCid, serialized);
    return true;
  } catch (err) {
    console.warn("Local storage full, using in-memory store for large payload", err);
    window.__ipfsMemoryStore = window.__ipfsMemoryStore || {};
    window.__ipfsMemoryStore[ipfsCid] = {
      cid: ipfsCid,
      data: new Uint8Array(data.ciphertext),
      iv: data.iv,
      mimeType: data.mimeType || "application/octet-stream",
      fileName: data.fileName || "record.bin",
      storedAt: new Date().toISOString()
    };
    return true;
  }
}

/**
 * Retrieve encrypted payload from IPFS storage simulator
 */
export function retrieveFromIpfsSimulator(ipfsCid) {
  // Check memory store first
  if (window.__ipfsMemoryStore && window.__ipfsMemoryStore[ipfsCid]) {
    return window.__ipfsMemoryStore[ipfsCid];
  }
  const item = localStorage.getItem(STORAGE_PREFIX + ipfsCid);
  if (!item) return null;
  const parsed = JSON.parse(item);
  return {
    ...parsed,
    data: new Uint8Array(parsed.data)
  };
}
