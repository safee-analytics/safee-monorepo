import { uuid, timestamp, index } from "drizzle-orm/pg-core";
import { auditSchema, idpk } from "./_common.js";
import { cases } from "./cases.js";
import { users } from "./users.js";

export const casePresence = auditSchema.table(
  "case_presence",
  {
    id: idpk("id"),
    caseId: uuid("case_id")
      .references(() => cases.id, { onDelete: "cascade" })
      .notNull(),
    userId: uuid("user_id")
      .references(() => users.id, { onDelete: "cascade" })
      .notNull(),
    lastSeenAt: timestamp("last_seen_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index("case_presence_case_id_idx").on(table.caseId),
    index("case_presence_user_id_idx").on(table.userId),
    index("case_presence_last_seen_idx").on(table.lastSeenAt),
  ],
);

export type CasePresence = typeof casePresence.$inferSelect;
export type NewCasePresence = typeof casePresence.$inferInsert;
