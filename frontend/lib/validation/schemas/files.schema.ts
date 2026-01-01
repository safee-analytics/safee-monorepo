import { z } from "zod";

export const fileItemSchema = z.object({
  id: z.string(),
  name: z.string(),
  size: z.number(),
  type: z.string(),
  uploadedAt: z.string(),
  uploadedBy: z.string().optional(),
  isEncrypted: z.boolean().optional(),
  tags: z.array(z.string()).optional(),
  url: z.string().optional(),
});

export type FileItem = z.infer<typeof fileItemSchema>;
