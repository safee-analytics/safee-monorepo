"use client";

import { useState } from "react";
import { Calendar, FileText, Filter } from "lucide-react";
import type { DataSourceConfig } from "@/lib/types/reports";
import { useCases, type CaseData } from "@/lib/api/hooks/cases";

interface DataSourceSelectorProps {
  caseId?: string;
  value: DataSourceConfig | null;
  onChange: (value: DataSourceConfig) => void;
}

export function DataSourceSelector({ caseId, value, onChange }: DataSourceSelectorProps) {
  const [selectedCase, setSelectedCase] = useState(caseId || "");
  const [dateRange, setDateRange] = useState({
    start: "",
    end: "",
  });
  const [includeDrafts, setIncludeDrafts] = useState(false);

  const { data: cases = [], isLoading } = useCases({});

  const handleApply = () => {
    onChange({
      caseId: selectedCase,
      dateRange,
      includeDrafts,
    });
  };

  return (
    <div>
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Configure Data Sources</h3>
        <p className="text-sm text-gray-600">
          Select the case and specify date range for data to include in your report.
        </p>
      </div>

      <div className="space-y-6">
        {/* Case Selection */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            <FileText className="w-4 h-4 inline mr-1" />
            Select Case
          </label>
          {caseId ? (
            <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-sm text-blue-800">
                Pre-selected case: {cases.find((c: CaseData) => c.id === caseId)?.clientName}
              </p>
            </div>
          ) : isLoading ? (
            <div className="p-3 bg-gray-50 border border-gray-200 rounded-lg">
              <p className="text-sm text-gray-600">Loading cases...</p>
            </div>
          ) : cases.length === 0 ? (
            <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
              <p className="text-sm text-yellow-800">No cases available. Please create a case first.</p>
            </div>
          ) : (
            <select
              value={selectedCase}
              onChange={(e) => setSelectedCase(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2"
            >
              <option value="">Select a case...</option>
              {cases.map((c: CaseData) => (
                <option key={c.id} value={c.id}>
                  {c.caseNumber} - {c.clientName}
                </option>
              ))}
            </select>
          )}
        </div>

        {/* Date Range */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            <Calendar className="w-4 h-4 inline mr-1" />
            Date Range (Optional)
          </label>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-gray-600 mb-1">Start Date</label>
              <input
                type="date"
                value={dateRange.start}
                onChange={(e) => setDateRange({ ...dateRange, start: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-600 mb-1">End Date</label>
              <input
                type="date"
                value={dateRange.end}
                onChange={(e) => setDateRange({ ...dateRange, end: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2"
              />
            </div>
          </div>
          <p className="text-xs text-gray-500 mt-1">Leave blank to include all data from the case</p>
        </div>

        {/* Filters */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            <Filter className="w-4 h-4 inline mr-1" />
            Filters
          </label>
          <div className="space-y-2">
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={includeDrafts}
                onChange={(e) => setIncludeDrafts(e.target.checked)}
                className="rounded border-gray-300"
              />
              <span className="text-sm text-gray-700">Include draft documents and findings</span>
            </label>
          </div>
        </div>

        {/* Apply Button */}
        <div className="pt-4">
          <button
            onClick={handleApply}
            disabled={!selectedCase}
            className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Apply Configuration
          </button>
        </div>

        {value && (
          <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
            <p className="text-sm text-green-800">
              ✓ Data source configured. Click <span className="font-semibold">Next</span> to customize
              sections.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
