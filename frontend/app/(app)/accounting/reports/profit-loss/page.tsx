"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, TrendingUp, TrendingDown, Download, Printer, Calendar } from "lucide-react";
import { useProfitLoss } from "@/lib/api/hooks";

export default function ProfitLossPage() {
  const [dateRange, setDateRange] = useState({
    from: new Date(new Date().getFullYear(), 0, 1).toISOString().split("T")[0],
    to: new Date().toISOString().split("T")[0],
  });

  const { data: report, isLoading } = useProfitLoss(dateRange.from, dateRange.to);

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/accounting" className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
            <ArrowLeft className="w-5 h-5 text-gray-600" />
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Profit & Loss Statement</h1>
            <p className="text-gray-600 mt-1">Income statement showing revenue and expenses</p>
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

      {/* Date Range Selector */}
      <div className="bg-white rounded-lg shadow border border-gray-200 p-4">
        <div className="flex items-center gap-4">
          <Calendar className="w-5 h-5 text-gray-400" />
          <span className="text-sm font-medium text-gray-700">Period:</span>
          <input
            type="date"
            value={dateRange.from}
            onChange={(e) => {
              setDateRange((prev) => ({ ...prev, from: e.target.value }));
            }}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
          <span className="text-gray-400">→</span>
          <input
            type="date"
            value={dateRange.to}
            onChange={(e) => {
              setDateRange((prev) => ({ ...prev, to: e.target.value }));
            }}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
          <button
            onClick={() => {
              const today = new Date();
              setDateRange({
                from: new Date(today.getFullYear(), today.getMonth(), 1).toISOString().split("T")[0],
                to: today.toISOString().split("T")[0],
              });
            }}
            className="px-4 py-2 text-sm text-blue-600 hover:text-blue-700 font-medium"
          >
            This Month
          </button>
          <button
            onClick={() => {
              const today = new Date();
              setDateRange({
                from: new Date(today.getFullYear(), 0, 1).toISOString().split("T")[0],
                to: today.toISOString().split("T")[0],
              });
            }}
            className="px-4 py-2 text-sm text-blue-600 hover:text-blue-700 font-medium"
          >
            This Year
          </button>
        </div>
      </div>

      {isLoading ? (
        <div className="bg-white rounded-lg shadow border border-gray-200 p-12 text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          <p className="mt-4 text-gray-600">Loading report...</p>
        </div>
      ) : report ? (
        <>
          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white rounded-lg shadow border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-3">
                <div className="p-3 rounded-lg bg-green-50">
                  <TrendingUp className="w-6 h-6 text-green-600" />
                </div>
              </div>
              <p className="text-sm text-gray-600 mb-1">Total Revenue</p>
              <p className="text-3xl font-bold text-gray-900">${report.income?.toLocaleString() || 0}</p>
              <p className="text-sm text-green-600 mt-2">Income from operations</p>
            </div>

            <div className="bg-white rounded-lg shadow border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-3">
                <div className="p-3 rounded-lg bg-red-50">
                  <TrendingDown className="w-6 h-6 text-red-600" />
                </div>
              </div>
              <p className="text-sm text-gray-600 mb-1">Total Expenses</p>
              <p className="text-3xl font-bold text-gray-900">${report.expenses?.toLocaleString() || 0}</p>
              <p className="text-sm text-red-600 mt-2">Operating costs</p>
            </div>

            <div className="bg-white rounded-lg shadow border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-3">
                <div className={`p-3 rounded-lg ${report.netProfit >= 0 ? "bg-blue-50" : "bg-orange-50"}`}>
                  {report.netProfit >= 0 ? (
                    <TrendingUp className="w-6 h-6 text-blue-600" />
                  ) : (
                    <TrendingDown className="w-6 h-6 text-orange-600" />
                  )}
                </div>
              </div>
              <p className="text-sm text-gray-600 mb-1">Net Profit</p>
              <p
                className={`text-3xl font-bold ${report.netProfit >= 0 ? "text-blue-600" : "text-orange-600"}`}
              >
                ${Math.abs(report.netProfit || 0).toLocaleString()}
              </p>
              <p className={`text-sm mt-2 ${report.netProfit >= 0 ? "text-blue-600" : "text-orange-600"}`}>
                {report.netProfit >= 0 ? "Profit" : "Loss"} for period
              </p>
            </div>
          </div>

          {/* Detailed Report */}
          <div className="bg-white rounded-lg shadow border border-gray-200">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">Detailed Statement</h2>
              <p className="text-sm text-gray-600 mt-1">
                {new Date(dateRange.from).toLocaleDateString()} -{" "}
                {new Date(dateRange.to).toLocaleDateString()}
              </p>
            </div>

            <div className="p-6">
              <div className="space-y-6">
                {/* Revenue Section */}
                <div>
                  <div className="flex items-center justify-between py-3 border-b-2 border-gray-300">
                    <h3 className="text-lg font-semibold text-gray-900">Revenue</h3>
                    <p className="text-lg font-bold text-gray-900">${report.income?.toLocaleString() || 0}</p>
                  </div>
                </div>

                {/* Expenses Section */}
                <div>
                  <div className="flex items-center justify-between py-3 border-b-2 border-gray-300">
                    <h3 className="text-lg font-semibold text-gray-900">Expenses</h3>
                    <p className="text-lg font-bold text-gray-900">
                      ${report.expenses?.toLocaleString() || 0}
                    </p>
                  </div>
                </div>

                {/* Net Profit */}
                <div className="pt-4 border-t-4 border-gray-300">
                  <div className="flex items-center justify-between py-3">
                    <h3 className="text-xl font-bold text-gray-900">Net Profit (Loss)</h3>
                    <p
                      className={`text-2xl font-bold ${report.netProfit >= 0 ? "text-green-600" : "text-red-600"}`}
                    >
                      {report.netProfit >= 0 ? "+" : "-"}${Math.abs(report.netProfit || 0).toLocaleString()}
                    </p>
                  </div>
                </div>

                {/* Profit Margin */}
                {report.income > 0 && (
                  <div className="bg-blue-50 rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-gray-700">Profit Margin</span>
                      <span className="text-lg font-bold text-blue-600">
                        {((report.netProfit / report.income) * 100).toFixed(2)}%
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </>
      ) : (
        <div className="bg-white rounded-lg shadow border border-gray-200 p-12 text-center">
          <TrendingUp className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-600 font-medium">No data available</p>
          <p className="text-gray-500 text-sm mt-1">Try adjusting your date range</p>
        </div>
      )}
    </div>
  );
}
