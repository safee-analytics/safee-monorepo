"use client";

import { useState, useRef, useCallback, useEffect, useMemo } from "react";
import { FiUpload, FiFile, FiX, FiCheck, FiAlertCircle, FiLoader } from "react-icons/fi";
import { useFileUpload, type UseFileUploadOptions } from "@/lib/hooks/useFileUpload";
import { useTranslation } from "@/lib/providers/TranslationProvider";

export interface FileUploadProps extends UseFileUploadOptions {
  // Behavior
  accept?: string;
  multiple?: boolean;
  maxSize?: number;
  maxFiles?: number;

  // UI Customization
  variant?: "button" | "dropzone" | "avatar" | "minimal";
  label?: string;
  description?: string;
  className?: string;

  // Validation
  validator?: (file: File) => Promise<boolean | string>;

  // Custom rendering
  renderPreview?: (file: File) => React.ReactNode;
}

export function FileUpload({
  accept,
  multiple = false,
  maxSize = 100 * 1024 * 1024, // 100MB default
  maxFiles,
  variant = "dropzone",
  label,
  description,
  className = "",
  validator,
  renderPreview,
  ...uploadOptions
}: FileUploadProps) {
  const { t: _t } = useTranslation();
  const [dragActive, setDragActive] = useState(false);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  const inputRef = useRef<HTMLInputElement>(null);

  const { files, isUploading, addFiles, cancelUpload, removeFile, retryUpload } = useFileUpload({
    ...uploadOptions,
    autoStart: true,
  });

  // Validate file
  const validateFile = useCallback(
    async (file: File): Promise<string | null> => {
      // Size validation
      if (file.size > maxSize) {
        return `File size exceeds ${formatFileSize(maxSize)}`;
      }

      // Custom validation
      if (validator) {
        const result = await validator(file);
        if (result !== true) {
          return typeof result === "string" ? result : "Validation failed";
        }
      }

      return null;
    },
    [maxSize, validator],
  );

  // Handle file selection
  const handleFiles = useCallback(
    async (selectedFiles: FileList | null) => {
      if (!selectedFiles || selectedFiles.length === 0) return;

      const fileArray = Array.from(selectedFiles);

      // Check max files limit
      if (maxFiles && files.length + fileArray.length > maxFiles) {
        alert(`Maximum ${maxFiles} files allowed`);
        return;
      }

      // Validate all files
      const errors: Record<string, string> = {};
      const validFiles: File[] = [];

      for (const file of fileArray) {
        const error = await validateFile(file);
        if (error) {
          errors[file.name] = error;
        } else {
          validFiles.push(file);
        }
      }

      setValidationErrors(errors);

      // Add valid files to upload queue
      if (validFiles.length > 0) {
        addFiles(validFiles);
      }
    },
    [files.length, maxFiles, validateFile, addFiles],
  );

  // Handle drag events
  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setDragActive(false);

      if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
        void handleFiles(e.dataTransfer.files);
      }
    },
    [handleFiles],
  );

  // Handle input change
  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      e.preventDefault();
      if (e.target.files && e.target.files.length > 0) {
        void handleFiles(e.target.files);
      }
    },
    [handleFiles],
  );

  // Render based on variant
  if (variant === "button") {
    return (
      <div className={className}>
        <input
          ref={inputRef}
          type="file"
          accept={accept}
          multiple={multiple}
          onChange={handleChange}
          className="hidden"
        />
        <button
          onClick={() => inputRef.current?.click()}
          disabled={isUploading}
          className="px-4 py-2 bg-safee-600 text-white rounded-lg hover:bg-safee-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
        >
          <FiUpload className="w-4 h-4" />
          {label || "Upload File"}
        </button>
        {files.length > 0 && (
          <div className="mt-4 space-y-2">
            {files.map((file) => (
              <FilePreview
                key={file.id}
                file={file}
                onCancel={() => { void cancelUpload(file.id); }}
                onRemove={() => { removeFile(file.id); }}
                onRetry={() => { retryUpload(file.id); }}
              />
            ))}
          </div>
        )}
      </div>
    );
  }

  if (variant === "minimal") {
    return (
      <div className={className}>
        <input
          ref={inputRef}
          type="file"
          accept={accept}
          multiple={multiple}
          onChange={handleChange}
          className="hidden"
        />
        <button
          onClick={() => inputRef.current?.click()}
          disabled={isUploading}
          className="text-safee-600 hover:text-safee-700 underline disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {label || "Choose file"}
        </button>
      </div>
    );
  }

  if (variant === "avatar") {
    const currentFile = files[0];
    const previewUrl = currentFile?.file ? URL.createObjectURL(currentFile.file) : null;

    return (
      <div className={`relative ${className}`}>
        <input
          ref={inputRef}
          type="file"
          accept={accept || "image/*"}
          onChange={handleChange}
          className="hidden"
        />
        <div className="relative w-32 h-32 rounded-full overflow-hidden border-2 border-gray-300 dark:border-gray-600 group cursor-pointer">
          {previewUrl ? (
            <img src={previewUrl} alt="Avatar preview" className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center">
              <FiUpload className="w-8 h-8 text-gray-400" />
            </div>
          )}
          <div
            onClick={() => inputRef.current?.click()}
            className="absolute inset-0 bg-black bg-opacity-50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
          >
            <FiUpload className="w-6 h-6 text-white" />
          </div>
        </div>
        {currentFile && currentFile.status === "uploading" && (
          <div className="absolute inset-0 bg-black bg-opacity-50 rounded-full flex items-center justify-center">
            <FiLoader className="w-6 h-6 text-white animate-spin" />
          </div>
        )}
      </div>
    );
  }

  // Default: dropzone variant
  return (
    <div className={className}>
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        multiple={multiple}
        onChange={handleChange}
        className="hidden"
      />

      <div
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        onClick={() => inputRef.current?.click()}
        className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-colors ${
          dragActive
            ? "border-safee-500 bg-safee-50 dark:bg-safee-900/20"
            : "border-gray-300 dark:border-gray-600 hover:border-safee-400 dark:hover:border-safee-500"
        }`}
      >
        <div className="flex flex-col items-center gap-4">
          <div className="w-16 h-16 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center">
            <FiUpload className="w-8 h-8 text-gray-400" />
          </div>

          <div>
            <p className="text-lg font-medium text-gray-900 dark:text-gray-100">
              {label || "Drop files here or click to upload"}
            </p>
            {description && <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{description}</p>}
            <p className="text-xs text-gray-400 mt-2">Maximum file size: {formatFileSize(maxSize)}</p>
          </div>
        </div>
      </div>

      {/* Validation Errors */}
      {Object.keys(validationErrors).length > 0 && (
        <div className="mt-4 space-y-2">
          {Object.entries(validationErrors).map(([fileName, error]) => (
            <div
              key={fileName}
              className="flex items-center gap-2 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg"
            >
              <FiAlertCircle className="w-4 h-4 text-red-600 dark:text-red-400 flex-shrink-0" />
              <div className="flex-1 text-sm">
                <span className="font-medium text-red-900 dark:text-red-100">{fileName}</span>
                <span className="text-red-600 dark:text-red-400">: {error}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* File List */}
      {files.length > 0 && (
        <div className="mt-4 space-y-2">
          {files.map((file) => (
              <FilePreview
                key={file.id}
                file={file}
                onCancel={() => { void cancelUpload(file.id); }}
                onRemove={() => { removeFile(file.id); }}
                onRetry={() => { retryUpload(file.id); }}
                renderPreview={renderPreview}
              />
          ))}
        </div>
      )}
    </div>
  );
}

// File Preview Component
interface FilePreviewProps {
  file: {
    file: File;
    id: string;
    progress: number;
    status: "pending" | "uploading" | "completed" | "failed";
    error?: string;
  };
  onCancel: () => void;
  onRemove: () => void;
  onRetry: () => void;
  renderPreview?: (file: File) => React.ReactNode;
}

function FilePreview({ file, onCancel, onRemove, onRetry, renderPreview }: FilePreviewProps) {
  const isImage = file.file.type.startsWith("image/");
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [previewError, setPreviewError] = useState(false);

  // Try to create preview for images
  useEffect(() => {
    let url: string | undefined;
    if (isImage && !renderPreview) {
      try {
        url = URL.createObjectURL(file.file);
        setPreviewUrl(url);
      } catch (err) {
        console.warn("Failed to create preview:", err);
        setPreviewError(true);
      }
    }
    return () => {
      if (url) {
        URL.revokeObjectURL(url);
      }
    };
  }, [file.file, isImage, renderPreview]);

  return (
    <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
      {/* Preview */}
      <div className="w-12 h-12 rounded overflow-hidden bg-gray-100 dark:bg-gray-700 flex-shrink-0">
        {renderPreview ? (
          renderPreview(file.file)
        ) : previewUrl && !previewError ? (
          <img
            src={previewUrl}
            alt={file.file.name}
            className="w-full h-full object-cover"
            onError={() => { setPreviewError(true); }}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <FiFile className="w-6 h-6 text-gray-400" />
          </div>
        )}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">{file.file.name}</p>
        <p className="text-xs text-gray-500 dark:text-gray-400">{formatFileSize(file.file.size)}</p>

        {/* Progress Bar */}
        {file.status === "uploading" && (
          <div className="mt-2">
            <div className="flex items-center gap-2">
              <div className="flex-1 h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                <div
                  className="h-full bg-safee-600 transition-all duration-300"
                  style={{ width: `${file.progress}%` }}
                />
              </div>
              <span className="text-xs text-gray-500 dark:text-gray-400">{file.progress}%</span>
            </div>
          </div>
        )}

        {/* Error */}
        {file.status === "failed" && file.error && (
          <p className="text-xs text-red-600 dark:text-red-400 mt-1">{file.error}</p>
        )}
      </div>

      {/* Status Icon & Actions */}
      <div className="flex items-center gap-2">
        {file.status === "uploading" && (
          <>
            <FiLoader className="w-4 h-4 text-safee-600 animate-spin" />
            <button
              onClick={onCancel}
              className="p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded transition-colors"
              title="Cancel"
            >
              <FiX className="w-4 h-4 text-gray-600 dark:text-gray-400" />
            </button>
          </>
        )}

        {file.status === "completed" && (
          <>
            <FiCheck className="w-4 h-4 text-green-600" />
            <button
              onClick={onRemove}
              className="p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded transition-colors"
              title="Remove"
            >
              <FiX className="w-4 h-4 text-gray-600 dark:text-gray-400" />
            </button>
          </>
        )}

        {file.status === "failed" && (
          <>
            <button
              onClick={onRetry}
              className="px-2 py-1 text-xs bg-safee-600 text-white rounded hover:bg-safee-700 transition-colors"
            >
              Retry
            </button>
            <button
              onClick={onRemove}
              className="p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded transition-colors"
              title="Remove"
            >
              <FiX className="w-4 h-4 text-gray-600 dark:text-gray-400" />
            </button>
          </>
        )}

        {file.status === "pending" && (
          <button
            onClick={onRemove}
            className="p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded transition-colors"
            title="Remove"
          >
            <FiX className="w-4 h-4 text-gray-600 dark:text-gray-400" />
          </button>
        )}
      </div>
    </div>
  );
}

// Utility function to format file size
function formatFileSize(bytes: number): string {
  if (bytes === 0) return "0 Bytes";
  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${Math.round((bytes / Math.pow(k, i)) * 100) / 100  } ${  sizes[i]}`;
}
