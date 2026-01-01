"use client";

import React, { useState, useMemo } from "react";
import {
  Upload,
  Search,
  Grid3x3,
  List,
  FolderPlus,
  Download,
  Trash2,
  MoreVertical,
  File,
  FileText,
  Image as ImageIcon,
  CheckSquare,
  Square,
  X,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { DocumentPreviewDrawer } from "./DocumentPreviewDrawer";
import { type Document, documentSchema } from "@/lib/validation";

interface DocumentBrowserProps {
  caseId: string;
  documents?: Document[];
  isLoading?: boolean;
  onUpload?: (files: File[]) => void;
  onDelete?: (documentIds: string[]) => void;
  onDownload?: (documentIds: string[]) => void;
  onCategoryChange?: (documentId: string, category: string) => void;
  onDocumentClick?: (document: Document) => void;
}

export function DocumentBrowser({
  caseId: _caseId,
  documents = [],
  isLoading = false,
  onUpload: _onUpload,
  onDelete,
  onDownload,
  onCategoryChange,
  onDocumentClick,
}: DocumentBrowserProps) {
  const [viewMode, setViewMode] = useState<"list" | "grid">("list");
  const [selectedFolder, setSelectedFolder] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedDocs, setSelectedDocs] = useState<Set<string>>(new Set());
  const [_showUploadModal, _setShowUploadModal] = useState(false);
  const [previewDocument, setPreviewDocument] = useState<Document | null>(null);

  // Group documents by category (folders)
  const folders = useMemo(() => {
    const folderMap = new Map<string, number>();
    for (const doc of documents) {
      const category = doc.category || "Uncategorized";
      folderMap.set(category, (folderMap.get(category) || 0) + 1);
    }
    return Array.from(folderMap.entries()).map(([name, count]) => ({ name, count }));
  }, [documents]);

  // Filter documents
  const filteredDocs = useMemo(() => {
    let filtered = documents;

    // Filter by folder
    if (selectedFolder !== "all") {
      filtered = filtered.filter((doc) => doc.category === selectedFolder);
    }

    // Filter by search
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter((doc) => doc.name.toLowerCase().includes(query));
    }

    return filtered;
  }, [documents, selectedFolder, searchQuery]);

  const toggleSelectDoc = (docId: string) => {
    const newSelected = new Set(selectedDocs);
    if (newSelected.has(docId)) {
      newSelected.delete(docId);
    } else {
      newSelected.add(docId);
    }
    setSelectedDocs(newSelected);
  };

  const toggleSelectAll = () => {
    if (selectedDocs.size === filteredDocs.length) {
      setSelectedDocs(new Set());
    } else {
      setSelectedDocs(new Set(filteredDocs.map((d) => d.id)));
    }
  };

  const handleBulkDelete = () => {
    if (selectedDocs.size > 0 && onDelete) {
      onDelete(Array.from(selectedDocs));
      setSelectedDocs(new Set());
    }
  };

  const handleBulkDownload = () => {
    if (selectedDocs.size > 0 && onDownload) {
      onDownload(Array.from(selectedDocs));
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

  const getStatusBadge = (status: string) => {
    const styles = {
      pending: "bg-yellow-100 text-yellow-700",
      approved: "bg-green-100 text-green-700",
      rejected: "bg-red-100 text-red-700",
    };
    return styles[status as keyof typeof styles] || styles.pending;
  };

  const handleDocumentClick = (doc: Document) => {
    if (onDocumentClick) {
      onDocumentClick(doc);
    } else {
      // Default behavior: open preview drawer
      setPreviewDocument(doc);
    }
  };

  const handleStatusChange = (documentId: string, status: string) => {
    // Update document status - this would typically call an API
  };

  return (
    <>
      <div className="flex h-[calc(100vh-200px)] bg-white rounded-xl border border-gray-200 overflow-hidden">
        {/* Left Sidebar - Folders */}
        <aside className="w-64 border-r border-gray-200 bg-gray-50">
          <div className="p-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-gray-900">Folders</h3>
              <button className="p-1.5 hover:bg-gray-200 rounded-lg transition-colors" title="New folder">
                <FolderPlus className="h-4 w-4 text-gray-600" />
              </button>
            </div>

            <nav className="space-y-1">
              <button
                onClick={() => {
                  setSelectedFolder("all");
                }}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm transition-colors ${
                  selectedFolder === "all"
                    ? "bg-blue-100 text-blue-700 font-medium"
                    : "text-gray-700 hover:bg-gray-100"
                }`}
              >
                <span>All Documents</span>
                <span className="text-xs px-2 py-0.5 bg-gray-200 rounded-full">{documents.length}</span>
              </button>

              {folders.map((folder) => (
                <button
                  key={folder.name}
                  onClick={() => {
                    setSelectedFolder(folder.name);
                  }}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm transition-colors ${
                    selectedFolder === folder.name
                      ? "bg-blue-100 text-blue-700 font-medium"
                      : "text-gray-700 hover:bg-gray-100"
                  }`}
                >
                  <span className="truncate">{folder.name}</span>
                  <span className="text-xs px-2 py-0.5 bg-gray-200 rounded-full">{folder.count}</span>
                </button>
              ))}
            </nav>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 flex flex-col overflow-hidden">
          {/* Actions Bar */}
          <div className="flex items-center justify-between p-4 border-b border-gray-200">
            <div className="flex items-center space-x-3 flex-1">
              {/* Search */}
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                  }}
                  placeholder="Search documents..."
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              {/* Upload Button */}
              <button
                onClick={() => {
                  _setShowUploadModal(true);
                }}
                className="flex items-center space-x-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
              >
                <Upload className="h-4 w-4" />
                <span>Upload</span>
              </button>
            </div>

            {/* View Toggle */}
            <div className="flex items-center bg-gray-100 rounded-lg p-1 ml-3">
              <button
                onClick={() => {
                  setViewMode("list");
                }}
                className={`p-1.5 rounded transition-colors ${
                  viewMode === "list"
                    ? "bg-white text-blue-600 shadow-sm"
                    : "text-gray-600 hover:text-gray-900"
                }`}
                title="List view"
              >
                <List className="h-4 w-4" />
              </button>
              <button
                onClick={() => {
                  setViewMode("grid");
                }}
                className={`p-1.5 rounded transition-colors ${
                  viewMode === "grid"
                    ? "bg-white text-blue-600 shadow-sm"
                    : "text-gray-600 hover:text-gray-900"
                }`}
                title="Grid view"
              >
                <Grid3x3 className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* Bulk Actions Bar */}
          <AnimatePresence>
            {selectedDocs.size > 0 && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="bg-blue-50 border-b border-blue-200 px-4 py-3 flex items-center justify-between overflow-hidden"
              >
                <span className="text-sm font-medium text-blue-900">
                  {selectedDocs.size} document{selectedDocs.size > 1 ? "s" : ""} selected
                </span>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={handleBulkDownload}
                    className="flex items-center space-x-1 px-3 py-1.5 bg-white hover:bg-blue-100 text-blue-700 rounded-lg transition-colors text-sm"
                  >
                    <Download className="h-4 w-4" />
                    <span>Download</span>
                  </button>
                  <button
                    onClick={handleBulkDelete}
                    className="flex items-center space-x-1 px-3 py-1.5 bg-white hover:bg-red-100 text-red-700 rounded-lg transition-colors text-sm"
                  >
                    <Trash2 className="h-4 w-4" />
                    <span>Delete</span>
                  </button>
                  <button
                    onClick={() => {
                      setSelectedDocs(new Set());
                    }}
                    className="p-1.5 hover:bg-white rounded-lg transition-colors"
                    title="Clear selection"
                  >
                    <X className="h-4 w-4 text-blue-700" />
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Document List/Grid */}
          <div className="flex-1 overflow-y-auto p-4">
            {isLoading ? (
              <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" />
              </div>
            ) : filteredDocs.length > 0 ? (
              viewMode === "list" ? (
                <DocumentListView
                  documents={filteredDocs}
                  selectedDocs={selectedDocs}
                  onToggleSelect={toggleSelectDoc}
                  onToggleSelectAll={toggleSelectAll}
                  onDocumentClick={handleDocumentClick}
                  getFileIcon={getFileIcon}
                  formatFileSize={formatFileSize}
                  getStatusBadge={getStatusBadge}
                />
              ) : (
                <DocumentGridView
                  documents={filteredDocs}
                  selectedDocs={selectedDocs}
                  onToggleSelect={toggleSelectDoc}
                  onDocumentClick={handleDocumentClick}
                  getFileIcon={getFileIcon}
                  formatFileSize={formatFileSize}
                  getStatusBadge={getStatusBadge}
                />
              )
            ) : (
              <div className="flex flex-col items-center justify-center h-64 text-gray-500">
                <File className="h-16 w-16 mb-4 opacity-30" />
                <p className="text-lg font-medium">No documents found</p>
                <p className="text-sm mt-1">
                  {searchQuery ? "Try adjusting your search" : "Upload documents to get started"}
                </p>
              </div>
            )}
          </div>
        </main>
      </div>

      {/* Document Preview Drawer */}
      <DocumentPreviewDrawer
        isOpen={previewDocument !== null}
        onClose={() => {
          setPreviewDocument(null);
        }}
        document={previewDocument}
        onDownload={(docId) => onDownload?.([docId])}
        onDelete={(docId) => {
          if (onDelete) {
            onDelete([docId]);
          }
          setPreviewDocument(null);
        }}
        onStatusChange={handleStatusChange}
        onCategoryChange={onCategoryChange}
      />
    </>
  );
}

// List View Component
interface DocumentListViewProps {
  documents: Document[];
  selectedDocs: Set<string>;
  onToggleSelect: (docId: string) => void;
  onToggleSelectAll: () => void;
  onDocumentClick: (document: Document) => void;
  getFileIcon: (type: string) => React.ReactElement;
  formatFileSize: (bytes: number) => string;
  getStatusBadge: (status: string) => string;
}

function DocumentListView({
  documents,
  selectedDocs,
  onToggleSelect,
  onToggleSelectAll,
  onDocumentClick,
  getFileIcon,
  formatFileSize,
  getStatusBadge,
}: DocumentListViewProps) {
  return (
    <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
      {/* Table Header */}
      <div className="grid grid-cols-12 gap-4 px-4 py-3 bg-gray-50 border-b border-gray-200 text-sm font-medium text-gray-700">
        <div className="col-span-1 flex items-center">
          <button onClick={onToggleSelectAll} className="p-1 hover:bg-gray-200 rounded">
            {selectedDocs.size === documents.length ? (
              <CheckSquare className="h-4 w-4 text-blue-600" />
            ) : (
              <Square className="h-4 w-4" />
            )}
          </button>
        </div>
        <div className="col-span-5">Name</div>
        <div className="col-span-2">Category</div>
        <div className="col-span-1">Size</div>
        <div className="col-span-2">Status</div>
        <div className="col-span-1"></div>
      </div>

      {/* Table Rows */}
      <div className="divide-y divide-gray-200">
        {documents.map((doc: Document) => (
          <div
            key={doc.id}
            className={`grid grid-cols-12 gap-4 px-4 py-3 hover:bg-gray-50 transition-colors ${
              selectedDocs.has(doc.id) ? "bg-blue-50" : ""
            }`}
          >
            <div className="col-span-1 flex items-center">
              <button
                onClick={() => {
                  onToggleSelect(doc.id);
                }}
                className="p-1 hover:bg-gray-200 rounded"
              >
                {selectedDocs.has(doc.id) ? (
                  <CheckSquare className="h-4 w-4 text-blue-600" />
                ) : (
                  <Square className="h-4 w-4" />
                )}
              </button>
            </div>
            <div
              className="col-span-5 flex items-center space-x-3 cursor-pointer"
              onClick={() => {
                onDocumentClick?.(doc);
              }}
            >
              {getFileIcon(doc.type)}
              <span className="font-medium text-gray-900 truncate hover:text-blue-600 transition-colors">
                {doc.name}
              </span>
            </div>
            <div className="col-span-2 flex items-center text-sm text-gray-600">{doc.category}</div>
            <div className="col-span-1 flex items-center text-sm text-gray-600">
              {formatFileSize(doc.size)}
            </div>
            <div className="col-span-2 flex items-center">
              <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusBadge(doc.status)}`}>
                {doc.status}
              </span>
            </div>
            <div className="col-span-1 flex items-center justify-end">
              <button className="p-1 hover:bg-gray-200 rounded">
                <MoreVertical className="h-4 w-4 text-gray-600" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// Grid View Component
interface DocumentGridViewProps {
  documents: Document[];
  selectedDocs: Set<string>;
  onToggleSelect: (docId: string) => void;
  onDocumentClick: (document: Document) => void;
  getFileIcon: (type: string) => React.ReactElement;
  formatFileSize: (bytes: number) => string;
  getStatusBadge: (status: string) => string;
}

function DocumentGridView({
  documents,
  selectedDocs,
  onToggleSelect,
  onDocumentClick,
  getFileIcon,
  formatFileSize,
  getStatusBadge,
}: DocumentGridViewProps) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
      {documents.map((doc: Document) => (
        <motion.div
          key={doc.id}
          whileHover={{ scale: 1.02 }}
          className={`relative p-4 rounded-lg border-2 transition-all cursor-pointer ${
            selectedDocs.has(doc.id)
              ? "bg-blue-50 border-blue-300 ring-2 ring-blue-200"
              : "bg-white border-gray-200 hover:border-gray-300"
          }`}
          onClick={(e) => {
            // Only select if clicking the card, not the checkbox
            if (e.target instanceof HTMLElement && e.target.closest(".checkbox-area")) {
              onToggleSelect(doc.id);
            } else {
              onDocumentClick?.(doc);
            }
          }}
        >
          {/* Selection Checkbox */}
          <div
            className="absolute top-2 left-2 checkbox-area"
            onClick={(e) => {
              e.stopPropagation();
            }}
          >
            {selectedDocs.has(doc.id) ? (
              <CheckSquare className="h-5 w-5 text-blue-600" />
            ) : (
              <Square className="h-5 w-5 text-gray-400" />
            )}
          </div>

          {/* Status Badge */}
          <div className="absolute top-2 right-2">
            <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${getStatusBadge(doc.status)}`}>
              {doc.status}
            </span>
          </div>

          {/* File Icon */}
          <div className="flex justify-center mt-6 mb-3">{getFileIcon(doc.type)}</div>

          {/* File Info */}
          <p className="font-medium text-sm text-gray-900 text-center truncate mb-1">{doc.name}</p>
          <p className="text-xs text-gray-500 text-center">{formatFileSize(doc.size)}</p>
          <p className="text-xs text-gray-500 text-center mt-1">{doc.category}</p>
        </motion.div>
      ))}
    </div>
  );
}
