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

export type CustomField = z.infer<typeof customFieldSchema>;

export const procedureRequirementsSchema = z.object({
  customFields: z.array(customFieldSchema).optional(),
  minAttachments: z.number().optional(),
  maxAttachments: z.number().optional(),
  requiresObservations: z.boolean().optional(),
  allowedFileTypes: z.array(z.string()).optional(),
});

export const fieldDataSchema = z.record(z.string(), z.unknown());

export const procedureSchema = z.object({
  referenceNumber: z.string().min(1, "Reference number is required"),
  title: z.string().min(1, "Title is required"),
  description: z.string().optional(),
  sortOrder: z.number(),
  requirements: procedureRequirementsSchema.optional(),
});

export const sectionSchema = z.object({
  name: z.string().min(1, "Section name is required"),
  description: z.string().optional(),
  sortOrder: z.number(),
  settings: z.record(z.string(), z.unknown()).optional(),
  procedures: z.array(procedureSchema).min(1, "At least one procedure is required"),
});

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

export const fileUploadItemSchema = z.object({
  file: z.instanceof(File),
  status: z.enum(["pending", "uploading", "success", "error"]),
  progress: z.number().min(0).max(100),
  category: z.string().optional(),
  error: z.string().optional(),
});

export type FileUploadItem = z.infer<typeof fileUploadItemSchema>;

export const documentSchema = z.object({
  id: z.string(),
  name: z.string(),
  type: z.string(),
  size: z.number(),
  category: z.string(),
  status: z.enum(["pending", "approved", "rejected"]),
  uploadedAt: z.string(),
  uploadedBy: z.string(),
});

export type Document = z.infer<typeof documentSchema>;

export const statCardPropsSchema = z.object({
  title: z.string(),
  value: z.number(),
  subtitle: z.string(),
  icon: z.unknown(),
  iconBgColor: z.string(),
  iconColor: z.string(),
  trend: z
    .object({
      value: z.string(),
      positive: z.boolean(),
    })
    .optional(),
});

export type StatCardProps = z.infer<typeof statCardPropsSchema>;
