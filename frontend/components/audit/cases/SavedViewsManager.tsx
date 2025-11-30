"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Save, Star, StarOff, Trash2, Eye, Clock, Filter, Plus, Edit2, Check, X } from "lucide-react";
import type { FilterToken } from "./CaseFilters";

export interface SavedView {
  id: string;
  name: string;
  description?: string;
  filters: FilterToken[];
  viewMode: "list" | "grid" | "kanban";
  sortBy?: string;
  isFavorite: boolean;
  createdAt: string;
  lastUsed?: string;
}

interface SavedViewsManagerProps {
  savedViews: SavedView[];
  activeViewId?: string;
  currentFilters: FilterToken[];
  currentViewMode: "list" | "grid" | "kanban";
  onSaveView: (view: Omit<SavedView, "id" | "createdAt">) => void;
  onLoadView: (view: SavedView) => void;
  onDeleteView: (id: string) => void;
  onToggleFavorite: (id: string) => void;
  onUpdateView: (id: string, updates: Partial<SavedView>) => void;
}

export function SavedViewsManager({
  savedViews,
  activeViewId,
  currentFilters,
  currentViewMode,
  onSaveView,
  onLoadView,
  onDeleteView,
  onToggleFavorite,
  onUpdateView,
}: SavedViewsManagerProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [newViewName, setNewViewName] = useState("");
  const [newViewDescription, setNewViewDescription] = useState("");
  const [editingViewId, setEditingViewId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");

  const favoriteViews = savedViews.filter((v) => v.isFavorite);
  const regularViews = savedViews.filter((v) => !v.isFavorite);

  const handleSaveCurrentView = () => {
    if (!newViewName.trim()) return;

    onSaveView({
      name: newViewName.trim(),
      description: newViewDescription.trim() || undefined,
      filters: currentFilters,
      viewMode: currentViewMode,
      isFavorite: false,
      lastUsed: new Date().toISOString(),
    });

    setNewViewName("");
    setNewViewDescription("");
    setShowSaveDialog(false);
  };

  const handleRenameView = (id: string) => {
    if (!editName.trim()) return;
    onUpdateView(id, { name: editName.trim() });
    setEditingViewId(null);
    setEditName("");
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  return (
    <div className="relative">
      {/* Compact View - Shows favorite views */}
      {!isExpanded && favoriteViews.length > 0 && (
        <div className="flex items-center space-x-2 mb-4">
          <span className="text-sm text-gray-600">Quick Views:</span>
          {favoriteViews.slice(0, 3).map((view) => (
            <button
              key={view.id}
              onClick={() => onLoadView(view)}
              className={`px-3 py-1.5 text-sm rounded-lg border transition-colors ${
                activeViewId === view.id
                  ? "bg-blue-50 border-blue-200 text-blue-700"
                  : "bg-white border-gray-300 text-gray-700 hover:border-gray-400"
              }`}
            >
              <Star className="h-3 w-3 inline mr-1 fill-yellow-400 text-yellow-400" />
              {view.name}
            </button>
          ))}
          <button
            onClick={() => setIsExpanded(true)}
            className="text-sm text-blue-600 hover:text-blue-700 font-medium"
          >
            View all ({savedViews.length})
          </button>
        </div>
      )}

      {/* Expanded View */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="mb-4 overflow-hidden"
          >
            <div className="bg-white rounded-xl border border-gray-200 p-4">
              {/* Header */}
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-2">
                  <Eye className="h-5 w-5 text-gray-600" />
                  <h3 className="font-semibold text-gray-900">Saved Views</h3>
                  <span className="text-sm text-gray-500">({savedViews.length})</span>
                </div>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => setShowSaveDialog(true)}
                    className="px-3 py-1.5 text-sm bg-blue-600 hover:bg-blue-700 text-white rounded-lg flex items-center space-x-1 transition-colors"
                  >
                    <Plus className="h-4 w-4" />
                    <span>Save Current</span>
                  </button>
                  <button
                    onClick={() => setIsExpanded(false)}
                    className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    <X className="h-4 w-4 text-gray-500" />
                  </button>
                </div>
              </div>

              {/* Favorite Views */}
              {favoriteViews.length > 0 && (
                <div className="mb-4">
                  <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                    Favorites
                  </h4>
                  <div className="space-y-2">
                    {favoriteViews.map((view) => (
                      <ViewCard
                        key={view.id}
                        view={view}
                        isActive={activeViewId === view.id}
                        isEditing={editingViewId === view.id}
                        editName={editName}
                        onLoad={() => onLoadView(view)}
                        onDelete={() => onDeleteView(view.id)}
                        onToggleFavorite={() => onToggleFavorite(view.id)}
                        onStartEdit={() => {
                          setEditingViewId(view.id);
                          setEditName(view.name);
                        }}
                        onSaveEdit={() => handleRenameView(view.id)}
                        onCancelEdit={() => {
                          setEditingViewId(null);
                          setEditName("");
                        }}
                        onEditNameChange={setEditName}
                        formatDate={formatDate}
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* Regular Views */}
              {regularViews.length > 0 && (
                <div>
                  <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                    All Views
                  </h4>
                  <div className="space-y-2">
                    {regularViews.map((view) => (
                      <ViewCard
                        key={view.id}
                        view={view}
                        isActive={activeViewId === view.id}
                        isEditing={editingViewId === view.id}
                        editName={editName}
                        onLoad={() => onLoadView(view)}
                        onDelete={() => onDeleteView(view.id)}
                        onToggleFavorite={() => onToggleFavorite(view.id)}
                        onStartEdit={() => {
                          setEditingViewId(view.id);
                          setEditName(view.name);
                        }}
                        onSaveEdit={() => handleRenameView(view.id)}
                        onCancelEdit={() => {
                          setEditingViewId(null);
                          setEditName("");
                        }}
                        onEditNameChange={setEditName}
                        formatDate={formatDate}
                      />
                    ))}
                  </div>
                </div>
              )}

              {savedViews.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  <Eye className="h-12 w-12 mx-auto mb-2 opacity-30" />
                  <p className="text-sm">No saved views yet</p>
                  <p className="text-xs mt-1">Save your current filters and view mode for quick access</p>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Save Dialog */}
      <AnimatePresence>
        {showSaveDialog && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 grid place-items-center p-4"
            onClick={() => setShowSaveDialog(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-xl shadow-xl w-full max-w-md p-6"
            >
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Save Current View</h3>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">View Name *</label>
                  <input
                    type="text"
                    value={newViewName}
                    onChange={(e) => setNewViewName(e.target.value)}
                    placeholder="e.g., High Priority Active Cases"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    autoFocus
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Description (Optional)
                  </label>
                  <textarea
                    value={newViewDescription}
                    onChange={(e) => setNewViewDescription(e.target.value)}
                    placeholder="What does this view show?"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    rows={2}
                  />
                </div>

                <div className="bg-gray-50 rounded-lg p-3 space-y-2">
                  <p className="text-sm font-medium text-gray-700">Will save:</p>
                  <div className="flex items-center space-x-2 text-sm text-gray-600">
                    <Filter className="h-4 w-4" />
                    <span>
                      {currentFilters.length} filter{currentFilters.length !== 1 ? "s" : ""}
                    </span>
                  </div>
                  <div className="flex items-center space-x-2 text-sm text-gray-600">
                    <Eye className="h-4 w-4" />
                    <span>{currentViewMode} view</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-end space-x-3 mt-6">
                <button
                  onClick={() => setShowSaveDialog(false)}
                  className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveCurrentView}
                  disabled={!newViewName.trim()}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
                >
                  <Save className="h-4 w-4" />
                  <span>Save View</span>
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

interface ViewCardProps {
  view: SavedView;
  isActive: boolean;
  isEditing: boolean;
  editName: string;
  onLoad: () => void;
  onDelete: () => void;
  onToggleFavorite: () => void;
  onStartEdit: () => void;
  onSaveEdit: () => void;
  onCancelEdit: () => void;
  onEditNameChange: (name: string) => void;
  formatDate: (date: string) => string;
}

function ViewCard({
  view,
  isActive,
  isEditing,
  editName,
  onLoad,
  onDelete,
  onToggleFavorite,
  onStartEdit,
  onSaveEdit,
  onCancelEdit,
  onEditNameChange,
  formatDate,
}: ViewCardProps) {
  return (
    <div
      className={`p-3 rounded-lg border transition-all ${
        isActive ? "bg-blue-50 border-blue-200" : "bg-gray-50 border-gray-200 hover:border-gray-300"
      }`}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          {isEditing ? (
            <div className="flex items-center space-x-2">
              <input
                type="text"
                value={editName}
                onChange={(e) => onEditNameChange(e.target.value)}
                className="flex-1 px-2 py-1 text-sm border border-blue-300 rounded focus:ring-2 focus:ring-blue-500"
                autoFocus
              />
              <button onClick={onSaveEdit} className="p-1 text-green-600 hover:bg-green-50 rounded">
                <Check className="h-4 w-4" />
              </button>
              <button onClick={onCancelEdit} className="p-1 text-gray-600 hover:bg-gray-100 rounded">
                <X className="h-4 w-4" />
              </button>
            </div>
          ) : (
            <button onClick={onLoad} className="text-left w-full group">
              <div className="flex items-center space-x-2 mb-1">
                <span
                  className={`font-medium text-sm ${
                    isActive ? "text-blue-700" : "text-gray-900 group-hover:text-blue-600"
                  }`}
                >
                  {view.name}
                </span>
              </div>
              {view.description && <p className="text-xs text-gray-600 mb-1">{view.description}</p>}
              <div className="flex items-center space-x-3 text-xs text-gray-500">
                <span className="flex items-center space-x-1">
                  <Filter className="h-3 w-3" />
                  <span>{view.filters.length} filters</span>
                </span>
                <span className="flex items-center space-x-1">
                  <Eye className="h-3 w-3" />
                  <span>{view.viewMode}</span>
                </span>
                {view.lastUsed && (
                  <span className="flex items-center space-x-1">
                    <Clock className="h-3 w-3" />
                    <span>{formatDate(view.lastUsed)}</span>
                  </span>
                )}
              </div>
            </button>
          )}
        </div>

        {!isEditing && (
          <div className="flex items-center space-x-1 ml-2">
            <button
              onClick={onToggleFavorite}
              className="p-1.5 hover:bg-white rounded transition-colors"
              title={view.isFavorite ? "Remove from favorites" : "Add to favorites"}
            >
              {view.isFavorite ? (
                <Star className="h-4 w-4 text-yellow-500 fill-yellow-400" />
              ) : (
                <StarOff className="h-4 w-4 text-gray-400" />
              )}
            </button>
            <button
              onClick={onStartEdit}
              className="p-1.5 hover:bg-white rounded transition-colors"
              title="Rename view"
            >
              <Edit2 className="h-4 w-4 text-gray-400 hover:text-blue-600" />
            </button>
            <button
              onClick={onDelete}
              className="p-1.5 hover:bg-white rounded transition-colors"
              title="Delete view"
            >
              <Trash2 className="h-4 w-4 text-gray-400 hover:text-red-600" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
