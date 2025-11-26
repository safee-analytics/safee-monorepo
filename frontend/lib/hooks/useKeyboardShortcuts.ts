import { useEffect, useCallback, useRef } from "react";

export interface KeyboardShortcut {
  key: string;
  ctrlKey?: boolean;
  metaKey?: boolean;
  shiftKey?: boolean;
  altKey?: boolean;
  action: () => void;
  description: string;
  category: string;
}

export interface KeySequence {
  sequence: string[];
  action: () => void;
  description: string;
  category: string;
}

interface UseKeyboardShortcutsOptions {
  shortcuts?: KeyboardShortcut[];
  sequences?: KeySequence[];
  enabled?: boolean;
}

/**
 * Hook for managing keyboard shortcuts with support for:
 * - Single key shortcuts (e.g., "N" for new)
 * - Modifier combinations (e.g., Cmd+S for save)
 * - Key sequences (e.g., "G then D" for go to dashboard)
 */
export function useKeyboardShortcuts({
  shortcuts = [],
  sequences = [],
  enabled = true,
}: UseKeyboardShortcutsOptions = {}) {
  const sequenceBufferRef = useRef<string[]>([]);
  const sequenceTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const clearSequenceBuffer = useCallback(() => {
    sequenceBufferRef.current = [];
    if (sequenceTimeoutRef.current) {
      clearTimeout(sequenceTimeoutRef.current);
      sequenceTimeoutRef.current = null;
    }
  }, []);

  const addToSequenceBuffer = useCallback(
    (key: string) => {
      sequenceBufferRef.current.push(key.toLowerCase());

      // Clear buffer after 1.5 seconds of inactivity
      if (sequenceTimeoutRef.current) {
        clearTimeout(sequenceTimeoutRef.current);
      }
      sequenceTimeoutRef.current = setTimeout(clearSequenceBuffer, 1500);
    },
    [clearSequenceBuffer],
  );

  const checkSequenceMatch = useCallback(() => {
    const buffer = sequenceBufferRef.current;
    if (buffer.length === 0) return null;

    for (const seq of sequences) {
      if (seq.sequence.length !== buffer.length) continue;

      const match = seq.sequence.every(
        (key, index) => key.toLowerCase() === buffer[index],
      );

      if (match) {
        return seq;
      }
    }

    return null;
  }, [sequences]);

  useEffect(() => {
    if (!enabled) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      // Don't trigger shortcuts when typing in inputs, textareas, or contenteditable
      const target = event.target as HTMLElement;
      if (
        target.tagName === "INPUT" ||
        target.tagName === "TEXTAREA" ||
        target.isContentEditable
      ) {
        // Exception: Allow Cmd+K to work everywhere
        if (
          (event.metaKey || event.ctrlKey) &&
          event.key.toLowerCase() === "k"
        ) {
          // Let this through (handled by QuickActions hook)
        } else {
          return;
        }
      }

      // Check single key shortcuts first
      for (const shortcut of shortcuts) {
        const keyMatch = shortcut.key.toLowerCase() === event.key.toLowerCase();
        const ctrlMatch = !!shortcut.ctrlKey === event.ctrlKey;
        const metaMatch = !!shortcut.metaKey === event.metaKey;
        const shiftMatch = !!shortcut.shiftKey === event.shiftKey;
        const altMatch = !!shortcut.altKey === event.altKey;

        if (keyMatch && ctrlMatch && metaMatch && shiftMatch && altMatch) {
          event.preventDefault();
          shortcut.action();
          clearSequenceBuffer();
          return;
        }
      }

      // For key sequences, add to buffer if it's a letter key without modifiers
      if (
        event.key.length === 1 &&
        !event.ctrlKey &&
        !event.metaKey &&
        !event.altKey
      ) {
        addToSequenceBuffer(event.key);
        const matchedSequence = checkSequenceMatch();

        if (matchedSequence) {
          event.preventDefault();
          matchedSequence.action();
          clearSequenceBuffer();
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      clearSequenceBuffer();
    };
  }, [
    enabled,
    shortcuts,
    sequences,
    addToSequenceBuffer,
    checkSequenceMatch,
    clearSequenceBuffer,
  ]);

  return { clearSequenceBuffer };
}

/**
 * Predefined keyboard shortcuts for common actions
 */
export const COMMON_SHORTCUTS = {
  // Navigation
  GO_DASHBOARD: { sequence: ["g", "d"], description: "Go to Dashboard", category: "Navigation" },
  GO_CASES: { sequence: ["g", "c"], description: "Go to Cases", category: "Navigation" },
  GO_DOCUMENTS: { sequence: ["g", "f"], description: "Go to Documents", category: "Navigation" },
  GO_PLANNING: { sequence: ["g", "p"], description: "Go to Planning", category: "Navigation" },

  // View Switching
  VIEW_TABLE: { sequence: ["v", "t"], description: "Switch to Table View", category: "Views" },
  VIEW_GRID: { sequence: ["v", "g"], description: "Switch to Grid View", category: "Views" },
  VIEW_KANBAN: { sequence: ["v", "k"], description: "Switch to Kanban View", category: "Views" },

  // Actions
  NEW: { key: "n", description: "New Case", category: "Actions" },
  DUPLICATE: { key: "d", description: "Duplicate Case", category: "Actions" },
  SAVE_TEMPLATE: { key: "t", description: "Save as Template", category: "Actions" },
  EXPORT: { key: "e", description: "Export", category: "Actions" },
  SEARCH: { key: "f", description: "Search", category: "Actions" },

  // Bulk Operations
  BULK_ARCHIVE: { key: "a", shiftKey: true, description: "Archive Selected", category: "Bulk" },
  BULK_STATUS: { key: "s", description: "Change Status", category: "Bulk" },
  BULK_ASSIGN: { key: "t", shiftKey: true, description: "Assign Team", category: "Bulk" },
  BULK_DELETE: { key: "d", shiftKey: true, description: "Delete Selected", category: "Bulk" },

  // Filters & Selection
  TOGGLE_FILTERS: { key: "f", shiftKey: true, description: "Toggle Filters", category: "Filters" },
  SELECT_ALL: { key: "a", metaKey: true, description: "Select All", category: "Selection" },

  // Help
  HELP: { key: "/", description: "Show Keyboard Shortcuts", category: "Help" },
} as const;
