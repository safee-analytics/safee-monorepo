import { text, timestamp, jsonb, index, uuid, integer, boolean } from "drizzle-orm/pg-core";
import { idpk, odooSchema, odooOperationStatusEnum, odooCircuitStateEnum } from "./_common.js";
import { organizations } from "./organizations.js";
import { users } from "./users.js";

/**
 * Comprehensive audit log for all Odoo operations
 * Tracks every interaction with Odoo for debugging and compliance
 */
export const odooAuditLogs = odooSchema.table(
  "audit_logs",
  {
    id: idpk("id"),

    // Operation identification
    operationId: text("operation_id").notNull().unique(),
    operationType: text("operation_type").notNull(),

    // Odoo details
    odooModel: text("odoo_model"),
    odooMethod: text("odoo_method"),
    odooRecordIds: jsonb("odoo_record_ids").$type<number[]>(),
    odooDomain: jsonb("odoo_domain").$type<unknown[]>(),

    // Request/Response
    requestPayload: jsonb("request_payload").$type<Record<string, unknown>>(),
    responseData: jsonb("response_data").$type<unknown>(),

    // Status and errors
    status: odooOperationStatusEnum("status").notNull(),
    errorMessage: text("error_message"),
    errorStack: text("error_stack"),

    // Timing
    startTime: timestamp("start_time", { withTimezone: true }).notNull(),
    endTime: timestamp("end_time", { withTimezone: true }),
    durationMs: integer("duration_ms"),

    // Retry tracking
    attemptNumber: integer("attempt_number").notNull().default(1),
    maxRetries: integer("max_retries").notNull().default(3),
    isRetry: boolean("is_retry").notNull().default(false),
    parentOperationId: text("parent_operation_id"),

    // Circuit breaker state
    circuitState: odooCircuitStateEnum("circuit_state"),

    // User context
    userId: uuid("user_id").references(() => users.id, { onDelete: "set null" }),
    organizationId: uuid("organization_id")
      .references(() => organizations.id, { onDelete: "cascade" })
      .notNull(),

    // Metadata
    metadata: jsonb("metadata").$type<Record<string, unknown>>(),

    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index("odoo_audit_logs_operation_id_idx").on(table.operationId),
    index("odoo_audit_logs_operation_type_idx").on(table.operationType),
    index("odoo_audit_logs_model_idx").on(table.odooModel),
    index("odoo_audit_logs_status_idx").on(table.status),
    index("odoo_audit_logs_user_idx").on(table.userId),
    index("odoo_audit_logs_org_idx").on(table.organizationId),
    index("odoo_audit_logs_created_at_idx").on(table.createdAt),
    index("odoo_audit_logs_parent_idx").on(table.parentOperationId),
  ],
);

export type OdooAuditLog = typeof odooAuditLogs.$inferSelect;
export type NewOdooAuditLog = typeof odooAuditLogs.$inferInsert;
