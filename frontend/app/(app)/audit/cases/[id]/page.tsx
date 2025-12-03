"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Edit2, MoreVertical, CheckCircle, Clock, AlertCircle } from "lucide-react";
import { useCase } from "@/lib/api/hooks";
import { DocumentBrowser } from "@/components/audit/cases/DocumentBrowser";
import {
  DocumentPreviewDrawer,
  type Document as DocumentType,
} from "@/components/audit/cases/DocumentPreviewDrawer";
import { BulkUploadModal } from "@/components/audit/cases/BulkUploadModal";
import { ActivityFeed } from "@/components/collaboration/ActivityFeed";
import { ActiveViewers } from "@/components/collaboration/ActiveViewers";
import { AnimatedButton } from "@safee/ui";

type TabType = "overview" | "documents" | "activity" | "team";

export default function CaseDetailPage() {
  const params = useParams();
  const router = useRouter();
  const caseId = params.id as string;

  const [activeTab, setActiveTab] = useState<TabType>("overview");
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [previewDocument, setPreviewDocument] = useState<DocumentType | null>(null);

  // Fetch case data
  const { data: caseData, isLoading } = useCase(caseId);

  // Mock documents - replace with actual API call
  const mockDocuments = [
    {
      id: "1",
      name: "Financial_Statement_2024.pdf",
      type: "application/pdf",
      size: 2458624,
      category: "Financial Statements",
      status: "approved" as const,
      uploadedAt: "2024-01-15T10:30:00Z",
      uploadedBy: "Ahmed Al-Mansoori",
      url: "/api/documents/1",
      version: 2,
    },
    {
      id: "2",
      name: "Balance_Sheet_Q4.xlsx",
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      size: 856432,
      category: "Financial Statements",
      status: "pending" as const,
      uploadedAt: "2024-01-14T09:20:00Z",
      uploadedBy: "Fatima Hassan",
      url: "/api/documents/2",
      version: 1,
    },
    {
      id: "3",
      name: "Audit_Report_Draft.docx",
      type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      size: 1245680,
      category: "Audit Reports",
      status: "pending" as const,
      uploadedAt: "2024-01-13T14:45:00Z",
      uploadedBy: "Mohammed Ali",
      url: "/api/documents/3",
      version: 1,
    },
  ];

  const handleUpload = async (_files: Array<{ file: File; category: string }>) => {
    // Implement actual upload logic here
    console.warn("Uploading files:", _files);
    await new Promise((resolve) => setTimeout(resolve, 1000));
  };

  const getStatusBadge = (status: string) => {
    const styles = {
      pending: { bg: "bg-yellow-100", text: "text-yellow-700", icon: Clock },
      "in-progress": { bg: "bg-blue-100", text: "text-blue-700", icon: Clock },
      "under-review": { bg: "bg-purple-100", text: "text-purple-700", icon: AlertCircle },
      completed: { bg: "bg-green-100", text: "text-green-700", icon: CheckCircle },
      overdue: { bg: "bg-red-100", text: "text-red-700", icon: AlertCircle },
    };
    return styles[status as keyof typeof styles] || styles.pending;
  };

  const getPriorityBadge = (priority: string) => {
    const styles = {
      low: { bg: "bg-gray-100", text: "text-gray-700" },
      medium: { bg: "bg-blue-100", text: "text-blue-700" },
      high: { bg: "bg-orange-100", text: "text-orange-700" },
      critical: { bg: "bg-red-100", text: "text-red-700" },
    };
    return styles[priority as keyof typeof styles] || styles.medium;
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" />
      </div>
    );
  }

  if (!caseData) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Case Not Found</h2>
          <p className="text-gray-600 mb-4">The case you&apos;re looking for doesn&apos;t exist.</p>
          <AnimatedButton onClick={() => router.push("/audit/cases")} variant="primary">
            Back to Cases
          </AnimatedButton>
        </div>
      </div>
    );
  }

  const statusBadge = getStatusBadge(caseData.status);
  const priorityBadge = getPriorityBadge(caseData.priority);
  const StatusIcon = statusBadge.icon;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center space-x-4 mb-4">
            <button
              onClick={() => router.push("/audit/cases")}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ArrowLeft className="h-5 w-5 text-gray-600" />
            </button>
            <div className="flex-1">
              <div className="flex items-center space-x-3 mb-2">
                <h1 className="text-2xl font-bold text-gray-900">{caseData.clientName || "Unnamed Case"}</h1>
                <span
                  className={`px-3 py-1 rounded-full text-xs font-medium ${statusBadge.bg} ${statusBadge.text} flex items-center space-x-1`}
                >
                  <StatusIcon className="h-3 w-3" />
                  <span>{caseData.status}</span>
                </span>
                <span
                  className={`px-3 py-1 rounded-full text-xs font-medium ${priorityBadge.bg} ${priorityBadge.text}`}
                >
                  {caseData.priority}
                </span>
              </div>
              <div className="flex items-center space-x-4 text-sm text-gray-600">
                <span>{caseData.caseNumber}</span>
                <span>•</span>
                <span>{caseData.auditType?.replace(/_/g, " ")}</span>
                {caseData.dueDate && (
                  <>
                    <span>•</span>
                    <span>Due {new Date(caseData.dueDate).toLocaleDateString()}</span>
                  </>
                )}
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <ActiveViewers caseId={caseId} enableRealtime={true} variant="compact" />
              <AnimatedButton variant="outline" size="md" className="flex items-center space-x-2">
                <Edit2 className="h-4 w-4" />
                <span>Edit</span>
              </AnimatedButton>
              <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                <MoreVertical className="h-5 w-5 text-gray-600" />
              </button>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex items-center space-x-1 border-b border-gray-200 -mb-px">
            <button
              onClick={() => setActiveTab("overview")}
              className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                activeTab === "overview"
                  ? "border-blue-600 text-blue-600"
                  : "border-transparent text-gray-600 hover:text-gray-900"
              }`}
            >
              Overview
            </button>
            <button
              onClick={() => setActiveTab("documents")}
              className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                activeTab === "documents"
                  ? "border-blue-600 text-blue-600"
                  : "border-transparent text-gray-600 hover:text-gray-900"
              }`}
            >
              Documents
              <span className="ml-2 px-2 py-0.5 bg-gray-200 text-gray-700 text-xs rounded-full">
                {mockDocuments.length}
              </span>
            </button>
            <button
              onClick={() => setActiveTab("activity")}
              className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                activeTab === "activity"
                  ? "border-blue-600 text-blue-600"
                  : "border-transparent text-gray-600 hover:text-gray-900"
              }`}
            >
              Activity
            </button>
            <button
              onClick={() => setActiveTab("team")}
              className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                activeTab === "team"
                  ? "border-blue-600 text-blue-600"
                  : "border-transparent text-gray-600 hover:text-gray-900"
              }`}
            >
              Team
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-6 py-6">
        {activeTab === "overview" && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Main Info */}
            <div className="lg:col-span-2 space-y-6">
              <div className="bg-white rounded-xl border border-gray-200 p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Case Details</h2>
                <dl className="grid grid-cols-2 gap-4">
                  <div>
                    <dt className="text-sm text-gray-500">Client Name</dt>
                    <dd className="text-sm font-medium text-gray-900 mt-1">{caseData.clientName}</dd>
                  </div>
                  <div>
                    <dt className="text-sm text-gray-500">Audit Type</dt>
                    <dd className="text-sm font-medium text-gray-900 mt-1">
                      {caseData.auditType?.replace(/_/g, " ")}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-sm text-gray-500">Status</dt>
                    <dd className="text-sm font-medium text-gray-900 mt-1">{caseData.status}</dd>
                  </div>
                  <div>
                    <dt className="text-sm text-gray-500">Priority</dt>
                    <dd className="text-sm font-medium text-gray-900 mt-1">{caseData.priority}</dd>
                  </div>
                  <div>
                    <dt className="text-sm text-gray-500">Due Date</dt>
                    <dd className="text-sm font-medium text-gray-900 mt-1">
                      {caseData.dueDate ? new Date(caseData.dueDate).toLocaleDateString() : "Not set"}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-sm text-gray-500">Case Number</dt>
                    <dd className="text-sm font-medium text-gray-900 mt-1">{caseData.caseNumber}</dd>
                  </div>
                </dl>
              </div>

              {/* Recent Activity */}
              <div className="bg-white rounded-xl border border-gray-200 p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Recent Activity</h2>
                <p className="text-sm text-gray-600">No recent activity</p>
              </div>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Team */}
              <div className="bg-white rounded-xl border border-gray-200 p-6">
                <h3 className="text-sm font-semibold text-gray-900 mb-4">Assigned Team</h3>
                <p className="text-sm text-gray-600">No team members assigned</p>
              </div>

              {/* Documents Summary */}
              <div className="bg-white rounded-xl border border-gray-200 p-6">
                <h3 className="text-sm font-semibold text-gray-900 mb-4">Documents</h3>
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">Total</span>
                    <span className="font-medium text-gray-900">{mockDocuments.length}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">Pending Review</span>
                    <span className="font-medium text-yellow-600">
                      {mockDocuments.filter((d) => d.status === "pending").length}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">Approved</span>
                    <span className="font-medium text-green-600">
                      {mockDocuments.filter((d) => d.status === "approved").length}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === "documents" && (
          <DocumentBrowser
            caseId={caseId}
            documents={mockDocuments}
            isLoading={false}
            onUpload={(_files) => {
              setShowUploadModal(true);
            }}
            onDocumentClick={(doc) => setPreviewDocument(doc)}
            onDownload={(docIds) => {
              console.warn("Download documents:", docIds);
            }}
            onDelete={(docIds) => {
              console.warn("Delete documents:", docIds);
            }}
          />
        )}

        {activeTab === "activity" && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Activity Feed */}
            <div className="lg:col-span-2">
              <div className="bg-white rounded-xl border border-gray-200 p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Activity Timeline</h2>
                <ActivityFeed caseId={caseId} enableRealtime={true} showMarkAsRead={true} limit={50} />
              </div>
            </div>

            {/* Active Viewers Sidebar */}
            <div className="lg:col-span-1">
              <ActiveViewers caseId={caseId} enableRealtime={true} variant="full" />
            </div>
          </div>
        )}

        {activeTab === "team" && (
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Team Members</h2>
            <p className="text-sm text-gray-600">Team management coming soon...</p>
          </div>
        )}
      </div>

      {/* Modals */}
      <BulkUploadModal
        isOpen={showUploadModal}
        onClose={() => setShowUploadModal(false)}
        onUpload={handleUpload}
      />

      <DocumentPreviewDrawer
        isOpen={!!previewDocument}
        onClose={() => setPreviewDocument(null)}
        document={previewDocument}
      />
    </div>
  );
}
