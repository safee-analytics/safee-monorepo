import { z } from "zod";

export const EmailTemplateSchema = z.object({
  name: z.string(),
  subject: z.object({
    en: z.string(),
    ar: z.string(),
  }),
  html: z.object({
    en: z.string(),
    ar: z.string(),
  }),
  text: z
    .object({
      en: z.string(),
      ar: z.string(),
    })
    .optional(),
  requiredVariables: z.array(z.string()),
});

export type EmailTemplate = z.infer<typeof EmailTemplateSchema>;

export interface TemplateRenderContext {
  locale: "en" | "ar";
  variables: Record<string, string>;
}
