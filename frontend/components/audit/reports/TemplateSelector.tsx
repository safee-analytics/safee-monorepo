"use client";

import { Check, FileText } from "lucide-react";
import type { ReportTemplate } from "@/lib/types/reports";

interface TemplateSelectorProps {
  selected: string | null;
  onSelect: (templateId: string) => void;
}

const templates: ReportTemplate[] = [
  {
    id: "financial",
    name: "Financial Audit Report",
    nameAr: "تقرير التدقيق المالي",
    description:
      "Comprehensive financial audit with detailed balance sheet, income statement, and cash flow analysis",
    descriptionAr: "تدقيق مالي شامل مع تحليل مفصل للميزانية العمومية وبيان الدخل والتدفق النقدي",
    auditType: "financial_audit",
    preview: "📊 Cover | Executive Summary | Financial Statements | Findings | Recommendations",
  },
  {
    id: "compliance",
    name: "Compliance Audit Report",
    nameAr: "تقرير تدقيق الامتثال",
    description: "Regulatory compliance assessment with detailed framework analysis and violation tracking",
    descriptionAr: "تقييم الامتثال التنظيمي مع تحليل مفصل للإطار وتتبع المخالفات",
    auditType: "compliance_audit",
    preview: "📋 Cover | Compliance Score | Frameworks | Violations | Action Plan",
  },
  {
    id: "icv",
    name: "ICV Audit Report",
    nameAr: "تقرير تدقيق القيمة المضافة المحلية",
    description: "In-Country Value audit report for UAE local content certification",
    descriptionAr: "تقرير تدقيق القيمة المحلية لشهادة المحتوى المحلي في الإمارات",
    auditType: "icv_audit",
    preview: "🇦🇪 Cover | ICV Calculation | Local Spend | Certification | Appendix",
  },
  {
    id: "risk",
    name: "Risk Assessment Report",
    nameAr: "تقرير تقييم المخاطر",
    description: "Comprehensive risk analysis with heat maps, mitigation strategies, and monitoring plan",
    descriptionAr: "تحليل شامل للمخاطر مع خرائط حرارية واستراتيجيات التخفيف وخطة المراقبة",
    auditType: "risk_assessment",
    preview: "⚠️ Cover | Risk Matrix | Heat Map | Mitigation | Monitoring",
  },
  {
    id: "executive",
    name: "Executive Summary Report",
    nameAr: "تقرير الملخص التنفيذي",
    description: "High-level overview report for stakeholders with key metrics and visual dashboards",
    descriptionAr:
      "تقرير نظرة عامة رفيعة المستوى لأصحاب المصلحة مع المقاييس الرئيسية ولوحات المعلومات المرئية",
    auditType: "general",
    preview: "📈 Cover | Key Metrics | Trends | Highlights | Next Steps",
  },
];

export function TemplateSelector({ selected, onSelect }: TemplateSelectorProps) {
  return (
    <div>
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Choose Report Template</h3>
        <p className="text-sm text-gray-600">
          Select a pre-built template that matches your audit type. You&apos;ll be able to customize sections
          in the next step.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {templates.map((template) => (
          <button
            key={template.id}
            onClick={() => { onSelect(template.id); }}
            className={`text-left p-4 rounded-lg border-2 transition-all ${
              selected === template.id
                ? "border-blue-500 bg-blue-50"
                : "border-gray-200 hover:border-gray-300 bg-white"
            }`}
          >
            <div className="flex items-start gap-3">
              <div
                className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${
                  selected === template.id ? "bg-blue-600" : "bg-gray-100"
                }`}
              >
                {selected === template.id ? (
                  <Check className="w-5 h-5 text-white" />
                ) : (
                  <FileText className="w-5 h-5 text-gray-600" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="font-semibold text-gray-900 mb-1">{template.name}</h4>
                <p className="text-sm text-gray-600 mb-2">{template.description}</p>
                <div className="text-xs text-gray-500 bg-gray-50 rounded px-2 py-1 inline-block">
                  {template.preview}
                </div>
              </div>
            </div>
          </button>
        ))}
      </div>

      {selected && (
        <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <p className="text-sm text-blue-800">
            ✓ Template selected. Click <span className="font-semibold">Next</span> to configure data sources.
          </p>
        </div>
      )}
    </div>
  );
}
