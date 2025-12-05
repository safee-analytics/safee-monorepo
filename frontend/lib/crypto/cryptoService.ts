import { generateMnemonic, mnemonicToSeedSync, validateMnemonic } from "bip39";

export const PBKDF2_ITERATIONS = 600_000; // OWASP recommended
export const SALT_LENGTH = 16; // bytes
export const IV_LENGTH = 12; // bytes for GCM mode
export const KEY_LENGTH = 256; // bits
export const RSA_KEY_SIZE = 4096; // bits

export async function deriveKeyFromPassword(
  password: string,
  salt: string,
  iterations: number = PBKDF2_ITERATIONS,
): Promise<CryptoKey> {
  const encoder = new TextEncoder();
  const passwordBuffer = encoder.encode(password);
  const saltBuffer = base64ToArrayBuffer(salt);

  const keyMaterial = await crypto.subtle.importKey("raw", passwordBuffer, { name: "PBKDF2" }, false, [
    "deriveBits",
    "deriveKey",
  ]);

  const key = await crypto.subtle.deriveKey(
    {
      name: "PBKDF2",
      salt: saltBuffer,
      iterations,
      hash: "SHA-256",
    },
    keyMaterial,
    { name: "AES-GCM", length: KEY_LENGTH },
    true, // extractable (needed for wrapping)
    ["encrypt", "decrypt", "wrapKey", "unwrapKey"],
  );

  return key;
}

export async function generateOrgKey(): Promise<CryptoKey> {
  return await crypto.subtle.generateKey(
    { name: "AES-GCM", length: KEY_LENGTH },
    true, // extractable
    ["encrypt", "decrypt"],
  );
}

export async function wrapOrgKey(
  orgKey: CryptoKey,
  masterKey: CryptoKey,
): Promise<{ wrappedKey: string; iv: string }> {
  const iv = crypto.getRandomValues(new Uint8Array(IV_LENGTH));

  const wrappedKeyBuffer = await crypto.subtle.wrapKey("raw", orgKey, masterKey, { name: "AES-GCM", iv });

  return {
    wrappedKey: arrayBufferToBase64(wrappedKeyBuffer),
    iv: arrayBufferToBase64(iv.buffer),
  };
}

export async function unwrapOrgKey(wrappedKey: string, iv: string, masterKey: CryptoKey): Promise<CryptoKey> {
  const wrappedKeyBuffer = base64ToArrayBuffer(wrappedKey);
  const ivBuffer = base64ToArrayBuffer(iv);

  return await crypto.subtle.unwrapKey(
    "raw",
    wrappedKeyBuffer,
    masterKey,
    { name: "AES-GCM", iv: ivBuffer },
    { name: "AES-GCM", length: KEY_LENGTH },
    true, // extractable
    ["encrypt", "decrypt"],
  );
}

export async function encryptChunk(
  chunk: ArrayBuffer,
  key: CryptoKey,
  iv: Uint8Array<ArrayBuffer>,
): Promise<ArrayBuffer> {
  return await crypto.subtle.encrypt({ name: "AES-GCM", iv }, key, chunk);
}

export async function decryptChunk(
  encryptedChunk: ArrayBuffer,
  key: CryptoKey,
  iv: Uint8Array<ArrayBuffer>,
): Promise<ArrayBuffer> {
  return await crypto.subtle.decrypt({ name: "AES-GCM", iv }, key, encryptedChunk);
}

export async function generateRSAKeypair(): Promise<{
  publicKey: CryptoKey;
  privateKey: CryptoKey;
}> {
  return await crypto.subtle.generateKey(
    {
      name: "RSA-OAEP",
      modulusLength: RSA_KEY_SIZE,
      publicExponent: new Uint8Array([1, 0, 1]), // 65537
      hash: "SHA-256",
    },
    true, // extractable
    ["wrapKey", "unwrapKey"],
  );
}

export async function wrapOrgKeyWithRSA(orgKey: CryptoKey, publicKey: CryptoKey): Promise<string> {
  const wrappedKeyBuffer = await crypto.subtle.wrapKey("raw", orgKey, publicKey, {
    name: "RSA-OAEP",
  });

  return arrayBufferToBase64(wrappedKeyBuffer);
}

export async function unwrapOrgKeyWithRSA(wrappedKey: string, privateKey: CryptoKey): Promise<CryptoKey> {
  const wrappedKeyBuffer = base64ToArrayBuffer(wrappedKey);

  return await crypto.subtle.unwrapKey(
    "raw",
    wrappedKeyBuffer,
    privateKey,
    { name: "RSA-OAEP" },
    { name: "AES-GCM", length: KEY_LENGTH },
    true,
    ["encrypt", "decrypt"],
  );
}

export async function exportPublicKeyToPEM(publicKey: CryptoKey): Promise<string> {
  const exported = await crypto.subtle.exportKey("spki", publicKey);
  const exportedAsBase64 = arrayBufferToBase64(exported);
  return `-----BEGIN PUBLIC KEY-----\n${exportedAsBase64}\n-----END PUBLIC KEY-----`;
}

export async function importPublicKeyFromPEM(pem: string): Promise<CryptoKey> {
  const pemContents = pem
    .replace("-----BEGIN PUBLIC KEY-----", "")
    .replace("-----END PUBLIC KEY-----", "")
    .replace(/\s/g, "");

  const binaryDer = base64ToArrayBuffer(pemContents);

  return await crypto.subtle.importKey("spki", binaryDer, { name: "RSA-OAEP", hash: "SHA-256" }, true, [
    "wrapKey",
  ]);
}

export async function exportEncryptedPrivateKey(
  privateKey: CryptoKey,
  password: string,
  salt: string,
): Promise<{ encryptedKey: string; iv: string; salt: string }> {
  const wrappingKey = await deriveKeyFromPassword(password, salt);
  const iv = crypto.getRandomValues(new Uint8Array(IV_LENGTH));

  const wrappedKeyBuffer = await crypto.subtle.wrapKey("pkcs8", privateKey, wrappingKey, {
    name: "AES-GCM",
    iv,
  });

  return {
    encryptedKey: arrayBufferToBase64(wrappedKeyBuffer),
    iv: arrayBufferToBase64(iv.buffer),
    salt,
  };
}

export async function importEncryptedPrivateKey(
  encryptedKey: string,
  iv: string,
  password: string,
  salt: string,
): Promise<CryptoKey> {
  const unwrappingKey = await deriveKeyFromPassword(password, salt);
  const encryptedKeyBuffer = base64ToArrayBuffer(encryptedKey);
  const ivBuffer = base64ToArrayBuffer(iv);

  return await crypto.subtle.unwrapKey(
    "pkcs8",
    encryptedKeyBuffer,
    unwrappingKey,
    { name: "AES-GCM", iv: ivBuffer },
    { name: "RSA-OAEP", hash: "SHA-256" },
    true,
    ["unwrapKey"],
  );
}

export function generateSalt(): string {
  const salt = crypto.getRandomValues(new Uint8Array(SALT_LENGTH));
  return arrayBufferToBase64(salt.buffer);
}

export function generateIV(): string {
  const iv = crypto.getRandomValues(new Uint8Array(IV_LENGTH));
  return arrayBufferToBase64(iv.buffer);
}

export function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = "";
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

export function base64ToArrayBuffer(base64: string): ArrayBuffer {
  const binaryString = atob(base64);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes.buffer;
}

export function generateRecoveryPhrase(): string {
  // 128 bits of entropy = 12 words
  return generateMnemonic(128);
}

export async function deriveKeyFromRecoveryPhrase(phrase: string, salt: string): Promise<CryptoKey> {
  if (!validateMnemonic(phrase)) {
    throw new Error("Invalid recovery phrase");
  }

  const seed = mnemonicToSeedSync(phrase);

  const keyMaterial = seed.slice(0, 32);

  const importedKey = await crypto.subtle.importKey("raw", keyMaterial, { name: "PBKDF2" }, false, [
    "deriveKey",
  ]);

  const saltBuffer = base64ToArrayBuffer(salt);

  return await crypto.subtle.deriveKey(
    {
      name: "PBKDF2",
      salt: saltBuffer,
      iterations: 10000, // Lower iterations since BIP-39 seed is already strong
      hash: "SHA-256",
    },
    importedKey,
    { name: "AES-GCM", length: KEY_LENGTH },
    true,
    ["encrypt", "decrypt", "wrapKey", "unwrapKey"],
  );
}

export function validateRecoveryPhrase(phrase: string): boolean {
  try {
    return validateMnemonic(phrase);
  } catch {
    return false;
  }
}

export function validatePasswordStrength(password: string): {
  isValid: boolean;
  score: number;
  feedback: string[];
} {
  const feedback: string[] = [];
  let score = 0;

  if (password.length < 16) {
    feedback.push("Password must be at least 16 characters long");
  } else {
    score += 25;
  }

  // Uppercase check
  if (!/[A-Z]/.test(password)) {
    feedback.push("Add uppercase letters");
  } else {
    score += 25;
  }

  // Lowercase check
  if (!/[a-z]/.test(password)) {
    feedback.push("Add lowercase letters");
  } else {
    score += 25;
  }

  // Number check
  if (!/[0-9]/.test(password)) {
    feedback.push("Add numbers");
  } else {
    score += 12;
  }

  // Special character check
  if (!/[^A-Za-z0-9]/.test(password)) {
    feedback.push("Add special characters");
  } else {
    score += 13;
  }

  return {
    isValid: password.length >= 16 && score >= 75,
    score,
    feedback,
  };
}
