"use client";

import { Bookmark, FileText, FolderOpen, Plus, Search } from "lucide-react";
import { useState } from "react";

export default function BookmarksPage() {
  const [searchQuery, setSearchQuery] = useState("");

  // Placeholder data - replace with actual bookmarks from API
  const bookmarks = [
    {
      id: "1",
      title: "Q4 Financial Report",
      type: "report",
      module: "Accounting",
      url: "/accounting/reports/profit-loss",
      createdAt: "2025-01-15",
    },
    {
      id: "2",
      title: "Employee Onboarding Checklist",
      type: "document",
      module: "HR",
      url: "/hr/employees/123",
      createdAt: "2025-01-10",
    },
  ];

  const filteredBookmarks = bookmarks.filter((bookmark) =>
    bookmark.title.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-safee-100 rounded-lg">
                <Bookmark className="h-6 w-6 text-safee-600" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Bookmarks</h1>
                <p className="text-gray-600">Quick access to your saved items</p>
              </div>
            </div>
            <button className="flex items-center gap-2 px-4 py-2 bg-safee-600 text-white rounded-lg hover:bg-safee-700 transition-colors">
              <Plus className="h-5 w-5" />
              Add Bookmark
            </button>
          </div>
        </div>

        {/* Search Bar */}
        <div className="mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search bookmarks..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-safee-500 focus:border-transparent"
            />
          </div>
        </div>

        {/* Bookmarks Grid */}
        {filteredBookmarks.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredBookmarks.map((bookmark) => (
              <a
                key={bookmark.id}
                href={bookmark.url}
                className="group bg-white rounded-xl border border-gray-200 p-6 hover:shadow-lg hover:border-safee-300 transition-all"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="p-2 bg-gray-100 rounded-lg group-hover:bg-safee-100 transition-colors">
                    {bookmark.type === "report" ? (
                      <FileText className="h-6 w-6 text-gray-600 group-hover:text-safee-600" />
                    ) : (
                      <FolderOpen className="h-6 w-6 text-gray-600 group-hover:text-safee-600" />
                    )}
                  </div>
                  <Bookmark className="h-5 w-5 text-safee-600 fill-safee-600" />
                </div>

                <h3 className="text-lg font-semibold text-gray-900 mb-2 group-hover:text-safee-600 transition-colors">
                  {bookmark.title}
                </h3>

                <div className="flex items-center gap-2 text-sm text-gray-500">
                  <span className="px-2 py-1 bg-gray-100 rounded text-xs font-medium">{bookmark.module}</span>
                  <span>•</span>
                  <span>{new Date(bookmark.createdAt).toLocaleDateString()}</span>
                </div>
              </a>
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
            <div className="flex justify-center mb-4">
              <div className="p-4 bg-gray-100 rounded-full">
                <Bookmark className="h-12 w-12 text-gray-400" />
              </div>
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No bookmarks found</h3>
            <p className="text-gray-600 mb-6">
              {searchQuery
                ? "Try adjusting your search terms"
                : "Start bookmarking important pages and reports for quick access"}
            </p>
            {!searchQuery && (
              <button className="px-6 py-3 bg-safee-600 text-white rounded-lg hover:bg-safee-700 transition-colors">
                Browse Reports
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
