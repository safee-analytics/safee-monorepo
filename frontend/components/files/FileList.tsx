"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import {
  File,
  Image,
  FileText,
  Film,
  Music,
  Archive,
  Download,
  Trash2,
  MoreVertical,
  Eye,
  Share2,
  Copy,
} from "lucide-react";
import { EncryptionBadge } from "@/components/ui/EncryptionBadge";
import { Button } from "@safee/ui";
import { type FileItem, fileItemSchema } from "@/lib/validation";

interface FileListProps {
  files: FileItem[];
  onDownload?: (file: FileItem) => void;
  onDelete?: (fileId: string) => void;
  onPreview?: (file: FileItem) => void;
  onShare?: (file: FileItem) => void;
  showActions?: boolean;
  emptyMessage?: string;
  className?: string;
}

export function FileList({
  files,
  onDownload,
  onDelete,
  onPreview,
  onShare,
  showActions = true,
  emptyMessage = "No files yet",
  className = "",
}: FileListProps) {
  const [activeMenu, setActiveMenu] = useState<string | null>(null);

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
    return `${Math.round((bytes / Math.pow(k, i)) * 100) / 100} ${sizes[i]}`;
  };

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diffInSeconds < 60) return "Just now";
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
    if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)}d ago`;

    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: date.getFullYear() !== now.getFullYear() ? "numeric" : undefined,
    });
  };

  const handleMenuToggle = (fileId: string) => {
    setActiveMenu(activeMenu === fileId ? null : fileId);
  };

  const handleAction = async (action: () => void | Promise<void>) => {
    await action();
    setActiveMenu(null);
  };

  if (files.length === 0) {
    return (
      <div
        className={`rounded-lg border-2 border-dashed border-gray-300 bg-gray-50 p-12 text-center dark:border-gray-600 dark:bg-gray-800 ${className}`}
      >
        <File className="mx-auto mb-4 h-12 w-12 text-gray-400 dark:text-gray-500" />
        <p className="text-sm text-gray-500 dark:text-gray-400">{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div className={`space-y-2 ${className}`}>
      {files.map((file) => {
        const FileIcon = getFileIcon(file.type);
        return (
          <motion.div
            key={file.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, x: -100 }}
            className="group relative flex items-center gap-4 rounded-lg border border-gray-200 bg-white p-4 transition-all hover:border-gray-300 hover:shadow-sm dark:border-gray-700 dark:bg-gray-800 dark:hover:border-gray-600"
          >
            {/* File Icon */}
            <div className="flex-shrink-0">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-gray-100 dark:bg-gray-700">
                <FileIcon className="h-6 w-6 text-gray-600 dark:text-gray-400" />
              </div>
            </div>

            {/* File Info */}
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <p className="truncate text-sm font-medium text-gray-900 dark:text-white">{file.name}</p>
                {file.isEncrypted && <EncryptionBadge encrypted={true} />}
              </div>
              <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                <span>{formatFileSize(file.size)}</span>
                <span>•</span>
                <span>{formatDate(file.uploadedAt)}</span>
                {file.uploadedBy && (
                  <>
                    <span>•</span>
                    <span>by {file.uploadedBy}</span>
                  </>
                )}
              </div>
              {file.tags && file.tags.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-1">
                  {file.tags.map((tag) => (
                    <span
                      key={tag}
                      className="rounded-full bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-700 dark:bg-blue-900/30 dark:text-blue-400"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* Quick Actions */}
            {showActions && (
              <div className="flex items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                {onPreview && (
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => {
                      void handleAction(() => onPreview(file));
                    }}
                    title="Preview"
                  >
                    <Eye className="h-4 w-4" />
                  </Button>
                )}
                {onDownload && (
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => {
                      void handleAction(() => onDownload(file));
                    }}
                    title="Download"
                  >
                    <Download className="h-4 w-4" />
                  </Button>
                )}
                {onShare && (
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => {
                      void handleAction(() => onShare(file));
                    }}
                    title="Share"
                  >
                    <Share2 className="h-4 w-4" />
                  </Button>
                )}
              </div>
            )}

            {/* More Menu */}
            {showActions && (
              <div className="relative">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => {
                    handleMenuToggle(file.id);
                  }}
                  title="More actions"
                >
                  <MoreVertical className="h-4 w-4" />
                </Button>

                {activeMenu === file.id && (
                  <>
                    {/* Backdrop */}
                    <div
                      className="fixed inset-0 z-10"
                      onClick={() => {
                        setActiveMenu(null);
                      }}
                    />

                    {/* Menu */}
                    <motion.div
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="absolute right-0 top-full z-20 mt-1 w-48 rounded-lg border border-gray-200 bg-white py-1 shadow-lg dark:border-gray-700 dark:bg-gray-800"
                    >
                      {onPreview && (
                        <Button
                          variant="ghost"
                          className="w-full justify-start gap-3 px-4 py-2 text-sm"
                          onClick={() => {
                            void handleAction(() => onPreview(file));
                          }}
                        >
                          <Eye className="h-4 w-4" />
                          Preview
                        </Button>
                      )}
                      {onDownload && (
                        <Button
                          variant="ghost"
                          className="w-full justify-start gap-3 px-4 py-2 text-sm"
                          onClick={() => {
                            void handleAction(() => onDownload(file));
                          }}
                        >
                          <Download className="h-4 w-4" />
                          Download
                        </Button>
                      )}
                      {file.url && (
                        <Button
                          variant="ghost"
                          className="w-full justify-start gap-3 px-4 py-2 text-sm"
                          onClick={() => {
                            void handleAction(() => navigator.clipboard.writeText(file.url || ""));
                          }}
                        >
                          <Copy className="h-4 w-4" />
                          Copy Link
                        </Button>
                      )}
                      {onShare && (
                        <Button
                          variant="ghost"
                          className="w-full justify-start gap-3 px-4 py-2 text-sm"
                          onClick={() => {
                            void handleAction(() => onShare(file));
                          }}
                        >
                          <Share2 className="h-4 w-4" />
                          Share
                        </Button>
                      )}
                      {onDelete && (
                        <>
                          <div className="my-1 border-t border-gray-200 dark:border-gray-700" />
                          <Button
                            variant="ghost"
                            className="w-full justify-start gap-3 px-4 py-2 text-sm text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/20"
                            onClick={() => {
                              void handleAction(() => onDelete(file.id));
                            }}
                          >
                            <Trash2 className="h-4 w-4" />
                            Delete
                          </Button>
                        </>
                      )}
                    </motion.div>
                  </>
                )}
              </div>
            )}
          </motion.div>
        );
      })}
    </div>
  );
}
