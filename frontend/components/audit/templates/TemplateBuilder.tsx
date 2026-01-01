"use client";

import { useState, useEffect } from "react";
import { useForm, useFieldArray, FormProvider } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@safee/ui";
import { Save, Plus, Eye, EyeOff, Download, Upload } from "lucide-react";
import { useToast } from "@safee/ui";
import {
  useCreateTemplate,
  useUpdateTemplate,
  useTemplate,
  type CreateTemplateRequest,
  type TemplateType,
  type CaseCategory,
  type TemplateStructure,
  getTemplateTypeLabel,
  getCategoryLabel,
  validateTemplateStructure,
} from "@/lib/api/hooks/templates";
import { SectionCard } from "./SectionCard";
import { TemplatePreview } from "./TemplatePreview";

// ============================================================================
// Zod Schema matching backend validation
// ============================================================================

const procedureSchema = z.object({
  referenceNumber: z.string().min(1, "Reference number is required"),
  title: z.string().min(1, "Title is required"),
  description: z.string().optional(),
  sortOrder: z.number(),
  requirements: z.record(z.string(), z.unknown()).optional(),
});

const sectionSchema = z.object({
  name: z.string().min(1, "Section name is required"),
  description: z.string().optional(),
  sortOrder: z.number(),
  settings: z.record(z.string(), z.unknown()).optional(),
  procedures: z.array(procedureSchema).min(1, "At least one procedure is required"),
});

const templateFormSchema = z.object({
  name: z.string().min(1, "Template name is required"),
  description: z.string().optional(),
  templateType: z.enum(["scope", "form", "checklist", "report", "plan"]),
  category: z.enum(["certification", "financial", "operational", "compliance"]).optional(),
  version: z.string().default("1.0.0"),
  isActive: z.boolean().default(false),
  isSystemTemplate: z.boolean().default(false),
  structure: z.object({
    sections: z.array(sectionSchema).min(1, "At least one section is required"),
    settings: z.record(z.string(), z.unknown()).optional(),
  }),
});

type TemplateFormData = z.infer<typeof templateFormSchema>;

// ============================================================================
// Component Props
// ============================================================================

interface TemplateBuilderProps {
  /**
   * Template ID for editing existing template
   * If not provided, will create a new template
   */
  templateId?: string;

  /**
   * Callback when template is saved successfully
   */
  onSave?: (templateId: string) => void;

  /**
   * Callback when cancel is clicked
   */
  onCancel?: () => void;

  /**
   * Initial data for creating a new template
   */
  initialData?: Partial<TemplateFormData>;
}

// ============================================================================
// Main Component
// ============================================================================

export function TemplateBuilder({
  templateId,
  onSave,
  onCancel,
  initialData,
}: TemplateBuilderProps) {
  const [showPreview, setShowPreview] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const toast = useToast();
  const createTemplate = useCreateTemplate();
  const updateTemplate = useUpdateTemplate();
  const { data: existingTemplate, isLoading } = useTemplate(templateId || "");

  const isEditMode = !!templateId;

  // Initialize form with default values
  const methods = useForm<TemplateFormData>({
    resolver: zodResolver(templateFormSchema),
    defaultValues: initialData || {
      name: "",
      description: "",
      templateType: "scope",
      category: "certification",
      version: "1.0.0",
      isActive: false,
      isSystemTemplate: false,
      structure: {
        sections: [
          {
            name: "Section 1",
            description: "",
            sortOrder: 0,
            procedures: [
              {
                referenceNumber: "1.1",
                title: "Procedure 1",
                description: "",
                sortOrder: 0,
              },
            ],
          },
        ],
      },
    },
  });

  const {
    control,
    handleSubmit,
    formState: { errors, isDirty },
    reset,
    watch,
  } = methods;

  // Watch form data for preview
  const formData = watch();

  // Load existing template data
  useEffect(() => {
    if (existingTemplate && isEditMode) {
      reset({
        name: existingTemplate.name,
        description: existingTemplate.description || "",
        templateType: existingTemplate.templateType,
        category: existingTemplate.category || undefined,
        version: existingTemplate.version,
        isActive: existingTemplate.isActive,
        isSystemTemplate: existingTemplate.isSystemTemplate,
        structure: existingTemplate.structure,
      });
    }
  }, [existingTemplate, isEditMode, reset]);

  // Field array for sections
  const { fields: sections, append, remove, move } = useFieldArray({
    control,
    name: "structure.sections",
  });

  // ============================================================================
  // Handlers
  // ============================================================================

  const handleAddSection = () => {
    const nextSortOrder = sections.length;
    append({
      name: `Section ${sections.length + 1}`,
      description: "",
      sortOrder: nextSortOrder,
      procedures: [
        {
          referenceNumber: `${sections.length + 1}.1`,
          title: "Procedure 1",
          description: "",
          sortOrder: 0,
        },
      ],
    });
  };

  const handleRemoveSection = (index: number) => {
    if (sections.length === 1) {
      toast.error("Template must have at least one section");
      return;
    }
    remove(index);
  };

  const handleMoveSection = (from: number, to: number) => {
    move(from, to);
    // Update sort orders
    // TODO: Update sort orders after move
  };

  const onSubmit = async (data: TemplateFormData) => {
    setIsSaving(true);

    try {
      // Validate structure
      const validation = validateTemplateStructure(data.structure);
      if (!validation.valid) {
        toast.error(validation.errors[0]);
        setIsSaving(false);
        return;
      }

      // Create or update template
      if (isEditMode && templateId) {
        const result = await updateTemplate.mutateAsync({
          templateId,
          updates: data,
        });
        toast.success(`Template "${data.name}" has been updated successfully`);
        onSave?.(templateId);
      } else {
        const result = await createTemplate.mutateAsync(data as CreateTemplateRequest);
        toast.success(`Template "${data.name}" has been created successfully`);
        onSave?.(result?.id || "");
        reset(); // Clear form after successful creation
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to save template");
    } finally {
      setIsSaving(false);
    }
  };

  const handleExportJson = () => {
    const dataStr = JSON.stringify(formData, null, 2);
    const dataUri = `data:application/json;charset=utf-8,${encodeURIComponent(dataStr)}`;
    const exportFileDefaultName = `${formData.name.replace(/\s+/g, "_")}_template.json`;

    const linkElement = document.createElement("a");
    linkElement.setAttribute("href", dataUri);
    linkElement.setAttribute("download", exportFileDefaultName);
    linkElement.click();

    toast.success("Template has been exported as JSON");
  };

  const handleImportJson = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const json = JSON.parse(e.target?.result as string);
        reset(json);
        toast.success("Template has been imported successfully");
      } catch (error) {
        toast.error("Invalid JSON file");
      }
    };
    reader.readAsText(file);
  };

  // ============================================================================
  // Render
  // ============================================================================

  if (isLoading && isEditMode) {
    return (
      <div className="flex items-center justify-center h-96">
        <p className="text-gray-500">Loading template...</p>
      </div>
    );
  }

  return (
    <FormProvider {...methods}>
      <div className="flex flex-col h-full">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">
              {isEditMode ? "Edit Template" : "Create Template"}
            </h2>
            <p className="text-sm text-gray-500 mt-1">
              Design a reusable template with sections and procedures
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowPreview(!showPreview)}
            >
              {showPreview ? (
                <>
                  <EyeOff className="h-4 w-4 mr-2" />
                  Hide Preview
                </>
              ) : (
                <>
                  <Eye className="h-4 w-4 mr-2" />
                  Show Preview
                </>
              )}
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={handleExportJson}
            >
              <Download className="h-4 w-4 mr-2" />
              Export JSON
            </Button>

            <label>
              <input
                type="file"
                accept=".json"
                onChange={handleImportJson}
                className="hidden"
              />
              <Button
                variant="outline"
                size="sm"
                onClick={() => document.querySelector<HTMLInputElement>('input[type="file"]')?.click()}
                type="button"
              >
                <Upload className="h-4 w-4 mr-2" />
                Import JSON
              </Button>
            </label>

            {onCancel && (
              <Button
                variant="outline"
                onClick={onCancel}
                disabled={isSaving}
              >
                Cancel
              </Button>
            )}

            <Button
              onClick={handleSubmit(onSubmit)}
              disabled={isSaving || !isDirty}
            >
              <Save className="h-4 w-4 mr-2" />
              {isSaving ? "Saving..." : isEditMode ? "Update" : "Create"}
            </Button>
          </div>
        </div>

        {/* Main Content */}
        <div className={`flex-1 overflow-hidden ${showPreview ? "grid grid-cols-2 gap-6" : ""}`}>
          {/* Builder Panel */}
          <div className="h-full overflow-y-auto p-6">
            <form className="space-y-6">
              {/* Template Info */}
              <div className="bg-white rounded-lg border border-gray-200 p-6 space-y-4">
                <h3 className="text-lg font-semibold text-gray-900">Template Information</h3>

                <div className="grid grid-cols-2 gap-4">
                  <div className="col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Template Name *
                    </label>
                    <input
                      type="text"
                      {...methods.register("name")}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="e.g., ICV Audit Template"
                    />
                    {errors.name && (
                      <p className="text-sm text-red-600 mt-1">{errors.name.message}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Template Type *
                    </label>
                    <select
                      {...methods.register("templateType")}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="scope">Scope</option>
                      <option value="form">Form</option>
                      <option value="checklist">Checklist</option>
                      <option value="report">Report</option>
                      <option value="plan">Plan</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Category
                    </label>
                    <select
                      {...methods.register("category")}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">Select category...</option>
                      <option value="certification">Certification</option>
                      <option value="financial">Financial</option>
                      <option value="operational">Operational</option>
                      <option value="compliance">Compliance</option>
                    </select>
                  </div>

                  <div className="col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Description
                    </label>
                    <textarea
                      {...methods.register("description")}
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Describe the purpose and use case for this template"
                    />
                  </div>

                  <div className="flex items-center gap-4">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        {...methods.register("isActive")}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <span className="text-sm font-medium text-gray-700">Active</span>
                    </label>

                    {isEditMode && existingTemplate?.isSystemTemplate && (
                      <label className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          {...methods.register("isSystemTemplate")}
                          disabled
                          className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                        <span className="text-sm font-medium text-gray-500">
                          System Template (read-only)
                        </span>
                      </label>
                    )}
                  </div>
                </div>
              </div>

              {/* Sections */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-gray-900">
                    Template Structure ({sections.length} sections)
                  </h3>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleAddSection}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add Section
                  </Button>
                </div>

                {errors.structure?.sections && (
                  <p className="text-sm text-red-600">
                    {errors.structure.sections.message}
                  </p>
                )}

                <div className="space-y-3">
                  {sections.map((section, index) => (
                    <SectionCard
                      key={section.id}
                      sectionIndex={index}
                      onRemove={() => handleRemoveSection(index)}
                      onMoveUp={index > 0 ? () => handleMoveSection(index, index - 1) : undefined}
                      onMoveDown={
                        index < sections.length - 1
                          ? () => handleMoveSection(index, index + 1)
                          : undefined
                      }
                    />
                  ))}
                </div>
              </div>
            </form>
          </div>

          {/* Preview Panel */}
          {showPreview && (
            <div className="h-full overflow-y-auto p-6 bg-gray-50 border-l">
              <TemplatePreview data={formData} />
            </div>
          )}
        </div>
      </div>
    </FormProvider>
  );
}
