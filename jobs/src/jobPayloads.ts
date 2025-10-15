import { z } from "zod";
import { EmailJobPayloadSchema } from "./emailTypes.js";

export const JobPayloadSchemas = {
  send_email: EmailJobPayloadSchema,
} as const;

export type JobPayloadType = keyof typeof JobPayloadSchemas;

export type JobPayloadMap = {
  send_email: z.infer<typeof EmailJobPayloadSchema>;
};

export function validateJobPayload<T extends JobPayloadType>(jobType: T, payload: unknown): JobPayloadMap[T] {
  const schema = JobPayloadSchemas[jobType];
  return schema.parse(payload) as JobPayloadMap[T];
}

export function getJobPayloadSchema(jobType: JobPayloadType): z.ZodType {
  return JobPayloadSchemas[jobType];
}
