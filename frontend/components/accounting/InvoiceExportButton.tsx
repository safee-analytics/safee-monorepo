"use client";

import { useState } from "react";
import { Download } from "lucide-react";
import { useToast, SafeeToastContainer } from "@/components/feedback";
import { useInvoiceStyles } from "@/lib/api/hooks/invoiceStyles";
import { downloadInvoicePDF, InvoiceData } from "@/lib/utils/generateInvoicePDF";
import { useActiveOrganization } from "@/lib/api/hooks";

interface InvoiceExportButtonProps {
  invoice: InvoiceData;
  className?: string;
}

export function InvoiceExportButton({ invoice, className }: InvoiceExportButtonProps) {
  const toast = useToast();
  const { data: organization } = useActiveOrganization();
  const { data: invoiceStyles } = useInvoiceStyles(organization?.id || "");
  const [isExporting, setIsExporting] = useState(false);

  const handleExport = async () => {
    if (!invoiceStyles) {
      toast.error("Invoice styles not loaded");
      return;
    }

    setIsExporting(true);
    try {
      await downloadInvoicePDF(invoice, invoiceStyles);
    } catch (err) {
      console.error("Failed to export invoice:", err);
      toast.error("Failed to export invoice");
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <>
      <button
        onClick={() => {
          void handleExport();
        }}
        disabled={isExporting || !invoiceStyles}
        className={`flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed ${className || ""}`}
      >
        <Download className="w-4 h-4" />
        {isExporting ? "Exporting..." : "Export PDF"}
      </button>
      <SafeeToastContainer notifications={toast.notifications} onRemove={toast.removeToast} />
    </>
  );
}
