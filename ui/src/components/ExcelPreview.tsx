import React from "react";
import type { ExcelColumn } from "../utils/excel";

export interface ExcelPreviewProps {
  columns: ExcelColumn[];
  data: Record<string, unknown>[];
  maxRows?: number;
  className?: string;
}

/**
 * Component to preview Excel data in a table before exporting
 */
export function ExcelPreview({
  columns,
  data,
  maxRows = 10,
  className = "",
}: ExcelPreviewProps) {
  const displayData = maxRows ? data.slice(0, maxRows) : data;
  const hasMore = maxRows && data.length > maxRows;

  return (
    <div className={className}>
      <div className="mb-2 text-sm text-gray-600">
        Showing {displayData.length} of {data.length} rows
        {hasMore && ` (preview only)`}
      </div>

      <div className="overflow-x-auto border border-gray-300 rounded">
        <table className="min-w-full text-sm">
          <thead className="bg-blue-600 text-white">
            <tr>
              {columns.map((column, rowIndex) => (
                <th
                  key={rowIndex}
                  className="px-4 py-2 text-left font-semibold border-r border-blue-500 last:border-r-0"
                  style={{ width: column.width ? `${column.width}ch` : "auto" }}
                >
                  {column.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {displayData.map((row, rowIdx) => (
              <tr key={rowIdx} className={rowIdx % 2 === 0 ? "bg-white" : "bg-gray-50"}>
                {columns.map((column, colIdx) => (
                  <td key={colIdx} className="px-4 py-2 border-r border-gray-200 last:border-r-0">
                    {formatCellValue(row[column.key])}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {hasMore && (
        <div className="mt-2 text-xs text-gray-500 italic">
          + {data.length - maxRows} more rows will be included in the export
        </div>
      )}
    </div>
  );
}

function formatCellValue(value: unknown): string {
  if (value === null || value === undefined) {
    return "-";
  }
  if (typeof value === "object") {
    try {
      return JSON.stringify(value);
    } catch {
      return "[object]";
    }
  }
  if (typeof value === "string" || typeof value === "number" || typeof value === "boolean") {
    return String(value);
  }
  return "";
}
