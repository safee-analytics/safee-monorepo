"use client";

import { X, FileText, CheckCircle2, AlertCircle, Clock } from "lucide-react";

interface DocumentVersion {
  version: number;
  uploadedBy: string;
  uploadedAt: string;
  status: "pending" | "under-review" | "approved" | "rejected";
  changes?: string;
}

interface DocumentVersionModalProps {
  isOpen: boolean;
  onClose: () => void;
  documentName: string;
  versions: DocumentVersion[];
  currentVersion: number;
}

export function DocumentVersionModal({
  isOpen,
  onClose,
  documentName,
  versions,
  currentVersion,
}: DocumentVersionModalProps) {
  if (!isOpen) return null;

  const getStatusColor = (status: DocumentVersion["status"]) => {
    switch (status) {
      case "approved":
        return "bg-green-100 text-green-700";
      case "under-review":
        return "bg-yellow-100 text-yellow-700";
      case "rejected":
        return "bg-red-100 text-red-700";
      default:
        return "bg-gray-100 text-gray-700";
    }
  };

  const getStatusIcon = (status: DocumentVersion["status"]) => {
    switch (status) {
      case "approved":
        return <CheckCircle2 className="w-4 h-4 text-green-600" />;
      case "under-review":
        return <Clock className="w-4 h-4 text-yellow-600" />;
      case "rejected":
        return <AlertCircle className="w-4 h-4 text-red-600" />;
      default:
        return <Clock className="w-4 h-4 text-gray-600" />;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />

      {/* Modal */}
      <div className="relative bg-white rounded-xl shadow-xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div>
            <h2 className="text-xl font-bold text-gray-900">Document Version History</h2>
            <p className="text-sm text-gray-600 mt-1">{documentName}</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
            <X className="w-5 h-5 text-gray-600" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          <div className="space-y-4">
            {versions
              .sort((a, b) => b.version - a.version)
              .map((version, index) => (
                <div
                  key={version.version}
                  className={`border-2 rounded-lg p-4 ${
                    version.version === currentVersion
                      ? "border-blue-500 bg-blue-50"
                      : "border-gray-200 bg-white"
                  }`}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                        <FileText className="w-5 h-5 text-blue-600" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold text-gray-900">Version {version.version}</h3>
                          {version.version === currentVersion && (
                            <span className="px-2 py-0.5 bg-blue-600 text-white text-xs font-medium rounded">
                              Current
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-3 mt-1 text-xs text-gray-600">
                          <span>Uploaded by {version.uploadedBy}</span>
                          <span>•</span>
                          <span>{version.uploadedAt}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {getStatusIcon(version.status)}
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(version.status)}`}
                      >
                        {version.status}
                      </span>
                    </div>
                  </div>

                  {/* Changes */}
                  {version.changes && (
                    <div className="mt-3 p-3 bg-gray-50 rounded-lg">
                      <p className="text-xs font-medium text-gray-700 mb-1">Changes in this version:</p>
                      <p className="text-sm text-gray-600">{version.changes}</p>
                    </div>
                  )}

                  {/* Comparison with previous version */}
                  {index < versions.length - 1 && (
                    <div className="mt-3 pt-3 border-t border-gray-200">
                      <button className="text-sm text-blue-600 hover:text-blue-700 font-medium">
                        Compare with v{versions[index + 1].version}
                      </button>
                    </div>
                  )}
                </div>
              ))}
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-6 border-t border-gray-200 bg-gray-50">
          <div className="text-sm text-gray-600">
            {versions.length} {versions.length === 1 ? "version" : "versions"} in history
          </div>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
