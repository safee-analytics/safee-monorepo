import { uuid, timestamp, primaryKey, index } from "drizzle-orm/pg-core";
import { casesSchema, assignmentRoleEnum } from "./_common.js";
import { cases } from "./cases.js";
import { users } from "./users.js";

export const caseAssignments = casesSchema.table(
  "case_assignments",
  {
    caseId: uuid("case_id")
      .references(() => cases.id, { onDelete: "cascade" })
      .notNull(),
    userId: uuid("user_id")
      .references(() => users.id, { onDelete: "cascade" })
      .notNull(),
    role: assignmentRoleEnum("role").notNull(), // 'lead', 'reviewer', 'team_member'
    assignedBy: uuid("assigned_by")
      .references(() => users.id, { onDelete: "restrict", onUpdate: "cascade" })
      .notNull(),
    assignedAt: timestamp("assigned_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    primaryKey({ columns: [table.caseId, table.userId] }),
    index("case_assignments_user_id_idx").on(table.userId),
    index("case_assignments_role_idx").on(table.role),
  ],
);

export type CaseAssignment = typeof caseAssignments.$inferSelect;
export type NewCaseAssignment = typeof caseAssignments.$inferInsert;
