import { z } from "zod";

export const activityTypeSchema = z.object({
  id: z.number(),
  name: z.string(),
});

export type ActivityType = z.infer<typeof activityTypeSchema>;

export const leadSchema = z.object({
  id: z.number(),
  name: z.string(),
  partnerName: z.string().nullable().optional(),
  contactName: z.string().nullable().optional(),
  expectedRevenue: z.number().nullable().optional(),
  probability: z.number().nullable().optional(),
  type: z.enum(["lead", "opportunity"]).nullable().optional(),
  priority: z.enum(["0", "1", "2", "3"]).nullable().optional(),
  emailFrom: z.string().nullable().optional(),
  phone: z.string().nullable().optional(),
  dateDeadline: z.string().nullable().optional(),
  stage: z
    .object({
      name: z.string(),
    })
    .nullable()
    .optional(),
  user: z
    .object({
      id: z.number(),
      name: z.string().nullable().optional(),
    })
    .nullable()
    .optional(),
});

export type Lead = z.infer<typeof leadSchema>;
