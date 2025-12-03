"use client";

import { useState } from "react";
import { X, Download, Trash2, Edit2, Eye, User } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { formatDistanceToNow } from "date-fns";

export interface Document {
  id: string;
  name: string;
  type: string;
  size: number;
  category: string;
  status: "pending" | "approved" | "rejected";
  uploadedAt: string;
  uploadedBy: string;
  url?: string;
  version?: number;
  description?: string;
}

interface DocumentVersion {
  version: number;
  uploadedAt: string;
  uploadedBy: string;
  changes: string;
  url: string;
}

interface Comment {
  id: string;
  author: string;
  content: string;
  createdAt: string;
  avatar?: string;
}

interface DocumentPreviewDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  document: Document | null;
  onDownload?: (documentId: string) => void;
  onDelete?: (documentId: string) => void;
  onStatusChange?: (documentId: string, status: string) => void;
  onCategoryChange?: (documentId: string, category: string) => void;
}

export function DocumentPreviewDrawer({
  isOpen,
  onClose,
  document,
  onDownload,
  onDelete,
  onStatusChange,
  onCategoryChange,
}: DocumentPreviewDrawerProps) {
  const [activeTab, setActiveTab] = useState<"preview" | "details" | "history" | "comments">("preview");
  const [newComment, setNewComment] = useState("");
  const [editingMetadata, setEditingMetadata] = useState(false);

  // Mock data - replace with real API calls
  const versions: DocumentVersion[] = [
    {
      version: 3,
      uploadedAt: "2024-01-15T10:30:00Z",
      uploadedBy: "Ahmed Al-Mansoori",
      changes: "Updated figures based on Q4 results",
      url: "/api/documents/123/versions/3",
    },
    {
      version: 2,
      uploadedAt: "2024-01-10T14:20:00Z",
      uploadedBy: "Fatima Hassan",
      changes: "Added compliance notes",
      url: "/api/documents/123/versions/2",
    },
    {
      version: 1,
      uploadedAt: "2024-01-05T09:15:00Z",
      uploadedBy: "Mohammed Ali",
      changes: "Initial upload",
      url: "/api/documents/123/versions/1",
    },
  ];

  const comments: Comment[] = [
    {
      id: "1",
      author: "Sarah Wilson",
      content:
        "Please review the revenue figures on page 3. They seem to be inconsistent with the quarterly report.",
      createdAt: "2024-01-15T11:00:00Z",
      avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Sarah",
    },
    {
      id: "2",
      author: "Michael Chen",
      content: "Reviewed and approved. All figures match the general ledger.",
      createdAt: "2024-01-15T14:30:00Z",
      avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Michael",
    },
  ];

  if (!document) return null;

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + " B";
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
    return (bytes / (1024 * 1024)).toFixed(1) + " MB";
  };

  const getStatusColor = (status: string) => {
    const colors = {
      pending: { bg: "bg-yellow-100", text: "text-yellow-700", border: "border-yellow-300" },
      approved: { bg: "bg-green-100", text: "text-green-700", border: "border-green-300" },
      rejected: { bg: "bg-red-100", text: "text-red-700", border: "border-red-300" },
    };
    return colors[status as keyof typeof colors] || colors.pending;
  };

  const _statusColors = getStatusColor(document.status);

  const renderPreview = () => {
    if (document.type.includes("pdf")) {
      // For now, use iframe for external PDFs
      // PDFViewer from @safee/ui is for rendering react-pdf documents, not viewing external PDFs
      return (
        <div className="h-full flex items-center justify-center bg-gray-100">
          {document.url ? (
            <iframe src={document.url} className="w-full h-full border-0" title={document.name} />
          ) : (
            <p className="text-gray-500">No preview available</p>
          )}
        </div>
      );
    } else if (document.type.includes("image")) {
      return (
        <div className="flex items-center justify-center h-full bg-gray-100">
          <img
            src={document.url || ""}
            alt={document.name}
            className="max-w-full max-h-full object-contain"
          />
        </div>
      );
    } else {
      return (
        <div className="flex flex-col items-center justify-center h-full text-gray-500">
          <Eye className="h-16 w-16 mb-4 opacity-30" />
          <p className="text-lg font-medium">Preview not available</p>
          <p className="text-sm mt-2">This file type doesn&apos;t support preview</p>
          <button
            onClick={() => onDownload?.(document.id)}
            className="mt-4 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
          >
            Download to View
          </button>
        </div>
      );
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
                <h2 className="text-lg font-semibold text-gray-900 truncate">{document.name}</h2>
                <p className="text-sm text-gray-500 mt-0.5">
                  {formatFileSize(document.size)} • Version {document.version || 1}
                </p>
              </div>
              <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                <X className="h-5 w-5 text-gray-500" />
              </button>
            </div>

            {/* Tabs */}
            <div className="flex items-center border-b border-gray-200 px-6">
              <button
                onClick={() => setActiveTab("preview")}
                className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === "preview"
                    ? "border-blue-600 text-blue-600"
                    : "border-transparent text-gray-600 hover:text-gray-900"
                }`}
              >
                Preview
              </button>
              <button
                onClick={() => setActiveTab("details")}
                className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === "details"
                    ? "border-blue-600 text-blue-600"
                    : "border-transparent text-gray-600 hover:text-gray-900"
                }`}
              >
                Details
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
              </button>
              <button
                onClick={() => setActiveTab("comments")}
                className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === "comments"
                    ? "border-blue-600 text-blue-600"
                    : "border-transparent text-gray-600 hover:text-gray-900"
                }`}
              >
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
              {activeTab === "preview" && (
                <div className="h-full p-4">
                  <div className="h-full bg-gray-50 rounded-lg overflow-hidden">{renderPreview()}</div>
                </div>
              )}

              {activeTab === "details" && (
                <div className="p-6 space-y-6">
                  {/* Status */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => onStatusChange?.(document.id, "pending")}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                          document.status === "pending"
                            ? "bg-yellow-100 text-yellow-700 ring-2 ring-yellow-300"
                            : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                        }`}
                      >
                        Pending
                      </button>
                      <button
                        onClick={() => onStatusChange?.(document.id, "approved")}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                          document.status === "approved"
                            ? "bg-green-100 text-green-700 ring-2 ring-green-300"
                            : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                        }`}
                      >
                        Approved
                      </button>
                      <button
                        onClick={() => onStatusChange?.(document.id, "rejected")}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                          document.status === "rejected"
                            ? "bg-red-100 text-red-700 ring-2 ring-red-300"
                            : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                        }`}
                      >
                        Rejected
                      </button>
                    </div>
                  </div>

                  {/* Category */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Category</label>
                    <select
                      value={document.category}
                      onChange={(e) => onCategoryChange?.(document.id, e.target.value)}
                      disabled={!editingMetadata}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-50 disabled:text-gray-600"
                    >
                      <option value="Financial Statements">Financial Statements</option>
                      <option value="Audit Reports">Audit Reports</option>
                      <option value="Supporting Documents">Supporting Documents</option>
                      <option value="Compliance">Compliance</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>

                  {/* File Info */}
                  <div className="grid grid-cols-2 gap-4 pt-4 border-t border-gray-200">
                    <div>
                      <p className="text-sm text-gray-500 mb-1">File Type</p>
                      <p className="text-sm font-medium text-gray-900">{document.type}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500 mb-1">File Size</p>
                      <p className="text-sm font-medium text-gray-900">{formatFileSize(document.size)}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500 mb-1">Uploaded By</p>
                      <p className="text-sm font-medium text-gray-900">{document.uploadedBy}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500 mb-1">Uploaded</p>
                      <p className="text-sm font-medium text-gray-900">
                        {formatDistanceToNow(new Date(document.uploadedAt), { addSuffix: true })}
                      </p>
                    </div>
                  </div>

                  {/* Description */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
                    <textarea
                      defaultValue={document.description || ""}
                      disabled={!editingMetadata}
                      placeholder="Add a description..."
                      rows={3}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-50 disabled:text-gray-600 resize-none"
                    />
                  </div>

                  {/* Edit Button */}
                  <div className="flex items-center space-x-2">
                    {!editingMetadata ? (
                      <button
                        onClick={() => setEditingMetadata(true)}
                        className="flex items-center space-x-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                      >
                        <Edit2 className="h-4 w-4" />
                        <span>Edit Metadata</span>
                      </button>
                    ) : (
                      <>
                        <button
                          onClick={() => setEditingMetadata(false)}
                          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                        >
                          Save Changes
                        </button>
                        <button
                          onClick={() => setEditingMetadata(false)}
                          className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-lg transition-colors"
                        >
                          Cancel
                        </button>
                      </>
                    )}
                  </div>
                </div>
              )}

              {activeTab === "history" && (
                <div className="p-6">
                  <h3 className="text-sm font-semibold text-gray-900 mb-4">Version History</h3>
                  <div className="space-y-4">
                    {versions.map((version) => (
                      <div
                        key={version.version}
                        className="flex items-start space-x-3 p-4 bg-gray-50 rounded-lg border border-gray-200"
                      >
                        <div className="flex-shrink-0 w-10 h-10 bg-blue-600 text-white rounded-full flex items-center justify-center font-semibold">
                          v{version.version}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900">{version.changes}</p>
                          <div className="flex items-center space-x-2 mt-1 text-xs text-gray-500">
                            <User className="h-3 w-3" />
                            <span>{version.uploadedBy}</span>
                            <span>•</span>
                            <span>
                              {formatDistanceToNow(new Date(version.uploadedAt), { addSuffix: true })}
                            </span>
                          </div>
                        </div>
                        <button className="flex-shrink-0 px-3 py-1 text-xs text-blue-600 hover:bg-blue-50 rounded transition-colors">
                          Restore
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {activeTab === "comments" && (
                <div className="p-6">
                  <h3 className="text-sm font-semibold text-gray-900 mb-4">Comments</h3>

                  {/* Comment List */}
                  <div className="space-y-4 mb-6">
                    {comments.map((comment) => (
                      <div key={comment.id} className="flex items-start space-x-3">
                        <img
                          src={comment.avatar}
                          alt={comment.author}
                          className="w-8 h-8 rounded-full flex-shrink-0"
                        />
                        <div className="flex-1">
                          <div className="bg-gray-50 rounded-lg p-3">
                            <p className="text-sm font-medium text-gray-900 mb-1">{comment.author}</p>
                            <p className="text-sm text-gray-700">{comment.content}</p>
                          </div>
                          <p className="text-xs text-gray-500 mt-1">
                            {formatDistanceToNow(new Date(comment.createdAt), { addSuffix: true })}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Add Comment */}
                  <div className="border-t border-gray-200 pt-4">
                    <textarea
                      value={newComment}
                      onChange={(e) => setNewComment(e.target.value)}
                      placeholder="Add a comment..."
                      rows={3}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none mb-3"
                    />
                    <button className="w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors">
                      Post Comment
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Footer Actions */}
            <div className="flex items-center justify-between px-6 py-4 border-t border-gray-200 bg-gray-50">
              <button
                onClick={() => onDownload?.(document.id)}
                className="flex items-center space-x-2 px-4 py-2 bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 rounded-lg transition-colors"
              >
                <Download className="h-4 w-4" />
                <span>Download</span>
              </button>
              <button
                onClick={() => {
                  if (confirm("Are you sure you want to delete this document?")) {
                    onDelete?.(document.id);
                    onClose();
                  }
                }}
                className="flex items-center space-x-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
              >
                <Trash2 className="h-4 w-4" />
                <span>Delete</span>
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
