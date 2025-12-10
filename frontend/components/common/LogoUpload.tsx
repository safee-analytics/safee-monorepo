"use client";

import { useState } from "react";
import { FiLoader } from "react-icons/fi";
import { FileUpload } from "./FileUpload";
import type { FileMetadata } from "@/lib/services/uploadService";

export interface LogoUploadProps {
  currentLogoUrl?: string;
  onSuccess?: (metadata: FileMetadata) => void;
  onError?: (error: Error) => void;
  maxSize?: number; // Default: 2MB
  endpoint?: string; // Custom upload endpoint (e.g., '/api/v1/organizations/{orgId}/logo')
  method?: 'POST' | 'PUT'; // HTTP method for custom endpoint (default: PUT)
  className?: string;
}

export function LogoUpload({
  currentLogoUrl,
  onSuccess,
  onError,
  maxSize = 2 * 1024 * 1024, // 2MB
  endpoint,
  method = 'PUT',
  className = "",
}: LogoUploadProps) {
  const [previewUrl, setPreviewUrl] = useState<string | null>(currentLogoUrl || null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  return (
    <div className={className}>
      <div className="space-y-4">
        {/* Preview */}
        {previewUrl && (
          <div className="relative w-48 h-48 border-2 border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden bg-white dark:bg-gray-800 flex items-center justify-center">
            <img
              src={previewUrl}
              alt="Company Logo"
              className="max-w-full max-h-full object-contain p-4"
            />
            {isUploading && (
              <div className="absolute inset-0 bg-black bg-opacity-50 flex flex-col items-center justify-center">
                <FiLoader className="w-8 h-8 text-white animate-spin mb-2" />
                <span className="text-sm text-white font-medium">{uploadProgress}%</span>
              </div>
            )}
          </div>
        )}

        {/* Upload Area */}
        <FileUpload
          variant="dropzone"
          accept="image/png,image/svg+xml,image/jpeg"
          maxSize={maxSize}
          endpoint={endpoint}
          method={method}
          label="Upload Company Logo"
          description="PNG, SVG, or JPG - Max 2MB"
          onProgress={(progress: number) => {
            setIsUploading(progress > 0 && progress < 100);
            setUploadProgress(progress);
          }}
          onSuccess={(file, metadata) => {
            setIsUploading(false);
            setUploadProgress(100);
            onSuccess?.(metadata);
          }}
          onError={(file, error) => {
            setIsUploading(false);
            setPreviewUrl(currentLogoUrl || null);
            onError?.(error);
          }}
        />

        {/* Guidelines */}
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
          <h4 className="text-sm font-medium text-blue-900 dark:text-blue-100 mb-2">
            Logo Guidelines
          </h4>
          <ul className="text-xs text-blue-700 dark:text-blue-300 space-y-1">
            <li>• Use a square or rectangular logo for best results</li>
            <li>• Transparent background (PNG/SVG) recommended</li>
            <li>• Minimum resolution: 200x200 pixels</li>
            <li>• File size should not exceed 2MB</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
