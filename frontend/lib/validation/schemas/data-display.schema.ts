import { z } from "zod";

export const userSchema = z.object({
  id: z.number(),
  name: z.string(),
  contact: z.string(),
  photoURL: z.string(),
  maxRank: z.number(),
  status: z.string(),
});

export type User = z.infer<typeof userSchema>;
