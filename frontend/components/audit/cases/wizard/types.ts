/**
 * Shared types for the Case Creation Wizard
 * Extracted to avoid circular dependencies between CreateCaseWizard and step components
 * Uses centralized types from gateway
 */

import type { CaseTemplateData } from "@/lib/data/caseTemplates";
import type { CaseType, CaseStatus, CasePriority, AssignmentRole } from "@/lib/types/cases";

export interface WizardStepProps {
  data: Partial<WizardData>;
  onChange: (updates: Partial<WizardData>) => void;
  onNext: () => void;
  onBack: () => void;
}

export interface WizardData {
  // Step 1: Template Selection
  selectedTemplate: CaseTemplateData | null;
  useTemplate: boolean;

  // Step 2: Quick Start (Essential fields) - Using gateway types
  title: string;
  caseType: CaseType;
  priority: CasePriority;
  dueDate: string | undefined;

  // Step 3: Details (Optional additional fields) - Using gateway types
  status: CaseStatus;
  description?: string;
  estimatedHours?: number;
  budget?: number;

  // Step 4: Team Assignment (Optional) - Using gateway types
  assignments?: {
    userId: string;
    role: AssignmentRole;
  }[];

  // Step 5: Documents (Optional)
  documentPreviews?: File[];
}

export interface ValidationResult {
  valid: boolean;
  errors?: Record<string, string>;
}
