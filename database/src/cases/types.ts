import { z } from "zod";
import type {
  Case,
  NewCase,
  AuditTemplate,
  NewAuditTemplate,
  AuditScope,
  NewAuditScope,
  AuditSection,
  NewAuditSection,
  AuditProcedure,
  NewAuditProcedure,
  CaseDocument,
  NewCaseDocument,
  CaseNote,
  NewCaseNote,
  CaseAssignment,
  NewCaseAssignment,
  CaseHistory,
  NewCaseHistory,
} from "../drizzle/index.js";

/**
 * Zod schemas for JSONB fields
 */

// Custom field validation schema
export const customFieldValidationSchema = z.object({
  min: z.number().optional(),
  max: z.number().optional(),
  minLength: z.number().optional(),
  maxLength: z.number().optional(),
  pattern: z.string().optional(),
});

// Custom field schema
export const customFieldSchema = z.object({
  name: z.string(),
  type: z.enum(["text", "number", "date", "select", "textarea", "checkbox", "file"]),
  required: z.boolean(),
  validation: customFieldValidationSchema.optional(),
  options: z.array(z.string()).optional(),
  helpText: z.string().optional(),
});

// Procedure requirements schema
export const procedureRequirementsSchema = z.object({
  isRequired: z.boolean().optional(),
  minAttachments: z.number().optional(),
  maxAttachments: z.number().optional(),
  requiresObservations: z.boolean().optional(),
  requiresReviewComment: z.boolean().optional(),
  allowedFileTypes: z.array(z.string()).optional(),
  customFields: z.array(customFieldSchema).optional(),
  completionCriteria: z
    .object({
      allAttachmentsRequired: z.boolean().optional(),
      allCustomFieldsRequired: z.boolean().optional(),
      observationsRequired: z.boolean().optional(),
    })
    .optional(),
});

export type ProcedureRequirements = z.infer<typeof procedureRequirementsSchema>;
export type CustomField = z.infer<typeof customFieldSchema>;

// Section settings schema (defined before template section)
export const sectionSettingsSchema = z.object({
  canAddProcedures: z.boolean().optional(),
  canRemoveProcedures: z.boolean().optional(),
  requiredAttachments: z.number().optional(),
  allowObservations: z.boolean().optional(),
  requireReview: z.boolean().optional(),
});

export type SectionSettings = z.infer<typeof sectionSettingsSchema>;

// Template procedure schema (for structure JSONB)
export const templateProcedureSchema = z.object({
  referenceNumber: z.string(),
  title: z.string(),
  description: z.string().optional(),
  requirements: procedureRequirementsSchema.optional(),
  sortOrder: z.number(),
});

// Template section schema (for structure JSONB)
export const templateSectionSchema = z.object({
  name: z.string(),
  description: z.string().optional(),
  sortOrder: z.number(),
  settings: sectionSettingsSchema.optional(),
  procedures: z.array(templateProcedureSchema),
});

// Template settings schema (for template structure)
export const templateSettingsSchema = z.record(z.string(), z.unknown());

// Template structure schema
export const templateStructureSchema = z.object({
  sections: z.array(templateSectionSchema),
  settings: templateSettingsSchema.optional(),
});

export type TemplateStructure = z.infer<typeof templateStructureSchema>;
export type TemplateSection = z.infer<typeof templateSectionSchema>;
export type TemplateProcedure = z.infer<typeof templateProcedureSchema>;

// Procedure field data schema (dynamic, validates at runtime)
export const procedureFieldDataSchema = z.record(z.string(), z.unknown());

export type ProcedureFieldData = z.infer<typeof procedureFieldDataSchema>;

// Scope metadata schema
export const scopeMetadataSchema = z.record(z.string(), z.unknown());

export type ScopeMetadata = z.infer<typeof scopeMetadataSchema>;

/**
 * Use Drizzle's infer types for inputs
 */
export type CreateCaseInput = NewCase;
export type UpdateCaseInput = Partial<Omit<NewCase, "organizationId" | "createdBy">>;

export type CreateTemplateInput = NewAuditTemplate;
export type CreateScopeInput = Omit<
  NewAuditScope,
  "completedBy" | "archivedBy" | "completedAt" | "archivedAt"
>;
export type CreateSectionInput = NewAuditSection;
export type CreateProcedureInput = Omit<NewAuditProcedure, "isCompleted" | "completedBy" | "completedAt">;
export type CompleteProcedureInput = {
  completedBy: string;
  fieldData?: Record<string, unknown>;
  memo?: string;
};
export type CreateDocumentInput = Omit<NewCaseDocument, "isDeleted">;
export type CreateNoteInput = Omit<NewCaseNote, "isEdited">;
export type UpdateNoteInput = Pick<NewCaseNote, "content">;
export type CreateAssignmentInput = NewCaseAssignment;

/**
 * Re-export database types for convenience
 */
export type {
  Case,
  NewCase,
  AuditTemplate,
  NewAuditTemplate,
  AuditScope,
  NewAuditScope,
  AuditSection,
  NewAuditSection,
  AuditProcedure,
  NewAuditProcedure,
  CaseDocument,
  NewCaseDocument,
  CaseNote,
  NewCaseNote,
  CaseAssignment,
  NewCaseAssignment,
  CaseHistory,
  NewCaseHistory,
};

/**
 * Extended types with relations
 */
export interface CaseWithRelations extends Case {
  auditScopes?: AuditScope[];
  documents?: CaseDocument[];
  notes?: CaseNote[];
  assignments?: CaseAssignment[];
  history?: CaseHistory[];
}

export interface AuditScopeWithRelations extends AuditScope {
  case?: Case;
  template?: AuditTemplate;
  sections?: AuditSection[];
}

export interface AuditSectionWithRelations extends AuditSection {
  scope?: AuditScope;
  procedures?: AuditProcedure[];
}

export interface AuditProcedureWithRelations extends AuditProcedure {
  section?: AuditSection;
  documents?: CaseDocument[];
  notes?: CaseNote[];
}
