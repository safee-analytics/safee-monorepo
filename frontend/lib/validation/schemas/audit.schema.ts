import { z } from "zod";

export const customFieldValidationSchema = z.object({
  minLength: z.number().optional(),
  maxLength: z.number().optional(),
  min: z.number().optional(),
  max: z.number().optional(),
  pattern: z.string().optional(),
});

export const customFieldSchema = z.object({
  name: z.string(),
  label: z.string(),
  type: z.enum(["text", "textarea", "number", "date", "select", "checkbox", "file"]),
  required: z.boolean(),
  placeholder: z.string().optional(),
  helpText: z.string().optional(),
  options: z.array(z.string()).optional(), // For select fields
  validation: customFieldValidationSchema.optional(),
});

export const procedureRequirementsSchema = z.object({
  customFields: z.array(customFieldSchema).optional(),
  minAttachments: z.number().optional(),
  maxAttachments: z.number().optional(),
  requiresObservations: z.boolean().optional(),
  allowedFileTypes: z.array(z.string()).optional(),
});

export const fieldDataSchema = z.record(z.string(), z.unknown());

export const createTemplateRequestSchema = z.object({
  name: z.string().min(1, "Template name is required"),
  description: z.string().optional(),
  templateType: z.enum(["scope", "form", "checklist", "report", "plan"]),
  category: z.enum(["certification", "financial", "operational", "compliance"]).optional(),
  version: z.string().default("1.0.0"),
  isActive: z.boolean().default(false),
  isSystemTemplate: z.boolean().default(false),
  structure: z.object({
    sections: z.array(sectionSchema).min(1, "At least one section is required"),
    settings: z.record(z.string(), z.unknown()).optional(),
  }),
});

export type CreateTemplateRequestType = z.infer<typeof createTemplateRequestSchema>;

