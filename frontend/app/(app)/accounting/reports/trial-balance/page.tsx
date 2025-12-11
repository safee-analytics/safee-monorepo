"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, BarChart3, Download, Printer, Calendar, CheckCircle2 } from "lucide-react";
import { useTrialBalance } from "@/lib/api/hooks";

export default function TrialBalancePage() {
  const [dateRange, setDateRange] = useState({
    from: new Date(new Date().getFullYear(), 0, 1).toISOString().split("T")[0],
    to: new Date().toISOString().split("T")[0],
  });

  const { data: report, isLoading } = useTrialBalance({
    dateFrom: dateRange.from,
    dateTo: dateRange.to,
  });

  const totalDebits = report?.reduce((sum: number, acc) => sum + (acc.debit || 0), 0) || 0;
  const totalCredits = report?.reduce((sum: number, acc) => sum + (acc.credit || 0), 0) || 0;
  const isBalanced = Math.abs(totalDebits - totalCredits) < 0.01;

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/accounting" className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
            <ArrowLeft className="w-5 h-5 text-gray-600" />
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Trial Balance</h1>
            <p className="text-gray-600 mt-1">Verify that total debits equal total credits</p>
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
            onChange={(e) => { setDateRange((prev) => ({ ...prev, from: e.target.value })); }}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
          <span className="text-gray-400">→</span>
          <input
            type="date"
            value={dateRange.to}
            onChange={(e) => { setDateRange((prev) => ({ ...prev, to: e.target.value })); }}
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
                <div className="p-3 rounded-lg bg-blue-50">
                  <BarChart3 className="w-6 h-6 text-blue-600" />
                </div>
              </div>
              <p className="text-sm text-gray-600 mb-1">Total Debits</p>
              <p className="text-3xl font-bold text-gray-900">${totalDebits.toLocaleString()}</p>
            </div>

            <div className="bg-white rounded-lg shadow border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-3">
                <div className="p-3 rounded-lg bg-purple-50">
                  <BarChart3 className="w-6 h-6 text-purple-600" />
                </div>
              </div>
              <p className="text-sm text-gray-600 mb-1">Total Credits</p>
              <p className="text-3xl font-bold text-gray-900">${totalCredits.toLocaleString()}</p>
            </div>

            <div className="bg-white rounded-lg shadow border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-3">
                <div className={`p-3 rounded-lg ${isBalanced ? "bg-green-50" : "bg-red-50"}`}>
                  <CheckCircle2 className={`w-6 h-6 ${isBalanced ? "text-green-600" : "text-red-600"}`} />
                </div>
              </div>
              <p className="text-sm text-gray-600 mb-1">Balance Status</p>
              <p className={`text-2xl font-bold ${isBalanced ? "text-green-600" : "text-red-600"}`}>
                {isBalanced ? "Balanced" : "Out of Balance"}
              </p>
              {!isBalanced && (
                <p className="text-xs text-red-600 mt-2">
                  Difference: ${Math.abs(totalDebits - totalCredits).toLocaleString()}
                </p>
              )}
            </div>
          </div>

          {/* Balance Verification Message */}
          {isBalanced && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <div className="flex items-center gap-3">
                <CheckCircle2 className="w-5 h-5 text-green-600" />
                <div>
                  <p className="font-medium text-green-900">Books are Balanced</p>
                  <p className="text-sm text-green-700 mt-1">
                    Total debits equal total credits - your accounting is in balance
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Detailed Report */}
          <div className="bg-white rounded-lg shadow border border-gray-200">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">Account Balances</h2>
              <p className="text-sm text-gray-600 mt-1">
                {new Date(dateRange.from).toLocaleDateString()} -{" "}
                {new Date(dateRange.to).toLocaleDateString()}
              </p>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                      Account Code
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                      Account Name
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-600 uppercase tracking-wider">
                      Debit
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-600 uppercase tracking-wider">
                      Credit
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-600 uppercase tracking-wider">
                      Balance
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {report.map((account, index) => {
                    const balance = (account.debit || 0) - (account.credit || 0);
                    return (
                      <tr key={index} className="hover:bg-gray-50">
                        <td className="px-6 py-4">
                          <span className="text-sm font-mono text-gray-900">{account.accountCode}</span>
                        </td>
                        <td className="px-6 py-4">
                          <span className="text-sm text-gray-900">{account.accountName}</span>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <span className="text-sm text-gray-900">
                            {account.debit > 0 ? `$${account.debit.toLocaleString()}` : "—"}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <span className="text-sm text-gray-900">
                            {account.credit > 0 ? `$${account.credit.toLocaleString()}` : "—"}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <span
                            className={`text-sm font-medium ${
                              balance > 0
                                ? "text-blue-600"
                                : balance < 0
                                  ? "text-purple-600"
                                  : "text-gray-900"
                            }`}
                          >
                            {balance !== 0 ? `$${Math.abs(balance).toLocaleString()}` : "—"}
                            {balance > 0 ? " DR" : balance < 0 ? " CR" : ""}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
                <tfoot className="bg-gray-50 border-t-2 border-gray-300">
                  <tr>
                    <td colSpan={2} className="px-6 py-4 font-bold text-gray-900">
                      Total
                    </td>
                    <td className="px-6 py-4 text-right font-bold text-blue-600">
                      ${totalDebits.toLocaleString()}
                    </td>
                    <td className="px-6 py-4 text-right font-bold text-purple-600">
                      ${totalCredits.toLocaleString()}
                    </td>
                    <td className="px-6 py-4 text-right font-bold text-gray-900">
                      {isBalanced ? (
                        <span className="text-green-600">Balanced ✓</span>
                      ) : (
                        <span className="text-red-600">
                          ${Math.abs(totalDebits - totalCredits).toLocaleString()}
                        </span>
                      )}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>

          {/* Accounting Equation */}
          <div className="bg-white rounded-lg shadow border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Accounting Equation</h3>
            <div className="flex items-center justify-center gap-4 text-center">
              <div>
                <p className="text-sm text-gray-600">Assets</p>
                <p className="text-2xl font-bold text-blue-600">${(0)?.toLocaleString() || 0}</p>
              </div>
              <span className="text-2xl text-gray-400">=</span>
              <div>
                <p className="text-sm text-gray-600">Liabilities</p>
                <p className="text-2xl font-bold text-orange-600">${(0)?.toLocaleString() || 0}</p>
              </div>
              <span className="text-2xl text-gray-400">+</span>
              <div>
                <p className="text-sm text-gray-600">Equity</p>
                <p className="text-2xl font-bold text-purple-600">${(0)?.toLocaleString() || 0}</p>
              </div>
            </div>
          </div>
        </>
      ) : (
        <div className="bg-white rounded-lg shadow border border-gray-200 p-12 text-center">
          <BarChart3 className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-600 font-medium">No data available</p>
          <p className="text-gray-500 text-sm mt-1">Try adjusting your date range</p>
        </div>
      )}
    </div>
  );
}
