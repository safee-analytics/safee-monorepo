import { text, timestamp, boolean, index } from "drizzle-orm/pg-core";
import { idpk, jobsSchema, jobNameEnum } from "./_common.js";

export const jobSchedules = jobsSchema.table(
  "job_schedules",
  {
    id: idpk("id"),
    jobName: jobNameEnum("job_name").notNull(),
    name: text("name").notNull(),
    cronExpression: text("cron_expression"), // e.g., "0 9 * * *" for daily at 9am
    timezone: text("timezone").default("UTC").notNull(),
    isActive: boolean("is_active").default(true).notNull(),
    nextRunAt: timestamp("next_run_at", { withTimezone: true }),
    lastRunAt: timestamp("last_run_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index("job_schedules_job_name_idx").on(table.jobName),
    index("job_schedules_next_run_idx").on(table.nextRunAt),
    index("job_schedules_active_idx").on(table.isActive),
  ],
);

export type JobSchedule = typeof jobSchedules.$inferSelect;
export type NewJobSchedule = typeof jobSchedules.$inferInsert;
