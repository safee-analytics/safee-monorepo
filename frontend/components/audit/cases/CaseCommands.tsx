"use client";

import { useRouter } from "next/navigation";
import {
  Plus,
  Copy,
  Save,
  Home,
  Folder,
  Search,
  Archive,
  Download,
  Edit,
  Table as TableIcon,
  Grid3x3,
  Columns3,
  Keyboard,
  Filter,
  Trash2,
  CheckSquare,
  Users,
  FileText,
} from "lucide-react";
import { QuickActions, useQuickActions, type QuickAction } from "@safee/ui";

interface CaseCommandsProps {
  isOpen: boolean;
  onClose: () => void;
  onNewCase?: () => void;
  onDuplicateCase?: () => void;
  onSaveTemplate?: () => void;
  onArchiveSelected?: () => void;
  onExport?: () => void;
  onBulkStatusChange?: () => void;
  onViewChange?: (view: "list" | "grid" | "kanban") => void;
  onShowShortcuts?: () => void;
  selectedCasesCount?: number;
}

export function CaseCommands({
  isOpen,
  onClose,
  onNewCase,
  onDuplicateCase,
  onSaveTemplate,
  onArchiveSelected,
  onExport,
  onBulkStatusChange,
  onViewChange,
  onShowShortcuts,
  selectedCasesCount = 0,
}: CaseCommandsProps) {
  const router = useRouter();

  const actions: QuickAction[] = [
    // Creation Actions
    {
      id: "new-case",
      label: "New Case",
      icon: <Plus className="h-4 w-4" />,
      shortcut: "N",
      onExecute: () => onNewCase?.(),
    },
    {
      id: "duplicate",
      label: "Duplicate Selected Case",
      icon: <Copy className="h-4 w-4" />,
      shortcut: "D",
      onExecute: () => onDuplicateCase?.(),
    },
    {
      id: "template",
      label: "Save as Template",
      icon: <Save className="h-4 w-4" />,
      shortcut: "T",
      onExecute: () => onSaveTemplate?.(),
    },

    // Navigation
    {
      id: "go-dashboard",
      label: "Go to Dashboard",
      icon: <Home className="h-4 w-4" />,
      shortcut: "G then D",
      onExecute: () => router.push("/audit/dashboard"),
    },
    {
      id: "go-cases",
      label: "Go to Cases",
      icon: <Folder className="h-4 w-4" />,
      shortcut: "G then C",
      onExecute: () => router.push("/audit/cases"),
    },
    {
      id: "go-documents",
      label: "Go to Documents",
      icon: <FileText className="h-4 w-4" />,
      shortcut: "G then F",
      onExecute: () => router.push("/audit/documents"),
    },
    {
      id: "search",
      label: "Search Cases",
      icon: <Search className="h-4 w-4" />,
      shortcut: "F",
      onExecute: () => {
        // Focus search input
        const searchInput = document.querySelector<HTMLInputElement>('input[type="text"]');
        searchInput?.focus();
      },
    },

    // Bulk Actions (show only when cases are selected)
    ...(selectedCasesCount > 0
      ? [
          {
            id: "bulk-archive",
            label: `Archive ${selectedCasesCount} Case${selectedCasesCount > 1 ? "s" : ""}`,
            icon: <Archive className="h-4 w-4" />,
            shortcut: "Shift+A",
            onExecute: () => onArchiveSelected?.(),
          },
          {
            id: "bulk-status",
            label: `Change Status (${selectedCasesCount} selected)`,
            icon: <Edit className="h-4 w-4" />,
            shortcut: "S",
            onExecute: () => onBulkStatusChange?.(),
          },
          {
            id: "bulk-assign",
            label: `Assign Team (${selectedCasesCount} selected)`,
            icon: <Users className="h-4 w-4" />,
            shortcut: "Shift+T",
            onExecute: () => console.log("Assign team"),
          },
          {
            id: "bulk-delete",
            label: `Delete ${selectedCasesCount} Case${selectedCasesCount > 1 ? "s" : ""}`,
            icon: <Trash2 className="h-4 w-4" />,
            shortcut: "Shift+D",
            onExecute: () => console.log("Delete cases"),
          },
        ]
      : []),

    // Actions
    {
      id: "export",
      label: "Export Cases",
      icon: <Download className="h-4 w-4" />,
      shortcut: "E",
      onExecute: () => onExport?.(),
    },
    {
      id: "toggle-filters",
      label: "Toggle Filters",
      icon: <Filter className="h-4 w-4" />,
      shortcut: "Shift+F",
      onExecute: () => console.log("Toggle filters"),
    },
    {
      id: "select-all",
      label: "Select All Cases",
      icon: <CheckSquare className="h-4 w-4" />,
      shortcut: "Cmd+A",
      onExecute: () => console.log("Select all"),
    },

    // View Changes
    {
      id: "view-table",
      label: "Switch to Table View",
      icon: <TableIcon className="h-4 w-4" />,
      shortcut: "V then T",
      onExecute: () => onViewChange?.("list"),
    },
    {
      id: "view-grid",
      label: "Switch to Grid View",
      icon: <Grid3x3 className="h-4 w-4" />,
      shortcut: "V then G",
      onExecute: () => onViewChange?.("grid"),
    },
    {
      id: "view-kanban",
      label: "Switch to Kanban View",
      icon: <Columns3 className="h-4 w-4" />,
      shortcut: "V then K",
      onExecute: () => onViewChange?.("kanban"),
    },

    // Help
    {
      id: "shortcuts",
      label: "Show Keyboard Shortcuts",
      icon: <Keyboard className="h-4 w-4" />,
      shortcut: "?",
      onExecute: () => onShowShortcuts?.(),
    },
  ];

  return <QuickActions actions={actions} isOpen={isOpen} onClose={onClose} />;
}

/**
 * Hook to enable Cmd+K for command palette
 */
export function useCaseCommands(onOpen: () => void) {
  useQuickActions(onOpen);
}
