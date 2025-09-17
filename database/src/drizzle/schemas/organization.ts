import { z } from "zod";

export const organizationSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1).max(255),
  slug: z.string().min(1).max(100),
  isActive: z.boolean().default(true),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export type Organization = z.infer<typeof organizationSchema>;
export type CreateOrganization = Omit<Organization, "id" | "createdAt" | "updatedAt">;
export type UpdateOrganization = Partial<CreateOrganization>;
