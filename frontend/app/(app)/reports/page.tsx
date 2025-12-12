"use client";

import {
  BarChart3,
  FileText,
  TrendingUp,
  Users,
  DollarSign,
  Package,
  Calendar,
  Download,
  ArrowRight,
} from "lucide-react";
import Link from "next/link";

export default function ReportsPage() {
  const reportCategories = [
    {
      id: "accounting",
      title: "Accounting & Finance",
      description: "Financial statements, P&L, balance sheets",
      icon: DollarSign,
      color: "bg-green-100 text-green-600",
      hoverColor: "hover:bg-green-50 hover:border-green-300",
      reports: [
        { name: "Profit & Loss", url: "/accounting/reports/profit-loss" },
        { name: "Trial Balance", url: "/accounting/reports/trial-balance" },
        { name: "Aged Payable", url: "/accounting/reports/aged-payable" },
        { name: "Aged Receivable", url: "/accounting/reports/aged-receivable" },
      ],
    },
    {
      id: "hr",
      title: "HR & Payroll",
      description: "Employee reports, attendance, payroll summaries",
      icon: Users,
      color: "bg-blue-100 text-blue-600",
      hoverColor: "hover:bg-blue-50 hover:border-blue-300",
      reports: [
        { name: "Employee Directory", url: "/hr/reports/employees" },
        { name: "Payroll Summary", url: "/hr/reports/payroll" },
        { name: "Attendance Report", url: "/hr/reports/attendance" },
        { name: "Leave Balance", url: "/hr/reports/leave" },
      ],
    },
    {
      id: "crm",
      title: "CRM & Sales",
      description: "Sales pipeline, customer insights, revenue tracking",
      icon: TrendingUp,
      color: "bg-purple-100 text-purple-600",
      hoverColor: "hover:bg-purple-50 hover:border-purple-300",
      reports: [
        { name: "Sales Pipeline", url: "/crm/reports/pipeline" },
        { name: "Customer Overview", url: "/crm/reports/customers" },
        { name: "Revenue Analysis", url: "/crm/reports/revenue" },
        { name: "Lead Conversion", url: "/crm/reports/conversion" },
      ],
    },
    {
      id: "audit",
      title: "Audit & Compliance",
      description: "Audit trails, compliance reports, risk assessments",
      icon: FileText,
      color: "bg-orange-100 text-orange-600",
      hoverColor: "hover:bg-orange-50 hover:border-orange-300",
      reports: [
        { name: "Audit Plans", url: "/audit/reports" },
        { name: "Risk Assessment", url: "/audit/reports/risk" },
        { name: "Compliance Status", url: "/audit/reports/compliance" },
        { name: "Audit Trail", url: "/audit/reports/trail" },
      ],
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-safee-100 rounded-lg">
              <BarChart3 className="h-6 w-6 text-safee-600" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Reports & Analytics</h1>
              <p className="text-gray-600">Comprehensive insights across all modules</p>
            </div>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Total Reports</p>
                <p className="text-2xl font-bold text-gray-900">24</p>
              </div>
              <FileText className="h-8 w-8 text-gray-400" />
            </div>
          </div>
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Generated Today</p>
                <p className="text-2xl font-bold text-gray-900">8</p>
              </div>
              <Calendar className="h-8 w-8 text-gray-400" />
            </div>
          </div>
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Scheduled</p>
                <p className="text-2xl font-bold text-gray-900">5</p>
              </div>
              <Package className="h-8 w-8 text-gray-400" />
            </div>
          </div>
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Downloads</p>
                <p className="text-2xl font-bold text-gray-900">142</p>
              </div>
              <Download className="h-8 w-8 text-gray-400" />
            </div>
          </div>
        </div>

        {/* Report Categories */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {reportCategories.map((category) => {
            const Icon = category.icon;
            return (
              <div
                key={category.id}
                className={`bg-white rounded-xl border border-gray-200 p-6 transition-all ${category.hoverColor}`}
              >
                <div className="flex items-start gap-4 mb-4">
                  <div className={`p-3 rounded-lg ${category.color}`}>
                    <Icon className="h-6 w-6" />
                  </div>
                  <div className="flex-1">
                    <h2 className="text-xl font-bold text-gray-900 mb-1">{category.title}</h2>
                    <p className="text-sm text-gray-600">{category.description}</p>
                  </div>
                </div>

                <div className="space-y-2">
                  {category.reports.map((report) => (
                    <Link
                      key={report.name}
                      href={report.url}
                      className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 transition-colors group"
                    >
                      <div className="flex items-center gap-3">
                        <FileText className="h-4 w-4 text-gray-400" />
                        <span className="text-sm font-medium text-gray-700 group-hover:text-safee-600">
                          {report.name}
                        </span>
                      </div>
                      <ArrowRight className="h-4 w-4 text-gray-400 group-hover:text-safee-600 transition-colors" />
                    </Link>
                  ))}
                </div>
              </div>
            );
          })}
        </div>

        {/* Recent Reports Section */}
        <div className="mt-8">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Recent Reports</h2>
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Report Name
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Module
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Generated
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {[
                  {
                    name: "Quarterly Financial Summary",
                    module: "Accounting",
                    date: "2025-01-15 10:30 AM",
                  },
                  { name: "Employee Performance Report", module: "HR", date: "2025-01-15 09:15 AM" },
                  { name: "Sales Pipeline Analysis", module: "CRM", date: "2025-01-14 04:20 PM" },
                ].map((report, idx) => (
                  <tr key={idx} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <FileText className="h-4 w-4 text-gray-400" />
                        <span className="text-sm font-medium text-gray-900">{report.name}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="px-2 py-1 text-xs font-medium bg-gray-100 text-gray-700 rounded">
                        {report.module}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{report.date}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      <button className="text-safee-600 hover:text-safee-700 text-sm font-medium">
                        Download
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
