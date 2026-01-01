"use client";

import { useState, useEffect } from "react";
import { useForm, useFieldArray, FormProvider, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@safee/ui";
import {
  Save,
  Plus,
  Eye,
  EyeOff,
  Download,
  Upload,
  FileText,
  Tag,
  FolderTree,
  FileCheck2,
  Layers,
} from "lucide-react";
import { useToast } from "@safee/ui";
import { logError } from "@/lib/utils/logger";
import { motion } from "framer-motion";
import { FormSelect, type SelectOption } from "@/components/ui/FormSelect";
import {
  useCreateTemplate,
  useUpdateTemplate,
  useTemplate,
  type CreateTemplateRequest,
  validateTemplateStructure,
} from "@/lib/api/hooks/templates";
import { SectionCard } from "./SectionCard";
import { TemplatePreview } from "./TemplatePreview";

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

interface TemplateBuilderProps {
  templateId?: string;
  onSave?: (templateId: string) => void;
  onCancel?: () => void;
  initialData?: Partial<TemplateFormData>;
}

const TEMPLATE_TYPE_OPTIONS: SelectOption[] = [
  { value: "scope", label: "Scope" },
  { value: "form", label: "Form" },
  { value: "checklist", label: "Checklist" },
  { value: "report", label: "Report" },
  { value: "plan", label: "Plan" },
];

const CATEGORY_OPTIONS: SelectOption[] = [
  { value: "certification", label: "Certification" },
  { value: "financial", label: "Financial" },
  { value: "operational", label: "Operational" },
  { value: "compliance", label: "Compliance" },
];

export function TemplateBuilder({ templateId, onSave, onCancel, initialData }: TemplateBuilderProps) {
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

  const {
    fields: sections,
    append,
    remove,
    move,
  } = useFieldArray({
    control,
    name: "structure.sections",
  });

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
    // TODO: [Frontend] - Update sort orders after section move
    //   Details: After moving a section, the `sortOrder` property of all affected sections should be updated to reflect their new positions.
    //   Priority: Medium
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
        await updateTemplate.mutateAsync({
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
      logError("Failed to save template", error, {
        templateId,
        templateName: data.name,
        isEditMode,
      });
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
        logError("Failed to import template JSON", error, {
          fileName: file.name,
        });
        toast.error("Invalid JSON file");
      }
    };
    reader.readAsText(file);
  };

  if (isLoading && isEditMode) {
    return (
      <div className="flex items-center justify-center h-96">
        <p className="text-gray-500">Loading template...</p>
      </div>
    );
  }

  return (
    <FormProvider {...methods}>
      <div className="flex flex-col h-full bg-gray-50">
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between p-6 bg-white border-b shadow-sm"
        >
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
              <Layers className="h-6 w-6 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900">
                {isEditMode ? "Edit Template" : "Create Template"}
              </h2>
              <p className="text-sm text-gray-600 mt-0.5">
                Design a reusable template with sections and procedures
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowPreview(!showPreview)}
              className="px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              {showPreview ? (
                <>
                  <EyeOff className="h-4 w-4 mr-2 inline" />
                  Hide Preview
                </>
              ) : (
                <>
                  <Eye className="h-4 w-4 mr-2 inline" />
                  Show Preview
                </>
              )}
            </button>

            <button
              onClick={handleExportJson}
              className="px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <Download className="h-4 w-4 mr-2 inline" />
              Export JSON
            </button>

            <label>
              <input type="file" accept=".json" onChange={handleImportJson} className="hidden" />
              <button
                onClick={() => {
                  document.querySelector<HTMLInputElement>('input[type="file"]')?.click();
                }}
                type="button"
                className="px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <Upload className="h-4 w-4 mr-2 inline" />
                Import JSON
              </button>
            </label>

            {onCancel && (
              <button
                onClick={onCancel}
                disabled={isSaving}
                className="px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Cancel
              </button>
            )}

            <button
              onClick={() => void handleSubmit(onSubmit)()}
              disabled={isSaving || !isDirty}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Save className="h-4 w-4 mr-2 inline" />
              {isSaving ? "Saving..." : isEditMode ? "Update" : "Create"}
            </button>
          </div>
        </motion.div>

        <div className={`flex-1 overflow-hidden ${showPreview ? "grid grid-cols-2 gap-6" : ""}`}>
          <div className="h-full overflow-y-auto p-6">
            <form className="space-y-6">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden"
              >
                <div className="bg-gradient-to-r from-blue-50 to-purple-50 px-6 py-4 border-b border-gray-200">
                  <div className="flex items-center gap-2">
                    <FileText className="h-5 w-5 text-blue-600" />
                    <h3 className="text-lg font-semibold text-gray-900">Template Information</h3>
                  </div>
                  <p className="text-sm text-gray-600 mt-1">Basic details about your template</p>
                </div>

                <div className="p-6 space-y-5">
                  <div>
                    <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                      <FileText className="h-4 w-4 text-blue-600" />
                      Template Name
                      <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      {...methods.register("name")}
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                      placeholder="e.g., ICV Audit Template"
                    />
                    {errors.name && (
                      <p className="text-sm text-red-600 mt-1.5 flex items-center gap-1">
                        <span className="font-medium">⚠</span> {errors.name.message}
                      </p>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                        <FolderTree className="h-4 w-4 text-purple-600" />
                        Template Type
                        <span className="text-red-500">*</span>
                      </label>
                      <Controller
                        name="templateType"
                        control={control}
                        render={({ field }) => (
                          <FormSelect
                            value={field.value}
                            onChange={field.onChange}
                            options={TEMPLATE_TYPE_OPTIONS}
                            placeholder="Select template type..."
                            error={!!errors.templateType}
                          />
                        )}
                      />
                      {errors.templateType && (
                        <p className="text-sm text-red-600 mt-1.5 flex items-center gap-1">
                          <span className="font-medium">⚠</span> {errors.templateType.message}
                        </p>
                      )}
                    </div>

                    <div>
                      <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                        <Tag className="h-4 w-4 text-green-600" />
                        Category
                      </label>
                      <Controller
                        name="category"
                        control={control}
                        render={({ field }) => (
                          <FormSelect
                            value={field.value || ""}
                            onChange={field.onChange}
                            options={CATEGORY_OPTIONS}
                            placeholder="Select category..."
                            error={!!errors.category}
                          />
                        )}
                      />
                      {errors.category && (
                        <p className="text-sm text-red-600 mt-1.5 flex items-center gap-1">
                          <span className="font-medium">⚠</span> {errors.category.message}
                        </p>
                      )}
                    </div>
                  </div>

                  <div>
                    <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                      <FileText className="h-4 w-4 text-gray-600" />
                      Description
                    </label>
                    <textarea
                      {...methods.register("description")}
                      rows={3}
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all resize-none"
                      placeholder="Describe the purpose and use case for this template"
                    />
                  </div>

                  <div className="flex items-center gap-6 pt-2">
                    <label className="flex items-center gap-2.5 cursor-pointer group">
                      <div className="relative">
                        <input
                          type="checkbox"
                          {...methods.register("isActive")}
                          className="w-5 h-5 rounded border-2 border-gray-300 text-blue-600 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all"
                        />
                      </div>
                      <div className="flex items-center gap-1.5">
                        <FileCheck2 className="h-4 w-4 text-green-600" />
                        <span className="text-sm font-medium text-gray-700 group-hover:text-gray-900 transition-colors">
                          Active Template
                        </span>
                      </div>
                    </label>

                    {isEditMode && existingTemplate?.isSystemTemplate && (
                      <label className="flex items-center gap-2.5">
                        <input
                          type="checkbox"
                          {...methods.register("isSystemTemplate")}
                          disabled
                          className="w-5 h-5 rounded border-2 border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                        <span className="text-sm font-medium text-gray-500">System Template (read-only)</span>
                      </label>
                    )}
                  </div>
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="space-y-4"
              >
                <div className="flex items-center justify-between bg-white rounded-xl border border-gray-200 shadow-sm p-4">
                  <div className="flex items-center gap-2">
                    <Layers className="h-5 w-5 text-blue-600" />
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">Template Structure</h3>
                      <p className="text-sm text-gray-600">
                        {sections.length} {sections.length === 1 ? "section" : "sections"}
                      </p>
                    </div>
                  </div>
                  <Button type="button" variant="outline" size="sm" onClick={handleAddSection}>
                    <Plus className="h-4 w-4 mr-2" />
                    Add Section
                  </Button>
                </div>

                {errors.structure?.sections && (
                  <p className="text-sm text-red-600 flex items-center gap-1">
                    <span className="font-medium">⚠</span> {errors.structure.sections.message}
                  </p>
                )}

                <div className="space-y-3">
                  {sections.map((section, index) => (
                    <motion.div
                      key={section.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.05 }}
                    >
                      <SectionCard
                        sectionIndex={index}
                        onRemove={() => handleRemoveSection(index)}
                        onMoveUp={index > 0 ? () => handleMoveSection(index, index - 1) : undefined}
                        onMoveDown={
                          index < sections.length - 1 ? () => handleMoveSection(index, index + 1) : undefined
                        }
                      />
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            </form>
          </div>

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
