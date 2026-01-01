"use client";

import { useState } from "react";
import { Button } from "@safee/ui";
import { Plus, Search, Grid3x3, List, Eye, Copy, Archive, CheckCircle } from "lucide-react";
import { useTemplates, type TemplateResponse, getTemplateSummary } from "@/lib/api/hooks/templates";
import Link from "next/link";

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
      <div className="flex items-center justify-center h-96">
        <p className="text-gray-500">Loading templates...</p>
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
        {filteredTemplates.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
              <Grid3x3 className="h-8 w-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-1">No templates found</h3>
            <p className="text-sm text-gray-500 mb-4">
              {searchQuery
                ? "Try adjusting your search or filters"
                : "Create your first template to get started"}
            </p>
            {onCreateNew && !searchQuery && (
              <Button onClick={onCreateNew}>
                <Plus className="h-4 w-4 mr-2" />
                Create Template
              </Button>
            )}
          </div>
        ) : viewMode === "grid" ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filteredTemplates.map((template) => (
              <TemplateCard
                key={template.id}
                template={template}
                onSelect={() => onSelectTemplate?.(template)}
              />
            ))}
          </div>
        ) : (
          <div className="space-y-2">
            {filteredTemplates.map((template) => (
              <TemplateListItem
                key={template.id}
                template={template}
                onSelect={() => onSelectTemplate?.(template)}
              />
            ))}
          </div>
        )}
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

  return (
    <div className="bg-white rounded-lg border border-gray-200 hover:shadow-md transition-shadow overflow-hidden">
      <div className="p-4 space-y-3">
        {/* Icon and badges */}
        <div className="flex items-start justify-between">
          <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
            <span className="text-2xl">📋</span>
          </div>
          <div className="flex flex-col gap-1 items-end">
            {template.isActive && (
              <CheckCircle className="h-4 w-4 text-green-600" />
            )}
            {template.isSystemTemplate && (
              <span className="px-2 py-0.5 text-xs font-medium bg-purple-100 text-purple-700 rounded">
                System
              </span>
            )}
          </div>
        </div>

        {/* Title and description */}
        <div>
          <h3 className="font-semibold text-gray-900 line-clamp-1">{template.name}</h3>
          {template.description && (
            <p className="text-sm text-gray-600 line-clamp-2 mt-1">{template.description}</p>
          )}
        </div>

        {/* Metadata */}
        <div className="flex flex-wrap gap-1">
          <span className="px-2 py-0.5 text-xs font-medium bg-blue-100 text-blue-700 rounded">
            {summary.typeLabel}
          </span>
          <span className="px-2 py-0.5 text-xs font-medium bg-gray-100 text-gray-700 rounded">
            v{template.version}
          </span>
        </div>

        {/* Stats */}
        <div className="text-xs text-gray-600 space-y-1">
          <div>{summary.sectionCount} sections</div>
          <div>{summary.procedureCount} procedures</div>
        </div>

        {/* Actions */}
        <div className="flex gap-2 pt-2 border-t">
          <Link href={`/audit/templates/${template.id}`} className="flex-1">
            <Button variant="outline" size="sm" className="w-full">
              <Eye className="h-3 w-3 mr-1" />
              View
            </Button>
          </Link>
          <Button variant="outline" size="sm" onClick={onSelect}>
            Use
          </Button>
        </div>
      </div>
    </div>
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

  return (
    <div className="bg-white rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors">
      <div className="flex items-center gap-4 p-4">
        <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
          <span className="text-xl">📋</span>
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="font-semibold text-gray-900 truncate">{template.name}</h3>
            {template.isActive && <CheckCircle className="h-4 w-4 text-green-600 flex-shrink-0" />}
            {template.isSystemTemplate && (
              <span className="px-2 py-0.5 text-xs font-medium bg-purple-100 text-purple-700 rounded flex-shrink-0">
                System
              </span>
            )}
          </div>
          <div className="flex items-center gap-3 text-sm text-gray-600">
            <span>{summary.typeLabel}</span>
            <span>•</span>
            <span>
              {summary.sectionCount} sections, {summary.procedureCount} procedures
            </span>
            <span>•</span>
            <span>v{template.version}</span>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-shrink-0">
          <Link href={`/audit/templates/${template.id}`}>
            <Button variant="outline" size="sm">
              <Eye className="h-3 w-3 mr-1" />
              View
            </Button>
          </Link>
          <Button size="sm" onClick={onSelect}>
            Use
          </Button>
        </div>
      </div>
    </div>
  );
}
