import React from "react";
import { AgGridReact, AgGridReactProps } from "ag-grid-react";
import { ModuleRegistry, AllCommunityModule } from "ag-grid-community";
import "ag-grid-community/styles/ag-grid.css";
import "ag-grid-community/styles/ag-theme-quartz.css";
import type { ColDef } from "ag-grid-community";

// Register AG Grid modules
ModuleRegistry.registerModules([AllCommunityModule]);

export interface DataGridProps<TData = Record<string, unknown>>
  extends Omit<AgGridReactProps<TData>, "columnDefs"> {
  data: TData[];
  columns: ColDef<TData>[];
  height?: number | string;
  enablePagination?: boolean;
  pageSize?: number;
  enableSorting?: boolean;
  enableFiltering?: boolean;
  className?: string;
}

/**
 * Wrapper component for AG Grid Community Edition
 * Provides a simplified API for common data grid use cases
 *
 * @example
 * <DataGrid
 *   data={invoices}
 *   columns={columns}
 *   className="ag-theme-quartz"
 *   height={500}
 * />
 */
export function DataGrid<TData = Record<string, unknown>>({
  data,
  columns,
  height = 500,
  enablePagination = true,
  pageSize = 10,
  enableSorting = true,
  enableFiltering = true,
  className = "ag-theme-quartz",
  ...agGridProps
}: DataGridProps<TData>) {
  const defaultColDef: ColDef = {
    flex: 1,
    minWidth: 100,
    resizable: true,
    sortable: enableSorting,
    filter: enableFiltering,
    ...agGridProps.defaultColDef,
  };

  return (
    <div className={className} style={{ height, width: "100%" }}>
      <AgGridReact
        rowData={data}
        columnDefs={columns}
        defaultColDef={defaultColDef}
        pagination={enablePagination}
        paginationPageSize={pageSize}
        animateRows={true}
        {...agGridProps}
      />
    </div>
  );
}

// Export AG Grid types for convenience
export type { ColDef, ValueFormatterParams, CellStyle } from "ag-grid-community";
