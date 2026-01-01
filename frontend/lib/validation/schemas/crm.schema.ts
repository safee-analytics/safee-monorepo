import { z } from "zod";

export const activityTypeSchema = z.object({
  id: z.number(),
  name: z.string(),
});

export type ActivityType = z.infer<typeof activityTypeSchema>;

export const leadSchema = z.object({
  id: z.number(),
  name: z.string(),
  stage: z.object({
    name: z.string(),
  }).nullable().optional(),
  user: z.object({
    id: z.number(),
  }).nullable().optional(),
});

export type Lead = z.infer<typeof leadSchema>;
