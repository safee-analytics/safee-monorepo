"use client";

import { useState } from "react";
import { Button } from "@safee/ui";
import { Plus, Search, Grid3x3, List, Eye, CheckCircle, Sparkles, Layers, FileText, ClipboardList, CheckSquare, BarChart3, Calendar, FileIcon } from "lucide-react";
import { useTemplates, type TemplateResponse, getTemplateSummary } from "@/lib/api/hooks/templates";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";

type ViewMode = "grid" | "list";
type FilterType = "all" | "system" | "organization";

interface TemplateLibraryProps {
  onCreateNew?: () => void;
  onSelectTemplate?: (template: TemplateResponse) => void;
}

export function TemplateLibrary({ onCreateNew, onSelectTemplate }: TemplateLibraryProps) {
  const [viewMode, setViewMode] = useState<ViewMode>("grid");
  const [filterType, setFilterType] = useState<FilterType>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTemplateType, setSelectedTemplateType] = useState<string>("all");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");

  const { data: templates, isLoading } = useTemplates();

  // Filter templates
  const filteredTemplates = templates?.filter((template) => {
    // Search filter
    if (searchQuery && !template.name.toLowerCase().includes(searchQuery.toLowerCase())) {
      return false;
    }

    // Type filter
    if (filterType === "system" && !template.isSystemTemplate) return false;
    if (filterType === "organization" && template.isSystemTemplate) return false;

    // Template type filter
    if (selectedTemplateType !== "all" && template.templateType !== selectedTemplateType) {
      return false;
    }

    // Category filter
    if (selectedCategory !== "all" && template.category !== selectedCategory) {
      return false;
    }

    return true;
  }) || [];

  if (isLoading) {
    return (
      <div className="flex flex-col h-full">
        {/* Header Skeleton */}
        <div className="flex items-center justify-between p-6 border-b">
          <div>
            <div className="h-8 w-48 bg-gray-200 rounded animate-pulse mb-2" />
            <div className="h-4 w-64 bg-gray-100 rounded animate-pulse" />
          </div>
          <div className="h-10 w-32 bg-gray-200 rounded animate-pulse" />
        </div>

        {/* Filters Skeleton */}
        <div className="p-6 border-b space-y-4">
          <div className="h-10 w-full bg-gray-100 rounded animate-pulse" />
          <div className="flex gap-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-8 w-24 bg-gray-100 rounded animate-pulse" />
            ))}
          </div>
        </div>

        {/* Cards Skeleton */}
        <div className="flex-1 overflow-y-auto p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="bg-white rounded-lg border border-gray-200 p-4 space-y-3">
                <div className="flex justify-between">
                  <div className="w-12 h-12 bg-gray-100 rounded-lg animate-pulse" />
                  <div className="w-16 h-6 bg-gray-100 rounded animate-pulse" />
                </div>
                <div className="space-y-2">
                  <div className="h-5 w-3/4 bg-gray-200 rounded animate-pulse" />
                  <div className="h-4 w-full bg-gray-100 rounded animate-pulse" />
                  <div className="h-4 w-2/3 bg-gray-100 rounded animate-pulse" />
                </div>
                <div className="flex gap-2">
                  <div className="h-6 w-16 bg-gray-100 rounded animate-pulse" />
                  <div className="h-6 w-12 bg-gray-100 rounded animate-pulse" />
                </div>
                <div className="space-y-1">
                  <div className="h-3 w-24 bg-gray-100 rounded animate-pulse" />
                  <div className="h-3 w-28 bg-gray-100 rounded animate-pulse" />
                </div>
                <div className="flex gap-2 pt-2 border-t">
                  <div className="flex-1 h-8 bg-gray-100 rounded animate-pulse" />
                  <div className="w-16 h-8 bg-gray-100 rounded animate-pulse" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between p-6 border-b">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Template Library</h2>
          <p className="text-sm text-gray-500 mt-1">
            Browse and manage audit templates ({filteredTemplates.length} templates)
          </p>
        </div>

        {onCreateNew && (
          <Button onClick={onCreateNew}>
            <Plus className="h-4 w-4 mr-2" />
            New Template
          </Button>
        )}
      </div>

      {/* Filters and Search */}
      <div className="p-6 border-b space-y-4">
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search templates by name..."
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Filters */}
        <div className="flex items-center gap-4 flex-wrap">
          {/* Type filter tabs */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setFilterType("all")}
              className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
                filterType === "all"
                  ? "bg-blue-100 text-blue-700"
                  : "text-gray-600 hover:bg-gray-100"
              }`}
            >
              All Templates
            </button>
            <button
              onClick={() => setFilterType("system")}
              className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
                filterType === "system"
                  ? "bg-blue-100 text-blue-700"
                  : "text-gray-600 hover:bg-gray-100"
              }`}
            >
              System
            </button>
            <button
              onClick={() => setFilterType("organization")}
              className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
                filterType === "organization"
                  ? "bg-blue-100 text-blue-700"
                  : "text-gray-600 hover:bg-gray-100"
              }`}
            >
              My Organization
            </button>
          </div>

          {/* Template type filter */}
          <select
            value={selectedTemplateType}
            onChange={(e) => setSelectedTemplateType(e.target.value)}
            className="px-3 py-1.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All Types</option>
            <option value="scope">Scope</option>
            <option value="form">Form</option>
            <option value="checklist">Checklist</option>
            <option value="report">Report</option>
            <option value="plan">Plan</option>
          </select>

          {/* Category filter */}
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="px-3 py-1.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All Categories</option>
            <option value="certification">Certification</option>
            <option value="financial">Financial</option>
            <option value="operational">Operational</option>
            <option value="compliance">Compliance</option>
          </select>

          {/* View mode toggle */}
          <div className="ml-auto flex items-center gap-1 border border-gray-300 rounded-md p-1">
            <button
              onClick={() => setViewMode("grid")}
              className={`p-1.5 rounded transition-colors ${
                viewMode === "grid" ? "bg-blue-100 text-blue-700" : "text-gray-600 hover:bg-gray-100"
              }`}
              title="Grid view"
            >
              <Grid3x3 className="h-4 w-4" />
            </button>
            <button
              onClick={() => setViewMode("list")}
              className={`p-1.5 rounded transition-colors ${
                viewMode === "list" ? "bg-blue-100 text-blue-700" : "text-gray-600 hover:bg-gray-100"
              }`}
              title="List view"
            >
              <List className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Templates */}
      <div className="flex-1 overflow-y-auto p-6">
        <AnimatePresence mode="wait">
          {filteredTemplates.length === 0 ? (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="flex flex-col items-center justify-center h-full text-center"
            >
              <motion.div
                initial={{ scale: 0.8 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", stiffness: 200, damping: 15 }}
                className="relative mb-8"
              >
                {/* Gradient background circles */}
                <div className="absolute inset-0 bg-gradient-to-br from-blue-100 via-purple-100 to-pink-100 rounded-full blur-2xl opacity-60 animate-pulse" />

                {/* Icon container */}
                <div className="relative w-24 h-24 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-xl">
                  <Layers className="h-12 w-12 text-white" />
                  <Sparkles className="absolute -top-2 -right-2 h-6 w-6 text-yellow-400 animate-pulse" />
                </div>
              </motion.div>

              <h3 className="text-2xl font-bold text-gray-900 mb-2">
                {searchQuery ? "No templates match your search" : "No templates yet"}
              </h3>
              <p className="text-base text-gray-600 mb-6 max-w-md">
                {searchQuery
                  ? "Try adjusting your search or filters to find what you're looking for"
                  : "Get started by creating your first template to streamline your workflow"}
              </p>

              {onCreateNew && !searchQuery && (
                <motion.div
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <Button onClick={onCreateNew} className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700">
                    <Plus className="h-4 w-4 mr-2" />
                    Create Your First Template
                  </Button>
                </motion.div>
              )}
            </motion.div>
          ) : viewMode === "grid" ? (
            <motion.div
              key="grid"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4"
            >
              {filteredTemplates.map((template, index) => (
                <motion.div
                  key={template.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05, duration: 0.3 }}
                >
                  <TemplateCard
                    template={template}
                    onSelect={() => onSelectTemplate?.(template)}
                  />
                </motion.div>
              ))}
            </motion.div>
          ) : (
            <motion.div
              key="list"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="space-y-2"
            >
              {filteredTemplates.map((template, index) => (
                <motion.div
                  key={template.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.03, duration: 0.3 }}
                >
                  <TemplateListItem
                    template={template}
                    onSelect={() => onSelectTemplate?.(template)}
                  />
                </motion.div>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

// Template Card for grid view
function TemplateCard({
  template,
  onSelect,
}: {
  template: TemplateResponse;
  onSelect: () => void;
}) {
  const summary = getTemplateSummary(template);
  const [isHovered, setIsHovered] = useState(false);

  // Get color scheme based on template type
  const getColorScheme = (type: string) => {
    switch (type) {
      case "scope":
        return { bg: "from-blue-500 to-cyan-500", badge: "bg-blue-100 text-blue-700", Icon: FileText };
      case "form":
        return { bg: "from-purple-500 to-pink-500", badge: "bg-purple-100 text-purple-700", Icon: ClipboardList };
      case "checklist":
        return { bg: "from-green-500 to-emerald-500", badge: "bg-green-100 text-green-700", Icon: CheckSquare };
      case "report":
        return { bg: "from-orange-500 to-red-500", badge: "bg-orange-100 text-orange-700", Icon: BarChart3 };
      case "plan":
        return { bg: "from-indigo-500 to-blue-500", badge: "bg-indigo-100 text-indigo-700", Icon: Calendar };
      default:
        return { bg: "from-gray-500 to-slate-500", badge: "bg-gray-100 text-gray-700", Icon: FileIcon };
    }
  };

  const colorScheme = getColorScheme(template.templateType);
  const IconComponent = colorScheme.Icon;

  return (
    <motion.div
      whileHover={{ y: -4, scale: 1.02 }}
      onHoverStart={() => setIsHovered(true)}
      onHoverEnd={() => setIsHovered(false)}
      className="bg-white rounded-xl border border-gray-200 hover:shadow-2xl transition-all duration-300 overflow-hidden relative group"
    >
      {/* Gradient top border */}
      <div className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r ${colorScheme.bg}`} />

      <div className="p-5 space-y-3">
        {/* Icon and badges */}
        <div className="flex items-start justify-between">
          <motion.div
            animate={{ rotate: isHovered ? [0, -10, 10, -10, 0] : 0 }}
            transition={{ duration: 0.5 }}
            className={`w-14 h-14 bg-gradient-to-br ${colorScheme.bg} rounded-xl flex items-center justify-center shadow-lg group-hover:shadow-xl transition-shadow`}
          >
            <IconComponent className="h-7 w-7 text-white" />
          </motion.div>
          <div className="flex flex-col gap-1.5 items-end">
            {template.isActive && (
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", stiffness: 200 }}
              >
                <CheckCircle className="h-5 w-5 text-green-600" />
              </motion.div>
            )}
            {template.isSystemTemplate && (
              <span className="px-2.5 py-1 text-xs font-semibold bg-gradient-to-r from-purple-100 to-pink-100 text-purple-700 rounded-full">
                System
              </span>
            )}
          </div>
        </div>

        {/* Title and description */}
        <div>
          <h3 className="font-bold text-gray-900 line-clamp-1 text-lg group-hover:text-blue-600 transition-colors">
            {template.name}
          </h3>
          {template.description && (
            <p className="text-sm text-gray-600 line-clamp-2 mt-1.5 leading-relaxed">
              {template.description}
            </p>
          )}
        </div>

        {/* Metadata */}
        <div className="flex flex-wrap gap-1.5">
          <span className={`px-3 py-1 text-xs font-semibold ${colorScheme.badge} rounded-full`}>
            {summary.typeLabel}
          </span>
          <span className="px-3 py-1 text-xs font-semibold bg-gradient-to-r from-gray-100 to-slate-100 text-gray-700 rounded-full">
            v{template.version}
          </span>
        </div>

        {/* Stats */}
        <div className="flex gap-4 text-sm">
          <div className="flex items-center gap-1.5 text-gray-700">
            <div className="w-2 h-2 rounded-full bg-blue-500" />
            <span className="font-medium">{summary.sectionCount}</span>
            <span className="text-gray-500">sections</span>
          </div>
          <div className="flex items-center gap-1.5 text-gray-700">
            <div className="w-2 h-2 rounded-full bg-purple-500" />
            <span className="font-medium">{summary.procedureCount}</span>
            <span className="text-gray-500">procedures</span>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-2 pt-3 border-t border-gray-100">
          <Link href={`/audit/templates/${template.id}`} className="flex-1">
            <Button variant="outline" size="sm" className="w-full">
              <Eye className="h-3.5 w-3.5 mr-1.5" />
              View
            </Button>
          </Link>
          <Button size="sm" onClick={onSelect}>
            Use
          </Button>
        </div>
      </div>
    </motion.div>
  );
}

// Template List Item for list view
function TemplateListItem({
  template,
  onSelect,
}: {
  template: TemplateResponse;
  onSelect: () => void;
}) {
  const summary = getTemplateSummary(template);

  // Get color scheme based on template type
  const getColorScheme = (type: string) => {
    switch (type) {
      case "scope":
        return { bg: "from-blue-500 to-cyan-500", badge: "bg-blue-100 text-blue-700", Icon: FileText };
      case "form":
        return { bg: "from-purple-500 to-pink-500", badge: "bg-purple-100 text-purple-700", Icon: ClipboardList };
      case "checklist":
        return { bg: "from-green-500 to-emerald-500", badge: "bg-green-100 text-green-700", Icon: CheckSquare };
      case "report":
        return { bg: "from-orange-500 to-red-500", badge: "bg-orange-100 text-orange-700", Icon: BarChart3 };
      case "plan":
        return { bg: "from-indigo-500 to-blue-500", badge: "bg-indigo-100 text-indigo-700", Icon: Calendar };
      default:
        return { bg: "from-gray-500 to-slate-500", badge: "bg-gray-100 text-gray-700", Icon: FileIcon };
    }
  };

  const colorScheme = getColorScheme(template.templateType);
  const IconComponent = colorScheme.Icon;

  return (
    <motion.div
      whileHover={{ x: 4, scale: 1.01 }}
      className="bg-white rounded-xl border border-gray-200 hover:shadow-lg hover:border-blue-200 transition-all duration-300 overflow-hidden"
    >
      <div className="flex items-center gap-4 p-4">
        <motion.div
          whileHover={{ rotate: [0, -5, 5, -5, 0] }}
          transition={{ duration: 0.5 }}
          className={`w-12 h-12 bg-gradient-to-br ${colorScheme.bg} rounded-xl flex items-center justify-center flex-shrink-0 shadow-md`}
        >
          <IconComponent className="h-6 w-6 text-white" />
        </motion.div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="font-bold text-gray-900 truncate hover:text-blue-600 transition-colors">
              {template.name}
            </h3>
            {template.isActive && (
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", stiffness: 200 }}
              >
                <CheckCircle className="h-4 w-4 text-green-600 flex-shrink-0" />
              </motion.div>
            )}
            {template.isSystemTemplate && (
              <span className="px-2.5 py-0.5 text-xs font-semibold bg-gradient-to-r from-purple-100 to-pink-100 text-purple-700 rounded-full flex-shrink-0">
                System
              </span>
            )}
          </div>
          <div className="flex items-center gap-3 text-sm">
            <span className={`px-2 py-0.5 text-xs font-semibold ${colorScheme.badge} rounded-full`}>
              {summary.typeLabel}
            </span>
            <div className="flex items-center gap-1.5 text-gray-700">
              <div className="w-1.5 h-1.5 rounded-full bg-blue-500" />
              <span className="font-medium">{summary.sectionCount}</span>
              <span className="text-gray-500">sections</span>
            </div>
            <div className="flex items-center gap-1.5 text-gray-700">
              <div className="w-1.5 h-1.5 rounded-full bg-purple-500" />
              <span className="font-medium">{summary.procedureCount}</span>
              <span className="text-gray-500">procedures</span>
            </div>
            <span className="text-gray-500">• v{template.version}</span>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-shrink-0">
          <Link href={`/audit/templates/${template.id}`}>
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <Button variant="outline" size="sm">
                <Eye className="h-3.5 w-3.5 mr-1.5" />
                View
              </Button>
            </motion.div>
          </Link>
          <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
            <Button size="sm" onClick={onSelect}>
              Use
            </Button>
          </motion.div>
        </div>
      </div>
    </motion.div>
  );
}
