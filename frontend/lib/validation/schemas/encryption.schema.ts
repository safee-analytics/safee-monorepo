import { z } from "zod";

export const auditorAccessResponseSchema = z.object({
  wrappedOrgKey: z.string(),
  encryptedPrivateKey: z.string(),
  privateKeySalt: z.string(),
  privateKeyIv: z.string(),
});

export type AuditorAccessResponse = z.infer<typeof auditorAccessResponseSchema>;

export const fileToEncryptSchema = z.object({
  id: z.string(),
  name: z.string(),
  size: z.number(),
  status: z.enum(["pending", "encrypting", "completed", "failed"]),
  error: z.string().optional(),
});

export type FileToEncrypt = z.infer<typeof fileToEncryptSchema>;

export const migrationStatsSchema = z.object({
  total: z.number(),
  encrypted: z.number(),
  pending: z.number(),
  failed: z.number(),
});

export type MigrationStats = z.infer<typeof migrationStatsSchema>;

export const keyRotationRequestSchema = z.object({
  newWrappedKey: z.string(),
  newSalt: z.string(),
  newIv: z.string(),
  reason: z.string().min(1, "Reason for rotation is required"),
  oldKeyId: z.string().optional(),
});

export type KeyRotationRequest = z.infer<typeof keyRotationRequestSchema>;

export const encryptionSetupRequestSchema = z.object({
  wrappedOrgKey: z.string(),
  salt: z.string(),
  iv: z.string(),
  keyVersion: z.number(),
  algorithm: z.string(),
  derivationParams: z.object({
    iterations: z.number(),
    hash: z.string(),
    keyLength: z.number(),
  }),
});

export type EncryptionSetupRequest = z.infer<typeof encryptionSetupRequestSchema>;
