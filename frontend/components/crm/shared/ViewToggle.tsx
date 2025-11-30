"use client";

import { LayoutGrid, Table } from "lucide-react";

interface ViewToggleProps {
  view: "kanban" | "table";
  onViewChange: (view: "kanban" | "table") => void;
}

export function ViewToggle({ view, onViewChange }: ViewToggleProps) {
  return (
    <div className="inline-flex items-center rounded-lg border border-gray-200 bg-white p-1">
      <button
        onClick={() => onViewChange("kanban")}
        className={`flex items-center space-x-2 rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
          view === "kanban"
            ? "bg-blue-100 text-blue-700"
            : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
        }`}
      >
        <LayoutGrid className="h-4 w-4" />
        <span>Kanban</span>
      </button>
      <button
        onClick={() => onViewChange("table")}
        className={`flex items-center space-x-2 rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
          view === "table"
            ? "bg-blue-100 text-blue-700"
            : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
        }`}
      >
        <Table className="h-4 w-4" />
        <span>Table</span>
      </button>
    </div>
  );
}
