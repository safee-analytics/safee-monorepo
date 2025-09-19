import { text, timestamp, jsonb, integer, boolean, index } from "drizzle-orm/pg-core";
import { idpk, jobsSchema } from "./_common.js";

export const jobDefinitions = jobsSchema.table(
  "job_definitions",
  {
    id: idpk("id"),
    name: text("name").notNull().unique(),
    description: text("description"),
    handlerName: text("handler_name").notNull(), // e.g., "DailyReportJob", "DataSyncJob"
    defaultPayload: jsonb("default_payload").$type<Record<string, unknown>>(),
    isActive: boolean("is_active").default(true).notNull(),
    maxRetries: integer("max_retries").default(3).notNull(),
    retryDelayMs: integer("retry_delay_ms").default(60000).notNull(), // 1 minute default
    timeoutMs: integer("timeout_ms").default(300000).notNull(), // 5 minutes default
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index("job_definitions_name_idx").on(table.name),
    index("job_definitions_handler_idx").on(table.handlerName),
    index("job_definitions_active_idx").on(table.isActive),
  ],
);

export type JobDefinition = typeof jobDefinitions.$inferSelect;
export type NewJobDefinition = typeof jobDefinitions.$inferInsert;
