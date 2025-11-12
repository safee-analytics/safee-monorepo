"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import { motion } from "framer-motion";
import {
  Save,
  Download,
  FileText,
  Settings,
  Users,
  MessageSquare,
  Archive,
  CheckCircle,
  AlertCircle,
} from "lucide-react";
import { useTranslation } from "@/lib/providers/TranslationProvider";
import { ICVScopeEditor } from "@/components/audit/ICVScopeEditor";
import { DEFAULT_ICV_SCOPE, ICVScope } from "@/types/icv";

export default function ICVScopePage() {
  const params = useParams();
  const { t, locale } = useTranslation();
  const [scope, setScope] = useState<ICVScope>(DEFAULT_ICV_SCOPE);
  const [isSaving, setIsSaving] = useState(false);

  const caseInfo = {
    id: params.id,
    clientName: "ALI INTERNATIONAL TRADING ESTABLISHMENT",
    year: 2022,
    createdDate: "7/29/2023",
    createdBy: "ADMIN",
    dueDate: "7/31/2023",
    status: "File Completed",
  };

  const handleSaveScope = async () => {
    setIsSaving(true);
    // Simulate save
    await new Promise((resolve) => setTimeout(resolve, 1000));
    setScope((prev) => ({ ...prev, updatedAt: new Date().toISOString() }));
    setIsSaving(false);
  };

  const handleExportScope = () => {
    // Export logic
    console.log("Exporting scope...");
  };

  const handleCompleteFile = async () => {
    if (window.confirm(t.audit.confirmComplete)) {
      setIsSaving(true);
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1000));
      setScope((prev) => ({
        ...prev,
        status: "Completed",
        completedAt: new Date().toISOString(),
        completedBy: "Current User",
        updatedAt: new Date().toISOString(),
      }));
      setIsSaving(false);
      alert(t.audit.fileCompletedSuccessfully);
    }
  };

  const handleArchiveFile = async () => {
    if (window.confirm(t.audit.confirmArchive)) {
      setIsSaving(true);
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1000));
      setScope((prev) => ({
        ...prev,
        status: "Archived",
        archivedAt: new Date().toISOString(),
        archivedBy: "Current User",
        updatedAt: new Date().toISOString(),
      }));
      setIsSaving(false);
      alert(t.audit.fileArchivedSuccessfully);
    }
  };

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case "Draft":
        return "bg-gray-100 text-gray-800";
      case "In Progress":
        return "bg-blue-100 text-blue-800";
      case "Under Review":
        return "bg-yellow-100 text-yellow-800";
      case "Completed":
        return "bg-green-100 text-green-800";
      case "Archived":
        return "bg-purple-100 text-purple-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "Draft":
        return t.audit.statusDraft;
      case "In Progress":
        return t.audit.statusInProgress;
      case "Under Review":
        return t.audit.statusUnderReview;
      case "Completed":
        return t.audit.statusCompleted;
      case "Archived":
        return t.audit.statusArchived;
      default:
        return status;
    }
  };

  const isReadOnly = scope.status === "Completed" || scope.status === "Archived";

  const completionPercentage =
    Math.round(
      (scope.sections.reduce(
        (acc, section) => acc + section.procedures.filter((p) => p.isCompleted).length,
        0,
      ) /
        scope.sections.reduce((acc, section) => acc + section.procedures.length, 0)) *
        100,
    ) || 0;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="flex h-screen">
        {/* Main Content */}
        <div className="flex-1 overflow-y-auto">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="p-6">
            {/* Header */}
            <div className="mb-6">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-12 h-12 bg-green-600 rounded flex items-center justify-center">
                  <FileText className="w-6 h-6 text-white" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h1 className="text-2xl font-bold text-gray-900">
                      AZ-SCR-{caseInfo.id}-{caseInfo.year}-1 Client: {caseInfo.clientName} / {caseInfo.year}
                    </h1>
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusBadgeColor(scope.status)}`}
                    >
                      {getStatusLabel(scope.status)}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600">
                    {t.audit.createdOn}: {caseInfo.createdDate}, {t.audit.createdBy}: {caseInfo.createdBy},{" "}
                    {t.audit.engagementDueDate}: {caseInfo.dueDate}
                  </p>
                </div>
                {scope.status === "Completed" && (
                  <div>
                    <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center border-4 border-green-600">
                      <div className="text-center">
                        <CheckCircle className="w-8 h-8 text-green-600 mx-auto" />
                        <span className="text-xs text-green-700 font-semibold">
                          {t.audit.qualityApproved}
                        </span>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Progress Bar */}
              <div className="bg-white rounded-lg border border-gray-200 p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-700">{t.audit.overallProgress}</span>
                  <span className="text-sm font-bold text-blue-600">{completionPercentage}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-3">
                  <div
                    className="bg-blue-600 h-3 rounded-full transition-all duration-500"
                    style={{ width: `${completionPercentage}%` }}
                  />
                </div>
              </div>
            </div>

            {/* Actions Bar */}
            <div className="flex items-center gap-3 mb-6">
              <button
                onClick={handleSaveScope}
                disabled={isSaving || isReadOnly}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
              >
                <Save className="w-4 h-4" />
                {isSaving ? t.audit.saving : t.audit.saveChanges}
              </button>
              <button
                onClick={handleExportScope}
                className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <Download className="w-4 h-4" />
                {t.audit.downloadPrint}
              </button>
              <button
                disabled={isReadOnly}
                className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
              >
                <Settings className="w-4 h-4" />
                {t.audit.templateSettings}
              </button>
            </div>

            {/* Read-only Banner */}
            {isReadOnly && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className={`mb-6 p-4 rounded-lg border-l-4 ${
                  scope.status === "Archived"
                    ? "bg-purple-50 border-purple-500"
                    : "bg-green-50 border-green-500"
                }`}
              >
                <div className="flex items-center gap-3">
                  {scope.status === "Archived" ? (
                    <Archive className="w-5 h-5 text-purple-600" />
                  ) : (
                    <CheckCircle className="w-5 h-5 text-green-600" />
                  )}
                  <div className="flex-1">
                    <p
                      className={`font-semibold ${
                        scope.status === "Archived" ? "text-purple-900" : "text-green-900"
                      }`}
                    >
                      {scope.status === "Archived" ? t.audit.statusArchived : t.audit.statusCompleted}
                    </p>
                    <p
                      className={`text-sm ${
                        scope.status === "Archived" ? "text-purple-700" : "text-green-700"
                      }`}
                    >
                      {scope.status === "Archived"
                        ? `${t.audit.archivedAt}: ${new Date(scope.archivedAt!).toLocaleString(locale)}`
                        : `${t.audit.completedAt}: ${new Date(scope.completedAt!).toLocaleString(locale)}`}
                    </p>
                  </div>
                </div>
              </motion.div>
            )}

            {/* Scope Editor */}
            <ICVScopeEditor
              sections={scope.sections}
              onSectionsChange={(sections) => setScope({ ...scope, sections })}
              readOnly={isReadOnly}
            />
          </motion.div>
        </div>

        {/* Right Sidebar - Actions */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="w-80 bg-white border-l border-gray-200 p-6 overflow-y-auto"
        >
          <h2 className="text-lg font-semibold text-gray-900 mb-4">{t.audit.actions}</h2>

          <div className="space-y-3">
            <button className="w-full flex items-center gap-3 px-4 py-3 text-left text-sm text-gray-700 hover:bg-gray-50 rounded-lg transition-colors border border-gray-200">
              <FileText className="w-5 h-5 text-gray-500" />
              <span>{t.audit.guidanceHelp}</span>
            </button>

            <button className="w-full flex items-center gap-3 px-4 py-3 text-left text-sm text-gray-700 hover:bg-gray-50 rounded-lg transition-colors border border-gray-200">
              <FileText className="w-5 h-5 text-gray-500" />
              <span>{t.audit.addAttachments}</span>
            </button>

            <button className="w-full flex items-center gap-3 px-4 py-3 text-left text-sm text-gray-700 hover:bg-gray-50 rounded-lg transition-colors border border-gray-200">
              <Users className="w-5 h-5 text-gray-500" />
              <span>{t.audit.addAnotherUser}</span>
            </button>

            <button className="w-full flex items-center gap-3 px-4 py-3 text-left text-sm text-gray-700 hover:bg-gray-50 rounded-lg transition-colors border border-gray-200">
              <Settings className="w-5 h-5 text-gray-500" />
              <span>{t.audit.categoryAssignment}</span>
            </button>

            <button className="w-full flex items-center gap-3 px-4 py-3 text-left text-sm text-gray-700 hover:bg-gray-50 rounded-lg transition-colors border border-gray-200">
              <MessageSquare className="w-5 h-5 text-gray-500" />
              <span>{t.audit.addObservations}</span>
            </button>

            <button className="w-full flex items-center gap-3 px-4 py-3 text-left text-sm text-gray-700 hover:bg-gray-50 rounded-lg transition-colors border border-gray-200">
              <MessageSquare className="w-5 h-5 text-gray-500" />
              <span>{t.audit.addComments}</span>
            </button>

            {scope.status !== "Completed" && scope.status !== "Archived" && (
              <button
                onClick={handleCompleteFile}
                disabled={isSaving}
                className="w-full flex items-center gap-3 px-4 py-3 text-left text-sm text-blue-600 hover:bg-blue-50 rounded-lg transition-colors border border-blue-200 disabled:opacity-50"
              >
                <CheckCircle className="w-5 h-5" />
                <span className="font-medium">{t.audit.completeFile}</span>
              </button>
            )}

            {scope.status === "Completed" && (
              <button
                onClick={handleArchiveFile}
                disabled={isSaving}
                className="w-full flex items-center gap-3 px-4 py-3 text-left text-sm text-gray-700 hover:bg-gray-50 rounded-lg transition-colors border border-gray-200 disabled:opacity-50"
              >
                <Archive className="w-5 h-5 text-gray-500" />
                <span>{t.audit.archive}</span>
              </button>
            )}

            <button className="w-full flex items-center gap-3 px-4 py-3 text-left text-sm text-gray-700 hover:bg-gray-50 rounded-lg transition-colors border border-gray-200">
              <Download className="w-5 h-5 text-gray-500" />
              <span>{t.audit.downloadClientFile}</span>
            </button>

            <button className="w-full flex items-center gap-3 px-4 py-3 text-left text-sm text-blue-600 hover:bg-blue-50 rounded-lg transition-colors border border-blue-200">
              <FileText className="w-5 h-5" />
              <span className="font-medium">{t.audit.icvReport}</span>
            </button>

            <button className="w-full flex items-center gap-3 px-4 py-3 text-left text-sm text-gray-700 hover:bg-gray-50 rounded-lg transition-colors border border-gray-200">
              <FileText className="w-5 h-5 text-gray-500" />
              <span>{t.audit.recentActivity}</span>
            </button>
          </div>

          {/* Status Info */}
          <div className="mt-6 pt-6 border-t border-gray-200">
            {caseInfo.dueDate && new Date(caseInfo.dueDate) < new Date() && (
              <div className="flex items-center gap-2 text-red-600 mb-4">
                <AlertCircle className="w-5 h-5" />
                <span className="font-semibold">{t.audit.dueDateExceeded}</span>
              </div>
            )}

            <div className="grid grid-cols-2 gap-4 text-center">
              <div>
                <div className="text-3xl font-bold text-gray-900">177</div>
                <div className="text-sm text-gray-600">{t.audit.views}</div>
              </div>
              <div>
                <div className="text-3xl font-bold text-gray-900">6</div>
                <div className="text-sm text-gray-600">{t.audit.users}</div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
