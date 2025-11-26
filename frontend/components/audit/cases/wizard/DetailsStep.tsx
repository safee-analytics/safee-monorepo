"use client";

import type { WizardStepProps } from "../CreateCaseWizard";
import { FileText, DollarSign, Clock } from "lucide-react";

const STATUSES = [
  { value: "pending", label: "Pending", color: "bg-gray-100 text-gray-700" },
  { value: "in-progress", label: "In Progress", color: "bg-blue-100 text-blue-700" },
  { value: "under-review", label: "Under Review", color: "bg-yellow-100 text-yellow-700" },
  { value: "completed", label: "Completed", color: "bg-green-100 text-green-700" },
];

export function DetailsStep({ data, onChange }: WizardStepProps) {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Additional Details</h3>
        <p className="text-sm text-gray-600">
          Optional fields to provide more context for this case (you can skip this step)
        </p>
      </div>

      {/* Status */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
        <div className="grid grid-cols-2 gap-3">
          {STATUSES.map((status) => {
            const isSelected = data.status === status.value;
            return (
              <button
                key={status.value}
                onClick={() => onChange({ status: status.value })}
                className={`p-3 rounded-lg border-2 transition-all ${
                  isSelected
                    ? `${status.color} border-current ring-2 ring-offset-2 ring-current/30`
                    : "bg-white border-gray-200 hover:bg-gray-50"
                }`}
              >
                <p className="font-medium text-center">{status.label}</p>
              </button>
            );
          })}
        </div>
      </div>

      {/* Description */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          <div className="flex items-center space-x-2">
            <FileText className="h-4 w-4" />
            <span>Description / Notes</span>
          </div>
        </label>
        <textarea
          value={data.description || ""}
          onChange={(e) => onChange({ description: e.target.value })}
          placeholder="Add any additional context, scope details, or special requirements..."
          rows={4}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
        />
        <p className="mt-1 text-xs text-gray-500">
          Provide background information or specific requirements for this audit
        </p>
      </div>

      {/* Estimated Hours */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          <div className="flex items-center space-x-2">
            <Clock className="h-4 w-4" />
            <span>Estimated Hours</span>
          </div>
        </label>
        <input
          type="number"
          value={data.estimatedHours || ""}
          onChange={(e) => onChange({ estimatedHours: e.target.value ? parseInt(e.target.value) : undefined })}
          placeholder="e.g., 40"
          min="1"
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
        <p className="mt-1 text-xs text-gray-500">
          Approximate number of hours required to complete this audit
        </p>
      </div>

      {/* Budget */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          <div className="flex items-center space-x-2">
            <DollarSign className="h-4 w-4" />
            <span>Budget (AED)</span>
          </div>
        </label>
        <input
          type="number"
          value={data.budget || ""}
          onChange={(e) => onChange({ budget: e.target.value ? parseFloat(e.target.value) : undefined })}
          placeholder="e.g., 50000"
          min="0"
          step="1000"
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
        <p className="mt-1 text-xs text-gray-500">
          Estimated budget for this audit engagement
        </p>
      </div>

      {/* Info Box */}
      <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <p className="text-sm text-blue-700">
          💡 <strong>Tip:</strong> These details can be updated later. You can skip this step and add
          them when you have more information.
        </p>
      </div>
    </div>
  );
}
