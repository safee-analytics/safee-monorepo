"use client";

import { useState } from "react";
import { FiFile, FiFileText, FiImage, FiVideo, FiMusic, FiArchive, FiCode } from "react-icons/fi";
import { FileUpload } from "./FileUpload";
import type { FileMetadata } from "@/lib/services/uploadService";

export interface DocumentUploadProps {
  onSuccess?: (files: FileMetadata[]) => void;
  onError?: (error: Error) => void;
  accept?: string;
  maxSize?: number; // Default: 100MB
  maxFiles?: number;
  encrypt?: boolean; // Enable encryption for sensitive documents
  encryptionKey?: ArrayBuffer;
  folderId?: string;
  tags?: string[];
  endpoint?: string; // Custom upload endpoint (e.g., '/api/v1/cases/{caseId}/documents')
  method?: "POST" | "PUT"; // HTTP method for custom endpoint (default: POST)
  className?: string;
}

export function DocumentUpload({
  onSuccess,
  onError,
  accept = ".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.csv",
  maxSize = 100 * 1024 * 1024, // 100MB
  maxFiles,
  encrypt = false,
  encryptionKey,
  folderId,
  tags,
  endpoint,
  method = "POST",
  className = "",
}: DocumentUploadProps) {
  const [uploadedFiles, setUploadedFiles] = useState<FileMetadata[]>([]);

  return (
    <div className={className}>
      <FileUpload
        variant="dropzone"
        accept={accept}
        multiple
        maxSize={maxSize}
        maxFiles={maxFiles}
        encrypt={encrypt}
        encryptionKey={encryptionKey}
        folderId={folderId}
        tags={tags}
        endpoint={endpoint}
        method={method}
        label="Drop documents here or click to upload"
        description={`Supports PDF, Word, Excel, PowerPoint, and more - Max ${formatFileSize(maxSize)} per file`}
        onSuccess={(file, metadata) => {
          setUploadedFiles((prev) => [...prev, metadata]);
        }}
        onComplete={(results) => {
          const successful = results.filter((r) => r.metadata).map((r) => r.metadata!);
          if (successful.length > 0) {
            onSuccess?.(successful);
          }
        }}
        onError={(file, error) => {
          onError?.(error);
        }}
        renderPreview={(file) => <FileTypeIcon file={file} />}
      />

      {/* Info Box */}
      <div className="mt-4 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-lg bg-safee-100 dark:bg-safee-900/30 flex items-center justify-center flex-shrink-0">
            {encrypt ? (
              <svg
                className="w-5 h-5 text-safee-600 dark:text-safee-400"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                />
              </svg>
            ) : (
              <FiFileText className="w-5 h-5 text-safee-600 dark:text-safee-400" />
            )}
          </div>
          <div className="flex-1">
            <h4 className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-1">
              {encrypt ? "Encrypted Upload" : "Document Upload"}
            </h4>
            <p className="text-xs text-gray-600 dark:text-gray-400">
              {encrypt
                ? "Your files will be encrypted before upload for maximum security"
                : "Files are uploaded securely and can be accessed anytime"}
            </p>
            {uploadedFiles.length > 0 && (
              <p className="text-xs text-safee-600 dark:text-safee-400 mt-2 font-medium">
                {uploadedFiles.length} {uploadedFiles.length === 1 ? "file" : "files"} uploaded successfully
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// File Type Icon Component
function FileTypeIcon({ file }: { file: File }) {
  const getIcon = () => {
    const type = file.type;
    const ext = file.name.split(".").pop()?.toLowerCase();

    // Images
    if (type.startsWith("image/")) {
      return <FiImage className="w-6 h-6 text-blue-600" />;
    }

    // Videos
    if (type.startsWith("video/")) {
      return <FiVideo className="w-6 h-6 text-purple-600" />;
    }

    // Audio
    if (type.startsWith("audio/")) {
      return <FiMusic className="w-6 h-6 text-pink-600" />;
    }

    // PDFs
    if (type === "application/pdf" || ext === "pdf") {
      return <FiFileText className="w-6 h-6 text-red-600" />;
    }

    // Word Documents
    if (type.includes("word") || type.includes("document") || ext === "doc" || ext === "docx") {
      return <FiFileText className="w-6 h-6 text-blue-600" />;
    }

    // Excel Spreadsheets
    if (
      type.includes("spreadsheet") ||
      type.includes("excel") ||
      ext === "xls" ||
      ext === "xlsx" ||
      ext === "csv"
    ) {
      return <FiFileText className="w-6 h-6 text-green-600" />;
    }

    // PowerPoint
    if (type.includes("presentation") || type.includes("powerpoint") || ext === "ppt" || ext === "pptx") {
      return <FiFileText className="w-6 h-6 text-orange-600" />;
    }

    // Archives
    if (
      type.includes("zip") ||
      type.includes("rar") ||
      type.includes("compressed") ||
      ext === "zip" ||
      ext === "rar" ||
      ext === "7z"
    ) {
      return <FiArchive className="w-6 h-6 text-yellow-600" />;
    }

    // Code files
    if (
      ext === "js" ||
      ext === "ts" ||
      ext === "jsx" ||
      ext === "tsx" ||
      ext === "py" ||
      ext === "java" ||
      ext === "cpp" ||
      ext === "c" ||
      ext === "html" ||
      ext === "css" ||
      ext === "json" ||
      ext === "xml"
    ) {
      return <FiCode className="w-6 h-6 text-gray-600" />;
    }

    // Default
    return <FiFile className="w-6 h-6 text-gray-600" />;
  };

  return (
    <div className="w-full h-full flex items-center justify-center bg-gray-100 dark:bg-gray-700">
      {getIcon()}
    </div>
  );
}

// Utility function to format file size
function formatFileSize(bytes: number): string {
  if (bytes === 0) return "0 Bytes";
  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${Math.round((bytes / Math.pow(k, i)) * 100) / 100} ${sizes[i]}`;
}
