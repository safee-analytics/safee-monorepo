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
