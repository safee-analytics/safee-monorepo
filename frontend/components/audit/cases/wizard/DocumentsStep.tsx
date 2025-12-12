"use client";

import { useState, useRef } from "react";
import type { WizardStepProps } from "./types";
import { Upload, X, FileText, File, Image as ImageIcon } from "lucide-react";

export function DocumentsStep({ data, onChange }: WizardStepProps) {
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const documentPreviews = data.documentPreviews || [];

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const newFiles = Array.from(e.dataTransfer.files);
      onChange({ documentPreviews: [...documentPreviews, ...newFiles] });
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const newFiles = Array.from(e.target.files);
      onChange({ documentPreviews: [...documentPreviews, ...newFiles] });
    }
  };

  const handleRemoveFile = (index: number) => {
    const newFiles = documentPreviews.filter((_, i) => i !== index);
    onChange({ documentPreviews: newFiles });
  };

  const getFileIcon = (file: File) => {
    const ext = file.name.split(".").pop()?.toLowerCase();
    if (["jpg", "jpeg", "png", "gif", "svg"].includes(ext || "")) {
      return <ImageIcon className="h-8 w-8 text-purple-600" />;
    } else if (["pdf"].includes(ext || "")) {
      return <FileText className="h-8 w-8 text-red-600" />;
    } else if (["doc", "docx"].includes(ext || "")) {
      return <FileText className="h-8 w-8 text-blue-600" />;
    } else if (["xls", "xlsx", "csv"].includes(ext || "")) {
      return <FileText className="h-8 w-8 text-green-600" />;
    }
    return <File className="h-8 w-8 text-gray-600" />;
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Upload Initial Documents</h3>
        <p className="text-sm text-gray-600">
          Optionally upload relevant documents now. You can also add documents later from the case detail
          page.
        </p>
      </div>

      {/* Upload Area */}
      <div
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        className={`relative border-2 border-dashed rounded-xl p-12 text-center transition-all ${
          dragActive
            ? "border-blue-500 bg-blue-50"
            : "border-gray-300 bg-gray-50 hover:border-gray-400 hover:bg-gray-100"
        }`}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple
          onChange={handleFileSelect}
          className="hidden"
          accept=".pdf,.doc,.docx,.xls,.xlsx,.csv,.jpg,.jpeg,.png,.gif"
        />

        <Upload className={`h-16 w-16 mx-auto mb-4 ${dragActive ? "text-blue-600" : "text-gray-400"}`} />

        <h4 className="text-lg font-semibold text-gray-900 mb-2">
          {dragActive ? "Drop files here" : "Upload Documents"}
        </h4>

        <p className="text-sm text-gray-600 mb-4">Drag and drop files here, or click to browse</p>

        <button
          onClick={() => fileInputRef.current?.click()}
          className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
        >
          Browse Files
        </button>

        <p className="text-xs text-gray-500 mt-4">
          Supported formats: PDF, Word, Excel, Images (Max 10MB per file)
        </p>
      </div>

      {/* Document Previews */}
      {documentPreviews.length > 0 && (
        <div>
          <h4 className="text-sm font-semibold text-gray-700 mb-3">
            Selected Documents ({documentPreviews.length})
          </h4>
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {documentPreviews.map((file, index) => (
              <div
                key={`${file.name}-${index}`}
                className="flex items-center justify-between p-4 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center space-x-4 flex-1">
                  <div className="flex-shrink-0">{getFileIcon(file)}</div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-900 truncate">{file.name}</p>
                    <p className="text-xs text-gray-500">
                      {formatFileSize(file.size)} • {file.type || "Unknown type"}
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => {
                    handleRemoveFile(index);
                  }}
                  className="ml-4 p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                  title="Remove file"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            ))}
          </div>

          {/* Suggested Categories */}
          {data.selectedTemplate && (
            <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-sm font-semibold text-blue-900 mb-2">Suggested Document Categories:</p>
              <div className="flex flex-wrap gap-2">
                {data.selectedTemplate.documentCategories.slice(0, 6).map((category) => (
                  <span
                    key={category}
                    className="px-3 py-1 bg-white text-blue-700 text-xs font-medium rounded-full border border-blue-200"
                  >
                    {category}
                  </span>
                ))}
              </div>
              <p className="text-xs text-blue-600 mt-2">
                These categories will be available when you upload documents to the case
              </p>
            </div>
          )}
        </div>
      )}

      {/* Info Box */}
      {documentPreviews.length === 0 && (
        <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg">
          <p className="text-sm text-gray-700">
            💡 <strong>Optional:</strong> You can upload documents now to get a head start, or skip this step
            and add them later when you have the files ready.
          </p>
        </div>
      )}

      {/* Upload Note */}
      {documentPreviews.length > 0 && (
        <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
          <p className="text-sm text-green-700">
            ✓{" "}
            <strong>
              {documentPreviews.length} document{documentPreviews.length > 1 ? "s" : ""}
            </strong>{" "}
            ready to upload. They will be uploaded when you create the case.
          </p>
        </div>
      )}
    </div>
  );
}
