import { text, timestamp, jsonb, integer, index, uuid } from "drizzle-orm/pg-core";
import { idpk, jobsSchema, jobStatusEnum, jobTypeEnum, priorityEnum } from "./_common.js";
import { jobDefinitions } from "./jobDefinitions.js";
import { jobSchedules } from "./jobSchedules.js";
import { organizations } from "./organizations.js";

export const jobs = jobsSchema.table(
  "jobs",
  {
    id: idpk("id"),
    jobDefinitionId: uuid("job_definition_id")
      .notNull()
      .references(() => jobDefinitions.id),
    scheduleId: uuid("schedule_id").references(() => jobSchedules.id),
    organizationId: uuid("organization_id").references(() => organizations.id),
    status: jobStatusEnum("status").default("pending").notNull(),
    type: jobTypeEnum("type").default("immediate").notNull(),
    priority: priorityEnum("priority").default("normal").notNull(),
    payload: jsonb("payload").$type<Record<string, unknown>>(),
    result: jsonb("result").$type<Record<string, unknown>>(),
    error: text("error"),
    attempts: integer("attempts").default(0).notNull(),
    maxRetries: integer("max_retries").default(3).notNull(),
    scheduledFor: timestamp("scheduled_for", { withTimezone: true }),
    startedAt: timestamp("started_at", { withTimezone: true }),
    completedAt: timestamp("completed_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index("jobs_status_idx").on(table.status),
    index("jobs_scheduled_for_idx").on(table.scheduledFor),
    index("jobs_organization_idx").on(table.organizationId),
    index("jobs_priority_idx").on(table.priority),
    index("jobs_type_idx").on(table.type),
    index("jobs_created_at_idx").on(table.createdAt),
    index("jobs_definition_idx").on(table.jobDefinitionId),
  ],
);

// Types
export type Job = typeof jobs.$inferSelect;
export type NewJob = typeof jobs.$inferInsert;
