"use client";

import { useState } from "react";
import { FileText, Download, Eye, FolderOpen, Calendar, File, Shield } from "lucide-react";

interface Document {
  id: string;
  name: string;
  category: string;
  uploadedAt: string;
  size: string;
  type: "pdf" | "doc" | "image";
  isConfidential: boolean;
}

const categoryIcons: Record<string, React.ComponentType<{ className?: string }>> = {
  Contracts: Shield,
  Policies: FileText,
  Forms: File,
  Other: FolderOpen,
};

export default function MyDocumentsPage() {
  const [selectedCategory, setSelectedCategory] = useState<string>("all");

  // Mock data - replace with actual API call
  const documents: Document[] = [
    {
      id: "1",
      name: "Employment Contract 2024.pdf",
      category: "Contracts",
      uploadedAt: "2024-01-01",
      size: "1.2 MB",
      type: "pdf",
      isConfidential: true,
    },
    {
      id: "2",
      name: "Employee Handbook.pdf",
      category: "Policies",
      uploadedAt: "2024-01-01",
      size: "3.5 MB",
      type: "pdf",
      isConfidential: false,
    },
    {
      id: "3",
      name: "Benefits Enrollment Form.pdf",
      category: "Forms",
      uploadedAt: "2024-01-15",
      size: "450 KB",
      type: "pdf",
      isConfidential: false,
    },
    {
      id: "4",
      name: "Tax Form W-4.pdf",
      category: "Forms",
      uploadedAt: "2024-01-01",
      size: "250 KB",
      type: "pdf",
      isConfidential: true,
    },
  ];

  const categories = ["all", ...Array.from(new Set(documents.map((d) => d.category)))];

  const filteredDocuments =
    selectedCategory === "all" ? documents : documents.filter((d) => d.category === selectedCategory);

  const documentsByCategory = categories.reduce(
    (acc, category) => {
      acc[category] =
        category === "all" ? documents.length : documents.filter((d) => d.category === category).length;
      return acc;
    },
    {} as Record<string, number>,
  );

  function handleDownload(_documentId: string) {
    // TODO: Implement actual download
  }

  function handleView(_documentId: string) {
    // TODO: Implement view modal
  }

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">My Documents</h1>
        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
          Access your HR documents and contracts
        </p>
      </div>

      {/* Category Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        {categories.map((category) => {
          const Icon = category === "all" ? FolderOpen : categoryIcons[category] || FileText;
          return (
            <button
              key={category}
              onClick={() => setSelectedCategory(category)}
              className={`p-4 rounded-xl border-2 transition-all ${
                selectedCategory === category
                  ? "border-safee-600 dark:border-safee-500 bg-safee-50 dark:bg-safee-900/20"
                  : "border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:border-gray-300 dark:hover:border-gray-600"
              }`}
            >
              <Icon
                className={`w-6 h-6 mb-2 ${
                  selectedCategory === category
                    ? "text-safee-600 dark:text-safee-400"
                    : "text-gray-400 dark:text-gray-500"
                }`}
              />
              <p
                className={`text-sm font-medium ${
                  selectedCategory === category
                    ? "text-safee-700 dark:text-safee-300"
                    : "text-gray-700 dark:text-gray-300"
                }`}
              >
                {category === "all" ? "All Documents" : category}
              </p>
              <p
                className={`text-xs mt-1 ${
                  selectedCategory === category
                    ? "text-safee-600 dark:text-safee-400"
                    : "text-gray-500 dark:text-gray-400"
                }`}
              >
                {documentsByCategory[category]} {documentsByCategory[category] === 1 ? "file" : "files"}
              </p>
            </button>
          );
        })}
      </div>

      {/* Documents List */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
            {selectedCategory === "all" ? "All Documents" : selectedCategory}
          </h2>
        </div>

        {filteredDocuments.length > 0 ? (
          <div className="divide-y divide-gray-200 dark:divide-gray-700">
            {filteredDocuments.map((document) => (
              <div
                key={document.id}
                className="p-6 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4 flex-1">
                    <div className="w-12 h-12 rounded-lg bg-red-100 dark:bg-red-900/20 flex items-center justify-center">
                      <FileText className="w-6 h-6 text-red-600 dark:text-red-400" />
                    </div>

                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold text-gray-900 dark:text-gray-100">{document.name}</h3>
                        {document.isConfidential && (
                          <span className="px-2 py-0.5 bg-amber-100 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400 text-xs font-medium rounded-full flex items-center gap-1">
                            <Shield className="w-3 h-3" />
                            Confidential
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400 mt-1">
                        <span>{document.category}</span>
                        <span>•</span>
                        <span>{document.size}</span>
                        <span>•</span>
                        <span className="flex items-center gap-1">
                          <Calendar className="w-4 h-4" />
                          {new Date(document.uploadedAt).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleView(document.id)}
                      className="px-3 py-2 text-safee-600 dark:text-safee-400 hover:bg-safee-50 dark:hover:bg-safee-900/20 rounded-lg transition-colors text-sm font-medium flex items-center gap-2"
                    >
                      <Eye className="w-4 h-4" />
                      View
                    </button>
                    <button
                      onClick={() => handleDownload(document.id)}
                      className="px-3 py-2 bg-safee-600 text-white rounded-lg hover:bg-safee-700 transition-colors text-sm font-medium flex items-center gap-2"
                    >
                      <Download className="w-4 h-4" />
                      Download
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-12 text-center">
            <FolderOpen className="w-12 h-12 text-gray-400 dark:text-gray-600 mx-auto mb-4" />
            <p className="text-gray-600 dark:text-gray-400">
              No documents found in {selectedCategory === "all" ? "this category" : selectedCategory}
            </p>
          </div>
        )}
      </div>

      {/* Info Banner */}
      <div className="mt-6 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-4">
        <div className="flex items-start gap-3">
          <Shield className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
          <div>
            <h4 className="text-sm font-semibold text-blue-900 dark:text-blue-100">Document Security</h4>
            <p className="text-sm text-blue-700 dark:text-blue-300 mt-1">
              All documents are securely stored and encrypted. Confidential documents are only accessible to
              you and authorized HR personnel.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
