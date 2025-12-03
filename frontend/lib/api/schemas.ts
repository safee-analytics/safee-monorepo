/**
 * Zod schemas for API validation
 * Note: These enums are duplicated from the database package to avoid importing server-side code
 * Keep in sync with database/src/drizzle/_common.ts
 */
import { z } from "zod";

// Case enum values - synced with database package
const CASE_STATUSES = ["new", "in-progress", "pending", "completed", "overdue", "archived"] as const;
const CASE_PRIORITIES = ["low", "medium", "high", "critical"] as const;

// Case validation schemas
export const CaseStatusSchema = z.enum(CASE_STATUSES);
export const CasePrioritySchema = z.enum(CASE_PRIORITIES);

// Infer TypeScript types from schemas
export type CaseStatus = z.infer<typeof CaseStatusSchema>;
export type CasePriority = z.infer<typeof CasePrioritySchema>;

// Helper functions for validation
export function isValidCaseStatus(value: unknown): value is CaseStatus {
  return CaseStatusSchema.safeParse(value).success;
}

export function isValidCasePriority(value: unknown): value is CasePriority {
  return CasePrioritySchema.safeParse(value).success;
}

// CRM Lead form schema
export const leadFormSchema = z.object({
  name: z.string().min(1, "Name is required"),
  type: z.enum(["lead", "opportunity"]).default("lead"),
  contactName: z.string().optional(),
  partnerName: z.string().optional(),
  emailFrom: z.string().email("Invalid email").optional().or(z.literal("")),
  phone: z.string().optional(),
  website: z.string().url("Invalid URL").optional().or(z.literal("")),
  function: z.string().optional(),
  street: z.string().optional(),
  street2: z.string().optional(),
  city: z.string().optional(),
  stateId: z.number().optional(),
  countryId: z.number().optional(),
  zip: z.string().optional(),
  partnerId: z.number().optional(),
  stageId: z.number().optional(),
  teamId: z.number().optional(),
  userId: z.number().optional(),
  expectedRevenue: z.number().positive("Expected revenue must be positive").optional(),
  probability: z
    .number()
    .min(0, "Probability must be at least 0")
    .max(100, "Probability must be at most 100")
    .optional(),
  dateDeadline: z.string().optional(),
  priority: z.enum(["0", "1", "2", "3"]).optional(),
  description: z.string().optional(),
  tags: z.array(z.number()).optional(),
});

export type LeadFormData = z.infer<typeof leadFormSchema>;

// CRM Contact form schema
export const contactFormSchema = z.object({
  name: z.string().min(1, "Name is required"),
  isCompany: z.boolean().default(false),
  email: z.string().email("Invalid email").optional().or(z.literal("")),
  phone: z.string().optional(),
  mobile: z.string().optional(),
  website: z.string().url("Invalid URL").optional().or(z.literal("")),
  street: z.string().optional(),
  street2: z.string().optional(),
  city: z.string().optional(),
  stateId: z.number().optional(),
  countryId: z.number().optional(),
  zip: z.string().optional(),
  function: z.string().optional(),
  vat: z.string().optional(),
  industryId: z.number().optional(),
});

export type ContactFormData = z.infer<typeof contactFormSchema>;

// CRM Activity form schema
export const activityFormSchema = z.object({
  leadId: z.number({ message: "Lead is required" }),
  activityTypeId: z.number({ message: "Activity type is required" }),
  summary: z.string().optional(),
  note: z.string().optional(),
  dateDeadline: z.string().min(1, "Due date is required"),
  userId: z.number().optional(),
});

export type ActivityFormData = z.infer<typeof activityFormSchema>;

// Quick lead creation schema (minimal fields)
export const quickLeadFormSchema = z.object({
  name: z.string().min(1, "Name is required"),
  contactName: z.string().optional(),
  emailFrom: z.string().email("Invalid email").optional().or(z.literal("")),
  phone: z.string().optional(),
});

export type QuickLeadFormData = z.infer<typeof quickLeadFormSchema>;
