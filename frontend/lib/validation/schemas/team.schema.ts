import { z } from "zod";

export const memberSchema = z.object({
  id: z.string(),
  userId: z.string(),
  role: z.string(),
  createdAt: z.string(),
  user: z.object({
    name: z.string().nullable(),
    email: z.string(),
  }),
});

export type Member = z.infer<typeof memberSchema>;

export const invitationSchema = z.object({
  id: z.string(),
  email: z.string(),
  role: z.string(),
  expiresAt: z.string(),
  status: z.string().optional(),
});

export type Invitation = z.infer<typeof invitationSchema>;
