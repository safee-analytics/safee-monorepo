import { text, timestamp, integer, boolean, jsonb, index, uuid } from "drizzle-orm/pg-core";
import { identitySchema, idpk } from "./_common.js";
import { organizations } from "./organizations.js";

export const encryptionKeys = identitySchema.table(
  "encryption_keys",
  {
    id: idpk("id"),
    organizationId: uuid("organization_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade", onUpdate: "cascade" }),
    wrappedOrgKey: text("wrapped_org_key").notNull(), // Base64 encrypted org key
    salt: text("salt").notNull(), // Base64 salt for PBKDF2
    iv: text("iv").notNull(), // Base64 IV for AES-GCM wrapper
    keyVersion: integer("key_version").default(1).notNull(),
    algorithm: text("algorithm").default("AES-256-GCM").notNull(),
    derivationParams: jsonb("derivation_params")
      .$type<{
        iterations: number;
        hash: string;
        keyLength: number;
      }>()
      .default({ iterations: 600000, hash: "SHA-256", keyLength: 32 })
      .notNull(),
    isActive: boolean("is_active").default(true).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    rotatedAt: timestamp("rotated_at", { withTimezone: true }),
  },
  (table) => [
    index("encryption_keys_org_idx").on(table.organizationId),
    index("encryption_keys_active_idx").on(table.isActive),
  ],
);
