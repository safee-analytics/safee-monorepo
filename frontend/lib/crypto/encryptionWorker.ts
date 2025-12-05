import { encryptChunk, decryptChunk, base64ToArrayBuffer, arrayBufferToBase64 } from "./cryptoService";

// Default chunk size: 128KB (configurable based on device capabilities)
const DEFAULT_CHUNK_SIZE = 128 * 1024;

interface EncryptMessage {
  type: "encrypt";
  fileData: ArrayBuffer;
  orgKeyData: ArrayBuffer; // Raw key material
  chunkSize?: number;
}

interface DecryptMessage {
  type: "decrypt";
  encryptedData: ArrayBuffer;
  orgKeyData: ArrayBuffer; // Raw key material
  iv: string; // Base64 encoded
  chunkSize?: number;
}

interface ProgressMessage {
  type: "progress";
  progress: number; // 0-100
  stage: "encrypting" | "decrypting";
}

interface CompleteMessage {
  type: "complete";
  result: ArrayBuffer;
  iv?: string; // Only for encryption
  authTag?: string; // GCM auth tag (included in result for AES-GCM)
}

interface ErrorMessage {
  type: "error";
  error: string;
}

type WorkerMessage = EncryptMessage | DecryptMessage;
type ResponseMessage = ProgressMessage | CompleteMessage | ErrorMessage;

// Worker message handler
self.onmessage = async (event: MessageEvent<WorkerMessage>) => {
  try {
    const message = event.data;

    if (message.type === "encrypt") {
      await handleEncrypt(message);
    } else if (message.type === "decrypt") {
      await handleDecrypt(message);
    }
  } catch (error) {
    postErrorMessage(error instanceof Error ? error.message : String(error));
  }
};

/**
 * Handles file encryption in chunks
 */
async function handleEncrypt(message: EncryptMessage): Promise<void> {
  const { fileData, orgKeyData, chunkSize = DEFAULT_CHUNK_SIZE } = message;

  // Import the organization key
  const orgKey = await crypto.subtle.importKey("raw", orgKeyData, { name: "AES-GCM", length: 256 }, false, [
    "encrypt",
  ]);

  // Generate IV for this file
  const iv = crypto.getRandomValues(new Uint8Array(12));

  // For small files, encrypt in one go
  if (fileData.byteLength <= chunkSize) {
    postProgressMessage(0, "encrypting");
    const encryptedData = await encryptChunk(fileData, orgKey, iv);
    postProgressMessage(100, "encrypting");
    postCompleteMessage(encryptedData, arrayBufferToBase64(iv.buffer));
    return;
  }

  // For large files, encrypt in chunks
  const chunks: ArrayBuffer[] = [];
  const totalChunks = Math.ceil(fileData.byteLength / chunkSize);

  for (let i = 0; i < totalChunks; i++) {
    const start = i * chunkSize;
    const end = Math.min(start + chunkSize, fileData.byteLength);
    const chunk = fileData.slice(start, end);

    // Each chunk gets its own encryption (with same key but different IV derived from position)
    const chunkIv = deriveChunkIV(iv, i);
    const encryptedChunk = await encryptChunk(chunk, orgKey, chunkIv);
    chunks.push(encryptedChunk);

    // Report progress
    const progress = Math.round(((i + 1) / totalChunks) * 100);
    postProgressMessage(progress, "encrypting");
  }

  // Concatenate all encrypted chunks
  const totalLength = chunks.reduce((acc, chunk) => acc + chunk.byteLength, 0);
  const result = new Uint8Array(totalLength);
  let offset = 0;
  for (const chunk of chunks) {
    result.set(new Uint8Array(chunk), offset);
    offset += chunk.byteLength;
  }

  postCompleteMessage(result.buffer, arrayBufferToBase64(iv.buffer));
}

/**
 * Handles file decryption in chunks
 */
async function handleDecrypt(message: DecryptMessage): Promise<void> {
  const { encryptedData, orgKeyData, iv, chunkSize = DEFAULT_CHUNK_SIZE } = message;

  // Import the organization key
  const orgKey = await crypto.subtle.importKey("raw", orgKeyData, { name: "AES-GCM", length: 256 }, false, [
    "decrypt",
  ]);

  const ivBuffer = base64ToArrayBuffer(iv);
  const ivBytes = new Uint8Array(ivBuffer);

  // For small files, decrypt in one go
  if (encryptedData.byteLength <= chunkSize + 16) {
    // +16 for GCM tag
    postProgressMessage(0, "decrypting");
    const decryptedData = await decryptChunk(encryptedData, orgKey, ivBytes);
    postProgressMessage(100, "decrypting");
    postCompleteMessage(decryptedData);
    return;
  }

  // For large files, decrypt in chunks
  const chunks: ArrayBuffer[] = [];
  const encryptedChunkSize = chunkSize + 16; // +16 for GCM auth tag per chunk
  const totalChunks = Math.ceil(encryptedData.byteLength / encryptedChunkSize);

  for (let i = 0; i < totalChunks; i++) {
    const start = i * encryptedChunkSize;
    const end = Math.min(start + encryptedChunkSize, encryptedData.byteLength);
    const encryptedChunk = encryptedData.slice(start, end);

    // Derive the same IV that was used for encryption
    const chunkIv = deriveChunkIV(ivBytes, i);
    const decryptedChunk = await decryptChunk(encryptedChunk, orgKey, chunkIv);
    chunks.push(decryptedChunk);

    // Report progress
    const progress = Math.round(((i + 1) / totalChunks) * 100);
    postProgressMessage(progress, "decrypting");
  }

  // Concatenate all decrypted chunks
  const totalLength = chunks.reduce((acc, chunk) => acc + chunk.byteLength, 0);
  const result = new Uint8Array(totalLength);
  let offset = 0;
  for (const chunk of chunks) {
    result.set(new Uint8Array(chunk), offset);
    offset += chunk.byteLength;
  }

  postCompleteMessage(result.buffer);
}

/**
 * Derives a unique IV for each chunk by combining base IV with chunk index
 * This ensures each chunk has a unique IV while being deterministic
 */
function deriveChunkIV(baseIV: Uint8Array, chunkIndex: number): Uint8Array<ArrayBuffer> {
  const buffer = new ArrayBuffer(baseIV.length);
  const chunkIV = new Uint8Array(buffer);
  chunkIV.set(baseIV);

  // XOR the last 4 bytes with the chunk index
  const indexBytes = new Uint8Array(4);
  new DataView(indexBytes.buffer).setUint32(0, chunkIndex, false);

  for (let i = 0; i < 4; i++) {
    chunkIV[chunkIV.length - 4 + i] ^= indexBytes[i];
  }

  return chunkIV;
}

/**
 * Posts progress update to main thread
 */
function postProgressMessage(progress: number, stage: "encrypting" | "decrypting"): void {
  const message: ProgressMessage = { type: "progress", progress, stage };
  self.postMessage(message);
}

/**
 * Posts completion message to main thread
 */
function postCompleteMessage(result: ArrayBuffer, iv?: string): void {
  const message: CompleteMessage = { type: "complete", result, iv };
  self.postMessage(message);
}

/**
 * Posts error message to main thread
 */
function postErrorMessage(error: string): void {
  const message: ErrorMessage = { type: "error", error };
  self.postMessage(message);
}

// Export types for use in main thread
export type {
  WorkerMessage,
  ResponseMessage,
  EncryptMessage,
  DecryptMessage,
  ProgressMessage,
  CompleteMessage,
  ErrorMessage,
};
