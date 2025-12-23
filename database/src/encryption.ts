import crypto from "node:crypto";

export class EncryptionService {
  private readonly algorithm = "aes-256-gcm";
  private readonly keyLength = 32; // 256 bits
  private readonly ivLength = 16; // 128 bits
  private readonly authTagLength = 16; // 128 bits
  private readonly encryptionKey: Buffer;

  constructor(secret: string) {
    this.encryptionKey = crypto.scryptSync(secret, "safee-encryption-salt", this.keyLength);
  }

  private getEncryptionKey(): Buffer {
    return this.encryptionKey;
  }

  encrypt(plaintext: string): string {
    const key = this.getEncryptionKey();
    const iv = crypto.randomBytes(this.ivLength);

    const cipher = crypto.createCipheriv(this.algorithm, key, iv);

    let encrypted = cipher.update(plaintext, "utf8", "base64");
    encrypted += cipher.final("base64");

    const authTag = cipher.getAuthTag();

    // Combine iv + authTag + encrypted data, all base64 encoded
    const combined = Buffer.concat([iv, authTag, Buffer.from(encrypted, "base64")]);

    return combined.toString("base64");
  }

  decrypt(encryptedData: string): string {
    const key = this.getEncryptionKey();
    const combined = Buffer.from(encryptedData, "base64");

    const iv = combined.subarray(0, this.ivLength);
    const authTag = combined.subarray(this.ivLength, this.ivLength + this.authTagLength);
    const encrypted = combined.subarray(this.ivLength + this.authTagLength);

    const decipher = crypto.createDecipheriv(this.algorithm, key, iv);
    decipher.setAuthTag(authTag);

    let decrypted = decipher.update(encrypted);
    decrypted = Buffer.concat([decrypted, decipher.final()]);

    return decrypted.toString("utf8");
  }

  isEncrypted(value: string): boolean {
    try {
      const decoded = Buffer.from(value, "base64");
      return decoded.length > this.ivLength + this.authTagLength;
    } catch {
      return false;
    }
  }
}

// Singleton for backward compatibility (uses environment variable or default)
export const encryptionService = new EncryptionService(
  process.env.JWT_SECRET ?? "development-encryption-key-change-in-production",
);
