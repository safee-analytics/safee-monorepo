import { uuid, timestamp, text, boolean, index } from "drizzle-orm/pg-core";
import { casesSchema, idpk, noteTypeEnum } from "./_common.js";
import { cases } from "./cases.js";
import { auditProcedures } from "./auditProcedures.js";
import { users } from "./users.js";

export const caseNotes = casesSchema.table(
  "case_notes",
  {
    id: idpk("id"),
    caseId: uuid("case_id")
      .references(() => cases.id, { onDelete: "cascade" })
      .notNull(),
    procedureId: uuid("procedure_id").references(() => auditProcedures.id, { onDelete: "cascade" }), // Optional: note for specific procedure
    noteType: noteTypeEnum("note_type").notNull(), // 'observation', 'review_comment', 'general', 'memo'
    content: text("content").notNull(),
    createdBy: uuid("created_by")
      .references(() => users.id, { onDelete: "restrict", onUpdate: "cascade" })
      .notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .$onUpdate(() => /* @__PURE__ */ new Date())
      .notNull(),
    isEdited: boolean("is_edited").notNull().default(false), // Track if note was edited after creation
  },
  (table) => [
    index("case_notes_case_id_idx").on(table.caseId),
    index("case_notes_procedure_id_idx").on(table.procedureId),
    index("case_notes_note_type_idx").on(table.noteType),
    index("case_notes_created_by_idx").on(table.createdBy),
  ],
);

export type CaseNote = typeof caseNotes.$inferSelect;
export type NewCaseNote = typeof caseNotes.$inferInsert;
