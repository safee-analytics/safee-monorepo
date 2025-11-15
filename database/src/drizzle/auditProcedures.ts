import { uuid, varchar, timestamp, text, boolean, integer, jsonb, index } from "drizzle-orm/pg-core";
import { auditSchema, idpk } from "./_common.js";
import { auditSections } from "./auditSections.js";
import { users } from "./users.js";

/**
 * Audit procedures table - Individual procedures within sections
 * Flexible structure supports any audit type via requirements and fieldData
 */
export const auditProcedures = auditSchema.table(
  "audit_procedures",
  {
    id: idpk("id"),
    sectionId: uuid("section_id")
      .references(() => auditSections.id, { onDelete: "cascade" })
      .notNull(),
    referenceNumber: varchar("reference_number", { length: 50 }).notNull(), // e.g., "A.1", "1.2.3", "STEP-001"
    title: varchar("title", { length: 500 }).notNull(),
    description: text("description"),
    requirements: jsonb("requirements").default({}).$type<{
      isRequired?: boolean;
      minAttachments?: number;
      maxAttachments?: number;
      requiresObservations?: boolean;
      requiresReviewComment?: boolean;
      allowedFileTypes?: string[];
      customFields?: {
        name: string;
        type: "text" | "number" | "date" | "select" | "textarea" | "checkbox" | "file";
        required: boolean;
        validation?: {
          min?: number;
          max?: number;
          minLength?: number;
          maxLength?: number;
          pattern?: string;
        };
        options?: string[]; // For select type
        helpText?: string;
      }[];
      completionCriteria?: {
        allAttachmentsRequired?: boolean;
        allCustomFieldsRequired?: boolean;
        observationsRequired?: boolean;
      };
    }>(),
    sortOrder: integer("sort_order").notNull().default(0),
    isCompleted: boolean("is_completed").notNull().default(false),
    completedBy: uuid("completed_by").references(() => users.id, {
      onDelete: "restrict",
      onUpdate: "cascade",
    }),
    completedAt: timestamp("completed_at", { withTimezone: true }),
    memo: text("memo"), // Auditor's private notes
    fieldData: jsonb("field_data").default({}).$type<Record<string, unknown>>(), // Stores custom field values
    canEdit: boolean("can_edit").notNull().default(true),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index("audit_procedures_section_id_idx").on(table.sectionId),
    index("audit_procedures_is_completed_idx").on(table.isCompleted),
    index("audit_procedures_sort_order_idx").on(table.sortOrder),
  ],
);

export type AuditProcedure = typeof auditProcedures.$inferSelect;
export type NewAuditProcedure = typeof auditProcedures.$inferInsert;
