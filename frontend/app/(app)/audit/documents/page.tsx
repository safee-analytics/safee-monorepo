"use client";

import React, { useState } from "react";
import {
  Search,
  Upload,
  LayoutGrid,
  List,
  Download,
  Share2,
  Trash2,
  Folder,
  FileText,
  File,
} from "lucide-react";
import { motion } from "framer-motion";
import { Document } from "@/types/audit";
import { useTranslation } from "@/lib/providers/TranslationProvider";
import { Table, Pagination } from "@/components/data-display/Table";
import { CollapsibleChevron } from "@/components/ui/DirectionalChevron";

interface FolderNode {
  id: string;
  name: string;
  children?: FolderNode[];
}

export default function DocumentRepository() {
  const { t, locale } = useTranslation();
  const [viewMode, setViewMode] = useState<"grid" | "list">("list");
  const [searchQuery, setSearchQuery] = useState("");
  const [folderSearchQuery, setFolderSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [currentPathIds, _setCurrentPathIds] = useState(["all-documents", "active-cases"]);
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set(["1", "2", "6"]));

  const folders: FolderNode[] = [
    {
      id: "1",
      name: t.audit.allDocuments,
      children: [
        {
          id: "2",
          name: t.audit.activeAudits,
          children: [
            { id: "3", name: "ABC Corporation" },
            { id: "4", name: "XYZ Retail Ltd" },
            { id: "5", name: "Manufacturing Co" },
          ],
        },
        {
          id: "6",
          name: t.audit.completedAuditsDocs,
          children: [
            { id: "10", name: "Q1 2024 Audits" },
            { id: "11", name: "Q2 2024 Audits" },
          ],
        },
        { id: "7", name: t.audit.templates },
        { id: "8", name: t.audit.compliance },
        { id: "9", name: t.audit.archive },
      ],
    },
  ];

  const pathIdToName: Record<string, string> = {
    "all-documents": t.audit.allDocuments,
    "active-cases": t.audit.activeAudits,
    "completed-audits": t.audit.completedAuditsDocs,
    templates: t.audit.templates,
    compliance: t.audit.compliance,
    archive: t.audit.archive,
  };

  const currentPath = currentPathIds.map((id) => pathIdToName[id] || id);

  const toggleFolder = (folderId: string) => {
    setExpandedFolders((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(folderId)) {
        newSet.delete(folderId);
      } else {
        newSet.add(folderId);
      }
      return newSet;
    });
  };

  const filterFolders = (
    nodes: FolderNode[],
    query: string,
  ): { nodes: FolderNode[]; matchedIds: Set<string> } => {
    if (!query) return { nodes, matchedIds: new Set() };

    const matchedIds = new Set<string>();
    const filtered = nodes.reduce<FolderNode[]>((acc, node) => {
      const matchesSearch = node.name.toLowerCase().includes(query.toLowerCase());
      const childResult = node.children
        ? filterFolders(node.children, query)
        : { nodes: [], matchedIds: new Set<string>() };

      if (matchesSearch || childResult.nodes.length > 0) {
        if (matchesSearch) matchedIds.add(node.id);
        for (const id of childResult.matchedIds) matchedIds.add(id);

        acc.push({
          ...node,
          children: childResult.nodes.length > 0 ? childResult.nodes : node.children,
        });
      }

      return acc;
    }, []);

    return { nodes: filtered, matchedIds };
  };

  const renderFolderTree = (nodes: FolderNode[], level = 0): React.ReactElement[] => {
    const { nodes: filteredNodes } = level === 0 ? filterFolders(nodes, folderSearchQuery) : { nodes };

    return filteredNodes.flatMap((folder) => {
      const isExpanded = expandedFolders.has(folder.id);
      const hasChildren = folder.children && folder.children.length > 0;

      return [
        <motion.button
          key={folder.id}
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.2 }}
          className="w-full flex items-center gap-2 px-2 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
          style={{ paddingLeft: `${8 + level * 16}px` }}
          onClick={() => hasChildren && toggleFolder(folder.id)}
        >
          {hasChildren ? (
            <CollapsibleChevron isExpanded={isExpanded} className="w-4 h-4 flex-shrink-0 text-gray-500" />
          ) : (
            <span className="w-4" />
          )}
          <Folder className="w-4 h-4 flex-shrink-0 text-gray-600" />
          <span className="truncate">{folder.name}</span>
        </motion.button>,
        ...(isExpanded && hasChildren ? renderFolderTree(folder.children!, level + 1) : []),
      ];
    });
  };

  const documents: Document[] = [
    {
      id: "1",
      name: "Financial Statements Q3 2024.pdf",
      type: "pdf",
      size: "2.4 MB",
      modified: "2 hours ago",
      owner: {
        name: "M. Chen",
        avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Michael",
      },
      company: "ABC Corporation",
    },
    {
      id: "2",
      name: "Audit Checklist Template.docx",
      type: "docx",
      size: "156 KB",
      modified: "1 day ago",
      owner: {
        name: "S. Wilson",
        avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Sarah",
      },
    },
    {
      id: "3",
      name: "Risk Assessment Matrix.xlsx",
      type: "xlsx",
      size: "892 KB",
      modified: "3 days ago",
      owner: {
        name: "D. Kim",
        avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=David",
      },
      company: "Manufacturing Co",
    },
    {
      id: "4",
      name: "Audit Findings Presentation.pptx",
      type: "pptx",
      size: "3.7 MB",
      modified: "5 days ago",
      owner: {
        name: "E. Rodriguez",
        avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Emma",
      },
      company: "XYZ Retail Ltd",
    },
    {
      id: "5",
      name: "Evidence Photos.zip",
      type: "zip",
      size: "15.2 MB",
      modified: "1 week ago",
      owner: {
        name: "L. Thompson",
        avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Lisa",
      },
      company: "ABC Corporation",
    },
    {
      id: "6",
      name: "Compliance Report 2024.pdf",
      type: "pdf",
      size: "4.1 MB",
      modified: "2 weeks ago",
      owner: {
        name: "J. Parker",
        avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=John",
      },
      company: "Compliance",
    },
  ];

  const getFileIconComponent = (type: Document["type"]) => {
    const iconMap: Record<Document["type"], { component: typeof FileText; color: string; bg: string }> = {
      pdf: { component: FileText, color: "text-red-600", bg: "bg-red-100" },
      docx: { component: FileText, color: "text-blue-600", bg: "bg-blue-100" },
      xlsx: { component: FileText, color: "text-green-600", bg: "bg-green-100" },
      pptx: { component: FileText, color: "text-orange-600", bg: "bg-orange-100" },
      zip: { component: File, color: "text-gray-600", bg: "bg-gray-100" },
      folder: { component: Folder, color: "text-yellow-600", bg: "bg-yellow-100" },
    };
    return iconMap[type] || iconMap.pdf;
  };

  const columns = [
    {
      key: "name",
      header: t.audit.name,
      render: (doc: Document) => {
        const fileIcon = getFileIconComponent(doc.type);
        const IconComponent = fileIcon.component;
        return (
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${fileIcon.bg}`}>
              <IconComponent className={`w-5 h-5 ${fileIcon.color}`} />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-900">{doc.name}</p>
              {doc.company && <p className="text-xs text-gray-600">{doc.company}</p>}
            </div>
          </div>
        );
      },
    },
    {
      key: "modified",
      header: t.audit.modified,
      render: (doc: Document) => <span className="text-sm text-gray-900">{doc.modified}</span>,
    },
    {
      key: "size",
      header: t.audit.size,
      render: (doc: Document) => <span className="text-sm text-gray-900">{doc.size}</span>,
    },
    {
      key: "owner",
      header: t.audit.owner,
      render: (doc: Document) => (
        <div className="flex items-center gap-2">
          <img src={doc.owner.avatar} alt={doc.owner.name} className="w-8 h-8 rounded-full" />
          <span className="text-sm text-gray-900">{doc.owner.name}</span>
        </div>
      ),
    },
    {
      key: "actions",
      header: t.audit.actions,
      render: () => (
        <div className="flex items-center gap-2">
          <button className="p-1.5 hover:bg-gray-100 rounded transition-colors" title={t.audit.download}>
            <Download className="w-4 h-4 text-gray-600" />
          </button>
          <button className="p-1.5 hover:bg-gray-100 rounded transition-colors" title="Share">
            <Share2 className="w-4 h-4 text-gray-600" />
          </button>
          <button
            className="p-1.5 hover:bg-gray-100 hover:text-red-600 rounded transition-colors"
            title="Delete"
          >
            <Trash2 className="w-4 h-4 text-gray-600" />
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="flex h-screen">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="w-64 bg-white border-r border-gray-200 p-4 overflow-y-auto"
        >
          <h2 className="text-sm font-semibold text-gray-900 mb-4 px-2">{t.audit.folderStructure}</h2>

          <div className="mb-4 px-2">
            <div className="relative">
              <Search
                className={`absolute ${locale === "ar" ? "right-3" : "left-3"} top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400`}
              />
              <input
                type="text"
                placeholder={t.common.search}
                value={folderSearchQuery}
                onChange={(e) => {
                  setFolderSearchQuery(e.target.value);
                }}
                className={`w-full ${locale === "ar" ? "pr-9 pl-3" : "pl-9 pr-3"} py-1.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
              />
            </div>
          </div>

          <div className="space-y-1">{renderFolderTree(folders)}</div>

          <div className="mt-8 pt-6 border-t border-gray-200">
            <h3 className="text-xs font-semibold text-gray-500 uppercase mb-3 px-2">
              {t.audit.quickFilters}
            </h3>
            <div className="space-y-1">
              <button className="w-full flex items-center gap-2 px-2 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-lg">
                <input type="checkbox" className="rounded border-gray-300" />
                <span>{t.audit.recentFiles}</span>
              </button>
              <button className="w-full flex items-center gap-2 px-2 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-lg">
                <input type="checkbox" className="rounded border-gray-300" />
                <span>{t.audit.sharedWithMe}</span>
              </button>
              <button className="w-full flex items-center gap-2 px-2 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-lg">
                <input type="checkbox" className="rounded border-gray-300" />
                <span>{t.audit.starred}</span>
              </button>
              <button className="w-full flex items-center gap-2 px-2 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-lg">
                <input type="checkbox" className="rounded border-gray-300" />
                <span>{t.audit.pendingReview}</span>
              </button>
            </div>
          </div>
        </motion.div>

        <div className="flex-1 overflow-y-auto">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="p-6">
            <div className="mb-6">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h1 className="text-3xl font-bold text-gray-900 mb-2">{t.audit.documentRepository}</h1>
                  <p className="text-gray-600">{t.audit.documentRepositorySubtitle}</p>
                </div>
                <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors">
                  <Upload className="w-4 h-4" />
                  {t.audit.uploadDocument}
                </button>
              </div>

              <div className="flex items-center gap-2 text-sm text-gray-600 mb-4">
                {currentPath.map((path, idx) => (
                  <div key={idx} className="flex items-center gap-2">
                    {idx > 0 && <span>/</span>}
                    <button
                      className={
                        idx === currentPath.length - 1 ? "text-blue-600 font-medium" : "hover:text-gray-900"
                      }
                    >
                      {path}
                    </button>
                  </div>
                ))}
              </div>

              <div className="flex items-center gap-4">
                <div className="flex-1 relative">
                  <Search
                    className={`absolute ${locale === "ar" ? "right-3" : "left-3"} top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400`}
                  />
                  <input
                    type="text"
                    placeholder={t.audit.searchDocuments}
                    value={searchQuery}
                    onChange={(e) => {
                      setSearchQuery(e.target.value);
                    }}
                    className={`w-full ${locale === "ar" ? "pr-10 pl-4" : "pl-10 pr-4"} py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500`}
                  />
                </div>
                <div className="flex items-center gap-2 bg-white border border-gray-300 rounded-lg p-1">
                  <button
                    onClick={() => {
                      setViewMode("list");
                    }}
                    className={`p-2 rounded ${viewMode === "list" ? "bg-gray-100" : "hover:bg-gray-50"}`}
                  >
                    <List className="w-5 h-5 text-gray-600" />
                  </button>
                  <button
                    onClick={() => {
                      setViewMode("grid");
                    }}
                    className={`p-2 rounded ${viewMode === "grid" ? "bg-gray-100" : "hover:bg-gray-50"}`}
                  >
                    <LayoutGrid className="w-5 h-5 text-gray-600" />
                  </button>
                </div>
                <select className="border border-gray-300 rounded-lg px-3 py-2 text-sm">
                  <option>{t.audit.sortByDate}</option>
                  <option>{t.audit.sortByName}</option>
                  <option>{t.audit.sortBySize}</option>
                  <option>{t.audit.sortByOwner}</option>
                </select>
              </div>
            </div>

            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
              <div className="p-4 border-b border-gray-200">
                <p className="text-sm text-gray-600">
                  {t.audit.showingDocuments
                    .replace("{start}", "1")
                    .replace("{end}", "6")
                    .replace("{total}", "156")}
                </p>
              </div>

              <div className="overflow-x-auto">
                <Table
                  data={documents}
                  columns={columns}
                  keyExtractor={(doc) => doc.id}
                  hoverable={true}
                  animated={false}
                  className="rounded-none shadow-none"
                />
              </div>

              <div className="p-4 border-t border-gray-200">
                <Pagination currentPage={currentPage} totalPages={26} onPageChange={setCurrentPage} />
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
