"use client";

import { AnimatePresence, motion } from "framer-motion";
import { X, Command, Keyboard } from "lucide-react";
import { useEffect } from "react";

interface ShortcutItem {
  keys: string[];
  description: string;
}

interface ShortcutCategory {
  category: string;
  shortcuts: ShortcutItem[];
}

interface KeyboardShortcutsOverlayProps {
  isOpen: boolean;
  onClose: () => void;
}

const SHORTCUTS: ShortcutCategory[] = [
  {
    category: "General",
    shortcuts: [
      { keys: ["⌘", "K"], description: "Open command palette" },
      { keys: ["?"], description: "Show keyboard shortcuts" },
      { keys: ["Esc"], description: "Close dialogs" },
    ],
  },
  {
    category: "Navigation",
    shortcuts: [
      { keys: ["G", "D"], description: "Go to Dashboard" },
      { keys: ["G", "C"], description: "Go to Cases" },
      { keys: ["G", "F"], description: "Go to Documents" },
      { keys: ["G", "P"], description: "Go to Planning" },
    ],
  },
  {
    category: "Actions",
    shortcuts: [
      { keys: ["N"], description: "New case" },
      { keys: ["D"], description: "Duplicate selected case" },
      { keys: ["T"], description: "Save as template" },
      { keys: ["E"], description: "Export cases" },
      { keys: ["F"], description: "Focus search" },
    ],
  },
  {
    category: "View Switching",
    shortcuts: [
      { keys: ["V", "T"], description: "Switch to Table view" },
      { keys: ["V", "G"], description: "Switch to Grid view" },
      { keys: ["V", "K"], description: "Switch to Kanban view" },
    ],
  },
  {
    category: "Bulk Operations",
    shortcuts: [
      { keys: ["⌘", "A"], description: "Select all cases" },
      { keys: ["⇧", "A"], description: "Archive selected" },
      { keys: ["S"], description: "Change status (when selected)" },
      { keys: ["⇧", "T"], description: "Assign team (when selected)" },
      { keys: ["⇧", "D"], description: "Delete selected" },
    ],
  },
  {
    category: "Filters",
    shortcuts: [{ keys: ["⇧", "F"], description: "Toggle filters panel" }],
  },
];

function KeyBadge({ keyText }: { keyText: string }) {
  return (
    <kbd className="inline-flex items-center justify-center min-w-[28px] h-7 px-2 text-sm font-semibold text-gray-900 bg-white border border-gray-300 rounded shadow-sm">
      {keyText}
    </kbd>
  );
}

export function KeyboardShortcutsOverlay({ isOpen, onClose }: KeyboardShortcutsOverlayProps) {
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => { window.removeEventListener("keydown", handleKeyDown); };
  }, [isOpen, onClose]);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[100] grid place-items-center overflow-y-auto p-4"
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 20 }}
              transition={{ type: "spring", duration: 0.3 }}
              onClick={(e) => { e.stopPropagation(); }}
              className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col"
            >
              {/* Header */}
              <div className="flex items-center justify-between px-6 py-5 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-purple-50">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-white rounded-lg shadow-sm">
                    <Keyboard className="h-6 w-6 text-blue-600" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-gray-900">Keyboard Shortcuts</h2>
                    <p className="text-sm text-gray-600 mt-0.5">
                      Power up your workflow with these shortcuts
                    </p>
                  </div>
                </div>
                <button onClick={onClose} className="p-2 hover:bg-white rounded-lg transition-colors">
                  <X className="h-5 w-5 text-gray-500" />
                </button>
              </div>

              {/* Content */}
              <div className="flex-1 overflow-y-auto p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  {SHORTCUTS.map((category) => (
                    <div key={category.category} className="space-y-3">
                      <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider">
                        {category.category}
                      </h3>
                      <div className="space-y-2">
                        {category.shortcuts.map((shortcut, index) => (
                          <div
                            key={index}
                            className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                          >
                            <span className="text-sm text-gray-700">{shortcut.description}</span>
                            <div className="flex items-center space-x-1">
                              {shortcut.keys.map((key, keyIndex) => (
                                <div key={keyIndex} className="flex items-center space-x-1">
                                  <KeyBadge keyText={key} />
                                  {keyIndex < shortcut.keys.length - 1 && (
                                    <span className="text-xs text-gray-400 mx-0.5">then</span>
                                  )}
                                </div>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Footer */}
              <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2 text-sm text-gray-600">
                    <Command className="h-4 w-4" />
                    <span>
                      Press{" "}
                      <kbd className="px-1.5 py-0.5 text-xs font-semibold bg-white border border-gray-300 rounded">
                        ?
                      </kbd>{" "}
                      anytime to see this menu
                    </span>
                  </div>
                  <button
                    onClick={onClose}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors font-medium"
                  >
                    Got it
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
