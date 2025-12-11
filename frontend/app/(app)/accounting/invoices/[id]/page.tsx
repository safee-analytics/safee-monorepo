"use client";

import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, FileText, CheckCircle, XCircle, Calendar, AlertCircle } from "lucide-react";
import { useInvoice } from "@/lib/api/hooks";

export default function InvoiceDetailPage() {
  const params = useParams();
  const router = useRouter();
  const invoiceId = params.id as string;

  const { data: invoice, isLoading } = useInvoice(invoiceId);

  if (isLoading) {
    return (
      <div className="p-6 flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          <p className="mt-4 text-gray-600">Loading invoice...</p>
        </div>
      </div>
    );
  }

  if (!invoice) {
    return (
      <div className="p-6 flex items-center justify-center min-h-screen">
        <div className="text-center">
          <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-600 font-medium">Invoice not found</p>
          <Link
            href="/accounting/invoices"
            className="inline-flex items-center gap-2 mt-4 text-blue-600 hover:text-blue-700"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Invoices
          </Link>
        </div>
      </div>
    );
  }

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      draft: { bg: "bg-yellow-100", text: "text-yellow-800", icon: Calendar },
      posted: { bg: "bg-green-100", text: "text-green-800", icon: CheckCircle },
      cancel: { bg: "bg-red-100", text: "text-red-800", icon: XCircle },
    };
    const config = statusConfig[status as keyof typeof statusConfig] || {
      bg: "bg-gray-100",
      text: "text-gray-800",
      icon: FileText,
    };
    return (
      <span className={`inline-flex items-center gap-2 px-3 py-1 rounded-full ${config.bg} ${config.text}`}>
        <config.icon className="w-4 h-4" />
        {status}
      </span>
    );
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={() => {
              router.back();
            }}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-gray-600" />
          </button>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-bold text-gray-900">{invoice.number}</h1>
              {getStatusBadge(invoice.status)}
            </div>
            <p className="text-gray-600 mt-1">Invoice Summary</p>
          </div>
        </div>
      </div>

      {/* Info Message */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
          <div>
            <h3 className="text-sm font-semibold text-blue-900 mb-1">Limited Summary View</h3>
            <p className="text-sm text-blue-800">
              This page shows a simplified summary. For full invoice details including line items, customer
              information, and payment details, please access the invoice directly through the Odoo interface.
            </p>
          </div>
        </div>
      </div>

      {/* Invoice Summary Card */}
      <div className="bg-white rounded-lg shadow border border-gray-200">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Invoice Summary</h2>
        </div>
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Invoice Number</label>
              <div className="p-3 bg-gray-50 rounded-lg">
                <p className="font-medium text-gray-900">{invoice.number}</p>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Type</label>
              <div className="p-3 bg-gray-50 rounded-lg">
                <p className="font-medium text-gray-900">{invoice.type}</p>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Date</label>
              <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg">
                <Calendar className="w-4 h-4 text-gray-400" />
                <p className="text-gray-900">{invoice.date}</p>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
              <div className="p-3 bg-gray-50 rounded-lg">{getStatusBadge(invoice.status)}</div>
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">Total Amount</label>
              <div className="p-4 bg-gray-50 rounded-lg border-2 border-gray-200">
                <p className="text-3xl font-bold text-gray-900">${invoice.total.toLocaleString()}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center justify-end gap-3">
        <Link
          href="/accounting/invoices"
          className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
        >
          Back to List
        </Link>
      </div>
    </div>
  );
}
