import { z } from "zod";

export const displayUserSchema = z.object({
  id: z.number(),
  name: z.string(),
  contact: z.string(),
  photoURL: z.string(),
  maxRank: z.number(),
  status: z.string(),
});

export type DisplayUser = z.infer<typeof displayUserSchema>;
