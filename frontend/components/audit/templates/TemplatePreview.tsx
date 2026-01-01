"use client";

import { FileText, ChevronRight } from "lucide-react";
import { getTemplateTypeLabel, getCategoryLabel, countTemplateProcedures } from "@/lib/api/hooks/templates";
import type { TemplateType, CaseCategory, TemplateStructure } from "@/lib/api/hooks/templates";

interface TemplatePreviewProps {
  data: {
    name: string;
    description?: string;
    templateType: TemplateType;
    category?: CaseCategory;
    version: string;
    isActive: boolean;
    structure: TemplateStructure;
  };
}

export function TemplatePreview({ data }: TemplatePreviewProps) {
  const procedureCount = countTemplateProcedures(data.structure);

  return (
    <div className="space-y-4">
      <div className="sticky top-0 bg-gray-50 pb-4">
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Template Preview</h3>
        <div className="bg-white rounded-lg border border-gray-200 p-4 space-y-2">
          <h4 className="font-semibold text-gray-900">{data.name || "Untitled Template"}</h4>
          {data.description && <p className="text-sm text-gray-600">{data.description}</p>}
          <div className="flex flex-wrap gap-2 text-xs">
            <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded">
              {getTemplateTypeLabel(data.templateType)}
            </span>
            {data.category && (
              <span className="px-2 py-1 bg-purple-100 text-purple-700 rounded">
                {getCategoryLabel(data.category)}
              </span>
            )}
            <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded">
              v{data.version}
            </span>
            {data.isActive && (
              <span className="px-2 py-1 bg-green-100 text-green-700 rounded">Active</span>
            )}
          </div>
          <div className="flex gap-4 text-sm text-gray-600 pt-2 border-t">
            <span>{data.structure.sections.length} sections</span>
            <span>{procedureCount} procedures</span>
          </div>
        </div>
      </div>

      <div className="space-y-3">
        {data.structure.sections.map((section, sectionIndex) => (
          <div
            key={sectionIndex}
            className="bg-white rounded-lg border border-gray-200 overflow-hidden"
          >
            <div className="bg-gray-50 px-4 py-2 border-b border-gray-200">
              <h5 className="font-medium text-gray-900">
                {sectionIndex + 1}. {section.name}
              </h5>
              {section.description && (
                <p className="text-sm text-gray-600 mt-1">{section.description}</p>
              )}
              <p className="text-xs text-gray-500 mt-1">
                {section.procedures.length} procedure{section.procedures.length !== 1 ? "s" : ""}
              </p>
            </div>

            <div className="divide-y divide-gray-100">
              {section.procedures.map((procedure, procIndex) => (
                <div key={procIndex} className="px-4 py-3 hover:bg-gray-50">
                  <div className="flex items-start gap-2">
                    <FileText className="h-4 w-4 text-gray-400 mt-0.5 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-mono text-gray-500">
                          {procedure.referenceNumber}
                        </span>
                        <ChevronRight className="h-3 w-3 text-gray-300" />
                        <span className="text-sm font-medium text-gray-900 truncate">
                          {procedure.title}
                        </span>
                      </div>
                      {procedure.description && (
                        <p className="text-xs text-gray-600 mt-1">{procedure.description}</p>
                      )}
                      {procedure.requirements && Object.keys(procedure.requirements).length > 0 && (
                        <div className="flex gap-1 mt-1">
                          <span className="text-xs px-1.5 py-0.5 bg-blue-50 text-blue-700 rounded">
                            {Object.keys(procedure.requirements).length} custom field
                            {Object.keys(procedure.requirements).length !== 1 ? "s" : ""}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {data.structure.sections.length === 0 && (
        <div className="text-center py-8 text-gray-500 text-sm">
          No sections added yet. Add sections to build your template.
        </div>
      )}
    </div>
  );
}
