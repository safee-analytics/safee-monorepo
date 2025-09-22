import { text, timestamp, boolean, index, uuid } from "drizzle-orm/pg-core";
import { idpk, jobsSchema } from "./_common.js";
import { jobDefinitions } from "./jobDefinitions.js";

export const jobSchedules = jobsSchema.table(
  "job_schedules",
  {
    id: idpk("id"),
    jobDefinitionId: uuid("job_definition_id")
      .notNull()
      .references(() => jobDefinitions.id, { onDelete: "cascade" }),
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
    index("job_schedules_definition_idx").on(table.jobDefinitionId),
    index("job_schedules_next_run_idx").on(table.nextRunAt),
    index("job_schedules_active_idx").on(table.isActive),
  ],
);

export type JobSchedule = typeof jobSchedules.$inferSelect;
export type NewJobSchedule = typeof jobSchedules.$inferInsert;
