"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { X, ExternalLink, Calendar, User, Flag, Clock, BarChart3 } from "lucide-react";
import type { components } from "@/lib/api/types";

type CaseStatus = components["schemas"]["CaseResponse"]["status"];
type CasePriority = components["schemas"]["CaseResponse"]["priority"];

interface CasePreviewDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  caseData: {
    id: string;
    caseNumber: string;
    clientName: string;
    auditType: string;
    status: CaseStatus;
    priority: CasePriority;
    dueDate?: string;
    assignee?: {
      name: string;
      avatar: string;
    };
    progress: number;
  } | null;
}

export function CasePreviewDrawer({ isOpen, onClose, caseData }: CasePreviewDrawerProps) {
  const router = useRouter();

  // Close drawer on ESC key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    if (isOpen) {
      document.addEventListener("keydown", handleEscape);
      return () => {
        document.removeEventListener("keydown", handleEscape);
      };
    }
  }, [isOpen, onClose]);

  if (!caseData) return null;

  const handleOpenFull = () => {
    router.push(`/audit/cases/${caseData.id}`);
    onClose();
  };

  const getStatusColor = (status: CaseStatus) => {
    switch (status) {
      case "pending":
        return "bg-gray-100 text-gray-700";
      case "in-progress":
        return "bg-blue-100 text-blue-700";
      case "under-review":
        return "bg-yellow-100 text-yellow-700";
      case "completed":
        return "bg-green-100 text-green-700";
      case "overdue":
        return "bg-red-100 text-red-700";
      default:
        return "bg-gray-100 text-gray-700";
    }
  };

  const getPriorityColor = (priority: CasePriority) => {
    switch (priority) {
      case "critical":
        return "text-red-600 bg-red-100";
      case "high":
        return "text-orange-600 bg-orange-100";
      case "medium":
        return "text-yellow-600 bg-yellow-100";
      case "low":
        return "text-green-600 bg-green-100";
      default:
        return "text-gray-600 bg-gray-100";
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/50 z-50"
          />

          {/* Drawer */}
          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 30, stiffness: 300 }}
            className="fixed right-0 top-0 bottom-0 w-full max-w-2xl bg-white shadow-2xl z-50 overflow-y-auto"
          >
            {/* Header */}
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between z-10">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                  <span className="text-xl">📋</span>
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-gray-900">{caseData.caseNumber}</h2>
                  <p className="text-sm text-gray-500">Quick Preview</p>
                </div>
              </div>
              <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            {/* Content */}
            <div className="p-6 space-y-6">
              {/* Client Info */}
              <div>
                <h3 className="text-sm font-medium text-gray-500 mb-2">Client</h3>
                <p className="text-lg font-semibold text-gray-900">{caseData.clientName}</p>
                <p className="text-sm text-gray-600">{caseData.auditType}</p>
              </div>

              {/* Status & Priority */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h3 className="text-sm font-medium text-gray-500 mb-2">Status</h3>
                  <span
                    className={`inline-flex px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(
                      caseData.status,
                    )}`}
                  >
                    {caseData.status}
                  </span>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-gray-500 mb-2">Priority</h3>
                  <span
                    className={`inline-flex px-3 py-1 rounded-full text-xs font-medium ${getPriorityColor(
                      caseData.priority,
                    )}`}
                  >
                    {caseData.priority}
                  </span>
                </div>
              </div>

              {/* Progress */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-sm font-medium text-gray-500">Progress</h3>
                  <span className="text-sm font-semibold text-blue-600">{caseData.progress}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-blue-600 h-2 rounded-full transition-all"
                    style={{ width: `${caseData.progress}%` }}
                  />
                </div>
              </div>

              {/* Details Grid */}
              <div className="grid grid-cols-1 gap-4 bg-gray-50 rounded-lg p-4">
                {caseData.assignee && (
                  <div className="flex items-center gap-3">
                    <User className="w-5 h-5 text-gray-400" />
                    <div className="flex-1">
                      <p className="text-xs text-gray-500">Assignee</p>
                      <div className="flex items-center gap-2 mt-1">
                        <img
                          src={caseData.assignee.avatar}
                          alt={caseData.assignee.name}
                          className="w-6 h-6 rounded-full"
                        />
                        <p className="text-sm font-medium text-gray-900">{caseData.assignee.name}</p>
                      </div>
                    </div>
                  </div>
                )}

                {caseData.dueDate && (
                  <div className="flex items-center gap-3">
                    <Calendar className="w-5 h-5 text-gray-400" />
                    <div className="flex-1">
                      <p className="text-xs text-gray-500">Due Date</p>
                      <p className="text-sm font-medium text-gray-900 mt-1">{caseData.dueDate}</p>
                    </div>
                  </div>
                )}
              </div>

              {/* Quick Stats */}
              <div className="border-t border-gray-200 pt-6">
                <h3 className="text-sm font-medium text-gray-700 mb-4">Quick Stats</h3>
                <div className="grid grid-cols-3 gap-4">
                  <div className="text-center">
                    <BarChart3 className="w-6 h-6 text-blue-600 mx-auto mb-2" />
                    <p className="text-2xl font-bold text-gray-900">12</p>
                    <p className="text-xs text-gray-500">Procedures</p>
                  </div>
                  <div className="text-center">
                    <Clock className="w-6 h-6 text-green-600 mx-auto mb-2" />
                    <p className="text-2xl font-bold text-gray-900">8</p>
                    <p className="text-xs text-gray-500">Completed</p>
                  </div>
                  <div className="text-center">
                    <Flag className="w-6 h-6 text-orange-600 mx-auto mb-2" />
                    <p className="text-2xl font-bold text-gray-900">4</p>
                    <p className="text-xs text-gray-500">Pending</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Footer Actions */}
            <div className="sticky bottom-0 bg-white border-t border-gray-200 px-6 py-4 flex gap-3">
              <button
                onClick={onClose}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
              >
                Close
              </button>
              <button
                onClick={handleOpenFull}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium flex items-center justify-center gap-2"
              >
                <ExternalLink className="w-4 h-4" />
                Open Full Case
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
