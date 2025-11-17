/**
 * Zod schemas for API validation
 * Uses enum values from the database package for type safety
 */
import { z } from "zod";
import { CASE_STATUSES, CASE_PRIORITIES } from "@safee/database";

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
