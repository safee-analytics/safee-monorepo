"use client";

import { useState } from "react";
import { X, FileText, Database, Settings, Sparkles } from "lucide-react";
import { TemplateSelector } from "./TemplateSelector";
import { DataSourceSelector } from "./DataSourceSelector";
import { SectionConfigurator } from "./SectionConfigurator";
import { GenerationProgress } from "./GenerationProgress";
import { useGenerateReport } from "@/lib/api/hooks/reports";
import type { DataSourceConfig } from "@/lib/types/reports";

interface ReportWizardProps {
  onClose: () => void;
  caseId?: string;
}

type WizardStep = "template" | "data" | "sections" | "generate";

export function ReportWizard({ onClose, caseId }: ReportWizardProps) {
  const [currentStep, setCurrentStep] = useState<WizardStep>("template");
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);
  const [dataSource, setDataSource] = useState<DataSourceConfig | null>(null);
  const [sections, setSections] = useState<string[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);

  const generateMutation = useGenerateReport();

  const steps = [
    { id: "template" as WizardStep, label: "Template", icon: FileText },
    { id: "data" as WizardStep, label: "Data Source", icon: Database },
    { id: "sections" as WizardStep, label: "Sections", icon: Settings },
    { id: "generate" as WizardStep, label: "Generate", icon: Sparkles },
  ];

  const currentStepIndex = steps.findIndex((s) => s.id === currentStep);

  const handleNext = () => {
    if (currentStep === "template" && selectedTemplate) {
      setCurrentStep("data");
    } else if (currentStep === "data" && dataSource) {
      setCurrentStep("sections");
    } else if (currentStep === "sections") {
      setCurrentStep("generate");
    }
  };

  const handleBack = () => {
    if (currentStep === "data") setCurrentStep("template");
    else if (currentStep === "sections") setCurrentStep("data");
    else if (currentStep === "generate") setCurrentStep("sections");
  };

  const handleGenerate = async () => {
    if (!selectedTemplate || !dataSource) return;

    setIsGenerating(true);
    try {
      await generateMutation.mutateAsync({
        caseId: dataSource.caseId,
        templateId: selectedTemplate,
        title: `Audit Report - ${new Date().toLocaleDateString()}`,
        settings: {
          dateRange: dataSource.dateRange.start
            ? {
                start: dataSource.dateRange.start,
                end: dataSource.dateRange.end || new Date().toISOString().split("T")[0],
              }
            : undefined,
          includeSections: sections,
        },
      });
      onClose();
    } catch (err) {
      console.error("Failed to generate report:", err);
    } finally {
      setIsGenerating(false);
    }
  };

  const canProceed = () => {
    if (currentStep === "template") return selectedTemplate !== null;
    if (currentStep === "data") return dataSource !== null;
    if (currentStep === "sections") return true;
    return false;
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-gray-900">Generate Audit Report</h2>
            <p className="text-sm text-gray-600">Follow the steps to configure your report</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
            <X className="w-5 h-5 text-gray-600" />
          </button>
        </div>

        {/* Progress Steps */}
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            {steps.map((step, index) => {
              const Icon = step.icon;
              const isActive = step.id === currentStep;
              const isCompleted = index < currentStepIndex;

              return (
                <div key={step.id} className="flex items-center flex-1">
                  <div className="flex items-center gap-2">
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center ${
                        isActive
                          ? "bg-blue-600 text-white"
                          : isCompleted
                            ? "bg-green-500 text-white"
                            : "bg-gray-200 text-gray-600"
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                    </div>
                    <span
                      className={`text-sm font-medium ${
                        isActive ? "text-blue-600" : isCompleted ? "text-green-600" : "text-gray-600"
                      }`}
                    >
                      {step.label}
                    </span>
                  </div>
                  {index < steps.length - 1 && (
                    <div className={`flex-1 h-0.5 mx-4 ${isCompleted ? "bg-green-500" : "bg-gray-200"}`} />
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {currentStep === "template" && (
            <TemplateSelector selected={selectedTemplate} onSelect={setSelectedTemplate} />
          )}
          {currentStep === "data" && (
            <DataSourceSelector caseId={caseId} value={dataSource} onChange={setDataSource} />
          )}
          {currentStep === "sections" && (
            <SectionConfigurator
              templateId={selectedTemplate!}
              selectedSections={sections}
              onChange={setSections}
            />
          )}
          {currentStep === "generate" && (
            <GenerationProgress
              isGenerating={isGenerating}
              onGenerate={handleGenerate}
              templateId={selectedTemplate!}
              dataSource={dataSource!}
              sections={sections}
            />
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between">
          <button
            onClick={handleBack}
            disabled={currentStep === "template"}
            className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Back
          </button>
          <div className="flex items-center gap-2">
            <button onClick={onClose} className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg">
              Cancel
            </button>
            {currentStep !== "generate" ? (
              <button
                onClick={handleNext}
                disabled={!canProceed()}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next
              </button>
            ) : (
              <button
                onClick={handleGenerate}
                disabled={isGenerating}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                <Sparkles className="w-4 h-4" />
                {isGenerating ? "Generating..." : "Generate Report"}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
