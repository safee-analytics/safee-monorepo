import { relations } from "drizzle-orm";
import { jobs } from "./jobs.js";
import { jobSchedules } from "./jobSchedules.js";
import { jobLogs } from "./jobLogs.js";
import { organizations } from "./organizations.js";

export const jobsRelations = relations(jobs, ({ one, many }) => ({
  schedule: one(jobSchedules, {
    fields: [jobs.scheduleId],
    references: [jobSchedules.id],
  }),
  organization: one(organizations, {
    fields: [jobs.organizationId],
    references: [organizations.id],
  }),
  logs: many(jobLogs),
}));
