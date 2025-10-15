import { relations } from "drizzle-orm";
import { jobSchedules } from "./jobSchedules.js";
import { jobs } from "./jobs.js";

export const jobSchedulesRelations = relations(jobSchedules, ({ many }) => ({
  jobs: many(jobs),
}));
