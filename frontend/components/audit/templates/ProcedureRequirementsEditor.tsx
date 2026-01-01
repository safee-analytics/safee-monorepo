"use client";

import { useState } from "react";
import { useFormContext } from "react-hook-form";
import { Button } from "@safee/ui";
import { X, Trash2, Save } from "lucide-react";
import { CustomFieldBuilder } from "./CustomFieldBuilder";

interface ProcedureRequirementsEditorProps {
  sectionIndex: number;
  procedureIndex: number;
  onClose: () => void;
}

// Custom field definition
export interface CustomField {
  id: string;
  name: string;
  type: "text" | "number" | "date" | "select" | "textarea" | "checkbox" | "file";
  label: string;
  description?: string;
  required: boolean;
  placeholder?: string;
  helpText?: string;
  defaultValue?: string | number | boolean;
  options?: string[]; // For select fields
  validation?: {
    min?: number;
    max?: number;
    minLength?: number;
    maxLength?: number;
    pattern?: string;
  };
}

// Procedure requirements
export interface ProcedureRequirements {
  isRequired?: boolean;
  minAttachments?: number;
  maxAttachments?: number;
  requiresObservations?: boolean;
  requiresReviewComment?: boolean;
  allowedFileTypes?: string[];
  customFields?: CustomField[];
}

export function ProcedureRequirementsEditor({
  sectionIndex,
  procedureIndex,
  onClose,
}: ProcedureRequirementsEditorProps) {
  const { watch, setValue } = useFormContext();

  const basePath = `structure.sections.${sectionIndex}.procedures.${procedureIndex}`;
  const procedureTitle = watch(`${basePath}.title`) || "Procedure";
  const procedureRef = watch(`${basePath}.referenceNumber`) || "";

  // Get current requirements
  const currentRequirements: ProcedureRequirements = watch(`${basePath}.requirements`) || {};

  // Local state for requirements
  const [requirements, setRequirements] = useState<ProcedureRequirements>({
    isRequired: currentRequirements.isRequired ?? true,
    minAttachments: currentRequirements.minAttachments ?? 0,
    maxAttachments: currentRequirements.maxAttachments ?? 10,
    requiresObservations: currentRequirements.requiresObservations ?? false,
    requiresReviewComment: currentRequirements.requiresReviewComment ?? false,
    allowedFileTypes: currentRequirements.allowedFileTypes ?? ["PDF", "DOCX", "XLSX"],
    customFields: currentRequirements.customFields || [],
  });

  const handleSave = () => {
    // Save requirements to form
    setValue(`${basePath}.requirements`, requirements, { shouldDirty: true });
    onClose();
  };

  const handleAddCustomField = (field: CustomField) => {
    setRequirements({
      ...requirements,
      customFields: [...(requirements.customFields || []), field],
    });
  };

  const handleRemoveCustomField = (fieldId: string) => {
    setRequirements({
      ...requirements,
      customFields: requirements.customFields?.filter((f) => f.id !== fieldId) || [],
    });
  };

  const fileTypes = ["PDF", "DOCX", "XLSX", "PPTX", "JPG", "PNG", "ZIP"];

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <div>
            <h2 className="text-xl font-bold text-gray-900">
              Configure Procedure: {procedureRef} {procedureTitle}
            </h2>
            <p className="text-sm text-gray-500 mt-1">
              Set requirements and custom fields for this procedure
            </p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
            <X className="h-5 w-5 text-gray-500" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Basic Requirements */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900">Basic Requirements</h3>

            <div className="grid grid-cols-2 gap-4">
              <label className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50">
                <input
                  type="checkbox"
                  checked={requirements.isRequired}
                  onChange={(e) => setRequirements({ ...requirements, isRequired: e.target.checked })}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <div>
                  <span className="font-medium text-gray-900">Required Procedure</span>
                  <p className="text-xs text-gray-500">Must be completed</p>
                </div>
              </label>

              <label className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50">
                <input
                  type="checkbox"
                  checked={requirements.requiresObservations}
                  onChange={(e) =>
                    setRequirements({ ...requirements, requiresObservations: e.target.checked })
                  }
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <div>
                  <span className="font-medium text-gray-900">Requires Observations</span>
                  <p className="text-xs text-gray-500">Auditor must add observations</p>
                </div>
              </label>

              <label className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50">
                <input
                  type="checkbox"
                  checked={requirements.requiresReviewComment}
                  onChange={(e) =>
                    setRequirements({ ...requirements, requiresReviewComment: e.target.checked })
                  }
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <div>
                  <span className="font-medium text-gray-900">Requires Review Comment</span>
                  <p className="text-xs text-gray-500">Reviewer must add comment</p>
                </div>
              </label>
            </div>
          </div>

          {/* Attachment Requirements */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900">Attachment Requirements</h3>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Minimum Attachments</label>
                <input
                  type="number"
                  min="0"
                  value={requirements.minAttachments}
                  onChange={(e) =>
                    setRequirements({
                      ...requirements,
                      minAttachments: parseInt(e.target.value) || 0,
                    })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Maximum Attachments</label>
                <input
                  type="number"
                  min="0"
                  value={requirements.maxAttachments}
                  onChange={(e) =>
                    setRequirements({
                      ...requirements,
                      maxAttachments: parseInt(e.target.value) || 10,
                    })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">Allowed File Types</label>
                <div className="flex flex-wrap gap-2">
                  {fileTypes.map((type) => (
                    <label
                      key={type}
                      className="flex items-center gap-2 px-3 py-2 border border-gray-200 rounded-md cursor-pointer hover:bg-gray-50"
                    >
                      <input
                        type="checkbox"
                        checked={requirements.allowedFileTypes?.includes(type)}
                        onChange={(e) => {
                          const updated = e.target.checked
                            ? [...(requirements.allowedFileTypes || []), type]
                            : requirements.allowedFileTypes?.filter((t) => t !== type) || [];
                          setRequirements({ ...requirements, allowedFileTypes: updated });
                        }}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <span className="text-sm font-medium text-gray-700">{type}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Custom Fields */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">
                Custom Fields ({requirements.customFields?.length || 0})
              </h3>
            </div>

            {requirements.customFields && requirements.customFields.length > 0 ? (
              <div className="space-y-3">
                {requirements.customFields.map((field, index) => (
                  <div
                    key={field.id}
                    className="flex items-start gap-3 p-4 border border-gray-200 rounded-lg hover:bg-gray-50"
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-sm font-medium text-gray-900">
                          {index + 1}. {field.label}
                        </span>
                        {field.required && (
                          <span className="px-2 py-0.5 text-xs font-medium bg-red-100 text-red-700 rounded">
                            Required
                          </span>
                        )}
                        <span className="px-2 py-0.5 text-xs font-medium bg-blue-100 text-blue-700 rounded">
                          {field.type}
                        </span>
                      </div>
                      {field.description && <p className="text-sm text-gray-600">{field.description}</p>}
                      {field.type === "select" && field.options && (
                        <p className="text-xs text-gray-500 mt-1">Options: {field.options.join(", ")}</p>
                      )}
                      {field.validation && (
                        <div className="text-xs text-gray-500 mt-1">
                          {field.validation.min !== undefined && `Min: ${field.validation.min} `}
                          {field.validation.max !== undefined && `Max: ${field.validation.max} `}
                          {field.validation.minLength !== undefined &&
                            `Min Length: ${field.validation.minLength} `}
                          {field.validation.maxLength !== undefined &&
                            `Max Length: ${field.validation.maxLength}`}
                        </div>
                      )}
                    </div>

                    <button
                      onClick={() => handleRemoveCustomField(field.id)}
                      className="p-1.5 hover:bg-red-100 rounded transition-colors"
                      title="Remove field"
                    >
                      <Trash2 className="h-4 w-4 text-red-600" />
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-500 text-center py-8 border border-dashed border-gray-300 rounded-lg">
                No custom fields defined. Click the button below to add fields.
              </p>
            )}

            <CustomFieldBuilder onAddField={handleAddCustomField} />
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 p-6 border-t bg-gray-50">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSave}>
            <Save className="h-4 w-4 mr-2" />
            Save Requirements
          </Button>
        </div>
      </div>
    </div>
  );
}
