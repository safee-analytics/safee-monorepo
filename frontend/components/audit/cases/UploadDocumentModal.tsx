"use client";

import { useState, useRef } from "react";
import { X, Upload, FileText, AlertCircle } from "lucide-react";

interface UploadDocumentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUpload: (file: File, metadata: DocumentMetadata) => void;
}

export interface DocumentMetadata {
  name: string;
  type: string;
  required: boolean;
  category: string;
}

const documentCategories = [
  "Financial Statements",
  "Audit Reports",
  "Company Registration",
  "Risk Assessment",
  "Supporting Documents",
  "Other",
];

export function UploadDocumentModal({ isOpen, onClose, onUpload }: UploadDocumentModalProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isRequired, setIsRequired] = useState(false);
  const [category, setCategory] = useState(documentCategories[0]);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleFileSelect = (file: File) => {
    setSelectedFile(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      handleFileSelect(files[0]);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      handleFileSelect(files[0]);
    }
  };

  const handleUpload = () => {
    if (!selectedFile) return;

    const fileType = selectedFile.name.split(".").pop()?.toUpperCase() || "FILE";

    onUpload(selectedFile, {
      name: selectedFile.name,
      type: fileType,
      required: isRequired,
      category,
    });

    // Reset form
    setSelectedFile(null);
    setIsRequired(false);
    setCategory(documentCategories[0]);
    onClose();
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes  } B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)  } KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)  } MB`;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />

      {/* Modal */}
      <div className="relative bg-white rounded-xl shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div>
            <h2 className="text-xl font-bold text-gray-900">Upload Document</h2>
            <p className="text-sm text-gray-600 mt-1">Add a new document to this case</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
            <X className="w-5 h-5 text-gray-600" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* File Upload Area */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Document File</label>
            <div
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
                isDragging ? "border-blue-500 bg-blue-50" : "border-gray-300 hover:border-gray-400"
              }`}
            >
              {selectedFile ? (
                <div className="flex items-center justify-center gap-3">
                  <FileText className="w-8 h-8 text-blue-600" />
                  <div className="text-left">
                    <p className="text-sm font-medium text-gray-900">{selectedFile.name}</p>
                    <p className="text-xs text-gray-500">{formatFileSize(selectedFile.size)}</p>
                  </div>
                  <button
                    onClick={() => { setSelectedFile(null); }}
                    className="ml-4 p-1 hover:bg-gray-100 rounded transition-colors"
                  >
                    <X className="w-4 h-4 text-gray-600" />
                  </button>
                </div>
              ) : (
                <>
                  <Upload className="w-12 h-12 mx-auto text-gray-400 mb-3" />
                  <p className="text-sm text-gray-600 mb-2">
                    Drag and drop your file here, or click to browse
                  </p>
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="text-sm text-blue-600 hover:text-blue-700 font-medium"
                  >
                    Choose File
                  </button>
                  <input ref={fileInputRef} type="file" onChange={handleFileInputChange} className="hidden" />
                </>
              )}
            </div>
          </div>

          {/* Category Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Document Category</label>
            <select
              value={category}
              onChange={(e) => { setCategory(e.target.value); }}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              {documentCategories.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>

          {/* Required Checkbox */}
          <div className="flex items-start gap-3 p-4 bg-gray-50 rounded-lg">
            <input
              type="checkbox"
              id="required"
              checked={isRequired}
              onChange={(e) => { setIsRequired(e.target.checked); }}
              className="mt-1 rounded border-gray-300 cursor-pointer"
            />
            <div>
              <label htmlFor="required" className="text-sm font-medium text-gray-900 cursor-pointer">
                Mark as Required
              </label>
              <p className="text-xs text-gray-600 mt-1">
                Required documents must be approved before the case can be completed
              </p>
            </div>
          </div>

          {/* Info Notice */}
          <div className="flex items-start gap-3 p-4 bg-blue-50 rounded-lg">
            <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-blue-900">
              <p className="font-medium mb-1">Document Review Process</p>
              <p className="text-blue-700">
                Once uploaded, documents will be marked as &ldquo;Pending&rdquo; and require review and
                approval before they can be used in workflow steps.
              </p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-200">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleUpload}
            disabled={!selectedFile}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Upload Document
          </button>
        </div>
      </div>
    </div>
  );
}
