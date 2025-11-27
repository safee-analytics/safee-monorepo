"use client";

import { Sparkles, FileText, CheckCircle2, Loader2 } from "lucide-react";
import type { DataSourceConfig } from "@/lib/types/reports";

interface GenerationProgressProps {
  isGenerating: boolean;
  onGenerate: () => void;
  templateId: string;
  dataSource: DataSourceConfig;
  sections: string[];
}

export function GenerationProgress({
  isGenerating,
  onGenerate,
  templateId,
  dataSource,
  sections,
}: GenerationProgressProps) {
  const steps = [
    { id: "data", label: "Fetching case data", completed: isGenerating },
    { id: "aggregate", label: "Aggregating metrics", completed: false },
    { id: "render", label: "Rendering template", completed: false },
    { id: "export", label: "Preparing export", completed: false },
  ];

  return (
    <div>
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Review & Generate</h3>
        <p className="text-sm text-gray-600">
          Review your configuration and generate the report. This may take a few moments.
        </p>
      </div>

      {!isGenerating ? (
        <div className="space-y-6">
          {/* Configuration Summary */}
          <div className="p-6 bg-gray-50 rounded-lg space-y-4">
            <div>
              <h4 className="text-sm font-medium text-gray-700 mb-1">Template</h4>
              <p className="text-gray-900 capitalize">{templateId.replace("_", " ")}</p>
            </div>
            <div>
              <h4 className="text-sm font-medium text-gray-700 mb-1">Data Source</h4>
              <p className="text-gray-900">Case ID: {dataSource.caseId}</p>
              {dataSource.dateRange.start && (
                <p className="text-sm text-gray-600">
                  {dataSource.dateRange.start} - {dataSource.dateRange.end || "Present"}
                </p>
              )}
            </div>
            <div>
              <h4 className="text-sm font-medium text-gray-700 mb-1">Sections</h4>
              <p className="text-gray-900">{sections.length} sections selected</p>
            </div>
          </div>

          {/* Generate Button */}
          <button
            onClick={onGenerate}
            className="w-full bg-gradient-to-r from-blue-600 to-blue-700 text-white py-3 rounded-lg hover:from-blue-700 hover:to-blue-800 transition-all flex items-center justify-center gap-2 font-medium"
          >
            <Sparkles className="w-5 h-5" />
            Generate Report
          </button>

          <p className="text-xs text-gray-500 text-center">
            Report generation typically takes 5-30 seconds depending on data volume
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Progress Steps */}
          <div className="space-y-3">
            {steps.map((step) => (
              <div key={step.id} className="flex items-center gap-3">
                {step.completed ? (
                  <CheckCircle2 className="w-5 h-5 text-green-600" />
                ) : (
                  <Loader2 className="w-5 h-5 text-blue-600 animate-spin" />
                )}
                <span
                  className={`text-sm ${step.completed ? "text-green-700" : "text-blue-700"}`}
                >
                  {step.label}
                </span>
              </div>
            ))}
          </div>

          {/* Progress Bar */}
          <div className="p-6 bg-blue-50 rounded-lg">
            <div className="flex items-center gap-3 mb-3">
              <FileText className="w-6 h-6 text-blue-600" />
              <div>
                <p className="font-medium text-gray-900">Generating your report...</p>
                <p className="text-sm text-gray-600">Please wait while we compile the data</p>
              </div>
            </div>
            <div className="w-full h-2 bg-blue-200 rounded-full overflow-hidden">
              <div
                className="h-full bg-blue-600 rounded-full animate-pulse"
                style={{ width: "45%" }}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
