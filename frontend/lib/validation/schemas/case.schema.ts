import { z } from "zod";

export const CaseStatusSchema = z.enum([
  "draft",
  "in_progress",
  "under_review",
  "completed",
  "overdue",
  "archived",
]);
export const CasePrioritySchema = z.enum(["low", "medium", "high", "critical"]);
const CaseTypeSchema = z.enum([
  "ICV_AUDIT",
  "ISO_9001_AUDIT",
  "ISO_14001_AUDIT",
  "ISO_45001_AUDIT",
  "FINANCIAL_AUDIT",
  "INTERNAL_AUDIT",
  "COMPLIANCE_AUDIT",
  "OPERATIONAL_AUDIT",
]);
const AssignmentRoleSchema = z.enum(["lead", "reviewer", "team_member"]);

export const caseAssignmentSchema = z.object({
  userId: z.string().nullable(),
  role: AssignmentRoleSchema,
  user: z
    .object({
      id: z.string().nullable(),
      name: z.string().nullable(),
      email: z.string(),
    })
    .optional(),
});

export const caseSchema = z.object({
  id: z.string(),
  caseNumber: z.string(),
  title: z.string(),
  caseType: CaseTypeSchema,
  status: CaseStatusSchema,
  priority: CasePrioritySchema,
  dueDate: z.string().nullable().optional(),
  createdBy: z.string(),
  createdAt: z.string(),
  updatedAt: z.string(),
  description: z.string().nullable().optional(),
  completedDate: z.string().nullable().optional(),
  assignments: z.array(caseAssignmentSchema).optional(),
});

export type Case = z.infer<typeof caseSchema>;
export type CaseAssignment = z.infer<typeof caseAssignmentSchema>;
