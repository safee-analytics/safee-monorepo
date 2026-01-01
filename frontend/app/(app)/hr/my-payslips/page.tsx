"use client";

import { useState } from "react";
import { Download, FileText, Eye, DollarSign, Calendar } from "lucide-react";

interface Payslip {
  id: string;
  month: string;
  year: number;
  grossPay: number;
  deductions: number;
  netPay: number;
  paidDate: string;
  status: "paid" | "pending";
}

export default function MyPayslipsPage() {
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

  // Mock data - replace with actual API call
  const payslips: Payslip[] = [
    {
      id: "1",
      month: "January",
      year: 2024,
      grossPay: 5000,
      deductions: 500,
      netPay: 4500,
      paidDate: "2024-01-31",
      status: "paid",
    },
    {
      id: "2",
      month: "December",
      year: 2023,
      grossPay: 5000,
      deductions: 500,
      netPay: 4500,
      paidDate: "2023-12-31",
      status: "paid",
    },
    {
      id: "3",
      month: "November",
      year: 2023,
      grossPay: 5000,
      deductions: 500,
      netPay: 4500,
      paidDate: "2023-11-30",
      status: "paid",
    },
  ];

  const years = Array.from(new Set(payslips.map((p) => p.year))).sort((a, b) => b - a);

  const filteredPayslips = payslips.filter((p) => p.year === selectedYear);

  const yearlyTotals = {
    grossPay: filteredPayslips.reduce((sum, p) => sum + p.grossPay, 0),
    deductions: filteredPayslips.reduce((sum, p) => sum + p.deductions, 0),
    netPay: filteredPayslips.reduce((sum, p) => sum + p.netPay, 0),
  };

  function handleDownload(_payslipId: string) {
    // TODO: Implement actual download
  }

  function handleView(_payslipId: string) {
    // TODO: Implement view modal
  }

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">My Payslips</h1>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">View and download your payslips</p>
        </div>
        <div className="flex items-center gap-2">
          <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Year:</label>
          <select
            value={selectedYear}
            onChange={(e) => setSelectedYear(Number(e.target.value))}
            className="px-4 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-safee-500"
          >
            {years.map((year) => (
              <option key={year} value={year}>
                {year}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Yearly Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-full bg-green-100 dark:bg-green-900/20 flex items-center justify-center">
              <DollarSign className="w-5 h-5 text-green-600 dark:text-green-400" />
            </div>
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Total Gross Pay</p>
              <p className="text-xl font-bold text-gray-900 dark:text-gray-100">
                ${yearlyTotals.grossPay.toLocaleString()}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-full bg-red-100 dark:bg-red-900/20 flex items-center justify-center">
              <DollarSign className="w-5 h-5 text-red-600 dark:text-red-400" />
            </div>
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Total Deductions</p>
              <p className="text-xl font-bold text-gray-900 dark:text-gray-100">
                ${yearlyTotals.deductions.toLocaleString()}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-full bg-safee-100 dark:bg-safee-900/20 flex items-center justify-center">
              <DollarSign className="w-5 h-5 text-safee-600 dark:text-safee-400" />
            </div>
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Total Net Pay</p>
              <p className="text-xl font-bold text-gray-900 dark:text-gray-100">
                ${yearlyTotals.netPay.toLocaleString()}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Payslips List */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
            Payslips for {selectedYear}
          </h2>
        </div>

        {filteredPayslips.length > 0 ? (
          <div className="divide-y divide-gray-200 dark:divide-gray-700">
            {filteredPayslips.map((payslip) => (
              <div
                key={payslip.id}
                className="p-6 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full bg-safee-100 dark:bg-safee-900/20 flex items-center justify-center">
                      <FileText className="w-6 h-6 text-safee-600 dark:text-safee-400" />
                    </div>

                    <div>
                      <h3 className="font-semibold text-gray-900 dark:text-gray-100">
                        {payslip.month} {payslip.year}
                      </h3>
                      <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400 mt-1">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-4 h-4" />
                          Paid: {new Date(payslip.paidDate).toLocaleDateString()}
                        </span>
                        <span className="flex items-center gap-1">
                          <DollarSign className="w-4 h-4" />
                          Net: ${payslip.netPay.toLocaleString()}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleView(payslip.id)}
                      className="px-3 py-2 text-safee-600 dark:text-safee-400 hover:bg-safee-50 dark:hover:bg-safee-900/20 rounded-lg transition-colors text-sm font-medium flex items-center gap-2"
                    >
                      <Eye className="w-4 h-4" />
                      View
                    </button>
                    <button
                      onClick={() => handleDownload(payslip.id)}
                      className="px-3 py-2 bg-safee-600 text-white rounded-lg hover:bg-safee-700 transition-colors text-sm font-medium flex items-center gap-2"
                    >
                      <Download className="w-4 h-4" />
                      Download
                    </button>
                  </div>
                </div>

                {/* Payslip Details */}
                <div className="mt-4 grid grid-cols-3 gap-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                  <div>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Gross Pay</p>
                    <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                      ${payslip.grossPay.toLocaleString()}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Deductions</p>
                    <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                      ${payslip.deductions.toLocaleString()}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Net Pay</p>
                    <p className="text-sm font-semibold text-safee-600 dark:text-safee-400">
                      ${payslip.netPay.toLocaleString()}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-12 text-center">
            <FileText className="w-12 h-12 text-gray-400 dark:text-gray-600 mx-auto mb-4" />
            <p className="text-gray-600 dark:text-gray-400">No payslips found for {selectedYear}</p>
          </div>
        )}
      </div>
    </div>
  );
}
