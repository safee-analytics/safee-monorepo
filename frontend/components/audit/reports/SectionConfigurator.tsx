"use client";

import { useState, useEffect } from "react";
import { GripVertical, Eye, EyeOff } from "lucide-react";
import type { ReportSection } from "@/lib/types/reports";

interface SectionConfiguratorProps {
  templateId: string;
  selectedSections: string[];
  onChange: (sections: string[]) => void;
}

const templateSections: Record<string, ReportSection[]> = {
  financial: [
    { id: "cover", title: "Cover Page", type: "cover_page", required: true },
    { id: "executive_summary", title: "Executive Summary", type: "text", required: true },
    { id: "financial_statements", title: "Financial Statements", type: "metrics_table", required: true },
    { id: "balance_sheet", title: "Balance Sheet Analysis", type: "metrics_table", required: false },
    { id: "income_statement", title: "Income Statement", type: "metrics_table", required: false },
    { id: "cash_flow", title: "Cash Flow Analysis", type: "chart", required: false },
    { id: "findings", title: "Audit Findings", type: "findings_list", required: true },
    { id: "recommendations", title: "Recommendations", type: "text", required: true },
    { id: "appendix", title: "Appendix", type: "appendix", required: false },
  ],
  compliance: [
    { id: "cover", title: "Cover Page", type: "cover_page", required: true },
    { id: "executive_summary", title: "Executive Summary", type: "text", required: true },
    { id: "compliance_score", title: "Compliance Score", type: "metrics_table", required: true },
    { id: "frameworks", title: "Framework Analysis", type: "text", required: true },
    { id: "violations", title: "Violations & Non-Compliance", type: "findings_list", required: true },
    { id: "action_plan", title: "Action Plan", type: "text", required: true },
    { id: "appendix", title: "Appendix", type: "appendix", required: false },
  ],
  icv: [
    { id: "cover", title: "Cover Page", type: "cover_page", required: true },
    { id: "executive_summary", title: "Executive Summary", type: "text", required: true },
    { id: "icv_calculation", title: "ICV Calculation", type: "metrics_table", required: true },
    { id: "local_spend", title: "Local Spend Breakdown", type: "chart", required: true },
    { id: "certification", title: "Certification Details", type: "text", required: true },
    { id: "appendix", title: "Appendix", type: "appendix", required: false },
  ],
  risk: [
    { id: "cover", title: "Cover Page", type: "cover_page", required: true },
    { id: "executive_summary", title: "Executive Summary", type: "text", required: true },
    { id: "risk_matrix", title: "Risk Matrix", type: "metrics_table", required: true },
    { id: "heat_map", title: "Risk Heat Map", type: "chart", required: true },
    { id: "mitigation", title: "Mitigation Strategies", type: "text", required: true },
    { id: "monitoring", title: "Monitoring Plan", type: "text", required: true },
    { id: "appendix", title: "Appendix", type: "appendix", required: false },
  ],
  executive: [
    { id: "cover", title: "Cover Page", type: "cover_page", required: true },
    { id: "key_metrics", title: "Key Metrics", type: "metrics_table", required: true },
    { id: "trends", title: "Trends & Insights", type: "chart", required: true },
    { id: "highlights", title: "Highlights", type: "text", required: true },
    { id: "next_steps", title: "Next Steps", type: "text", required: true },
  ],
};

export function SectionConfigurator({ templateId, selectedSections, onChange }: SectionConfiguratorProps) {
  const sections = templateSections[templateId] || [];
  const [activeSections, setActiveSections] = useState<string[]>([]);

  useEffect(() => {
    // Initialize with all required sections
    const requiredSections = sections.filter((s) => s.required).map((s) => s.id);
    setActiveSections(requiredSections);
    onChange(requiredSections);
  }, [templateId]);

  const toggleSection = (sectionId: string) => {
    const section = sections.find((s) => s.id === sectionId);
    if (section?.required) return; // Can't toggle required sections

    const newActiveSections = activeSections.includes(sectionId)
      ? activeSections.filter((id) => id !== sectionId)
      : [...activeSections, sectionId];

    setActiveSections(newActiveSections);
    onChange(newActiveSections);
  };

  return (
    <div>
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Customize Report Sections</h3>
        <p className="text-sm text-gray-600">
          Select which sections to include in your report. Required sections cannot be disabled.
        </p>
      </div>

      <div className="space-y-2">
        {sections.map((section) => {
          const isActive = activeSections.includes(section.id);
          const isRequired = section.required;

          return (
            <div
              key={section.id}
              className={`p-4 rounded-lg border-2 transition-all ${
                isActive
                  ? "border-blue-500 bg-blue-50"
                  : "border-gray-200 bg-gray-50"
              } ${isRequired ? "opacity-100" : "cursor-pointer hover:border-gray-300"}`}
              onClick={() => !isRequired && toggleSection(section.id)}
            >
              <div className="flex items-center gap-3">
                <GripVertical className="w-4 h-4 text-gray-400" />
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h4 className="font-medium text-gray-900">{section.title}</h4>
                    {isRequired && (
                      <span className="text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded">
                        Required
                      </span>
                    )}
                    <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded">
                      {section.type.replace("_", " ")}
                    </span>
                  </div>
                </div>
                {isActive ? (
                  <Eye className="w-5 h-5 text-blue-600" />
                ) : (
                  <EyeOff className="w-5 h-5 text-gray-400" />
                )}
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-6 p-4 bg-gray-50 border border-gray-200 rounded-lg">
        <p className="text-sm text-gray-700">
          <span className="font-semibold">{activeSections.length}</span> sections selected
        </p>
      </div>
    </div>
  );
}
