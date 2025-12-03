import { pdf, type DocumentProps } from "@react-pdf/renderer";
import React from "react";

/**
 * Generate PDF blob from React-PDF document
 * @param document - React-PDF Document component
 * @returns Blob containing the PDF
 */
export async function generatePDFBlob(document: React.ReactElement<DocumentProps>): Promise<Blob> {
  const blob = await pdf(document).toBlob();
  return blob;
}

/**
 * Download PDF from React-PDF document
 * @param document - React-PDF Document component
 * @param filename - Name of the file to download
 */
export async function downloadPDF(
  document: React.ReactElement<DocumentProps>,
  filename: string,
): Promise<void> {
  const blob = await generatePDFBlob(document);
  const url = URL.createObjectURL(blob);
  const a = window.document.createElement("a");
  a.href = url;
  a.download = filename.endsWith(".pdf") ? filename : `${filename}.pdf`;
  window.document.body?.appendChild(a);
  a.click();
  window.document.body?.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * Open PDF in new tab
 * @param document - React-PDF Document component
 */
export async function openPDFInNewTab(document: React.ReactElement<DocumentProps>): Promise<void> {
  const blob = await generatePDFBlob(document);
  const url = URL.createObjectURL(blob);
  window.open(url, "_blank");
}

/**
 * Common PDF styles that can be reused
 */
export const commonPDFStyles = {
  page: {
    padding: 40,
    fontSize: 12,
    fontFamily: "Helvetica",
  },
  header: {
    fontSize: 24,
    marginBottom: 20,
    fontWeight: "bold",
  },
  subheader: {
    fontSize: 16,
    marginBottom: 15,
    fontWeight: "bold",
  },
  section: {
    margin: 10,
    padding: 10,
  },
  text: {
    fontSize: 12,
    marginBottom: 5,
  },
  table: {
    display: "table",
    width: "100%",
    marginTop: 10,
    marginBottom: 10,
  },
  tableRow: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: "#e0e0e0",
    borderBottomStyle: "solid",
    paddingVertical: 8,
  },
  tableHeader: {
    flexDirection: "row",
    borderBottomWidth: 2,
    borderBottomColor: "#333",
    borderBottomStyle: "solid",
    backgroundColor: "#f5f5f5",
    paddingVertical: 8,
    fontWeight: "bold",
  },
  tableCol: {
    flex: 1,
    paddingHorizontal: 5,
  },
  tableCell: {
    fontSize: 10,
  },
  footer: {
    position: "absolute",
    bottom: 30,
    left: 40,
    right: 40,
    textAlign: "center",
    fontSize: 10,
    color: "#666",
  },
  bold: {
    fontWeight: "bold",
  },
  italic: {
    fontStyle: "italic",
  },
  textRight: {
    textAlign: "right",
  },
  textCenter: {
    textAlign: "center",
  },
} as const;

/**
 * Format currency for PDF display
 */
export function formatCurrencyForPDF(value: number, currency = "USD"): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
  }).format(value);
}

/**
 * Format date for PDF display
 */
export function formatDateForPDF(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return d.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}
