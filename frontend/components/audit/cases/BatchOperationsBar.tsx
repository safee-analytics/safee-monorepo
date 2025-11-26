"use client";

import { motion, AnimatePresence } from "framer-motion";
import {
  Archive,
  Trash2,
  Edit,
  Users,
  Download,
  X,
  CheckSquare,
  Tag,
} from "lucide-react";

interface BatchOperationsBarProps {
  selectedCount: number;
  onClearSelection: () => void;
  onArchive: () => void;
  onDelete: () => void;
  onStatusChange: () => void;
  onAssignTeam: () => void;
  onExport: () => void;
  onAddTags?: () => void;
}

export function BatchOperationsBar({
  selectedCount,
  onClearSelection,
  onArchive,
  onDelete,
  onStatusChange,
  onAssignTeam,
  onExport,
  onAddTags,
}: BatchOperationsBarProps) {
  return (
    <AnimatePresence>
      {selectedCount > 0 && (
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          transition={{ type: "spring", damping: 25, stiffness: 300 }}
          className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50"
        >
          <div className="bg-white rounded-xl shadow-2xl border border-gray-200 overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-3 bg-gradient-to-r from-blue-50 to-purple-50 border-b border-gray-200">
              <div className="flex items-center space-x-3">
                <div className="p-1.5 bg-blue-600 rounded-lg">
                  <CheckSquare className="h-4 w-4 text-white" />
                </div>
                <span className="font-semibold text-gray-900">
                  {selectedCount} case{selectedCount > 1 ? "s" : ""} selected
                </span>
              </div>
              <button
                onClick={onClearSelection}
                className="p-1.5 hover:bg-white rounded-lg transition-colors"
                title="Clear selection"
              >
                <X className="h-4 w-4 text-gray-500" />
              </button>
            </div>

            {/* Actions */}
            <div className="flex items-center divide-x divide-gray-200">
              <button
                onClick={onStatusChange}
                className="flex items-center space-x-2 px-6 py-4 hover:bg-gray-50 transition-colors group"
                title="Change status (S)"
              >
                <Edit className="h-5 w-5 text-gray-600 group-hover:text-blue-600" />
                <span className="text-sm font-medium text-gray-700 group-hover:text-blue-600">
                  Status
                </span>
              </button>

              <button
                onClick={onAssignTeam}
                className="flex items-center space-x-2 px-6 py-4 hover:bg-gray-50 transition-colors group"
                title="Assign team (Shift+T)"
              >
                <Users className="h-5 w-5 text-gray-600 group-hover:text-blue-600" />
                <span className="text-sm font-medium text-gray-700 group-hover:text-blue-600">
                  Assign
                </span>
              </button>

              {onAddTags && (
                <button
                  onClick={onAddTags}
                  className="flex items-center space-x-2 px-6 py-4 hover:bg-gray-50 transition-colors group"
                  title="Add tags"
                >
                  <Tag className="h-5 w-5 text-gray-600 group-hover:text-blue-600" />
                  <span className="text-sm font-medium text-gray-700 group-hover:text-blue-600">
                    Tags
                  </span>
                </button>
              )}

              <button
                onClick={onArchive}
                className="flex items-center space-x-2 px-6 py-4 hover:bg-gray-50 transition-colors group"
                title="Archive (Shift+A)"
              >
                <Archive className="h-5 w-5 text-gray-600 group-hover:text-amber-600" />
                <span className="text-sm font-medium text-gray-700 group-hover:text-amber-600">
                  Archive
                </span>
              </button>

              <button
                onClick={onExport}
                className="flex items-center space-x-2 px-6 py-4 hover:bg-gray-50 transition-colors group"
                title="Export (E)"
              >
                <Download className="h-5 w-5 text-gray-600 group-hover:text-green-600" />
                <span className="text-sm font-medium text-gray-700 group-hover:text-green-600">
                  Export
                </span>
              </button>

              <button
                onClick={onDelete}
                className="flex items-center space-x-2 px-6 py-4 hover:bg-red-50 transition-colors group"
                title="Delete (Shift+D)"
              >
                <Trash2 className="h-5 w-5 text-gray-600 group-hover:text-red-600" />
                <span className="text-sm font-medium text-gray-700 group-hover:text-red-600">
                  Delete
                </span>
              </button>
            </div>

            {/* Keyboard hints */}
            <div className="px-6 py-2 bg-gray-50 border-t border-gray-200">
              <p className="text-xs text-gray-500 text-center">
                Tip: Press <kbd className="px-1.5 py-0.5 text-xs font-semibold bg-white border border-gray-300 rounded">⌘K</kbd> to access all actions
              </p>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
