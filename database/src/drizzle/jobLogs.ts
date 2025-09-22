import { text, timestamp, jsonb, index, uuid } from "drizzle-orm/pg-core";
import { idpk, jobsSchema, logLevelEnum } from "./_common.js";
import { jobs } from "./jobs.js";

export const jobLogs = jobsSchema.table(
  "job_logs",
  {
    id: idpk("id"),
    jobId: uuid("job_id")
      .notNull()
      .references(() => jobs.id, { onDelete: "cascade" }),
    level: logLevelEnum("level").notNull(),
    message: text("message").notNull(),
    metadata: jsonb("metadata").$type<Record<string, unknown>>(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index("job_logs_job_idx").on(table.jobId),
    index("job_logs_level_idx").on(table.level),
    index("job_logs_created_at_idx").on(table.createdAt),
  ],
);

// Types
export type JobLog = typeof jobLogs.$inferSelect;
export type NewJobLog = typeof jobLogs.$inferInsert;
