/**
 * useFileUpload Hook
 * React hook for file uploads with WebSocket progress tracking,
 * automatic chunking, and error handling
 */

import { useState, useCallback, useRef } from "react";
import { uploadService, type FileMetadata, type UploadOptions } from "@/lib/services/uploadService";
import { useFileUploadProgress } from "@/lib/websocket/useFileUploadProgress";

export interface UploadFile {
  file: File;
  id: string;
  progress: number;
  status: "pending" | "uploading" | "completed" | "failed";
  error?: string;
  metadata?: FileMetadata;
  uploadId?: string;
}

export interface UseFileUploadOptions extends UploadOptions {
  onSuccess?: (file: File, metadata: FileMetadata) => void;
  onError?: (file: File, error: Error) => void;
  onComplete?: (results: UploadFile[]) => void;
  autoStart?: boolean;
}

export function useFileUpload(options: UseFileUploadOptions = {}) {
  const [files, setFiles] = useState<UploadFile[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const abortControllersRef = useRef<Map<string, AbortController>>(new Map());
  const currentUploadIdRef = useRef<string | null>(null);
  const completedFilesRef = useRef<Set<string>>(new Set()); // Track completed files to prevent duplicate callbacks
  const onCompleteCalledRef = useRef<boolean>(false); // Track if onComplete has been called for this batch

  // Handle WebSocket progress updates for chunked uploads
  useFileUploadProgress(currentUploadIdRef.current, (progressData) => {
    setFiles((prev) =>
      prev.map((f) =>
        f.uploadId === progressData.fileId
          ? {
              ...f,
              progress: progressData.percentage,
              status:
                progressData.stage === "completed"
                  ? "completed"
                  : progressData.stage === "error"
                    ? "failed"
                    : "uploading",
              error: progressData.error,
            }
          : f,
      ),
    );
  });

  /**
   * Add files to upload queue
   */
  const addFiles = useCallback(
    (newFiles: File[]) => {
      const uploadFiles: UploadFile[] = newFiles.map((file) => ({
        file,
        id: `${file.name}-${Date.now()}-${Math.random()}`,
        progress: 0,
        status: "pending" as const,
      }));

      setFiles((prev) => [...prev, ...uploadFiles]);

      // Reset onComplete flag when adding new files
      onCompleteCalledRef.current = false;

      if (options.autoStart !== false) {
        // Auto-start upload if not disabled
        uploadFiles.forEach((uploadFile) => {
          uploadFile.status = "uploading";
          startUpload(uploadFile);
        });
      }

      return uploadFiles;
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [options.autoStart],
  ); // startUpload is intentionally not included to avoid re-renders

  /**
   * Start uploading a file
   */
  const startUpload = async (uploadFile: UploadFile) => {
    try {
      setIsUploading(true);

      // Update status to uploading
      setFiles((prev) =>
        prev.map((f) => (f.id === uploadFile.id ? { ...f, status: "uploading" as const } : f)),
      );

      // Determine if this will be a chunked upload
      const isChunked = uploadFile.file.size > 10 * 1024 * 1024; // 10MB threshold

      let uploadId: string | undefined;

      if (isChunked) {
        // For chunked uploads, get the uploadId first
        const chunkSize = options.chunkSize || 5 * 1024 * 1024;
        const totalChunks = Math.ceil(uploadFile.file.size / chunkSize);

        const initResponse = await fetch("/api/v1/storage/upload/chunked/init", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({
            fileName: uploadFile.file.name,
            fileSize: uploadFile.file.size,
            mimeType: uploadFile.file.type,
            totalChunks,
            chunkSize,
            metadata: options.metadata,
          }),
        });

        if (!initResponse.ok) {
          throw new Error("Failed to initialize upload");
        }

        const initData = await initResponse.json();
        uploadId = initData.uploadId;

        // Store uploadId for WebSocket tracking
        setFiles((prev) => prev.map((f) => (f.id === uploadFile.id ? { ...f, uploadId } : f)));

        currentUploadIdRef.current = uploadId ?? null;
      }

      // Upload the file
      const metadata = await uploadService.upload(uploadFile.file, {
        ...options,
        onProgress: (progress) => {
          // For direct uploads, update progress manually
          if (!isChunked) {
            setFiles((prev) => prev.map((f) => (f.id === uploadFile.id ? { ...f, progress } : f)));
          }
        },
      });

      // Mark as completed
      setFiles((prev) =>
        prev.map((f) =>
          f.id === uploadFile.id ? { ...f, status: "completed" as const, progress: 100, metadata } : f,
        ),
      );

      // Only call onSuccess if we haven't already (prevents duplicate calls in React Strict Mode)
      if (!completedFilesRef.current.has(uploadFile.id)) {
        completedFilesRef.current.add(uploadFile.id);
        options.onSuccess?.(uploadFile.file, metadata);
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Upload failed";

      setFiles((prev) =>
        prev.map((f) =>
          f.id === uploadFile.id ? { ...f, status: "failed" as const, error: errorMessage } : f,
        ),
      );

      options.onError?.(uploadFile.file, error as Error);
    } finally {
      setIsUploading(false);
      currentUploadIdRef.current = null;

      // Check if all files are done
      setFiles((prev) => {
        const allDone = prev.every((f) => f.status === "completed" || f.status === "failed");
        if (allDone && !onCompleteCalledRef.current) {
          onCompleteCalledRef.current = true;
          options.onComplete?.(prev);
        }
        return prev;
      });
    }
  };

  /**
   * Upload all pending files
   */
  const startAll = useCallback(
    () => {
      const pending = files.filter((f) => f.status === "pending");
      pending.forEach((uploadFile) => startUpload(uploadFile));
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [files],
  ); // startUpload is intentionally not included to avoid re-renders

  /**
   * Cancel upload for a specific file
   */
  const cancelUpload = useCallback(
    async (fileId: string) => {
      const uploadFile = files.find((f) => f.id === fileId);

      if (uploadFile?.uploadId) {
        try {
          await uploadService.cancelChunkedUpload(uploadFile.uploadId);
        } catch (error) {
          console.error("Failed to cancel upload:", error);
        }
      }

      setFiles((prev) => prev.filter((f) => f.id !== fileId));
      abortControllersRef.current.delete(fileId);
    },
    [files],
  );

  /**
   * Remove a file from the list
   */
  const removeFile = useCallback((fileId: string) => {
    setFiles((prev) => prev.filter((f) => f.id !== fileId));
    completedFilesRef.current.delete(fileId); // Clean up tracking
  }, []);

  /**
   * Clear all files
   */
  const clearAll = useCallback(() => {
    setFiles([]);
    abortControllersRef.current.clear();
    completedFilesRef.current.clear(); // Clean up tracking
    onCompleteCalledRef.current = false; // Reset onComplete flag
  }, []);

  /**
   * Retry failed upload
   */
  const retryUpload = useCallback(
    (fileId: string) => {
      const uploadFile = files.find((f) => f.id === fileId);
      if (uploadFile) {
        startUpload(uploadFile);
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [files], // startUpload is intentionally not included to avoid re-renders
  );

  return {
    files,
    isUploading,
    addFiles,
    startAll,
    cancelUpload,
    removeFile,
    clearAll,
    retryUpload,
  };
}
