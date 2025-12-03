"use client";

import { motion } from "framer-motion";
import { useState, useRef, useEffect, KeyboardEvent } from "react";
import { Plus, Check, X } from "lucide-react";
import { springs } from "../utils/animations";

export interface InlineCreateRowProps {
  onSubmit: (value: string) => void | Promise<void>;
  placeholder?: string;
  buttonText?: string;
  columns?: number;
  autoFocus?: boolean;
}

/**
 * Inline Create Row - Jira style inline creation
 * Add to bottom of table for quick item creation
 *
 * @example
 * ```tsx
 * <table>
 *   <tbody>
 *     {items.map(item => <tr>...</tr>)}
 *     <InlineCreateRow
 *       onSubmit={async (title) => {
 *         await createCase({ title });
 *       }}
 *       placeholder="Add new case..."
 *     />
 *   </tbody>
 * </table>
 * ```
 */
export function InlineCreateRow({
  onSubmit,
  placeholder = "Add new item...",
  buttonText = "Add",
  columns = 1,
  autoFocus = false,
}: InlineCreateRowProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [value, setValue] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isEditing]);

  async function handleSubmit() {
    if (!value.trim() || isSubmitting) return;

    setIsSubmitting(true);
    try {
      await onSubmit(value.trim());
      setValue("");
      setIsEditing(false);
    } catch {
      // Silently handle error
    } finally {
      setIsSubmitting(false);
    }
  }

  function handleKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      void handleSubmit();
    } else if (e.key === "Escape") {
      setValue("");
      setIsEditing(false);
    }
  }

  function handleCancel() {
    setValue("");
    setIsEditing(false);
  }

  if (!isEditing) {
    return (
      <tr className="border-t border-gray-200">
        <td colSpan={columns} className="p-0">
          <motion.button
            onClick={() => { setIsEditing(true); }}
            className="w-full px-4 py-3 text-left text-sm text-gray-500 hover:bg-gray-50 hover:text-gray-700 transition-colors flex items-center gap-2 group"
            whileHover={{ x: 2 }}
            transition={springs.snappy}
          >
            <Plus size={16} className="group-hover:text-blue-600 transition-colors" />
            <span>{buttonText}</span>
            <span className="ml-auto text-xs text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity">
              or press Cmd+N
            </span>
          </motion.button>
        </td>
      </tr>
    );
  }

  return (
    <tr className="border-t border-gray-200 bg-blue-50/50">
      <td colSpan={columns} className="p-2">
        <div className="flex items-center gap-2">
          <input
            ref={inputRef}
            type="text"
            value={value}
            onChange={(e) => { setValue(e.target.value); }}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            disabled={isSubmitting}
            className="flex-1 px-3 py-2 bg-white border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50"
            autoFocus={autoFocus}
          />
          <motion.button
            onClick={() => { void handleSubmit(); }}
            disabled={!value.trim() || isSubmitting}
            className="p-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <Check size={16} />
          </motion.button>
          <motion.button
            onClick={handleCancel}
            disabled={isSubmitting}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <X size={16} />
          </motion.button>
        </div>
        <div className="mt-1 px-1 text-xs text-gray-500">
          Press <kbd className="px-1 py-0.5 bg-gray-200 rounded">Enter</kbd> to save •{" "}
          <kbd className="px-1 py-0.5 bg-gray-200 rounded">Esc</kbd> to cancel
        </div>
      </td>
    </tr>
  );
}

/**
 * Inline Create Card - For Kanban boards
 */
export interface InlineCreateCardProps {
  onSubmit: (value: string) => void | Promise<void>;
  placeholder?: string;
  buttonText?: string;
}

export function InlineCreateCard({
  onSubmit,
  placeholder = "Add new card...",
  buttonText = "Add card",
}: InlineCreateCardProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [value, setValue] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (isEditing && textareaRef.current) {
      textareaRef.current.focus();
    }
  }, [isEditing]);

  async function handleSubmit() {
    if (!value.trim() || isSubmitting) return;

    setIsSubmitting(true);
    try {
      await onSubmit(value.trim());
      setValue("");
      setIsEditing(false);
    } catch {
      // Silently handle error
    } finally {
      setIsSubmitting(false);
    }
  }

  function handleKeyDown(e: KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
      e.preventDefault();
      void handleSubmit();
    } else if (e.key === "Escape") {
      setValue("");
      setIsEditing(false);
    }
  }

  if (!isEditing) {
    return (
      <motion.button
        onClick={() => { setIsEditing(true); }}
        className="w-full px-3 py-2 text-left text-sm text-gray-500 hover:bg-gray-100 rounded-lg transition-colors flex items-center gap-2"
        whileHover={{ scale: 1.01 }}
        transition={springs.snappy}
      >
        <Plus size={16} />
        <span>{buttonText}</span>
      </motion.button>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={springs.snappy}
      className="bg-white rounded-lg shadow-sm border-2 border-blue-500 p-3"
    >
      <textarea
        ref={textareaRef}
        value={value}
        onChange={(e) => { setValue(e.target.value); }}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        disabled={isSubmitting}
        rows={3}
        className="w-full resize-none bg-transparent text-sm focus:outline-none disabled:opacity-50"
      />
      <div className="flex items-center justify-between mt-2 pt-2 border-t border-gray-200">
        <div className="text-xs text-gray-500">
          <kbd className="px-1 py-0.5 bg-gray-100 rounded">Cmd+Enter</kbd> to save
        </div>
        <div className="flex gap-2">
          <motion.button
            onClick={() => {
              setValue("");
              setIsEditing(false);
            }}
            disabled={isSubmitting}
            className="px-3 py-1 text-sm text-gray-600 hover:text-gray-900 transition-colors"
            whileTap={{ scale: 0.95 }}
          >
            Cancel
          </motion.button>
          <motion.button
            onClick={() => { void handleSubmit(); }}
            disabled={!value.trim() || isSubmitting}
            className="px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            whileTap={{ scale: 0.95 }}
          >
            {isSubmitting ? "Adding..." : "Add"}
          </motion.button>
        </div>
      </div>
    </motion.div>
  );
}

/**
 * Quick Add Button - Floating button with keyboard shortcut
 */
export interface QuickAddButtonProps {
  onClick: () => void;
  label?: string;
  shortcut?: string;
}

export function QuickAddButton({ onClick, label = "New", shortcut = "N" }: QuickAddButtonProps) {
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === shortcut.toLowerCase() && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        onClick();
      }
    }

    document.addEventListener("keydown", handleKeyDown);
    return () => { document.removeEventListener("keydown", handleKeyDown); };
  }, [onClick, shortcut]);

  return (
    <motion.button
      onClick={onClick}
      className="fixed bottom-6 right-6 z-40 px-4 py-3 bg-blue-600 text-white rounded-xl shadow-2xl flex items-center gap-2 hover:bg-blue-700 transition-colors group"
      whileHover={{ scale: 1.05, y: -2 }}
      whileTap={{ scale: 0.95 }}
      transition={springs.snappy}
    >
      <Plus size={20} />
      <span className="font-medium">{label}</span>
      <div className="ml-1 px-2 py-0.5 bg-blue-700 rounded text-xs opacity-0 group-hover:opacity-100 transition-opacity">
        ⌘{shortcut}
      </div>
    </motion.button>
  );
}
