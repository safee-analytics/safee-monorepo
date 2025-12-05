import { text, timestamp, uuid, index, boolean } from "drizzle-orm/pg-core";
import { identitySchema, idpk } from "./_common.js";
import { organizations } from "./organizations.js";
import { users } from "./users.js";
import { encryptionKeys } from "./encryptionKeys.js";

export const auditorAccess = identitySchema.table(
  "auditor_access",
  {
    id: idpk("id"),
    organizationId: uuid("organization_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade", onUpdate: "cascade" }),
    auditorUserId: uuid("auditor_user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade", onUpdate: "cascade" }),
    grantedByUserId: uuid("granted_by_user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade", onUpdate: "cascade" }),
    encryptionKeyId: uuid("encryption_key_id")
      .notNull()
      .references(() => encryptionKeys.id, { onDelete: "cascade", onUpdate: "cascade" }),
    wrappedOrgKey: text("wrapped_org_key").notNull(), // Org key wrapped with auditor's public RSA key
    expiresAt: timestamp("expires_at", { withTimezone: true }),
    isRevoked: boolean("is_revoked").default(false).notNull(),
    revokedAt: timestamp("revoked_at", { withTimezone: true }),
    revokedByUserId: uuid("revoked_by_user_id").references(() => users.id, {
      onDelete: "set null",
      onUpdate: "cascade",
    }),
    grantedAt: timestamp("granted_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index("auditor_access_org_idx").on(table.organizationId),
    index("auditor_access_auditor_idx").on(table.auditorUserId),
    index("auditor_access_revoked_idx").on(table.isRevoked),
  ],
);
