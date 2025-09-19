import { relations } from "drizzle-orm";
import { jobDefinitions } from "./jobDefinitions.js";
import { jobSchedules } from "./jobSchedules.js";
import { jobs } from "./jobs.js";

export const jobDefinitionsRelations = relations(jobDefinitions, ({ many }) => ({
  schedules: many(jobSchedules),
  jobs: many(jobs),
}));
