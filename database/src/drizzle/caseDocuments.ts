import {
  uuid,
  varchar,
  timestamp,
  boolean,
  bigint,
  integer,
  text,
  index,
  type AnyPgColumn,
} from "drizzle-orm/pg-core";
import { auditSchema, idpk } from "./_common.js";
import { cases } from "./cases.js";
import { auditProcedures } from "./auditProcedures.js";
import { users } from "./users.js";

export const caseDocuments = auditSchema.table(
  "case_documents",
  {
    id: idpk("id"),
    caseId: uuid("case_id")
      .references(() => cases.id, { onDelete: "cascade" })
      .notNull(),
    procedureId: uuid("procedure_id").references(() => auditProcedures.id, { onDelete: "set null" }), // Optional: attached to specific procedure
    fileName: varchar("file_name", { length: 255 }).notNull(),
    fileSize: bigint("file_size", { mode: "number" }).notNull(), // In bytes
    fileType: varchar("file_type", { length: 100 }).notNull(), // MIME type
    storagePath: varchar("storage_path", { length: 500 }).notNull(), // Path in storage system
    version: integer("version").notNull().default(1),
    parentDocumentId: uuid("parent_document_id").references((): AnyPgColumn => caseDocuments.id, {
      onDelete: "set null",
    }), // For versioning - self-reference
    uploadedBy: uuid("uploaded_by")
      .references(() => users.id, { onDelete: "restrict", onUpdate: "cascade" })
      .notNull(),
    uploadedAt: timestamp("uploaded_at", { withTimezone: true }).defaultNow().notNull(),
    isDeleted: boolean("is_deleted").notNull().default(false),
    ocrText: text("ocr_text"),
    ocrProcessedAt: timestamp("ocr_processed_at", { withTimezone: true }),
  },
  (table) => [
    index("case_documents_case_id_idx").on(table.caseId),
    index("case_documents_procedure_id_idx").on(table.procedureId),
    index("case_documents_parent_document_id_idx").on(table.parentDocumentId),
    index("case_documents_is_deleted_idx").on(table.isDeleted),
  ],
);

export type CaseDocument = typeof caseDocuments.$inferSelect;
export type NewCaseDocument = typeof caseDocuments.$inferInsert;
