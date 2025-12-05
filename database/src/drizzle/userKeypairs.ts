import { text, timestamp, uuid, index } from "drizzle-orm/pg-core";
import { identitySchema, idpk } from "./_common.js";
import { users } from "./users.js";

export const userKeypairs = identitySchema.table(
  "user_keypairs",
  {
    id: idpk("id"),
    userId: uuid("user_id")
      .notNull()
      .unique()
      .references(() => users.id, { onDelete: "cascade", onUpdate: "cascade" }),
    publicKey: text("public_key").notNull(), // Base64 PEM RSA public key
    encryptedPrivateKey: text("encrypted_private_key").notNull(), // Encrypted with user-derived key
    privateKeySalt: text("private_key_salt").notNull(), // For deriving private key wrapper
    privateKeyIv: text("private_key_iv").notNull(),
    algorithm: text("algorithm").default("RSA-OAEP-4096").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    lastUsedAt: timestamp("last_used_at", { withTimezone: true }),
  },
  (table) => [index("user_keypairs_user_idx").on(table.userId)],
);
