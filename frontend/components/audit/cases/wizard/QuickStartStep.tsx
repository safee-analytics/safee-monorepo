"use client";

import { useEffect, useState } from "react";
import type { WizardStepProps } from "../CreateCaseWizard";
import { Building2, Calendar, Flag, Sparkles } from "lucide-react";
import { ClientAutocomplete } from "../ClientAutocomplete";
import { useAutofill, type AutofillClientHistory } from "@/lib/hooks/useAutofill";

const AUDIT_TYPES = [
  { value: "financial_audit", label: "Financial Audit", icon: "💰" },
  { value: "compliance_audit", label: "Compliance Audit", icon: "✅" },
  { value: "icv_audit", label: "ICV Audit", icon: "🇦🇪" },
  { value: "operational_audit", label: "Operational Audit", icon: "⚙️" },
  { value: "it_audit", label: "IT Audit", icon: "💻" },
  { value: "general_audit", label: "General Audit", icon: "📋" },
];

const PRIORITIES = [
  {
    value: "low",
    label: "Low",
    description: "Routine audit with flexible timeline",
    color: "bg-gray-100 text-gray-700 border-gray-300",
  },
  {
    value: "medium",
    label: "Medium",
    description: "Standard priority audit",
    color: "bg-blue-100 text-blue-700 border-blue-300",
  },
  {
    value: "high",
    label: "High",
    description: "Important audit requiring attention",
    color: "bg-orange-100 text-orange-700 border-orange-300",
  },
  {
    value: "critical",
    label: "Critical",
    description: "Urgent audit - immediate action required",
    color: "bg-red-100 text-red-700 border-red-300",
  },
];

export function QuickStartStep({ data, onChange }: WizardStepProps) {
  const [showAutofillSuggestion, setShowAutofillSuggestion] = useState(false);
  const { suggestAuditType: _suggestAuditType, suggestDueDate, suggestPriority: _suggestPriority } = useAutofill();

  // Pre-fill from template if selected
  useEffect(() => {
    if (data.selectedTemplate && !data.clientName) {
      // Template is selected but fields not yet filled
      // Fields were already set in TemplateSelector, just ensure they're present
    }
  }, [data.selectedTemplate, data.clientName]);

  // Handle client selection with autofill
  const handleClientSelect = (clientHistory: AutofillClientHistory) => {
    if (!clientHistory || clientHistory.totalCases === 0) return;

    setShowAutofillSuggestion(true);

    // Auto-apply suggestions if no template is selected
    if (!data.selectedTemplate) {
      const updates: Partial<WizardStepProps['data']> = {};

      // Suggest audit type based on history
      if (!data.auditType && clientHistory.mostCommonAuditType) {
        updates.auditType = clientHistory.mostCommonAuditType;
      }

      // Suggest priority based on history
      if (clientHistory.commonPriority) {
        updates.priority = clientHistory.commonPriority;
      }

      // Suggest due date based on audit type
      if (updates.auditType) {
        const suggestedDate = suggestDueDate(updates.auditType);
        updates.dueDate = suggestedDate.toISOString().split("T")[0];
      }

      if (Object.keys(updates).length > 0) {
        onChange(updates);
      }
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Essential Information</h3>
        <p className="text-sm text-gray-600">
          {data.selectedTemplate
            ? `Creating ${data.selectedTemplate.name} - Fill in the basic details`
            : "Fill in the basic details to create your case"}
        </p>
      </div>

      {/* Client Name with Autocomplete */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          <div className="flex items-center space-x-2">
            <Building2 className="h-4 w-4" />
            <span>Client Name *</span>
            {showAutofillSuggestion && (
              <span className="flex items-center space-x-1 text-xs text-blue-600 bg-blue-50 px-2 py-1 rounded-full">
                <Sparkles className="h-3 w-3" />
                <span>Auto-filled from history</span>
              </span>
            )}
          </div>
        </label>
        <ClientAutocomplete
          value={data.clientName || ""}
          onChange={(value) => onChange({ clientName: value })}
          onClientSelect={handleClientSelect}
          placeholder="Enter client or company name"
        />
        <p className="mt-1 text-xs text-gray-500">
          Start typing to see recent clients and auto-fill suggestions
        </p>
      </div>

      {/* Audit Type */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Audit Type *</label>
        <div className="grid grid-cols-2 gap-3">
          {AUDIT_TYPES.map((type) => {
            const isSelected = data.auditType === type.value;
            const isFromTemplate = data.selectedTemplate?.auditType === type.value;

            return (
              <button
                key={type.value}
                onClick={() => onChange({ auditType: type.value })}
                disabled={isFromTemplate}
                className={`p-4 rounded-lg border-2 text-left transition-all ${
                  isSelected
                    ? "bg-blue-50 border-blue-500 ring-2 ring-blue-200"
                    : "bg-white border-gray-200 hover:bg-gray-50"
                } ${isFromTemplate ? "opacity-50 cursor-not-allowed" : ""}`}
              >
                <div className="flex items-center space-x-3">
                  <span className="text-2xl">{type.icon}</span>
                  <div className="flex-1">
                    <p className="font-medium text-gray-900">{type.label}</p>
                    {isFromTemplate && <p className="text-xs text-gray-500 mt-1">Set by template</p>}
                  </div>
                  {isSelected && (
                    <div className="w-5 h-5 bg-blue-600 rounded-full flex items-center justify-center">
                      <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 12 12">
                        <path
                          d="M10 3L4.5 8.5L2 6"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          fill="none"
                        />
                      </svg>
                    </div>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Priority */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          <div className="flex items-center space-x-2">
            <Flag className="h-4 w-4" />
            <span>Priority *</span>
          </div>
        </label>
        <div className="grid grid-cols-2 gap-3">
          {PRIORITIES.map((priority) => {
            const isSelected = data.priority === priority.value;
            const isFromTemplate = data.selectedTemplate?.priority === priority.value;

            return (
              <button
                key={priority.value}
                onClick={() => onChange({ priority: priority.value })}
                className={`p-4 rounded-lg border-2 text-left transition-all ${
                  isSelected
                    ? `${priority.color} ring-2 ring-offset-2`
                    : "bg-white border-gray-200 hover:bg-gray-50"
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <p className="font-medium">{priority.label}</p>
                  {isSelected && (
                    <div className="w-5 h-5 bg-current rounded-full flex items-center justify-center opacity-70">
                      <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 12 12">
                        <path
                          d="M10 3L4.5 8.5L2 6"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          fill="none"
                        />
                      </svg>
                    </div>
                  )}
                </div>
                <p className="text-xs opacity-70">{priority.description}</p>
                {isFromTemplate && <p className="text-xs mt-1 font-medium">Suggested by template</p>}
              </button>
            );
          })}
        </div>
      </div>

      {/* Due Date */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          <div className="flex items-center space-x-2">
            <Calendar className="h-4 w-4" />
            <span>Due Date</span>
          </div>
        </label>
        <input
          type="date"
          value={data.dueDate || ""}
          onChange={(e) => onChange({ dueDate: e.target.value })}
          min={new Date().toISOString().split("T")[0]}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
        {data.selectedTemplate && data.dueDate && (
          <p className="mt-1 text-xs text-blue-600">
            Suggested based on template&apos;s estimated duration ({data.selectedTemplate.estimatedDuration} days)
          </p>
        )}
        {!data.dueDate && (
          <p className="mt-1 text-xs text-gray-500">Optional - You can set this later if needed</p>
        )}
      </div>

      {/* Summary Box */}
      {data.clientName && data.auditType && (
        <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-lg">
          <h4 className="text-sm font-semibold text-green-900 mb-2">Ready to Continue</h4>
          <p className="text-sm text-green-700">
            Creating {data.auditType.replace(/_/g, " ")} for <strong>{data.clientName}</strong>
            {data.dueDate && ` - Due ${new Date(data.dueDate).toLocaleDateString()}`}
          </p>
        </div>
      )}
    </div>
  );
}
