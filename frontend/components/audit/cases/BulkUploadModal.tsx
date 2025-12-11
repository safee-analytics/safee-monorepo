"use client";

import { useState, useRef } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { X, Upload, File, FileText, Image as ImageIcon, CheckCircle, XCircle, Loader } from "lucide-react";

interface FileUploadItem {
  file: File;
  status: "pending" | "uploading" | "success" | "error";
  progress: number;
  category?: string;
  error?: string;
}

interface BulkUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUpload: (files: { file: File; category: string }[]) => Promise<void>;
  defaultCategory?: string;
  availableCategories?: string[];
}

const DEFAULT_CATEGORIES = [
  "Financial Statements",
  "Audit Reports",
  "Supporting Documents",
  "Bank Statements",
  "Trial Balance",
  "General Ledger",
  "Tax Returns",
  "Compliance",
  "Other",
];

export function BulkUploadModal({
  isOpen,
  onClose,
  onUpload,
  defaultCategory = "Other",
  availableCategories = DEFAULT_CATEGORIES,
}: BulkUploadModalProps) {
  const [files, setFiles] = useState<FileUploadItem[]>([]);
  const [dragActive, setDragActive] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

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
      addFiles(Array.from(e.dataTransfer.files));
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      addFiles(Array.from(e.target.files));
    }
  };

  const addFiles = (newFiles: File[]) => {
    const uploadItems: FileUploadItem[] = newFiles.map((file) => ({
      file,
      status: "pending",
      progress: 0,
      category: defaultCategory,
    }));
    setFiles((prev) => [...prev, ...uploadItems]);
  };

  const removeFile = (index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const updateFileCategory = (index: number, category: string) => {
    setFiles((prev) => prev.map((item, i) => (i === index ? { ...item, category } : item)));
  };

  const handleUpload = async () => {
    if (files.length === 0) return;

    setIsUploading(true);

    // Simulate upload progress for each file
    const uploadPromises = files.map(async (fileItem, index) => {
      // Update status to uploading
      setFiles((prev) =>
        prev.map((item, i) => (i === index ? { ...item, status: "uploading", progress: 0 } : item)),
      );

      try {
        // Simulate progress updates
        for (let progress = 0; progress <= 100; progress += 10) {
          await new Promise((resolve) => setTimeout(resolve, 100));
          setFiles((prev) => prev.map((item, i) => (i === index ? { ...item, progress } : item)));
        }

        // Call actual upload function
        await onUpload([{ file: fileItem.file, category: fileItem.category || defaultCategory }]);

        // Mark as success
        setFiles((prev) =>
          prev.map((item, i) => (i === index ? { ...item, status: "success", progress: 100 } : item)),
        );
      } catch (err) {
        // Mark as error
        setFiles((prev) =>
          prev.map((item, i) =>
            i === index ? { ...item, status: "error", error: (err as Error).message } : item,
          ),
        );
      }
    });

    await Promise.all(uploadPromises);
    setIsUploading(false);

    // Auto-close if all successful
    const allSuccessful = files.every((f) => f.status === "success");
    if (allSuccessful) {
      setTimeout(() => {
        onClose();
        setFiles([]);
      }, 1500);
    }
  };

  const getFileIcon = (type: string) => {
    if (type.includes("image")) return <ImageIcon className="h-5 w-5 text-purple-600" />;
    if (type.includes("pdf")) return <FileText className="h-5 w-5 text-red-600" />;
    if (type.includes("word") || type.includes("document"))
      return <FileText className="h-5 w-5 text-blue-600" />;
    if (type.includes("sheet") || type.includes("excel"))
      return <FileText className="h-5 w-5 text-green-600" />;
    return <File className="h-5 w-5 text-gray-600" />;
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "uploading":
        return <Loader className="h-5 w-5 text-blue-600 animate-spin" />;
      case "success":
        return <CheckCircle className="h-5 w-5 text-green-600" />;
      case "error":
        return <XCircle className="h-5 w-5 text-red-600" />;
      default:
        return null;
    }
  };

  const completedCount = files.filter((f) => f.status === "success").length;
  const errorCount = files.filter((f) => f.status === "error").length;

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={!isUploading ? onClose : undefined}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 grid place-items-center overflow-y-auto p-4"
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => {
                e.stopPropagation();
              }}
              className="bg-white rounded-xl shadow-xl w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col"
            >
              {/* Header */}
              <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
                <div>
                  <h2 className="text-xl font-bold text-gray-900">Upload Documents</h2>
                  {files.length > 0 && (
                    <p className="text-sm text-gray-600 mt-1">
                      {files.length} file{files.length > 1 ? "s" : ""} selected
                      {completedCount > 0 && ` • ${completedCount} uploaded`}
                      {errorCount > 0 && ` • ${errorCount} failed`}
                    </p>
                  )}
                </div>
                <button
                  onClick={onClose}
                  disabled={isUploading}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <X className="h-5 w-5 text-gray-500" />
                </button>
              </div>

              {/* Content */}
              <div className="flex-1 overflow-y-auto p-6">
                {files.length === 0 ? (
                  /* Drop Zone */
                  <div
                    onDragEnter={handleDrag}
                    onDragLeave={handleDrag}
                    onDragOver={handleDrag}
                    onDrop={handleDrop}
                    className={`border-2 border-dashed rounded-xl p-12 text-center transition-all ${
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

                    <Upload
                      className={`h-16 w-16 mx-auto mb-4 ${dragActive ? "text-blue-600" : "text-gray-400"}`}
                    />

                    <h3 className="text-lg font-semibold text-gray-900 mb-2">
                      {dragActive ? "Drop files here" : "Upload Documents"}
                    </h3>

                    <p className="text-sm text-gray-600 mb-6">Drag and drop files here, or click to browse</p>

                    <button
                      onClick={() => fileInputRef.current?.click()}
                      className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                    >
                      Browse Files
                    </button>

                    <p className="text-xs text-gray-500 mt-4">
                      Supported: PDF, Word, Excel, Images (Max 10MB per file)
                    </p>
                  </div>
                ) : (
                  /* File List */
                  <div className="space-y-3">
                    {files.map((fileItem, index) => (
                      <motion.div
                        key={index}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="flex items-center space-x-4 p-4 bg-gray-50 rounded-lg border border-gray-200"
                      >
                        {/* File Icon & Status */}
                        <div className="flex-shrink-0">
                          {fileItem.status === "pending" || fileItem.status === "uploading"
                            ? getFileIcon(fileItem.file.type)
                            : getStatusIcon(fileItem.status)}
                        </div>

                        {/* File Info */}
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-gray-900 truncate">{fileItem.file.name}</p>
                          <div className="flex items-center space-x-2 text-xs text-gray-500 mt-0.5">
                            <span>{formatFileSize(fileItem.file.size)}</span>
                            {fileItem.status === "uploading" && (
                              <>
                                <span>•</span>
                                <span>{fileItem.progress}%</span>
                              </>
                            )}
                            {fileItem.status === "error" && fileItem.error && (
                              <>
                                <span>•</span>
                                <span className="text-red-600">{fileItem.error}</span>
                              </>
                            )}
                          </div>

                          {/* Progress Bar */}
                          {fileItem.status === "uploading" && (
                            <div className="mt-2 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                              <motion.div
                                className="h-full bg-blue-600"
                                initial={{ width: 0 }}
                                animate={{ width: `${fileItem.progress}%` }}
                                transition={{ duration: 0.3 }}
                              />
                            </div>
                          )}
                        </div>

                        {/* Category Selector */}
                        {fileItem.status === "pending" && (
                          <select
                            value={fileItem.category}
                            onChange={(e) => {
                              updateFileCategory(index, e.target.value);
                            }}
                            disabled={isUploading}
                            className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
                          >
                            {availableCategories.map((cat) => (
                              <option key={cat} value={cat}>
                                {cat}
                              </option>
                            ))}
                          </select>
                        )}

                        {/* Remove Button */}
                        {fileItem.status === "pending" && (
                          <button
                            onClick={() => {
                              removeFile(index);
                            }}
                            disabled={isUploading}
                            className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            <X className="h-4 w-4" />
                          </button>
                        )}
                      </motion.div>
                    ))}

                    {/* Add More Files Button */}
                    {!isUploading && (
                      <button
                        onClick={() => fileInputRef.current?.click()}
                        className="w-full py-3 border-2 border-dashed border-gray-300 rounded-lg text-gray-600 hover:border-gray-400 hover:text-gray-700 hover:bg-gray-50 transition-colors flex items-center justify-center space-x-2"
                      >
                        <Upload className="h-4 w-4" />
                        <span>Add More Files</span>
                      </button>
                    )}
                  </div>
                )}
              </div>

              {/* Footer */}
              {files.length > 0 && (
                <div className="flex items-center justify-between px-6 py-4 border-t border-gray-200 bg-gray-50">
                  <button
                    onClick={onClose}
                    disabled={isUploading}
                    className="px-4 py-2 text-gray-700 hover:bg-gray-200 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isUploading ? "Uploading..." : "Cancel"}
                  </button>
                  <button
                    onClick={() => {
                      void handleUpload();
                    }}
                    disabled={isUploading || files.length === 0}
                    className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
                  >
                    {isUploading ? (
                      <>
                        <Loader className="h-4 w-4 animate-spin" />
                        <span>Uploading...</span>
                      </>
                    ) : (
                      <>
                        <Upload className="h-4 w-4" />
                        <span>
                          Upload {files.length} File{files.length > 1 ? "s" : ""}
                        </span>
                      </>
                    )}
                  </button>
                </div>
              )}
            </motion.div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
