"use client";

import { motion } from "framer-motion";
import { ReactNode } from "react";

interface Column<T> {
  key: string;
  header: string | ReactNode;
  render?: (row: T, index: number) => ReactNode;
  className?: string;
  headerClassName?: string;
}

interface TableProps<T> {
  data: T[];
  columns: Column<T>[];
  keyExtractor: (row: T, index: number) => string | number;
  className?: string;
  animated?: boolean;
  hoverable?: boolean;
  striped?: boolean;
}

export function Table<T>({
  data,
  columns,
  keyExtractor,
  className = "",
  animated = false,
  hoverable = true,
  striped = false,
}: TableProps<T>) {
  const RowComponent = animated ? motion.tr : "tr";
  const getRowProps = (row: T, index: number) => {
    const key = keyExtractor(row, index);
    return animated ? { layout: true, layoutId: `row-${key}` } : {};
  };

  return (
    <div className={`w-full bg-white shadow-lg rounded-lg overflow-x-auto ${className}`}>
      <table className="w-full">
        <thead>
          <tr className="border-b border-gray-200 text-gray-600 text-sm">
            {columns.map((column, idx) => (
              <th
                key={`header-${column.key}-${idx}`}
                className={`text-left p-4 font-medium uppercase tracking-wider ${column.headerClassName || ""}`}
              >
                {column.header}
              </th>
            ))}
          </tr>
        </thead>

        <tbody>
          {data.map((row, index) => {
            const key = keyExtractor(row, index);
            const rowClasses = `
              text-sm transition-colors
              ${hoverable ? "hover:bg-gray-50" : ""}
              ${striped && index % 2 === 1 ? "bg-gray-50" : "bg-white"}
            `.trim();

            return (
              <RowComponent key={key} {...getRowProps(row, index)} className={rowClasses}>
                {columns.map((column, colIdx) => (
                  <td key={`cell-${key}-${column.key}-${colIdx}`} className={`p-4 ${column.className || ""}`}>
                    {column.render ? column.render(row, index) : (row as Record<string, unknown>)[column.key]}
                  </td>
                ))}
              </RowComponent>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

// Pagination component to go with the table
interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  className?: string;
}

export function Pagination({ currentPage, totalPages, onPageChange, className = "" }: PaginationProps) {
  const pages = Array.from({ length: totalPages }, (_, i) => i + 1);
  const visiblePages = pages.slice(Math.max(0, currentPage - 2), Math.min(totalPages, currentPage + 1));

  return (
    <div className={`flex items-center justify-between ${className}`}>
      <button
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage === 1}
        className="px-4 py-2 text-sm text-gray-600 hover:text-gray-900 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        Previous
      </button>

      <div className="flex items-center gap-2">
        {visiblePages.map((page) => (
          <button
            key={page}
            onClick={() => onPageChange(page)}
            className={`w-8 h-8 rounded text-sm font-medium transition-colors ${
              page === currentPage ? "bg-blue-600 text-white" : "hover:bg-gray-100 text-gray-600"
            }`}
          >
            {page}
          </button>
        ))}
      </div>

      <button
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage === totalPages}
        className="px-4 py-2 text-sm text-gray-600 hover:text-gray-900 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        Next
      </button>
    </div>
  );
}
