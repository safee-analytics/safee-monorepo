"use client";

import { useState } from "react";
import { X, CheckCircle2, Clock, Calendar, User, FileText, MessageSquare } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { formatDistanceToNow } from "date-fns";
import { Button } from "@safee/ui";
import type { components } from "@/lib/api/types/audit";
import { procedureRequirementsSchema, fieldDataSchema, type CustomField } from "@/lib/validation";

type ProcedureResponse = components["schemas"]["ProcedureResponse"];

interface ProcedureDetailDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  procedure: ProcedureResponse | null;
  onComplete?: () => void;
  onEdit?: () => void;
}

interface ProcedureHistory {
  id: string;
  action: string;
  performedBy: string;
  performedAt: string;
  details?: string;
}

interface Comment {
  id: string;
  author: string;
  content: string;
  createdAt: string;
  avatar?: string;
}

export function ProcedureDetailDrawer({
  isOpen,
  onClose,
  procedure,
  onComplete,
  onEdit,
}: ProcedureDetailDrawerProps) {
  const [activeTab, setActiveTab] = useState<"details" | "attachments" | "history" | "comments">(
    "details"
  );
  const [newComment, setNewComment] = useState("");

  // Mock data - replace with real API calls
  const history: ProcedureHistory[] = procedure?.isCompleted
    ? [
        {
          id: "1",
          action: "Completed",
          performedBy: procedure.completedBy || "Unknown",
          performedAt: procedure.completedAt || new Date().toISOString(),
          details: procedure.memo || undefined,
        },
        {
          id: "2",
          action: "Created",
          performedBy: "System",
          performedAt: procedure.createdAt,
        },
      ]
    : [
        {
          id: "1",
          action: "Created",
          performedBy: "System",
          performedAt: procedure?.createdAt || new Date().toISOString(),
        },
      ];

  const comments: Comment[] = [];

  if (!procedure) return null;

  // Parse requirements and field data
  const requirements = procedureRequirementsSchema.safeParse(procedure.requirements).success
    ? procedureRequirementsSchema.parse(procedure.requirements)
    : {};

  const fieldData = fieldDataSchema.safeParse(procedure.fieldData).success
    ? fieldDataSchema.parse(procedure.fieldData)
    : {};

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const renderFieldValue = (field: CustomField) => {
    const value = fieldData[field.name];

    if (value === undefined || value === null || value === "") {
      return <span className="text-gray-400 italic">Not provided</span>;
    }

    switch (field.type) {
      case "checkbox":
        return value ? (
          <span className="text-green-600 font-medium">✓ Yes</span>
        ) : (
          <span className="text-gray-600">✗ No</span>
        );

      case "date":
        return formatDate(String(value));

      case "number":
        return String(value);

      case "select":
      case "text":
      case "textarea":
      default:
        return String(value);
    }
  };

  const handleAddComment = () => {
    if (!newComment.trim()) return;

    // TODO: [Backend/Frontend] - Implement comment submission API
//   Details: Implement the backend API endpoint for submitting comments and integrate it with this frontend component to allow users to add comments to procedures.
//   Priority: High
    setNewComment("");
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
            className="fixed inset-0 bg-black/30 backdrop-blur-sm z-40"
          />

          {/* Drawer */}
          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 30, stiffness: 300 }}
            className="fixed right-0 top-0 h-full w-full md:w-2/3 lg:w-1/2 bg-white shadow-2xl z-50 flex flex-col"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
              <div className="flex-1 min-w-0 mr-4">
                <div className="flex items-center gap-3 mb-1">
                  <span className="px-2 py-0.5 bg-blue-100 text-blue-700 text-xs font-medium rounded">
                    {procedure.referenceNumber}
                  </span>
                  {procedure.isCompleted && (
                    <span className="flex items-center gap-1 px-2 py-0.5 bg-green-100 text-green-700 text-xs font-medium rounded">
                      <CheckCircle2 className="h-3 w-3" />
                      Completed
                    </span>
                  )}
                </div>
                <h2 className="text-lg font-semibold text-gray-900">{procedure.title}</h2>
                {procedure.description && (
                  <p className="text-sm text-gray-600 mt-1">{procedure.description}</p>
                )}
              </div>
              <button
                onClick={onClose}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="h-5 w-5 text-gray-500" />
              </button>
            </div>

            {/* Action Buttons */}
            {!procedure.isCompleted && (
              <div className="px-6 py-3 border-b border-gray-200 bg-gray-50">
                <div className="flex items-center gap-2">
                  <Button onClick={onComplete} size="sm" className="flex-1">
                    <CheckCircle2 className="h-4 w-4 mr-2" />
                    Complete Procedure
                  </Button>
                  {onEdit && procedure.canEdit && (
                    <Button onClick={onEdit} variant="outline" size="sm">
                      Edit
                    </Button>
                  )}
                </div>
              </div>
            )}

            {/* Tabs */}
            <div className="flex items-center border-b border-gray-200 px-6">
              <button
                onClick={() => setActiveTab("details")}
                className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === "details"
                    ? "border-blue-600 text-blue-600"
                    : "border-transparent text-gray-600 hover:text-gray-900"
                }`}
              >
                <FileText className="h-4 w-4 inline mr-1.5" />
                Details
              </button>
              <button
                onClick={() => setActiveTab("attachments")}
                className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === "attachments"
                    ? "border-blue-600 text-blue-600"
                    : "border-transparent text-gray-600 hover:text-gray-900"
                }`}
              >
                Attachments
                {/* TODO: [Frontend] - Display attachment count
                Details: Implement logic to show the actual number of attachments for the procedure in the Attachments tab.
                Priority: Medium */}
              </button>
              <button
                onClick={() => setActiveTab("history")}
                className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === "history"
                    ? "border-blue-600 text-blue-600"
                    : "border-transparent text-gray-600 hover:text-gray-900"
                }`}
              >
                History
                {history.length > 0 && (
                  <span className="ml-1.5 px-1.5 py-0.5 bg-blue-100 text-blue-600 text-xs rounded-full">
                    {history.length}
                  </span>
                )}
              </button>
              <button
                onClick={() => setActiveTab("comments")}
                className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === "comments"
                    ? "border-blue-600 text-blue-600"
                    : "border-transparent text-gray-600 hover:text-gray-900"
                }`}
              >
                <MessageSquare className="h-4 w-4 inline mr-1.5" />
                Comments
                {comments.length > 0 && (
                  <span className="ml-1.5 px-1.5 py-0.5 bg-blue-100 text-blue-600 text-xs rounded-full">
                    {comments.length}
                  </span>
                )}
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto">
              {/* Details Tab */}
              {activeTab === "details" && (
                <div className="p-6 space-y-6">
                  {/* Basic Information */}
                  <div>
                    <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wider mb-3">
                      Basic Information
                    </h3>
                    <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">Reference Number</span>
                        <span className="text-sm font-medium text-gray-900">
                          {procedure.referenceNumber}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">Sort Order</span>
                        <span className="text-sm font-medium text-gray-900">
                          {procedure.sortOrder}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">Status</span>
                        <span
                          className={`text-sm font-medium ${
                            procedure.isCompleted ? "text-green-600" : "text-yellow-600"
                          }`}
                        >
                          {procedure.isCompleted ? "Completed" : "Pending"}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Custom Fields */}
                  {requirements.customFields && requirements.customFields.length > 0 && (
                    <div>
                      <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wider mb-3">
                        Custom Fields
                      </h3>
                      <div className="space-y-3">
                        {requirements.customFields.map((field) => (
                          <div
                            key={field.name}
                            className="bg-gray-50 rounded-lg p-4 space-y-1"
                          >
                            <div className="flex items-center justify-between">
                              <span className="text-sm font-medium text-gray-700">
                                {field.label}
                                {field.required && (
                                  <span className="text-red-600 ml-1">*</span>
                                )}
                              </span>
                              <span className="text-xs text-gray-500 uppercase">
                                {field.type}
                              </span>
                            </div>
                            <div className="text-sm text-gray-900">
                              {renderFieldValue(field)}
                            </div>
                            {field.helpText && (
                              <p className="text-xs text-gray-500 mt-1">{field.helpText}</p>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Observations */}
                  {procedure.memo && (
                    <div>
                      <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wider mb-3">
                        Observations / Notes
                      </h3>
                      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                        <p className="text-sm text-gray-900 whitespace-pre-wrap">
                          {procedure.memo}
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Completion Info */}
                  {procedure.isCompleted && (
                    <div>
                      <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wider mb-3">
                        Completion Details
                      </h3>
                      <div className="bg-green-50 border border-green-200 rounded-lg p-4 space-y-2">
                        <div className="flex items-center gap-2">
                          <User className="h-4 w-4 text-green-700" />
                          <span className="text-sm text-green-900">
                            Completed by <strong>{procedure.completedBy}</strong>
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-green-700" />
                          <span className="text-sm text-green-900">
                            {procedure.completedAt && formatDate(procedure.completedAt)}
                          </span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Attachments Tab */}
              {activeTab === "attachments" && (
                <div className="p-6">
                  <div className="text-center py-12">
                    <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <FileText className="h-8 w-8 text-gray-400" />
                    </div>
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No Attachments</h3>
                    <p className="text-sm text-gray-600 mb-4">
                      Upload documents related to this procedure
                    </p>
                    <Button variant="outline" size="sm">
                      Upload Files
                    </Button>
                  </div>
                </div>
              )}

              {/* History Tab */}
              {activeTab === "history" && (
                <div className="p-6">
                  <div className="space-y-4">
                    {history.map((item, index) => (
                      <div key={item.id} className="flex gap-4">
                        <div className="flex flex-col items-center">
                          <div
                            className={`w-8 h-8 rounded-full flex items-center justify-center ${
                              item.action === "Completed"
                                ? "bg-green-100"
                                : "bg-gray-100"
                            }`}
                          >
                            {item.action === "Completed" ? (
                              <CheckCircle2 className="h-4 w-4 text-green-600" />
                            ) : (
                              <Clock className="h-4 w-4 text-gray-600" />
                            )}
                          </div>
                          {index < history.length - 1 && (
                            <div className="w-0.5 h-full bg-gray-200 mt-2" />
                          )}
                        </div>
                        <div className="flex-1 pb-8">
                          <div className="flex items-start justify-between mb-1">
                            <div>
                              <p className="text-sm font-medium text-gray-900">
                                {item.action}
                              </p>
                              <p className="text-xs text-gray-600">
                                by {item.performedBy} •{" "}
                                {formatDistanceToNow(new Date(item.performedAt), {
                                  addSuffix: true,
                                })}
                              </p>
                            </div>
                          </div>
                          {item.details && (
                            <p className="text-sm text-gray-700 mt-2 bg-gray-50 rounded p-3">
                              {item.details}
                            </p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Comments Tab */}
              {activeTab === "comments" && (
                <div className="p-6">
                  {comments.length > 0 ? (
                    <div className="space-y-4 mb-6">
                      {comments.map((comment) => (
                        <div key={comment.id} className="flex gap-3">
                          <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                            <User className="h-4 w-4 text-blue-600" />
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center justify-between mb-1">
                              <p className="text-sm font-medium text-gray-900">
                                {comment.author}
                              </p>
                              <p className="text-xs text-gray-500">
                                {formatDistanceToNow(new Date(comment.createdAt), {
                                  addSuffix: true,
                                })}
                              </p>
                            </div>
                            <p className="text-sm text-gray-700">{comment.content}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 mb-6">
                      <MessageSquare className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                      <p className="text-sm text-gray-500">No comments yet</p>
                      <p className="text-xs text-gray-400 mt-1">
                        Start a discussion about this procedure
                      </p>
                    </div>
                  )}

                  {/* Add Comment */}
                  <div className="border-t pt-4">
                    <textarea
                      value={newComment}
                      onChange={(e) => setNewComment(e.target.value)}
                      placeholder="Add a comment..."
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                    />
                    <div className="flex justify-end mt-2">
                      <Button onClick={() => void handleAddComment()} size="sm">
                        Add Comment
                      </Button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
