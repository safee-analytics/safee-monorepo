"use client";

import { useState } from "react";
import { X, Download, FileText, FileSpreadsheet, Eye, ZoomIn, ZoomOut } from "lucide-react";
import type { AuditReportResponse } from "@/lib/types/reports";

interface ReportViewerProps {
  report: AuditReportResponse;
  onClose: () => void;
  onExport: (format: "pdf" | "excel") => void;
}

export function ReportViewer({ report, onClose, onExport }: ReportViewerProps) {
  const [zoom, setZoom] = useState(100);
  const [isExporting, setIsExporting] = useState(false);

  const handleExport = async (format: "pdf" | "excel") => {
    setIsExporting(true);
    await onExport(format);
    setIsExporting(false);
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-6xl w-full h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <FileText className="w-6 h-6 text-blue-600" />
            <div>
              <h2 className="text-xl font-bold text-gray-900">{report.title}</h2>
              <p className="text-sm text-gray-600">
                Generated {report.generatedAt ? new Date(report.generatedAt).toLocaleDateString() : "N/A"}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-600" />
          </button>
        </div>

        {/* Toolbar */}
        <div className="px-6 py-3 border-b border-gray-200 flex items-center justify-between bg-gray-50">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setZoom(Math.max(50, zoom - 10))}
              className="p-2 hover:bg-white rounded-lg border border-gray-300 transition-colors"
            >
              <ZoomOut className="w-4 h-4 text-gray-600" />
            </button>
            <span className="text-sm text-gray-700 font-medium px-3">{zoom}%</span>
            <button
              onClick={() => setZoom(Math.min(200, zoom + 10))}
              className="p-2 hover:bg-white rounded-lg border border-gray-300 transition-colors"
            >
              <ZoomIn className="w-4 h-4 text-gray-600" />
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => handleExport("pdf")}
              disabled={isExporting}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2"
            >
              <Download className="w-4 h-4" />
              Export PDF
            </button>
            <button
              onClick={() => handleExport("excel")}
              disabled={isExporting}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 flex items-center gap-2"
            >
              <FileSpreadsheet className="w-4 h-4" />
              Export Excel
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 bg-gray-100">
          <div
            className="bg-white rounded-lg shadow-sm mx-auto p-8"
            style={{
              width: `${zoom}%`,
              maxWidth: "100%",
              minHeight: "100%"
            }}
          >
            {report.status === "generating" ? (
              <div className="flex flex-col items-center justify-center py-12">
                <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mb-4" />
                <p className="text-gray-600">Generating report...</p>
              </div>
            ) : report.status === "failed" ? (
              <div className="flex flex-col items-center justify-center py-12">
                <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
                  <X className="w-8 h-8 text-red-600" />
                </div>
                <p className="text-gray-900 font-semibold mb-2">Report Generation Failed</p>
                <p className="text-gray-600 text-sm">Please try generating the report again</p>
              </div>
            ) : (
              <div className="space-y-8">
                {/* Cover Page */}
                <div className="text-center py-12 border-b border-gray-200">
                  <h1 className="text-4xl font-bold text-gray-900 mb-4">{report.title}</h1>
                  <p className="text-gray-600">
                    Generated on {report.generatedAt ? new Date(report.generatedAt).toLocaleDateString() : "N/A"}
                  </p>
                </div>

                {/* Executive Summary */}
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 mb-4">Executive Summary</h2>
                  <p className="text-gray-700 leading-relaxed">
                    This report provides a comprehensive overview of the audit findings and recommendations.
                  </p>
                </div>

                {/* Generated Data Display */}
                {report.generatedData && (
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900 mb-4">Data Summary</h2>
                    <div className="bg-gray-50 rounded-lg p-4">
                      <pre className="text-sm text-gray-700 whitespace-pre-wrap">
                        {JSON.stringify(report.generatedData, null, 2)}
                      </pre>
                    </div>
                  </div>
                )}

                {/* Settings Display */}
                {report.settings && (
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900 mb-4">Report Configuration</h2>
                    <div className="space-y-2 text-sm">
                      {report.settings.dateRange && (
                        <p className="text-gray-700">
                          <span className="font-medium">Date Range:</span>{" "}
                          {report.settings.dateRange.start} - {report.settings.dateRange.end}
                        </p>
                      )}
                      {report.settings.includeSections && (
                        <p className="text-gray-700">
                          <span className="font-medium">Sections:</span>{" "}
                          {report.settings.includeSections.length} included
                        </p>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
