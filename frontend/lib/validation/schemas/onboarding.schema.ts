import { z } from "zod";

export const moduleSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string(),
  icon: z.any(), // Cannot easily validate React component type with Zod
  color: z.string(),
});

export type Module = z.infer<typeof moduleSchema>;

export const subscriptionPlanSchema = z.object({
  id: z.string(),
  name: z.string(),
  slug: z.string(),
  pricePerSeat: z.string(),
  maxSeats: z.number().nullable(),
  features: z.record(z.string(), z.unknown()).nullable(),
});

export type SubscriptionPlan = z.infer<typeof subscriptionPlanSchema>;

export const currentSubscriptionSchema = z.object({
  isFree: z.boolean(),
  seats: z.number(),
  planSlug: z.string(),
  planName: z.string(),
});

export type CurrentSubscription = z.infer<typeof currentSubscriptionSchema>;

export const teamMemberSchema = z.object({
  email: z.string().email(),
  role: z.enum(["admin", "member", "owner"]),
});

export type TeamMember = z.infer<typeof teamMemberSchema>;

export const pendingInvitationSchema = z.object({
  id: z.string(),
  organizationId: z.string(),
  organizationName: z.string().optional(),
  inviterName: z.string().optional(),
  email: z.string().email(),
  role: z.enum(["admin", "member", "owner"]),
  status: z.string(),
  inviterId: z.string(),
  expiresAt: z.preprocess((arg) => (typeof arg === "string" || arg instanceof Date ? new Date(arg) : undefined), z.date()),
  createdAt: z.preprocess((arg) => (typeof arg === "string" || arg instanceof Date ? new Date(arg) : undefined), z.date()),
  teamId: z.string().optional(),
});

export type PendingInvitation = z.infer<typeof pendingInvitationSchema>;
