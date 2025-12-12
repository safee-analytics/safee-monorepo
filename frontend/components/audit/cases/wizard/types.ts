/**
 * Shared types for the Case Creation Wizard
 * Extracted to avoid circular dependencies between CreateCaseWizard and step components
 */

import type { CaseTemplateData } from "@/lib/data/caseTemplates";

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

  // Step 2: Quick Start (Essential fields)
  clientName: string;
  auditType: string;
  priority: string;
  dueDate: string | undefined;

  // Step 3: Details (Optional additional fields)
  status: string;
  description?: string;
  estimatedHours?: number;
  budget?: number;

  // Step 4: Team Assignment (Optional)
  assignments?: {
    userId: string;
    role: string;
  }[];

  // Step 5: Documents (Optional)
  documentPreviews?: File[];
}

export interface ValidationResult {
  valid: boolean;
  errors?: Record<string, string>;
}
