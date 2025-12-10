"use client";

import { useState, useRef } from "react";
import { FiCamera, FiLoader, FiX } from "react-icons/fi";
import { FileUpload } from "./FileUpload";
import type { FileMetadata } from "@/lib/services/uploadService";

export interface AvatarUploadProps {
  currentAvatarUrl?: string;
  onSuccess?: (metadata: FileMetadata) => void;
  onError?: (error: Error) => void;
  maxSize?: number; // Default: 5MB
  endpoint?: string; // Custom upload endpoint (e.g., '/api/v1/users/me/avatar')
  method?: 'POST' | 'PUT'; // HTTP method for custom endpoint (default: PUT)
  className?: string;
}

export function AvatarUpload({
  currentAvatarUrl,
  onSuccess,
  onError,
  maxSize = 5 * 1024 * 1024, // 5MB
  endpoint,
  method = 'PUT',
  className = "",
}: AvatarUploadProps) {
  const [previewUrl, setPreviewUrl] = useState<string | null>(currentAvatarUrl || null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  return (
    <div className={`relative ${className}`}>
      <FileUpload
        variant="avatar"
        accept="image/*"
        maxSize={maxSize}
        uploadEndpoint={endpoint}
        uploadMethod={method}
        onUploadStart={(file) => {
          setIsUploading(true);
          setUploadProgress(0);
          // Create preview
          const url = URL.createObjectURL(file);
          setPreviewUrl(url);
        }}
        onProgress={(file, progress) => {
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
