import { relations } from "drizzle-orm";
import { jobSchedules } from "./jobSchedules.js";
import { jobDefinitions } from "./jobDefinitions.js";
import { jobs } from "./jobs.js";

export const jobSchedulesRelations = relations(jobSchedules, ({ one, many }) => ({
  definition: one(jobDefinitions, {
    fields: [jobSchedules.jobDefinitionId],
    references: [jobDefinitions.id],
  }),
  jobs: many(jobs),
}));
