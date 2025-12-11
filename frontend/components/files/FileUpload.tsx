"use client";

import { useState, useRef, useCallback } from "react";
import {
  Upload,
  X,
  File,
  Image,
  FileText,
  Film,
  Music,
  Archive,
  CheckCircle,
  AlertCircle,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export interface FileUploadOptions {
  maxSize?: number; // in bytes
  maxFiles?: number;
  acceptedFileTypes?: string[]; // e.g., ['image/*', '.pdf', '.docx']
  multiple?: boolean;
  autoUpload?: boolean;
  showPreview?: boolean;
}

export interface UploadedFile {
  id: string;
  file: File;
  preview?: string;
  status: "pending" | "uploading" | "completed" | "error";
  progress: number;
  error?: string;
}

interface FileUploadProps {
  options?: FileUploadOptions;
  onFilesSelected?: (files: File[]) => void;
  onUpload?: (file: File) => Promise<void>;
  onRemove?: (fileId: string) => void;
  className?: string;
}

const defaultOptions: FileUploadOptions = {
  maxSize: 50 * 1024 * 1024, // 50MB
  maxFiles: 10,
  multiple: true,
  autoUpload: false,
  showPreview: true,
};

export function FileUpload({
  options = defaultOptions,
  onFilesSelected,
  onUpload,
  onRemove,
  className = "",
}: FileUploadProps) {
  const mergedOptions = { ...defaultOptions, ...options };
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState<string>("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const getFileIcon = (fileType: string) => {
    if (fileType.startsWith("image/")) return Image;
    if (fileType.startsWith("video/")) return Film;
    if (fileType.startsWith("audio/")) return Music;
    if (fileType.includes("pdf")) return FileText;
    if (fileType.includes("zip") || fileType.includes("rar")) return Archive;
    return File;
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${Math.round((bytes / Math.pow(k, i)) * 100) / 100  } ${  sizes[i]}`;
  };

  const validateFile = (file: File): string | null => {
    // Check file size
    if (mergedOptions.maxSize && file.size > mergedOptions.maxSize) {
      return `File size exceeds maximum of ${formatFileSize(mergedOptions.maxSize)}`;
    }

    // Check file type
    if (mergedOptions.acceptedFileTypes && mergedOptions.acceptedFileTypes.length > 0) {
      const isAccepted = mergedOptions.acceptedFileTypes.some((type) => {
        if (type.includes("*")) {
          // Handle wildcard types like 'image/*'
          const baseType = type.split("/")[0];
          return file.type.startsWith(baseType);
        }
        if (type.startsWith(".")) {
          // Handle extensions like '.pdf'
          return file.name.toLowerCase().endsWith(type.toLowerCase());
        }
        // Handle exact MIME types
        return file.type === type;
      });

      if (!isAccepted) {
        return `File type not accepted. Allowed types: ${mergedOptions.acceptedFileTypes.join(", ")}`;
      }
    }

    return null;
  };

  const createFilePreview = async (file: File): Promise<string | undefined> => {
    if (!mergedOptions.showPreview || !file.type.startsWith("image/")) {
      return undefined;
    }

    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => { resolve(reader.result as string); };
      reader.readAsDataURL(file);
    });
  };

  const handleFiles = async (newFiles: FileList | File[]) => {
    setError("");

    const filesArray = Array.from(newFiles);

    // Check max files limit
    if (mergedOptions.maxFiles && files.length + filesArray.length > mergedOptions.maxFiles) {
      setError(`Maximum ${mergedOptions.maxFiles} files allowed`);
      return;
    }

    // Validate and process files
    const validatedFiles: UploadedFile[] = [];

    for (const file of filesArray) {
      const validationError = validateFile(file);
      if (validationError) {
        setError(validationError);
        continue;
      }

      const preview = await createFilePreview(file);
      const uploadedFile: UploadedFile = {
        id: crypto.randomUUID(),
        file,
        preview,
        status: "pending",
        progress: 0,
      };

      validatedFiles.push(uploadedFile);
    }

    if (validatedFiles.length === 0) return;

    setFiles((prev) => [...prev, ...validatedFiles]);

    // Notify parent component
    if (onFilesSelected) {
      onFilesSelected(validatedFiles.map((f) => f.file));
    }

    // Auto-upload if enabled
    if (mergedOptions.autoUpload && onUpload) {
      for (const uploadedFile of validatedFiles) {
        handleUpload(uploadedFile.id);
      }
    }
  };

  const handleUpload = async (fileId: string) => {
    if (!onUpload) return;

    const fileToUpload = files.find((f) => f.id === fileId);
    if (!fileToUpload) return;

    // Update status to uploading
    setFiles((prev) => prev.map((f) => (f.id === fileId ? { ...f, status: "uploading" as const } : f)));

    try {
      await onUpload(fileToUpload.file);

      // Update status to completed
      setFiles((prev) =>
        prev.map((f) => (f.id === fileId ? { ...f, status: "completed" as const, progress: 100 } : f)),
      );
    } catch (err) {
      // Update status to error
      setFiles((prev) =>
        prev.map((f) =>
          f.id === fileId
            ? {
                ...f,
                status: "error" as const,
                error: err instanceof Error ? err.message : "Upload failed",
              }
            : f,
        ),
      );
    }
  };

  const handleRemove = (fileId: string) => {
    setFiles((prev) => prev.filter((f) => f.id !== fileId));
    if (onRemove) {
      onRemove(fileId);
    }
  };

  const handleDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const droppedFiles = e.dataTransfer.files;
    if (droppedFiles.length > 0) {
      handleFiles(droppedFiles);
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = e.target.files;
    if (selectedFiles && selectedFiles.length > 0) {
      handleFiles(selectedFiles);
    }
    // Reset input value to allow selecting the same file again
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className={`w-full ${className}`}>
      {/* Drop Zone */}
      <div
        onDragEnter={handleDragEnter}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={handleClick}
        className={`
          relative cursor-pointer rounded-lg border-2 border-dashed transition-all
          ${
            isDragging
              ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20"
              : "border-gray-300 bg-gray-50 hover:border-gray-400 dark:border-gray-600 dark:bg-gray-800"
          }
        `}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple={mergedOptions.multiple}
          accept={mergedOptions.acceptedFileTypes?.join(",")}
          onChange={handleFileInputChange}
          className="hidden"
        />

        <div className="flex flex-col items-center justify-center py-12 px-6">
          <Upload
            className={`mb-4 h-12 w-12 ${isDragging ? "text-blue-500" : "text-gray-400 dark:text-gray-500"}`}
          />
          <p className="mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">
            {isDragging ? "Drop files here" : "Click to upload or drag and drop"}
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            {mergedOptions.acceptedFileTypes && mergedOptions.acceptedFileTypes.length > 0
              ? `Accepted: ${mergedOptions.acceptedFileTypes.join(", ")}`
              : "All file types accepted"}
          </p>
          {mergedOptions.maxSize && (
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
              Max size: {formatFileSize(mergedOptions.maxSize)}
            </p>
          )}
          {mergedOptions.maxFiles && (
            <p className="text-xs text-gray-500 dark:text-gray-400">Max files: {mergedOptions.maxFiles}</p>
          )}
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-3 flex items-start gap-2 rounded-md bg-red-50 p-3 text-sm text-red-700 dark:bg-red-900/20 dark:text-red-400"
        >
          <AlertCircle className="mt-0.5 h-4 w-4 flex-shrink-0" />
          <span>{error}</span>
        </motion.div>
      )}

      {/* File List */}
      {files.length > 0 && (
        <div className="mt-4 space-y-2">
          <AnimatePresence>
            {files.map((uploadedFile) => {
              const FileIcon = getFileIcon(uploadedFile.file.type);
              return (
                <motion.div
                  key={uploadedFile.id}
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, x: -100 }}
                  className={`
                    flex items-center gap-3 rounded-lg border p-3 transition-colors
                    ${
                      uploadedFile.status === "completed"
                        ? "border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-900/20"
                        : uploadedFile.status === "error"
                          ? "border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-900/20"
                          : uploadedFile.status === "uploading"
                            ? "border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-900/20"
                            : "border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800"
                    }
                  `}
                >
                  {/* File Icon/Preview */}
                  <div className="flex-shrink-0">
                    {uploadedFile.preview ? (
                      <img
                        src={uploadedFile.preview}
                        alt={uploadedFile.file.name}
                        className="h-12 w-12 rounded object-cover"
                      />
                    ) : (
                      <div className="flex h-12 w-12 items-center justify-center rounded bg-gray-100 dark:bg-gray-700">
                        <FileIcon className="h-6 w-6 text-gray-500 dark:text-gray-400" />
                      </div>
                    )}
                  </div>

                  {/* File Info */}
                  <div className="flex-1 min-w-0">
                    <p className="truncate text-sm font-medium text-gray-900 dark:text-white">
                      {uploadedFile.file.name}
                    </p>
                    <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                      <span>{formatFileSize(uploadedFile.file.size)}</span>
                      {uploadedFile.status === "completed" && (
                        <span className="flex items-center gap-1 text-green-600 dark:text-green-400">
                          <CheckCircle className="h-3 w-3" />
                          Uploaded
                        </span>
                      )}
                      {uploadedFile.status === "error" && (
                        <span className="text-red-600 dark:text-red-400">{uploadedFile.error}</span>
                      )}
                      {uploadedFile.status === "uploading" && (
                        <span className="text-blue-600 dark:text-blue-400">Uploading...</span>
                      )}
                    </div>

                    {/* Progress Bar */}
                    {uploadedFile.status === "uploading" && (
                      <div className="mt-2 h-1 w-full overflow-hidden rounded-full bg-gray-200 dark:bg-gray-700">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${uploadedFile.progress}%` }}
                          className="h-full bg-blue-600"
                        />
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2">
                    {!mergedOptions.autoUpload && uploadedFile.status === "pending" && onUpload && (
                      <button
                        onClick={() => handleUpload(uploadedFile.id)}
                        className="rounded px-3 py-1 text-xs font-medium text-blue-600 hover:bg-blue-100 dark:text-blue-400 dark:hover:bg-blue-900/20"
                      >
                        Upload
                      </button>
                    )}
                    {uploadedFile.status !== "uploading" && (
                      <button
                        onClick={() => { handleRemove(uploadedFile.id); }}
                        className="rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-gray-700 dark:hover:text-gray-300"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      )}

      {/* Upload All Button */}
      {!mergedOptions.autoUpload && files.some((f) => f.status === "pending") && onUpload && (
        <button
          onClick={() => {
            for (const f of files.filter((f) => f.status === "pending")) handleUpload(f.id);
          }}
          className="mt-4 w-full rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
        >
          Upload All Files
        </button>
      )}
    </div>
  );
}
