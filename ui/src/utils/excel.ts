import * as ExcelJS from "exceljs";

export interface ExcelColumn {
  header: string;
  key: string;
  width?: number;
  style?: Partial<ExcelJS.Style>;
}

export interface ExcelExportOptions {
  filename: string;
  sheetName?: string;
  columns: ExcelColumn[];
  data: Record<string, unknown>[];
  headerStyle?: Partial<ExcelJS.Style>;
  autoFilter?: boolean;
  freezeHeader?: boolean;
}

/**
 * Export data to Excel file with advanced formatting
 * @param options - Excel export configuration
 */
export async function exportToExcel(options: ExcelExportOptions): Promise<void> {
  const {
    filename,
    sheetName = "Sheet1",
    columns,
    data,
    headerStyle,
    autoFilter = true,
    freezeHeader = true,
  } = options;

  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet(sheetName);

  // Set up columns with formatting
  worksheet.columns = columns.map((col) => ({
    header: col.header,
    key: col.key,
    width: col.width ?? 15,
    style: col.style,
  }));

  // Style header row
  const headerRow = worksheet.getRow(1);
  headerRow.font = { bold: true, ...headerStyle?.font };
  headerRow.fill = headerStyle?.fill ?? {
    type: "pattern",
    pattern: "solid",
    fgColor: { argb: "FF0070C0" },
  };
  headerRow.alignment = { vertical: "middle", horizontal: "center" };

  // Add data rows
  for (const item of data) {
    worksheet.addRow(item);
  }

  // Apply auto-filter
  if (autoFilter) {
    worksheet.autoFilter = {
      from: { row: 1, column: 1 },
      to: { row: 1, column: columns.length },
    };
  }

  // Freeze header row
  if (freezeHeader) {
    worksheet.views = [{ state: "frozen", ySplit: 1 }];
  }

  // Generate and download file
  const buffer = await workbook.xlsx.writeBuffer();
  downloadBuffer(buffer, `${filename}.xlsx`);
}

/**
 * Simple Excel export for quick data exports
 * @param data - Array of objects to export
 * @param filename - Name of the file (without extension)
 */
export async function simpleExportToExcel(data: Record<string, unknown>[], filename: string): Promise<void> {
  if (data.length === 0) {
    throw new Error("No data to export");
  }

  // Auto-generate columns from first data item
  const columns: ExcelColumn[] = Object.keys(data[0]).map((key) => ({
    header: key.charAt(0).toUpperCase() + key.slice(1),
    key,
    width: 20,
  }));

  await exportToExcel({
    filename,
    columns,
    data,
  });
}

/**
 * Export with conditional formatting (e.g., highlight paid/unpaid invoices)
 */
export async function exportWithConditionalFormatting(
  options: ExcelExportOptions & {
    conditionalRules?: {
      column: string;
      condition: (value: unknown) => boolean;
      style: Partial<ExcelJS.Style>;
    }[];
  },
): Promise<void> {
  const { conditionalRules, ...exportOptions } = options;

  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet(exportOptions.sheetName ?? "Sheet1");

  // Set up columns
  worksheet.columns = exportOptions.columns.map((col) => ({
    header: col.header,
    key: col.key,
    width: col.width ?? 15,
  }));

  // Style header
  const headerRow = worksheet.getRow(1);
  headerRow.font = { bold: true };
  headerRow.fill = {
    type: "pattern",
    pattern: "solid",
    fgColor: { argb: "FF0070C0" },
  };

  // Add data and apply conditional formatting
  for (const [_index, item] of exportOptions.data.entries()) {
    const row = worksheet.addRow(item);

    // Apply conditional rules
    if (conditionalRules) {
      for (const rule of conditionalRules) {
        const columnIndex = exportOptions.columns.findIndex((col) => col.key === rule.column);
        if (columnIndex !== -1 && rule.condition(item[rule.column])) {
          const cell = row.getCell(columnIndex + 1);
          if (rule.style.fill) cell.fill = rule.style.fill;
          if (rule.style.font) cell.font = rule.style.font;
          if (rule.style.border) cell.border = rule.style.border;
        }
      }
    }
  }

  // Generate and download
  const buffer = await workbook.xlsx.writeBuffer();
  downloadBuffer(buffer, `${exportOptions.filename}.xlsx`);
}

/**
 * Import Excel file and parse to JSON
 * @param file - File object from input element
 * @returns Parsed data as array of objects
 */
export async function importFromExcel(file: File): Promise<Record<string, unknown>[]> {
  const buffer = await file.arrayBuffer();
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.load(buffer);

  const worksheet = workbook.worksheets[0];
  const data: Record<string, unknown>[] = [];

  // Get headers from first row
  const headers: string[] = [];
  worksheet.getRow(1).eachCell((cell) => {
    headers.push(cell.value as string);
  });

  // Parse data rows
  worksheet.eachRow((row, _rowNumber) => {
    if (_rowNumber === 1) return; // Skip header row

    const rowData: Record<string, unknown> = {};
    row.eachCell((cell, colNumber) => {
      const header = headers[colNumber - 1];
      if (header) {
        rowData[header] = cell.value;
      }
    });

    data.push(rowData);
  });

  return data;
}

/**
 * Helper function to download buffer as file
 */
function downloadBuffer(buffer: ExcelJS.Buffer, filename: string): void {
  const blob = new Blob([buffer], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * Format currency for Excel export
 */
export function formatCurrency(value: number, currency = "USD"): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
  }).format(value);
}

/**
 * Format date for Excel export
 */
export function formatDate(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return d.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}
