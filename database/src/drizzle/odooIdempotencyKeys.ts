import { text, timestamp, jsonb, index, uuid } from "drizzle-orm/pg-core";
import { idpk, odooSchema, odooOperationStatusEnum } from "./_common.js";
import { organizations } from "./organizations.js";
import { users } from "./users.js";

/**
 * Idempotency tracking for Odoo operations
 * Prevents duplicate execution of operations when retrying
 */
export const odooIdempotencyKeys = odooSchema.table(
  "idempotency_keys",
  {
    id: idpk("id"),

    // Idempotency key (combination of operation + params hash)
    idempotencyKey: text("idempotency_key").notNull().unique(),

    // Operation details
    operationType: text("operation_type").notNull(),
    odooModel: text("odoo_model"),

    // Result caching
    status: odooOperationStatusEnum("status").notNull(),
    resultData: jsonb("result_data").$type<unknown>(),
    errorMessage: text("error_message"),

    // Tracking
    firstAttemptAt: timestamp("first_attempt_at", { withTimezone: true }).defaultNow().notNull(),
    completedAt: timestamp("completed_at", { withTimezone: true }),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),

    // Link to audit log
    operationId: text("operation_id").notNull(),

    // User context
    userId: uuid("user_id").references(() => users.id, { onDelete: "set null" }),
    organizationId: uuid("organization_id")
      .references(() => organizations.id, { onDelete: "cascade" })
      .notNull(),

    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index("odoo_idempotency_key_idx").on(table.idempotencyKey),
    index("odoo_idempotency_status_idx").on(table.status),
    index("odoo_idempotency_expires_idx").on(table.expiresAt),
    index("odoo_idempotency_org_idx").on(table.organizationId),
  ],
);

export type OdooIdempotencyKey = typeof odooIdempotencyKeys.$inferSelect;
export type NewOdooIdempotencyKey = typeof odooIdempotencyKeys.$inferInsert;
