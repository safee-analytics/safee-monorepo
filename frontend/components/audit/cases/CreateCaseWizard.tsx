"use client";

import { useState, useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { X, ArrowLeft, ArrowRight, Save } from "lucide-react";
import { useAuditStore } from "@/stores/useAuditStore";
import { TemplateSelector } from "./wizard/TemplateSelector";
import { QuickStartStep } from "./wizard/QuickStartStep";
import { DetailsStep } from "./wizard/DetailsStep";
import { TeamStep } from "./wizard/TeamStep";
import { DocumentsStep } from "./wizard/DocumentsStep";
import { useCreateCase } from "@/lib/api/hooks";
import { useToast } from "@safee/ui";
import type { CaseTemplateData } from "@/lib/data/caseTemplates";

interface WizardStep {
  id: string;
  title: string;
  component: React.ComponentType<WizardStepProps>;
  validate: (data: Partial<WizardData>) => ValidationResult;
  canSkip: boolean;
}

export interface WizardStepProps {
  data: Partial<WizardData>;
  onChange: (updates: Partial<WizardData>) => void;
  onNext: () => void;
  onBack: () => void;
}

interface ValidationResult {
  valid: boolean;
  errors?: Record<string, string>;
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

const WIZARD_STEPS: WizardStep[] = [
  {
    id: "template",
    title: "Choose Template",
    component: TemplateSelector,
    validate: () => ({ valid: true }), // Template selection is optional
    canSkip: false,
  },
  {
    id: "quickstart",
    title: "Quick Start",
    component: QuickStartStep,
    validate: (data) => {
      const errors: Record<string, string> = {};
      if (!data.clientName?.trim()) {
        errors.clientName = "Client name is required";
      }
      if (!data.auditType) {
        errors.auditType = "Audit type is required";
      }
      return {
        valid: Object.keys(errors).length === 0,
        errors: Object.keys(errors).length > 0 ? errors : undefined,
      };
    },
    canSkip: false,
  },
  {
    id: "details",
    title: "Details",
    component: DetailsStep,
    validate: () => ({ valid: true }), // All fields in details are optional
    canSkip: true,
  },
  {
    id: "team",
    title: "Team",
    component: TeamStep,
    validate: () => ({ valid: true }), // Team assignment is optional
    canSkip: true,
  },
  {
    id: "documents",
    title: "Documents",
    component: DocumentsStep,
    validate: () => ({ valid: true }), // Documents are optional
    canSkip: true,
  },
];

interface CreateCaseWizardProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export function CreateCaseWizard({ isOpen, onClose, onSuccess }: CreateCaseWizardProps) {
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [wizardData, setWizardData] = useState<Partial<WizardData>>({
    priority: "medium",
    status: "pending",
    useTemplate: false,
  });
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});

  const { wizardDraft, saveWizardDraft, clearWizardDraft } = useAuditStore();
  const createCaseMutation = useCreateCase();
  const toast = useToast();

  const currentStep = WIZARD_STEPS[currentStepIndex];
  const isFirstStep = currentStepIndex === 0;
  const isLastStep = currentStepIndex === WIZARD_STEPS.length - 1;

  // Load draft on mount
  useEffect(() => {
    if (wizardDraft && isOpen) {
      setWizardData(wizardDraft);
    }
  }, [wizardDraft, isOpen]);

  // Auto-save draft every 30 seconds
  useEffect(() => {
    if (!isOpen) return;

    const interval = setInterval(() => {
      if (Object.keys(wizardData).length > 0) {
        saveWizardDraft(wizardData);
      }
    }, 30000); // 30 seconds

    return () => { clearInterval(interval); };
  }, [wizardData, isOpen, saveWizardDraft]);

  const handleDataChange = (updates: Partial<WizardData>) => {
    setWizardData((prev) => ({ ...prev, ...updates }));
    // Clear validation errors for updated fields
    setValidationErrors((prev) => {
      const newErrors = { ...prev };
      for (const key of Object.keys(updates)) delete newErrors[key];
      return newErrors;
    });
  };

  const validateCurrentStep = (): boolean => {
    const result = currentStep.validate(wizardData);
    if (!result.valid && result.errors) {
      setValidationErrors(result.errors);
      return false;
    }
    setValidationErrors({});
    return true;
  };

  const handleNext = () => {
    if (!validateCurrentStep()) {
      toast.error("Please fix the errors before continuing");
      return;
    }

    if (isLastStep) {
      handleSubmit();
    } else {
      setCurrentStepIndex((prev) => prev + 1);
    }
  };

  const handleBack = () => {
    if (!isFirstStep) {
      setCurrentStepIndex((prev) => prev - 1);
    }
  };

  const handleSkip = () => {
    if (currentStep.canSkip) {
      if (isLastStep) {
        handleSubmit();
      } else {
        setCurrentStepIndex((prev) => prev + 1);
      }
    }
  };

  const handleSaveDraft = () => {
    saveWizardDraft(wizardData);
    toast.success("Draft saved successfully");
  };

  const handleSubmit = async () => {
    try {
      await createCaseMutation.mutateAsync({
        clientName: wizardData.clientName!,
        auditType: wizardData.auditType! as
          | "ICV"
          | "ISO_9001"
          | "ISO_14001"
          | "ISO_45001"
          | "financial_audit"
          | "internal_audit"
          | "compliance_audit"
          | "operational_audit",
        status: (wizardData.status || "pending") as
          | "pending"
          | "in-progress"
          | "under-review"
          | "completed"
          | "overdue"
          | "archived",
        priority: (wizardData.priority || "medium") as "low" | "medium" | "high" | "critical",
        dueDate: wizardData.dueDate,
        // Additional fields can be added here as the API supports them
      });

      toast.success("Case created successfully!");
      clearWizardDraft();
      setWizardData({ priority: "medium", status: "pending", useTemplate: false });
      setCurrentStepIndex(0);
      onSuccess?.();
      onClose();
    } catch (err) {
      console.error("Failed to create case:", err);
      toast.error("Failed to create case. Please try again.");
    }
  };

  const handleClose = () => {
    // Save draft before closing
    if (Object.keys(wizardData).length > 3) {
      // More than just default values
      saveWizardDraft(wizardData);
    }
    onClose();
  };

  const StepComponent = currentStep.component;

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={handleClose}
          className="bg-black/50 backdrop-blur-sm fixed inset-0 z-50 grid place-items-center overflow-y-auto p-4"
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            onClick={(e) => { e.stopPropagation(); }}
            className="bg-white rounded-xl shadow-xl w-full max-w-5xl max-h-[90vh] overflow-hidden flex flex-col"
          >
            {/* Header */}
            <div className="px-6 py-4 border-b border-gray-200">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-2xl font-bold text-gray-900">Create New Case</h2>
                <button onClick={handleClose} className="text-gray-400 hover:text-gray-600 transition-colors">
                  <X className="h-6 w-6" />
                </button>
              </div>

              {/* Progress Indicator */}
              <div className="flex items-center justify-between">
                {WIZARD_STEPS.map((step, index) => {
                  const isActive = index === currentStepIndex;
                  const isCompleted = index < currentStepIndex;
                  const isClickable = index < currentStepIndex;

                  return (
                    <div key={step.id} className="flex items-center flex-1">
                      <button
                        onClick={() => isClickable && setCurrentStepIndex(index)}
                        disabled={!isClickable}
                        className={`flex items-center space-x-2 ${isClickable ? "cursor-pointer" : "cursor-default"}`}
                      >
                        <div
                          className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold transition-colors ${
                            isActive
                              ? "bg-blue-600 text-white"
                              : isCompleted
                                ? "bg-green-500 text-white"
                                : "bg-gray-200 text-gray-600"
                          }`}
                        >
                          {isCompleted ? "✓" : index + 1}
                        </div>
                        <span
                          className={`text-sm font-medium ${
                            isActive ? "text-blue-600" : isCompleted ? "text-green-600" : "text-gray-500"
                          }`}
                        >
                          {step.title}
                        </span>
                      </button>
                      {index < WIZARD_STEPS.length - 1 && (
                        <div
                          className={`flex-1 h-0.5 mx-2 ${isCompleted ? "bg-green-500" : "bg-gray-200"}`}
                        />
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Step Content */}
            <div className="flex-1 overflow-y-auto px-6 py-6">
              <StepComponent
                data={wizardData}
                onChange={handleDataChange}
                onNext={handleNext}
                onBack={handleBack}
              />

              {/* Validation Errors */}
              {Object.keys(validationErrors).length > 0 && (
                <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
                  <h4 className="text-sm font-semibold text-red-800 mb-2">
                    Please fix the following errors:
                  </h4>
                  <ul className="text-sm text-red-700 space-y-1">
                    {Object.entries(validationErrors).map(([field, error]) => (
                      <li key={field}>• {error}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
              <div className="flex items-center justify-between">
                <div>
                  <button
                    onClick={handleSaveDraft}
                    className="flex items-center space-x-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-200 rounded-lg transition-colors"
                  >
                    <Save className="h-4 w-4" />
                    <span>Save Draft</span>
                  </button>
                </div>

                <div className="flex items-center space-x-3">
                  {!isFirstStep && (
                    <button
                      onClick={handleBack}
                      className="flex items-center space-x-2 px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                    >
                      <ArrowLeft className="h-4 w-4" />
                      <span>Back</span>
                    </button>
                  )}

                  {currentStep.canSkip && !isLastStep && (
                    <button
                      onClick={handleSkip}
                      className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                    >
                      Skip
                    </button>
                  )}

                  <button
                    onClick={handleNext}
                    disabled={createCaseMutation.isPending}
                    className="flex items-center space-x-2 px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <span>{isLastStep ? "Create Case" : "Next"}</span>
                    {!isLastStep && <ArrowRight className="h-4 w-4" />}
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
