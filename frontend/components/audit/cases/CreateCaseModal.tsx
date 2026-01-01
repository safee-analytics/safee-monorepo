"use client";

import { useState } from "react";
import { X } from "lucide-react";
import { useCreateCase } from "@/lib/api/hooks";
import type { CaseType, CaseStatus, CasePriority } from "@/lib/types/cases";

interface CreateCaseModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export function CreateCaseModal({ isOpen, onClose, onSuccess }: CreateCaseModalProps) {
  const createCase = useCreateCase();

  const [formData, setFormData] = useState({
    title: "",
    caseType: "" as CaseType | "",
    status: "draft" as CaseStatus,
    priority: "medium" as CasePriority,
    dueDate: "",
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.title.trim()) {
      newErrors.title = "Client name is required";
    }
    if (!formData.caseType.trim()) {
      newErrors.caseType = "Audit type is required";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validate()) {
      return;
    }

    try {
      // Backend will auto-generate the case number sequentially
      await createCase.mutateAsync({
        title: formData.title,
        caseType: formData.caseType as CaseType,
        status: formData.status,
        priority: formData.priority,
        dueDate: formData.dueDate || undefined,
      });

      // Reset form
      setFormData({
        title: "",
        caseType: "",
        status: "draft",
        priority: "medium",
        dueDate: "",
      });
      setErrors({});

      // Call success callback and close
      onSuccess?.();
      onClose();
    } catch (err) {
      console.error("Failed to create case:", err);
      setErrors({ submit: "Failed to create case. Please try again." });
    }
  };

  const handleClose = () => {
    if (!createCase.isPending) {
      setFormData({
        title: "",
        caseType: "",
        status: "draft",
        priority: "medium",
        dueDate: "",
      });
      setErrors({});
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
      onClick={(e) => {
        // Only close if clicking the backdrop itself, not the modal content
        if (e.target === e.currentTarget && !createCase.isPending) {
          handleClose();
        }
      }}
    >
      <div
        className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
        onClick={(e) => {
          e.stopPropagation();
        }}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Create New Case</h2>
            <p className="text-gray-600 text-sm mt-1">Fill in the essential details to create a case</p>
          </div>
          <button
            onClick={handleClose}
            disabled={createCase.isPending}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50 cursor-pointer disabled:cursor-not-allowed"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Form */}
        <form
          onSubmit={(event) => {
            void handleSubmit(event);
          }}
          className="p-6 space-y-6"
        >
          {/* Client Name */}
          <div>
            <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-2">
              Client Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              id="title"
              value={formData.title}
              onChange={(e) => {
                setFormData({ ...formData, title: e.target.value });
              }}
              className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                errors.title ? "border-red-500" : "border-gray-300"
              }`}
              placeholder="e.g., ABC Corporation"
              autoFocus
            />
            {errors.title && <p className="text-red-500 text-sm mt-1">{errors.title}</p>}
          </div>

          {/* Audit Type */}
          <div>
            <label htmlFor="caseType" className="block text-sm font-medium text-gray-700 mb-2">
              Audit Type <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              id="caseType"
              value={formData.caseType}
              onChange={(e) => {
                setFormData({ ...formData, caseType: e.target.value as CaseType | "" });
              }}
              className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                errors.caseType ? "border-red-500" : "border-gray-300"
              }`}
              placeholder="e.g., Financial Audit"
            />
            {errors.caseType && <p className="text-red-500 text-sm mt-1">{errors.caseType}</p>}
          </div>

          {/* Status, Priority and Due Date Row */}
          <div className="grid grid-cols-3 gap-6">
            {/* Status */}
            <div>
              <label htmlFor="status" className="block text-sm font-medium text-gray-700 mb-2">
                Initial Status
              </label>
              <select
                id="status"
                value={formData.status}
                onChange={(e) => {
                  setFormData({ ...formData, status: e.target.value as CaseStatus });
                }}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="draft">Pending</option>
                <option value="in_progress">In Progress</option>
                <option value="under_review">Under Review</option>
                <option value="completed">Completed</option>
              </select>
            </div>

            {/* Priority */}
            <div>
              <label htmlFor="priority" className="block text-sm font-medium text-gray-700 mb-2">
                Priority
              </label>
              <select
                id="priority"
                value={formData.priority}
                onChange={(e) => {
                  setFormData({ ...formData, priority: e.target.value as CasePriority });
                }}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="critical">Critical</option>
              </select>
            </div>

            {/* Due Date */}
            <div>
              <label htmlFor="dueDate" className="block text-sm font-medium text-gray-700 mb-2">
                Due Date
              </label>
              <input
                type="date"
                id="dueDate"
                value={formData.dueDate}
                onChange={(e) => {
                  setFormData({ ...formData, dueDate: e.target.value });
                }}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Error Message */}
          {errors.submit && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-600 text-sm">{errors.submit}</p>
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center justify-end gap-4 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={handleClose}
              disabled={createCase.isPending}
              className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50 cursor-pointer disabled:cursor-not-allowed"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={createCase.isPending}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer flex items-center gap-2"
            >
              {createCase.isPending ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Creating...</span>
                </>
              ) : (
                "Create Case"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
