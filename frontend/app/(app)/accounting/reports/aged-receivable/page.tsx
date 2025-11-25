"use client";

import Link from "next/link";
import { ArrowLeft, FileText, Download, Printer, AlertCircle } from "lucide-react";
import { useAgedReceivable } from "@/lib/api/hooks";

export default function AgedReceivablePage() {
  const { data: report, isLoading } = useAgedReceivable();

  const totalReceivable = report?.reduce((sum, item) => sum + item.total, 0) || 0;

  // Calculate aging buckets
  const aging = {
    current: report?.reduce((sum, item) => sum + (item.days_1_30 || 0), 0) || 0,
    days30: report?.reduce((sum, item) => sum + (item.days_31_60 || 0), 0) || 0,
    days60: report?.reduce((sum, item) => sum + (item.days_61_90 || 0), 0) || 0,
    days90: report?.reduce((sum, item) => sum + (item.days_over_90 || 0), 0) || 0,
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/accounting" className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
            <ArrowLeft className="w-5 h-5 text-gray-600" />
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Aged Receivables</h1>
            <p className="text-gray-600 mt-1">Outstanding customer invoices by age</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button className="flex items-center gap-2 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors">
            <Printer className="w-4 h-4" />
            Print
          </button>
          <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
            <Download className="w-4 h-4" />
            Export
          </button>
        </div>
      </div>

      {isLoading ? (
        <div className="bg-white rounded-lg shadow border border-gray-200 p-12 text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          <p className="mt-4 text-gray-600">Loading report...</p>
        </div>
      ) : report && report.length > 0 ? (
        <>
          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <div className="bg-white rounded-lg shadow border border-gray-200 p-6">
              <p className="text-sm text-gray-600 mb-2">Total Outstanding</p>
              <p className="text-3xl font-bold text-blue-600">${totalReceivable.toLocaleString()}</p>
            </div>
            <div className="bg-white rounded-lg shadow border border-gray-200 p-6">
              <p className="text-sm text-gray-600 mb-2">Current (0-30)</p>
              <p className="text-2xl font-bold text-green-600">${aging.current.toLocaleString()}</p>
              <p className="text-xs text-gray-500 mt-1">
                {totalReceivable > 0 ? ((aging.current / totalReceivable) * 100).toFixed(1) : 0}%
              </p>
            </div>
            <div className="bg-white rounded-lg shadow border border-gray-200 p-6">
              <p className="text-sm text-gray-600 mb-2">30-60 Days</p>
              <p className="text-2xl font-bold text-yellow-600">${aging.days30.toLocaleString()}</p>
              <p className="text-xs text-gray-500 mt-1">
                {totalReceivable > 0 ? ((aging.days30 / totalReceivable) * 100).toFixed(1) : 0}%
              </p>
            </div>
            <div className="bg-white rounded-lg shadow border border-gray-200 p-6">
              <p className="text-sm text-gray-600 mb-2">60-90 Days</p>
              <p className="text-2xl font-bold text-orange-600">${aging.days60.toLocaleString()}</p>
              <p className="text-xs text-gray-500 mt-1">
                {totalReceivable > 0 ? ((aging.days60 / totalReceivable) * 100).toFixed(1) : 0}%
              </p>
            </div>
            <div className="bg-white rounded-lg shadow border border-gray-200 p-6">
              <p className="text-sm text-gray-600 mb-2">Over 90 Days</p>
              <p className="text-2xl font-bold text-red-600">${aging.days90.toLocaleString()}</p>
              <p className="text-xs text-gray-500 mt-1">
                {totalReceivable > 0 ? ((aging.days90 / totalReceivable) * 100).toFixed(1) : 0}%
              </p>
            </div>
          </div>

          {/* Alert for Overdue */}
          {(aging.days60 > 0 || aging.days90 > 0) && (
            <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
              <div className="flex items-center gap-3">
                <AlertCircle className="w-5 h-5 text-orange-600" />
                <div>
                  <p className="font-medium text-orange-900">Overdue Invoices Detected</p>
                  <p className="text-sm text-orange-700 mt-1">
                    ${(aging.days60 + aging.days90).toLocaleString()} in invoices are overdue by more than 60
                    days
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Detailed Report */}
          <div className="bg-white rounded-lg shadow border border-gray-200">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">Aging Detail by Customer</h2>
              <p className="text-sm text-gray-600 mt-1">As of {new Date().toLocaleDateString()}</p>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                      Customer
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-600 uppercase tracking-wider">
                      Current
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-600 uppercase tracking-wider">
                      30-60 Days
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-600 uppercase tracking-wider">
                      60-90 Days
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-600 uppercase tracking-wider">
                      Over 90 Days
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-600 uppercase tracking-wider">
                      Total Due
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {report.map((customer, index) => (
                    <tr key={index} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <FileText className="w-4 h-4 text-gray-400" />
                          <span className="font-medium text-gray-900">{customer.partnerName}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <span className="text-sm text-gray-900">
                          ${customer.days_1_30?.toLocaleString() || 0}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <span
                          className={`text-sm ${customer.days_31_60 > 0 ? "text-yellow-600 font-medium" : "text-gray-900"}`}
                        >
                          ${customer.days_31_60?.toLocaleString() || 0}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <span
                          className={`text-sm ${customer.days_61_90 > 0 ? "text-orange-600 font-medium" : "text-gray-900"}`}
                        >
                          ${customer.days_61_90?.toLocaleString() || 0}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <span
                          className={`text-sm ${customer.days_over_90 > 0 ? "text-red-600 font-bold" : "text-gray-900"}`}
                        >
                          ${customer.days_over_90?.toLocaleString() || 0}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <span className="text-sm font-bold text-gray-900">
                          ${customer.total.toLocaleString()}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot className="bg-gray-50 border-t-2 border-gray-300">
                  <tr>
                    <td className="px-6 py-4 font-bold text-gray-900">Total</td>
                    <td className="px-6 py-4 text-right font-bold text-gray-900">
                      ${aging.current.toLocaleString()}
                    </td>
                    <td className="px-6 py-4 text-right font-bold text-yellow-600">
                      ${aging.days30.toLocaleString()}
                    </td>
                    <td className="px-6 py-4 text-right font-bold text-orange-600">
                      ${aging.days60.toLocaleString()}
                    </td>
                    <td className="px-6 py-4 text-right font-bold text-red-600">
                      ${aging.days90.toLocaleString()}
                    </td>
                    <td className="px-6 py-4 text-right font-bold text-blue-600">
                      ${totalReceivable.toLocaleString()}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        </>
      ) : (
        <div className="bg-white rounded-lg shadow border border-gray-200 p-12 text-center">
          <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-600 font-medium">No outstanding receivables</p>
          <p className="text-gray-500 text-sm mt-1">All invoices have been paid</p>
        </div>
      )}
    </div>
  );
}
