import { z } from "zod";
import type {
  Case,
  NewCase,
  Template,
  NewTemplate,
  TemplateInstance,
  NewTemplateInstance,
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

export const customFieldValidationSchema = z.object({
  min: z.number().optional(),
  max: z.number().optional(),
  minLength: z.number().optional(),
  maxLength: z.number().optional(),
  pattern: z.string().optional(),
});

export const customFieldSchema = z.object({
  name: z.string(),
  type: z.enum(["text", "number", "date", "select", "textarea", "checkbox", "file"]),
  required: z.boolean(),
  validation: customFieldValidationSchema.optional(),
  options: z.array(z.string()).optional(),
  helpText: z.string().optional(),
});

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

export const sectionSettingsSchema = z.object({
  canAddProcedures: z.boolean().optional(),
  canRemoveProcedures: z.boolean().optional(),
  requiredAttachments: z.number().optional(),
  allowObservations: z.boolean().optional(),
  requireReview: z.boolean().optional(),
});

export type SectionSettings = z.infer<typeof sectionSettingsSchema>;

export const templateProcedureSchema = z.object({
  referenceNumber: z.string(),
  title: z.string(),
  description: z.string().optional(),
  requirements: procedureRequirementsSchema.optional(),
  sortOrder: z.number(),
});

export const templateSectionSchema = z.object({
  name: z.string(),
  description: z.string().optional(),
  sortOrder: z.number(),
  settings: sectionSettingsSchema.optional(),
  procedures: z.array(templateProcedureSchema),
});

export const templateSettingsSchema = z.record(z.string(), z.unknown());

export const templateStructureSchema = z.object({
  sections: z.array(templateSectionSchema),
  settings: templateSettingsSchema.optional(),
});

export type TemplateStructure = z.infer<typeof templateStructureSchema>;
export type TemplateSection = z.infer<typeof templateSectionSchema>;
export type TemplateProcedure = z.infer<typeof templateProcedureSchema>;

export const procedureFieldDataSchema = z.record(z.string(), z.unknown());

export type ProcedureFieldData = z.infer<typeof procedureFieldDataSchema>;

export const scopeMetadataSchema = z.record(z.string(), z.unknown());

export type ScopeMetadata = z.infer<typeof scopeMetadataSchema>;

// Case Activity schemas
export const activityMetadataSchema = z
  .object({
    caseName: z.string().optional(),
    oldValue: z.string().optional(),
    newValue: z.string().optional(),
    documentName: z.string().optional(),
    documentId: z.string().optional(),
    userName: z.string().optional(),
    assignedUserId: z.string().optional(),
    assignedUserName: z.string().optional(),
    commentId: z.string().optional(),
    scopeId: z.string().optional(),
    planId: z.string().optional(),
    reportId: z.string().optional(),
  })
  .catchall(z.unknown());

export const activityIsReadSchema = z.record(z.string(), z.boolean());

export type ActivityMetadata = z.infer<typeof activityMetadataSchema>;
export type ActivityIsRead = z.infer<typeof activityIsReadSchema>;

// Audit Plan schemas
export const auditPlanObjectiveSchema = z.object({
  id: z.string(),
  description: z.string(),
  priority: z.string().optional(),
});

export const auditPlanTeamMemberSchema = z.object({
  userId: z.string(),
  name: z.string(),
  role: z.string(),
  hours: z.number().optional(),
});

export const auditPlanPhaseSchema = z.object({
  name: z.string(),
  duration: z.number(),
  description: z.string().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
});

export const auditPlanRiskSchema = z.object({
  type: z.string(),
  severity: z.string(),
  message: z.string(),
});

export const auditPlanRiskAssessmentSchema = z.object({
  risks: z.array(auditPlanRiskSchema).optional(),
  overallRisk: z.string().optional(),
  score: z.number().optional(),
});

export type AuditPlanObjective = z.infer<typeof auditPlanObjectiveSchema>;
export type AuditPlanTeamMember = z.infer<typeof auditPlanTeamMemberSchema>;
export type AuditPlanPhase = z.infer<typeof auditPlanPhaseSchema>;
export type AuditPlanRisk = z.infer<typeof auditPlanRiskSchema>;
export type AuditPlanRiskAssessment = z.infer<typeof auditPlanRiskAssessmentSchema>;

// Audit Report schemas
export const auditReportSettingsSchema = z.object({
  dateRange: z
    .object({
      start: z.string(),
      end: z.string(),
    })
    .optional(),
  includeSections: z.array(z.string()).optional(),
  customizations: z.record(z.string(), z.unknown()).optional(),
});

export type AuditReportSettings = z.infer<typeof auditReportSettingsSchema>;

// Audit Report Template schemas
export const reportTemplateSectionSchema = z.object({
  id: z.string(),
  type: z.enum(["cover_page", "text", "metrics_table", "findings_list", "chart", "appendix"]),
  title: z.string().optional(),
  dataSource: z.string().optional(),
  config: z.record(z.string(), z.unknown()).optional(),
});

export const reportTemplateStructureSchema = z.object({
  sections: z.array(reportTemplateSectionSchema),
  styles: z.record(z.string(), z.unknown()).optional(),
  metadata: z.record(z.string(), z.unknown()).optional(),
});

export type ReportTemplateSection = z.infer<typeof reportTemplateSectionSchema>;
export type ReportTemplateStructure = z.infer<typeof reportTemplateStructureSchema>;

// Workflow Template schemas
export const workflowTemplateConfigSchema = z.object({
  settings: z.record(z.string(), z.unknown()).optional(),
  variables: z.record(z.string(), z.unknown()).optional(),
});

export type WorkflowTemplateConfig = z.infer<typeof workflowTemplateConfigSchema>;

// Workflow Step schemas
export const workflowStepConditionSchema = z.object({
  type: z.string(),
  field: z.string().optional(),
  operator: z.string().optional(),
  value: z.unknown().optional(),
});

export const workflowStepConditionsSchema = z.array(workflowStepConditionSchema);

export type WorkflowStepCondition = z.infer<typeof workflowStepConditionSchema>;
export type WorkflowStepConditions = z.infer<typeof workflowStepConditionsSchema>;

// Case History schemas (generic records for before/after changes)
export const caseHistoryChangesSchema = z.record(z.string(), z.unknown());

export type CaseHistoryChanges = z.infer<typeof caseHistoryChangesSchema>;

export type CreateCaseInput = NewCase;
export type UpdateCaseInput = Partial<Omit<NewCase, "organizationId" | "createdBy">>;

export type CreateTemplateInput = NewTemplate;
export type CreateScopeInput = Omit<
  NewTemplateInstance,
  "completedBy" | "archivedBy" | "completedAt" | "archivedAt"
>;
export type CreateSectionInput = NewAuditSection;
export type CreateProcedureInput = Omit<NewAuditProcedure, "isCompleted" | "completedBy" | "completedAt">;
export type CompleteProcedureInput = {
  completedBy: string;
  fieldData?: Record<string, unknown> | null;
  memo?: string | null;
};
export type CreateDocumentInput = Omit<NewCaseDocument, "isDeleted">;
export type CreateNoteInput = Omit<NewCaseNote, "isEdited">;
export type UpdateNoteInput = Pick<NewCaseNote, "content">;
export type CreateAssignmentInput = NewCaseAssignment;

export type {
  Case,
  NewCase,
  Template,
  NewTemplate,
  TemplateInstance,
  NewTemplateInstance,
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
  templateInstances?: TemplateInstance[] | null;
  documents?: CaseDocument[] | null;
  notes?: CaseNote[] | null;
  assignments?: CaseAssignment[] | null;
  history?: CaseHistory[] | null;
}

export interface TemplateInstanceWithRelations extends TemplateInstance {
  case?: Case | null;
  template?: Template | null;
  sections?: AuditSection[] | null;
}

export interface AuditSectionWithRelations extends AuditSection {
  scope?: TemplateInstance | null;
  procedures?: AuditProcedure[] | null;
}

export interface AuditProcedureWithRelations extends AuditProcedure {
  section?: AuditSection | null;
  documents?: CaseDocument[] | null;
  notes?: CaseNote[] | null;
}
