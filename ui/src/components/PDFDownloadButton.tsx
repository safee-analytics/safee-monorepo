"use client";

import React from "react";
import { PDFDownloadLink, type DocumentProps } from "@react-pdf/renderer";

export interface PDFDownloadButtonProps {
  document: React.ReactElement<DocumentProps>;
  fileName: string;
  children?: React.ReactNode;
  className?: string;
  loadingText?: string;
  onError?: (error: Error) => void;
}

/**
 * A wrapper component for PDFDownloadLink that provides a consistent UI
 */
export const PDFDownloadButton: React.FC<PDFDownloadButtonProps> = ({
  document,
  fileName,
  children,
  className = "",
  loadingText = "Generating PDF...",
  onError,
}) => {
  const defaultChildren = (
    <button
      type="button"
      className={className || "px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition"}
    >
      Download PDF
    </button>
  );

  return (
    <PDFDownloadLink document={document} fileName={fileName.endsWith(".pdf") ? fileName : `${fileName}.pdf`}>
      {({ loading, error }) => {
        if (error) {
          onError?.(error);
          return <div className="text-red-600 text-sm">Error generating PDF: {error.message}</div>;
        }

        if (loading) {
          return (
            <div className="text-gray-500 text-sm flex items-center gap-2">
              <svg
                className="animate-spin h-4 w-4"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                />
              </svg>
              {loadingText}
            </div>
          );
        }

        return children || defaultChildren;
      }}
    </PDFDownloadLink>
  );
};
