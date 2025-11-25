"use client";

import Link from "next/link";
import { ArrowLeft, BarChart3, TrendingUp, FileText, Receipt, DollarSign, Calendar } from "lucide-react";

export default function ReportsPage() {
  const reports = [
    {
      title: "Profit & Loss",
      description: "Income statement showing revenue, expenses, and net profit for a period",
      icon: TrendingUp,
      color: "text-green-600",
      bgColor: "bg-green-50",
      href: "/accounting/reports/profit-loss",
      category: "Financial Statements",
    },
    {
      title: "Trial Balance",
      description: "Verify that total debits equal total credits across all accounts",
      icon: BarChart3,
      color: "text-blue-600",
      bgColor: "bg-blue-50",
      href: "/accounting/reports/trial-balance",
      category: "Financial Statements",
    },
    {
      title: "Aged Receivables",
      description: "Outstanding customer invoices organized by age (0-30, 30-60, 60-90, 90+ days)",
      icon: FileText,
      color: "text-purple-600",
      bgColor: "bg-purple-50",
      href: "/accounting/reports/aged-receivable",
      category: "Accounts Receivable",
    },
    {
      title: "Aged Payables",
      description: "Outstanding vendor bills organized by age to manage payment priorities",
      icon: Receipt,
      color: "text-orange-600",
      bgColor: "bg-orange-50",
      href: "/accounting/reports/aged-payable",
      category: "Accounts Payable",
    },
    {
      title: "Partner Ledger",
      description: "Detailed transaction history for a specific customer or vendor",
      icon: DollarSign,
      color: "text-indigo-600",
      bgColor: "bg-indigo-50",
      href: "/accounting/reports/partner-ledger",
      category: "Detailed Reports",
      badge: "Coming Soon",
    },
    {
      title: "General Ledger",
      description: "Complete list of all accounting transactions by account",
      icon: BarChart3,
      color: "text-cyan-600",
      bgColor: "bg-cyan-50",
      href: "/accounting/reports/general-ledger",
      category: "Detailed Reports",
      badge: "Coming Soon",
    },
  ];

  const categories = [...new Set(reports.map((r) => r.category))];

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/accounting" className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
            <ArrowLeft className="w-5 h-5 text-gray-600" />
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Financial Reports</h1>
            <p className="text-gray-600 mt-1">View detailed financial reports and analysis</p>
          </div>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-6 rounded-lg shadow border border-gray-200">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-lg bg-blue-50">
              <BarChart3 className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Available Reports</p>
              <p className="text-2xl font-bold text-gray-900">{reports.length}</p>
            </div>
          </div>
        </div>
        <div className="bg-white p-6 rounded-lg shadow border border-gray-200">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-lg bg-green-50">
              <TrendingUp className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Categories</p>
              <p className="text-2xl font-bold text-gray-900">{categories.length}</p>
            </div>
          </div>
        </div>
        <div className="bg-white p-6 rounded-lg shadow border border-gray-200">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-lg bg-purple-50">
              <Calendar className="w-6 h-6 text-purple-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Period</p>
              <p className="text-lg font-bold text-gray-900">Current Year</p>
            </div>
          </div>
        </div>
        <div className="bg-white p-6 rounded-lg shadow border border-gray-200">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-lg bg-orange-50">
              <FileText className="w-6 h-6 text-orange-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Format</p>
              <p className="text-lg font-bold text-gray-900">PDF & Excel</p>
            </div>
          </div>
        </div>
      </div>

      {/* Reports by Category */}
      {categories.map((category) => (
        <div key={category} className="space-y-4">
          <h2 className="text-xl font-semibold text-gray-900">{category}</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {reports
              .filter((report) => report.category === category)
              .map((report) => (
                <Link
                  key={report.title}
                  href={report.href}
                  className={`bg-white rounded-lg shadow border border-gray-200 hover:shadow-lg transition-all p-6 ${
                    report.badge ? "relative" : ""
                  }`}
                >
                  {report.badge && (
                    <span className="absolute top-4 right-4 px-2 py-1 text-xs font-medium bg-yellow-100 text-yellow-800 rounded">
                      {report.badge}
                    </span>
                  )}
                  <div className="flex items-start gap-4">
                    <div className={`p-3 rounded-lg ${report.bgColor}`}>
                      <report.icon className={`w-8 h-8 ${report.color}`} />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">{report.title}</h3>
                      <p className="text-sm text-gray-600">{report.description}</p>
                    </div>
                  </div>
                </Link>
              ))}
          </div>
        </div>
      ))}

      {/* Help Section */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
        <div className="flex items-start gap-4">
          <div className="p-3 rounded-lg bg-blue-100">
            <BarChart3 className="w-6 h-6 text-blue-600" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Understanding Financial Reports</h3>
            <p className="text-sm text-gray-700 mb-3">
              Financial reports help you understand your business performance, track cash flow, and make
              informed decisions. Here are some tips:
            </p>
            <ul className="space-y-2 text-sm text-gray-700">
              <li className="flex items-start gap-2">
                <span className="text-blue-600 font-bold">•</span>
                <span>
                  <strong>Profit & Loss:</strong> Review monthly to track income and expenses trends
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-600 font-bold">•</span>
                <span>
                  <strong>Aged Receivables:</strong> Monitor closely to improve cash collection
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-600 font-bold">•</span>
                <span>
                  <strong>Trial Balance:</strong> Run before closing periods to ensure accuracy
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-600 font-bold">•</span>
                <span>
                  <strong>Aged Payables:</strong> Plan cash flow by tracking when bills are due
                </span>
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* Custom Reports Section */}
      <div className="bg-white rounded-lg shadow border border-gray-200 p-6">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Need a Custom Report?</h3>
            <p className="text-sm text-gray-600">
              Contact support to request custom reports tailored to your business needs
            </p>
          </div>
          <button className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
            Contact Support
          </button>
        </div>
      </div>
    </div>
  );
}
