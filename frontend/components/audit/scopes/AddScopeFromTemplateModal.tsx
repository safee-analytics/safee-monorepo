"use client";

import { useState } from "react";
import { Button } from "@safee/ui";
import { X, Search, CheckCircle } from "lucide-react";
import { useTemplates, getTemplateSummary } from "@/lib/api/hooks/templates";
import { useCreateScopeFromTemplate } from "@/lib/api/hooks";
import { useToast } from "@safee/ui";
import { logError } from "@/lib/utils/logger";
import type { TemplateResponse } from "@/lib/api/hooks/templates";

interface AddScopeFromTemplateModalProps {
  caseId: string;
  onClose: () => void;
  onSuccess: (scopeId: string) => void;
}

export function AddScopeFromTemplateModal({
  caseId,
  onClose,
  onSuccess,
}: AddScopeFromTemplateModalProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTemplate, setSelectedTemplate] = useState<TemplateResponse | null>(null);
  const [isCreating, setIsCreating] = useState(false);

  const toast = useToast();
  const { data: templates, isLoading } = useTemplates({ templateType: "scope" });
  const createScope = useCreateScopeFromTemplate();

  // Filter templates by search
  const filteredTemplates =
    templates?.filter((t) => t.name.toLowerCase().includes(searchQuery.toLowerCase())) || [];

  const handleCreate = async () => {
    if (!selectedTemplate) {
      toast.error("Please select a template");
      return;
    }

    setIsCreating(true);
    try {
      const result = await createScope.mutateAsync({
        caseId,
        templateData: { templateId: selectedTemplate.id },
      });

      toast.success(`Scope "${selectedTemplate.name}" created successfully`);
      onSuccess(result?.id || "");
    } catch (error) {
      logError("Failed to create scope from template", error, {
        caseId,
        templateId: selectedTemplate.id,
        templateName: selectedTemplate.name,
      });
      toast.error("Failed to create scope from template");
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-3xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <div>
            <h2 className="text-xl font-bold text-gray-900">Add Scope from Template</h2>
            <p className="text-sm text-gray-500 mt-1">
              Select a template to create a new scope for this case
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="h-5 w-5 text-gray-500" />
          </button>
        </div>

        {/* Search */}
        <div className="p-6 border-b">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search templates..."
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        {/* Templates List */}
        <div className="flex-1 overflow-y-auto p-6">
          {isLoading ? (
            <div className="flex items-center justify-center h-48">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
            </div>
          ) : filteredTemplates.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-3xl">📋</span>
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">No Templates Found</h3>
              <p className="text-sm text-gray-600">
                {searchQuery
                  ? "Try adjusting your search"
                  : "No scope templates are available"}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredTemplates.map((template) => {
                const summary = getTemplateSummary(template);
                const isSelected = selectedTemplate?.id === template.id;

                return (
                  <button
                    key={template.id}
                    onClick={() => setSelectedTemplate(template)}
                    className={`text-left p-4 rounded-lg border-2 transition-all ${
                      isSelected
                        ? "border-blue-500 bg-blue-50"
                        : "border-gray-200 hover:border-gray-300 hover:bg-gray-50"
                    }`}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                          <span className="text-xl">📋</span>
                        </div>
                        <div>
                          <h4 className="font-semibold text-gray-900">{template.name}</h4>
                          {template.version && (
                            <span className="text-xs text-gray-500">v{template.version}</span>
                          )}
                        </div>
                      </div>
                      {isSelected && (
                        <CheckCircle className="h-5 w-5 text-blue-600 flex-shrink-0" />
                      )}
                    </div>

                    {template.description && (
                      <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                        {template.description}
                      </p>
                    )}

                    <div className="flex items-center gap-3 text-xs text-gray-600">
                      <span>{summary.sectionCount} sections</span>
                      <span>•</span>
                      <span>{summary.procedureCount} procedures</span>
                    </div>

                    {template.isSystemTemplate && (
                      <div className="mt-2">
                        <span className="inline-block px-2 py-0.5 text-xs font-medium bg-purple-100 text-purple-700 rounded">
                          System Template
                        </span>
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-6 border-t bg-gray-50">
          <div className="text-sm text-gray-600">
            {selectedTemplate ? (
              <>
                Selected: <span className="font-medium text-gray-900">{selectedTemplate.name}</span>
              </>
            ) : (
              "No template selected"
            )}
          </div>
          <div className="flex items-center gap-3">
            <Button variant="outline" onClick={onClose} disabled={isCreating}>
              Cancel
            </Button>
            <Button onClick={() => void handleCreate()} disabled={!selectedTemplate || isCreating}>
              {isCreating ? "Creating..." : "Create Scope"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
