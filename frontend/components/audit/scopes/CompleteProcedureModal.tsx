"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@safee/ui";
import { X, Upload, Trash2 } from "lucide-react";
import { useToast } from "@safee/ui";
import { useCompleteProcedure } from "@/lib/api/hooks";
import { logError } from "@/lib/utils/logger";
import type { components } from "@/lib/api/types/audit";
import type { CustomField } from "../templates/ProcedureRequirementsEditor";
import { procedureRequirementsSchema } from "@/lib/validation";

type ProcedureResponse = components["schemas"]["ProcedureResponse"];

interface CompleteProcedureModalProps {
  caseId: string;
  scopeId: string;
  sectionId: string;
  procedure: ProcedureResponse;
  onClose: () => void;
  onSuccess: () => void;
}

// This is still needed for the buildValidationSchema function
interface ProcedureRequirements {
  customFields?: CustomField[];
  minAttachments?: number;
  maxAttachments?: number;
  requiresObservations?: boolean;
  allowedFileTypes?: string[];
}

// Build dynamic Zod schema from custom fields
function buildValidationSchema(requirements: ProcedureRequirements) {
  const fieldSchemas: Record<string, z.ZodTypeAny> = {};

  requirements.customFields?.forEach((field) => {
    let fieldSchema: z.ZodTypeAny;

    switch (field.type) {
      case "text":
      case "textarea":
        fieldSchema = z.string();
        if (field.validation?.minLength) {
          fieldSchema = (fieldSchema as z.ZodString).min(
            field.validation.minLength,
            `${field.label} must be at least ${field.validation.minLength} characters`,
          );
        }
        if (field.validation?.maxLength) {
          fieldSchema = (fieldSchema as z.ZodString).max(
            field.validation.maxLength,
            `${field.label} must be at most ${field.validation.maxLength} characters`,
          );
        }
        if (field.validation?.pattern) {
          fieldSchema = (fieldSchema as z.ZodString).regex(
            new RegExp(field.validation.pattern),
            `${field.label} format is invalid`,
          );
        }
        break;

      case "number":
        fieldSchema = z.coerce.number();
        if (field.validation?.min !== undefined) {
          fieldSchema = (fieldSchema as z.ZodNumber).min(
            field.validation.min,
            `${field.label} must be at least ${field.validation.min}`,
          );
        }
        if (field.validation?.max !== undefined) {
          fieldSchema = (fieldSchema as z.ZodNumber).max(
            field.validation.max,
            `${field.label} must be at most ${field.validation.max}`,
          );
        }
        break;

      case "date":
        fieldSchema = z.string();
        break;

      case "select":
        fieldSchema = z.string();
        if (field.options && field.options.length > 0) {
          fieldSchema = z.enum(field.options as [string, ...string[]]);
        }
        break;

      case "checkbox":
        fieldSchema = z.boolean();
        break;

      case "file":
        fieldSchema = z.string().optional();
        break;

      default:
        fieldSchema = z.string();
    }

    // Apply required validation
    if (field.required) {
      if (field.type === "checkbox") {
        fieldSchema = (fieldSchema as z.ZodBoolean).refine((val) => val === true, {
          message: `${field.label} must be checked`,
        });
      } else if (field.type !== "file") {
        fieldSchema = z.preprocess(
          (val) => (val === "" ? undefined : val),
          (fieldSchema as z.ZodString | z.ZodNumber).min(1, `${field.label} is required`),
        );
      }
    } else {
      fieldSchema = fieldSchema.optional();
    }

    fieldSchemas[field.name] = fieldSchema;
  });

  return z.object({
    fieldData: z.object(fieldSchemas),
    memo: requirements.requiresObservations
      ? z.string().min(1, "Observations are required")
      : z.string().optional(),
  });
}

export function CompleteProcedureModal({
  caseId,
  scopeId,
  sectionId,
  procedure,
  onClose,
  onSuccess,
}: CompleteProcedureModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [attachments, setAttachments] = useState<File[]>([]);

  const toast = useToast();
  const completeProcedure = useCompleteProcedure();

  // Parse requirements from procedure using Zod
  const requirements = procedureRequirementsSchema.safeParse(procedure.requirements).success
    ? procedureRequirementsSchema.parse(procedure.requirements)
    : {};

  // Build validation schema
  const validationSchema = buildValidationSchema(requirements as ProcedureRequirements);
  type FormData = z.infer<typeof validationSchema>;

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(validationSchema),
    defaultValues: {
      fieldData: {},
      memo: "",
    },
  });

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files) return;

    const newFiles = Array.from(files);

    // Check max attachments
    if (requirements.maxAttachments) {
      const totalFiles = attachments.length + newFiles.length;
      if (totalFiles > requirements.maxAttachments) {
        toast.error(`Maximum ${requirements.maxAttachments} attachments allowed`);
        return;
      }
    }

    // Check file types
    if (requirements.allowedFileTypes && requirements.allowedFileTypes.length > 0) {
      const invalidFiles = newFiles.filter((file) => {
        const ext = file.name.split(".").pop()?.toLowerCase();
        return !requirements.allowedFileTypes?.includes(`.${ext}`);
      });

      if (invalidFiles.length > 0) {
        toast.error(`Only ${requirements.allowedFileTypes.join(", ")} files are allowed`);
        return;
      }
    }

    setAttachments([...attachments, ...newFiles]);
  };

  const handleRemoveAttachment = (index: number) => {
    setAttachments(attachments.filter((_, i) => i !== index));
  };

  const onSubmit = async (data: FormData) => {
    // Validate attachments
    if (requirements.minAttachments && attachments.length < requirements.minAttachments) {
      toast.error(`At least ${requirements.minAttachments} attachment(s) required`);
      return;
    }

    setIsSubmitting(true);

    try {
      // TODO: [Backend] - Implement attachment upload API
      //   Details: The backend needs an API endpoint to handle file uploads for attachments. Once implemented, update this hook to first upload attachments before completing the procedure.
      //   Priority: High

      await completeProcedure.mutateAsync({
        caseId,
        scopeId,
        sectionId,
        procedureId: procedure.id,
        completion: {
          fieldData: data.fieldData,
          memo: data.memo || null,
        },
      });

      toast.success(`Procedure "${procedure.title}" completed successfully`);
      onSuccess();
      onClose();
    } catch (error) {
      logError("Failed to complete procedure", error, {
        caseId,
        scopeId,
        sectionId,
        procedureId: procedure.id,
        procedureTitle: procedure.title,
      });
      toast.error(error instanceof Error ? error.message : "Failed to complete procedure");
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + " " + sizes[i];
  };

  const renderField = (field: CustomField) => {
    const error = errors.fieldData?.[field.name];

    switch (field.type) {
      case "text":
        return (
          <div key={field.name}>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {field.label} {field.required && <span className="text-red-600">*</span>}
            </label>
            <input
              type="text"
              {...register(`fieldData.${field.name}`)}
              placeholder={field.placeholder}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            {field.helpText && <p className="text-xs text-gray-500 mt-1">{field.helpText}</p>}
            {error && <p className="text-sm text-red-600 mt-1">{String(error.message)}</p>}
          </div>
        );

      case "textarea":
        return (
          <div key={field.name}>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {field.label} {field.required && <span className="text-red-600">*</span>}
            </label>
            <textarea
              {...register(`fieldData.${field.name}`)}
              placeholder={field.placeholder}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            {field.helpText && <p className="text-xs text-gray-500 mt-1">{field.helpText}</p>}
            {error && <p className="text-sm text-red-600 mt-1">{String(error.message)}</p>}
          </div>
        );

      case "number":
        return (
          <div key={field.name}>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {field.label} {field.required && <span className="text-red-600">*</span>}
            </label>
            <input
              type="number"
              {...register(`fieldData.${field.name}`)}
              placeholder={field.placeholder}
              min={field.validation?.min}
              max={field.validation?.max}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            {field.helpText && <p className="text-xs text-gray-500 mt-1">{field.helpText}</p>}
            {error && <p className="text-sm text-red-600 mt-1">{String(error.message)}</p>}
          </div>
        );

      case "date":
        return (
          <div key={field.name}>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {field.label} {field.required && <span className="text-red-600">*</span>}
            </label>
            <input
              type="date"
              {...register(`fieldData.${field.name}`)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            {field.helpText && <p className="text-xs text-gray-500 mt-1">{field.helpText}</p>}
            {error && <p className="text-sm text-red-600 mt-1">{String(error.message)}</p>}
          </div>
        );

      case "select":
        return (
          <div key={field.name}>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {field.label} {field.required && <span className="text-red-600">*</span>}
            </label>
            <select
              {...register(`fieldData.${field.name}`)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Select {field.label}...</option>
              {field.options?.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
            {field.helpText && <p className="text-xs text-gray-500 mt-1">{field.helpText}</p>}
            {error && <p className="text-sm text-red-600 mt-1">{String(error.message)}</p>}
          </div>
        );

      case "checkbox":
        return (
          <div key={field.name} className="flex items-start">
            <input
              type="checkbox"
              {...register(`fieldData.${field.name}`)}
              className="mt-1 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <div className="ml-3">
              <label className="text-sm font-medium text-gray-700">
                {field.label} {field.required && <span className="text-red-600">*</span>}
              </label>
              {field.helpText && <p className="text-xs text-gray-500 mt-1">{field.helpText}</p>}
              {error && <p className="text-sm text-red-600 mt-1">{String(error.message)}</p>}
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-start justify-between p-6 border-b">
          <div>
            <h2 className="text-xl font-bold text-gray-900">Complete Procedure</h2>
            <p className="text-sm text-gray-600 mt-1">
              {procedure.referenceNumber}: {procedure.title}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            disabled={isSubmitting}
          >
            <X className="h-5 w-5 text-gray-500" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={(e) => void handleSubmit(onSubmit)(e)} className="flex-1 overflow-y-auto">
          <div className="p-6 space-y-6">
            {/* Description */}
            {procedure.description && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p className="text-sm text-blue-900">{procedure.description}</p>
              </div>
            )}

            {/* Custom Fields */}
            {requirements.customFields && (requirements.customFields as CustomField[]).length > 0 && (
              <div className="space-y-4">
                <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wider">
                  Required Information
                </h3>
                {(requirements.customFields as CustomField[]).map((field) => renderField(field))}
              </div>
            )}

            {/* Observations */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Observations / Notes
                {requirements.requiresObservations && <span className="text-red-600"> *</span>}
              </label>
              <textarea
                {...register("memo")}
                rows={4}
                placeholder="Enter your observations, findings, or additional notes..."
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              {errors.memo && <p className="text-sm text-red-600 mt-1">{errors.memo.message}</p>}
            </div>

            {/* Attachments */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Attachments
                {requirements.minAttachments && requirements.minAttachments > 0 && (
                  <span className="text-red-600"> *</span>
                )}
                {requirements.maxAttachments && (
                  <span className="text-xs text-gray-500 ml-2">(Max {requirements.maxAttachments})</span>
                )}
              </label>

              {/* File List */}
              {attachments.length > 0 && (
                <div className="space-y-2 mb-3">
                  {attachments.map((file, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200"
                    >
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        <div className="w-8 h-8 bg-blue-100 rounded flex items-center justify-center flex-shrink-0">
                          <span className="text-xs font-medium text-blue-700">
                            {file.name.split(".").pop()?.toUpperCase()}
                          </span>
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-medium text-gray-900 truncate">{file.name}</p>
                          <p className="text-xs text-gray-500">{formatFileSize(file.size)}</p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleRemoveAttachment(index)}
                        className="p-1.5 hover:bg-red-100 rounded transition-colors"
                        title="Remove attachment"
                      >
                        <Trash2 className="h-4 w-4 text-red-600" />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {/* Upload Button */}
              <label className="block">
                <input
                  type="file"
                  multiple
                  onChange={handleFileChange}
                  className="hidden"
                  accept={requirements.allowedFileTypes?.join(",")}
                />
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-blue-500 hover:bg-blue-50 transition-colors cursor-pointer">
                  <Upload className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                  <p className="text-sm text-gray-600">Click to upload or drag and drop files here</p>
                  {requirements.allowedFileTypes && requirements.allowedFileTypes.length > 0 && (
                    <p className="text-xs text-gray-500 mt-1">
                      Allowed types: {requirements.allowedFileTypes.join(", ")}
                    </p>
                  )}
                </div>
              </label>

              {requirements.minAttachments && requirements.minAttachments > 0 && (
                <p className="text-xs text-gray-600 mt-2">
                  At least {requirements.minAttachments} attachment(s) required
                </p>
              )}
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-end gap-3 p-6 border-t bg-gray-50">
            <Button variant="outline" onClick={onClose} disabled={isSubmitting} type="button">
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Completing..." : "Complete Procedure"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
