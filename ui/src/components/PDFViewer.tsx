"use client";

import React from "react";
import { PDFViewer as ReactPDFViewer, type DocumentProps } from "@react-pdf/renderer";

export interface PDFViewerProps {
  document: React.ReactElement<DocumentProps>;
  width?: string | number;
  height?: string | number;
  className?: string;
  showToolbar?: boolean;
}

/**
 * Component to preview PDF documents in the browser
 * Note: This should only be used on client-side (use "use client" in Next.js)
 */
export function PDFViewer({
  document,
  width = "100%",
  height = 600,
  className = "",
  showToolbar = true,
}: PDFViewerProps) {
  return (
    <div className={className} style={{ width, height }}>
      <ReactPDFViewer style={{ width: "100%", height: "100%" }} showToolbar={showToolbar}>
        {document}
      </ReactPDFViewer>
    </div>
  );
}
