"use client";

import { useState } from "react";
import type { WizardStepProps } from "./types";
import { SAMPLE_TEMPLATES, getSuggestedDueDate } from "@/lib/data/caseTemplates";
import { FileText, Clock, CheckCircle } from "lucide-react";

export function TemplateSelector({ data, onChange }: WizardStepProps) {
  const [hoveredTemplate, setHoveredTemplate] = useState<string | null>(null);

  const handleTemplateSelect = (template: (typeof SAMPLE_TEMPLATES)[0]) => {
    const dueDate = getSuggestedDueDate(template);
    onChange({
      selectedTemplate: template,
      useTemplate: true,
      auditType: template.auditType,
      priority: template.priority,
      dueDate: dueDate.toISOString().split("T")[0],
      status: template.defaultFields.status,
    });
  };

  const handleStartBlank = () => {
    onChange({
      selectedTemplate: null,
      useTemplate: false,
    });
  };

  const getColorClasses = (color: string) => {
    const colors: Record<string, { bg: string; border: string; text: string; hover: string }> = {
      blue: {
        bg: "bg-blue-50",
        border: "border-blue-200",
        text: "text-blue-700",
        hover: "hover:bg-blue-100",
      },
      green: {
        bg: "bg-green-50",
        border: "border-green-200",
        text: "text-green-700",
        hover: "hover:bg-green-100",
      },
      purple: {
        bg: "bg-purple-50",
        border: "border-purple-200",
        text: "text-purple-700",
        hover: "hover:bg-purple-100",
      },
      gray: {
        bg: "bg-gray-50",
        border: "border-gray-200",
        text: "text-gray-700",
        hover: "hover:bg-gray-100",
      },
    };
    return colors[color] || colors.gray;
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Choose a template to get started</h3>
        <p className="text-sm text-gray-600">
          Select a pre-configured template for common audit types, or start with a blank case
        </p>
      </div>

      {/* Template Grid */}
      <div className="grid grid-cols-2 gap-4">
        {SAMPLE_TEMPLATES.map((template) => {
          const colors = getColorClasses(template.color);
          const isSelected = data.selectedTemplate?.name === template.name;

          return (
            <button
              key={template.name}
              onClick={() => {
                handleTemplateSelect(template);
              }}
              onMouseEnter={() => {
                setHoveredTemplate(template.name);
              }}
              onMouseLeave={() => {
                setHoveredTemplate(null);
              }}
              className={`relative p-6 rounded-xl border-2 text-left transition-all ${
                isSelected
                  ? `${colors.bg} ${colors.border} ring-2 ring-offset-2 ring-${template.color}-500`
                  : `bg-white border-gray-200 ${colors.hover}`
              }`}
            >
              {/* Selection Indicator */}
              {isSelected && (
                <div className="absolute top-3 right-3">
                  <CheckCircle className={`h-6 w-6 ${colors.text}`} />
                </div>
              )}

              {/* Template Icon & Name */}
              <div className="flex items-start space-x-3 mb-3">
                <div className={`text-4xl`}>{template.icon}</div>
                <div className="flex-1">
                  <h4 className="font-semibold text-gray-900 mb-1">{template.name}</h4>
                  <p className="text-xs text-gray-600 line-clamp-2">{template.description}</p>
                </div>
              </div>

              {/* Template Info */}
              <div className="space-y-2 mt-4">
                <div className="flex items-center space-x-2 text-sm text-gray-600">
                  <Clock className="h-4 w-4" />
                  <span>{template.estimatedDuration} days</span>
                </div>
                <div className="flex items-center space-x-2 text-sm text-gray-600">
                  <FileText className="h-4 w-4" />
                  <span>{template.documentCategories.length} document categories</span>
                </div>
              </div>

              {/* Expanded Preview on Hover */}
              {hoveredTemplate === template.name && (
                <div className="absolute left-0 top-full mt-2 w-full z-10 bg-white border-2 border-gray-200 rounded-lg shadow-lg p-4 max-h-64 overflow-y-auto">
                  <h5 className="font-semibold text-sm text-gray-900 mb-2">Template Includes:</h5>

                  <div className="mb-3">
                    <p className="text-xs font-medium text-gray-700 mb-1">Document Categories:</p>
                    <ul className="text-xs text-gray-600 space-y-1">
                      {template.documentCategories.slice(0, 5).map((category) => (
                        <li key={category}>• {category}</li>
                      ))}
                      {template.documentCategories.length > 5 && (
                        <li>• +{template.documentCategories.length - 5} more&hellip;</li>
                      )}
                    </ul>
                  </div>

                  {template.checklistItems && (
                    <div>
                      <p className="text-xs font-medium text-gray-700 mb-1">Checklist Items:</p>
                      <ul className="text-xs text-gray-600 space-y-1">
                        {template.checklistItems.slice(0, 5).map((item) => (
                          <li key={item}>• {item}</li>
                        ))}
                        {template.checklistItems.length > 5 && (
                          <li>• +{template.checklistItems.length - 5} more&hellip;</li>
                        )}
                      </ul>
                    </div>
                  )}
                </div>
              )}
            </button>
          );
        })}
      </div>

      {/* Start Blank Option */}
      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-gray-300" />
        </div>
        <div className="relative flex justify-center text-sm">
          <span className="px-4 bg-white text-gray-500">or</span>
        </div>
      </div>

      <button
        onClick={handleStartBlank}
        className={`w-full p-6 rounded-xl border-2 transition-all ${
          data.useTemplate === false
            ? "bg-blue-50 border-blue-300 ring-2 ring-offset-2 ring-blue-500"
            : "bg-white border-gray-200 hover:bg-gray-50"
        }`}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="text-3xl">📝</div>
            <div className="text-left">
              <h4 className="font-semibold text-gray-900 mb-1">Start with Blank Case</h4>
              <p className="text-sm text-gray-600">
                Create a custom case from scratch without using a template
              </p>
            </div>
          </div>
          {data.useTemplate === false && <CheckCircle className="h-6 w-6 text-blue-600" />}
        </div>
      </button>

      {/* Continue Button Helper */}
      {(data.selectedTemplate || data.useTemplate === false) && (
        <div className="pt-4 text-center">
          <p className="text-sm text-gray-600">Press &quot;Next&quot; to continue with your selection</p>
        </div>
      )}
    </div>
  );
}
