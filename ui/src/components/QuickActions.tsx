"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect, useRef, ReactNode } from "react";
import { Search, Command } from "lucide-react";
import { springs } from "../utils/animations";

export interface QuickAction {
  id: string;
  label: string;
  icon?: ReactNode;
  shortcut?: string;
  onExecute: () => void;
}

export interface QuickActionsProps {
  actions: QuickAction[];
  isOpen: boolean;
  onClose: () => void;
}

/**
 * Quick Actions Panel - Simple Cmd+K menu
 *
 * @example
 * ```tsx
 * const [isOpen, setIsOpen] = useState(false);
 *
 * // Auto-open with Cmd+K
 * useQuickActions(() => setIsOpen(true));
 *
 * <QuickActions
 *   isOpen={isOpen}
 *   onClose={() => setIsOpen(false)}
 *   actions={[
 *     {
 *       id: "new-case",
 *       label: "New Case",
 *       icon: <Plus />,
 *       shortcut: "N",
 *       onExecute: () => setShowInline(true)
 *     }
 *   ]}
 * />
 * ```
 */
export function QuickActions({ actions, isOpen, onClose }: QuickActionsProps) {
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  const filtered = actions.filter((a) =>
    a.label.toLowerCase().includes(search.toLowerCase())
  );

  useEffect(() => {
    if (isOpen) {
      setSearch("");
      setSelected(0);
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;

    function handle(e: KeyboardEvent) {
      if (e.key === "Escape") {
        onClose();
      } else if (e.key === "ArrowDown") {
        e.preventDefault();
        setSelected((s) => (s + 1) % filtered.length);
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setSelected((s) => (s - 1 + filtered.length) % filtered.length);
      } else if (e.key === "Enter" && filtered[selected]) {
        e.preventDefault();
        filtered[selected].onExecute();
        onClose();
      }
    }

    document.addEventListener("keydown", handle);
    return () => { document.removeEventListener("keydown", handle); };
  }, [isOpen, filtered, selected, onClose]);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50"
          />

          <div className="fixed inset-0 z-50 flex items-start justify-center pt-[20vh] px-4 pointer-events-none">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: -20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: -20 }}
              transition={springs.snappy}
              className="w-full max-w-lg bg-white rounded-2xl shadow-2xl overflow-hidden pointer-events-auto"
              onClick={(e) => { e.stopPropagation(); }}
            >
              {/* Search */}
              <div className="flex items-center gap-3 px-4 py-3 border-b border-gray-200">
                <Search size={18} className="text-gray-400" />
                <input
                  ref={inputRef}
                  type="text"
                  value={search}
                  onChange={(e) => {
                    setSearch(e.target.value);
                    setSelected(0);
                  }}
                  placeholder="Quick actions..."
                  className="flex-1 bg-transparent outline-none text-sm"
                />
                <div className="flex items-center gap-1 px-2 py-1 bg-gray-100 rounded text-xs text-gray-500">
                  <Command size={10} />
                  <span>K</span>
                </div>
              </div>

              {/* Actions */}
              <div className="max-h-[400px] overflow-y-auto py-2">
                {filtered.length === 0 ? (
                  <div className="py-8 text-center text-sm text-gray-500">No actions found</div>
                ) : (
                  filtered.map((action, i) => (
                    <motion.button
                      key={action.id}
                      onClick={() => {
                        action.onExecute();
                        onClose();
                      }}
                      className={`
                        w-full flex items-center gap-3 px-4 py-2.5 text-left text-sm transition-colors
                        ${i === selected ? "bg-blue-50 text-blue-900" : "hover:bg-gray-50"}
                      `}
                      whileHover={{ x: 4 }}
                      transition={springs.snappy}
                    >
                      {action.icon && (
                        <div className={i === selected ? "text-blue-600" : "text-gray-400"}>
                          {action.icon}
                        </div>
                      )}
                      <span className="flex-1">{action.label}</span>
                      {action.shortcut && (
                        <kbd className="px-2 py-1 bg-gray-100 rounded text-xs text-gray-500">
                          ⌘{action.shortcut}
                        </kbd>
                      )}
                    </motion.button>
                  ))
                )}
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
}

/**
 * Hook to enable Cmd+K shortcut
 */
export function useQuickActions(onOpen: () => void) {
  useEffect(() => {
    function handle(e: KeyboardEvent) {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        onOpen();
      }
    }

    document.addEventListener("keydown", handle);
    return () => { document.removeEventListener("keydown", handle); };
  }, [onOpen]);
}
