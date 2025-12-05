import { text, timestamp, integer, boolean, uuid, index } from "drizzle-orm/pg-core";
import { identitySchema, idpk } from "./_common.js";
import { encryptionKeys } from "./encryptionKeys.js";

export const fileEncryptionMetadata = identitySchema.table(
  "file_encryption_metadata",
  {
    id: idpk("id"),
    fileId: uuid("file_id").notNull().unique(), // Links to StorageServiceV2 fileId
    encryptionKeyId: uuid("encryption_key_id")
      .notNull()
      .references(() => encryptionKeys.id, { onDelete: "restrict", onUpdate: "cascade" }),
    keyVersion: integer("key_version").notNull(),
    iv: text("iv").notNull(), // Base64 IV for file encryption
    authTag: text("auth_tag").notNull(), // Base64 GCM auth tag
    algorithm: text("algorithm").default("AES-256-GCM").notNull(),
    chunkSize: integer("chunk_size").default(131072).notNull(), // 128KB default
    isEncrypted: boolean("is_encrypted").default(true).notNull(),
    encryptedAt: timestamp("encrypted_at", { withTimezone: true }).defaultNow().notNull(),
    encryptedBy: uuid("encrypted_by").notNull(), // User ID who encrypted
  },
  (table) => [
    index("file_enc_metadata_file_idx").on(table.fileId),
    index("file_enc_metadata_key_idx").on(table.encryptionKeyId),
  ],
);
