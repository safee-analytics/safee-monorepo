import { uuid, timestamp, jsonb, index } from "drizzle-orm/pg-core";
import { auditSchema, idpk } from "./_common.js";
import { cases } from "./cases.js";
import { users } from "./users.js";

export const activityTypeEnum = auditSchema.enum("activity_type", [
  "case_created",
  "status_changed",
  "priority_updated",
  "document_uploaded",
  "document_approved",
  "document_rejected",
  "comment_added",
  "team_member_assigned",
  "team_member_removed",
  "case_completed",
  "case_archived",
  "scope_created",
  "procedure_completed",
  "plan_created",
  "report_generated",
]);

export const caseActivities = auditSchema.table(
  "case_activities",
  {
    id: idpk("id"),
    caseId: uuid("case_id")
      .references(() => cases.id, { onDelete: "cascade" })
      .notNull(),
    activityType: activityTypeEnum("activity_type").notNull(),
    userId: uuid("user_id").references(() => users.id, { onDelete: "set null" }),
    metadata: jsonb("metadata").$type<{
      caseName?: string;
      oldValue?: string;
      newValue?: string;
      documentName?: string;
      documentId?: string;
      userName?: string;
      assignedUserId?: string;
      assignedUserName?: string;
      commentId?: string;
      scopeId?: string;
      planId?: string;
      reportId?: string;
      [key: string]: unknown;
    }>(),
    isRead: jsonb("is_read").default({}).$type<Record<string, boolean>>(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index("case_activities_case_id_idx").on(table.caseId),
    index("case_activities_user_id_idx").on(table.userId),
    index("case_activities_type_idx").on(table.activityType),
    index("case_activities_created_at_idx").on(table.createdAt),
  ],
);

export type CaseActivity = typeof caseActivities.$inferSelect;
export type NewCaseActivity = typeof caseActivities.$inferInsert;
