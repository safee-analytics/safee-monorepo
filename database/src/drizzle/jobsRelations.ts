import { relations } from "drizzle-orm";
import { jobs } from "./jobs.js";
import { jobDefinitions } from "./jobDefinitions.js";
import { jobSchedules } from "./jobSchedules.js";
import { jobLogs } from "./jobLogs.js";
import { organizations } from "./organizations.js";

export const jobsRelations = relations(jobs, ({ one, many }) => ({
  definition: one(jobDefinitions, {
    fields: [jobs.jobDefinitionId],
    references: [jobDefinitions.id],
  }),
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
