"use client";

import { useState } from "react";
import { FiLoader } from "react-icons/fi";
import { FileUpload } from "./FileUpload";
import type { FileMetadata } from "@/lib/services/uploadService";

export interface AvatarUploadProps {
  currentAvatarUrl?: string;
  onSuccess?: (metadata: FileMetadata) => void;
  onError?: (error: Error) => void;
  maxSize?: number; // Default: 5MB
  endpoint?: string; // Custom upload endpoint (e.g., '/api/v1/users/me/avatar')
  method?: "POST" | "PUT"; // HTTP method for custom endpoint (default: PUT)
  className?: string;
}

export function AvatarUpload({
  currentAvatarUrl,
  onSuccess,
  onError,
  maxSize = 5 * 1024 * 1024, // 5MB
  endpoint,
  method = "PUT",
  className = "",
}: AvatarUploadProps) {
  const [_previewUrl, setPreviewUrl] = useState<string | null>(currentAvatarUrl || null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  return (
    <div className={`relative ${className}`}>
      <FileUpload
        variant="avatar"
        accept="image/*"
        maxSize={maxSize}
        endpoint={endpoint}
        method={method}
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
          setPreviewUrl(currentAvatarUrl || null);
          onError?.(error);
        }}
      />

      {/* Progress Overlay */}
      {isUploading && (
        <div className="absolute inset-0 bg-black bg-opacity-50 rounded-full flex flex-col items-center justify-center">
          <FiLoader className="w-6 h-6 text-white animate-spin mb-2" />
          <span className="text-xs text-white font-medium">{uploadProgress}%</span>
        </div>
      )}
    </div>
  );
}
