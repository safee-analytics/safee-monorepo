import { relations } from "drizzle-orm";
import { jobLogs } from "./jobLogs.js";
import { jobs } from "./jobs.js";

export const jobLogsRelations = relations(jobLogs, ({ one }) => ({
  job: one(jobs, {
    fields: [jobLogs.jobId],
    references: [jobs.id],
  }),
}));
