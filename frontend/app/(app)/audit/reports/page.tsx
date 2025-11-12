"use client";

import { useState } from "react";
import { Filter, FileDown, TrendingUp, DollarSign, AlertTriangle, CheckCircle2 } from "lucide-react";

export default function AuditReports() {
  const [reportType, setReportType] = useState("financial");
  const [timePeriod, setTimePeriod] = useState("last-30");
  const [client, setClient] = useState("all");
  const [status, setStatus] = useState("all");
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [trendView, setTrendView] = useState("monthly");

  const auditTrendsData = {
    monthly: [
      { month: "Jan", completed: 12, findings: 8 },
      { month: "Feb", completed: 15, findings: 10 },
      { month: "Mar", completed: 18, findings: 12 },
      { month: "Apr", completed: 22, findings: 15 },
      { month: "May", completed: 20, findings: 13 },
      { month: "Jun", completed: 25, findings: 17 },
      { month: "Jul", completed: 24, findings: 16 },
      { month: "Aug", completed: 28, findings: 19 },
      { month: "Sep", completed: 26, findings: 18 },
      { month: "Oct", completed: 23, findings: 15 },
      { month: "Nov", completed: 27, findings: 19 },
      { month: "Dec", completed: 30, findings: 20 },
    ],
  };

  const complianceScores = [
    { framework: "SOX", score: 92 },
    { framework: "GAAP", score: 88 },
    { framework: "IFRS", score: 90 },
    { framework: "PCAOB", score: 85 },
    { framework: "SEC", score: 87 },
  ];

  const generatedReports = [
    {
      id: "1",
      name: "Financial Audit - ABC Corp",
      generated: "Dec 12, 2024",
      pages: 24,
      size: "2.4 MB",
      status: "Completed",
      icon: "📄",
      color: "bg-blue-100",
    },
    {
      id: "2",
      name: "Risk Assessment - XYZ Ltd",
      generated: "Dec 10, 2024",
      pages: 18,
      size: "1.8 MB",
      status: "In Review",
      icon: "📊",
      color: "bg-yellow-100",
    },
    {
      id: "3",
      name: "Compliance Report - MFG Co",
      generated: "Dec 8, 2024",
      pages: 32,
      size: "3.2 MB",
      status: "Completed",
      icon: "📋",
      color: "bg-green-100",
    },
  ];

  const maxTrendValue = Math.max(...auditTrendsData.monthly.map((d) => Math.max(d.completed, d.findings)));

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6 flex items-start justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Audit Reports</h1>
            <p className="text-gray-600">Generate and view comprehensive audit reports with analytics</p>
          </div>
          <div className="flex items-center gap-3">
            <button className="bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 px-4 py-2 rounded-lg flex items-center gap-2 transition-colors">
              <Filter className="w-4 h-4" />
              Filter
            </button>
            <button className="bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 px-4 py-2 rounded-lg flex items-center gap-2 transition-colors">
              <FileDown className="w-4 h-4" />
              Export
            </button>
            <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors">
              + Generate Report
            </button>
          </div>
        </div>

        {/* Report Generator */}
        <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Report Generator</h2>
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-600">Auto-refresh</span>
              <button
                onClick={() => setAutoRefresh(!autoRefresh)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  autoRefresh ? "bg-blue-600" : "bg-gray-300"
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    autoRefresh ? "translate-x-6" : "translate-x-1"
                  }`}
                />
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Report Type</label>
              <select
                value={reportType}
                onChange={(e) => setReportType(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
              >
                <option value="financial">Financial Audit</option>
                <option value="compliance">Compliance Audit</option>
                <option value="risk">Risk Assessment</option>
                <option value="operational">Operational Audit</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Time Period</label>
              <select
                value={timePeriod}
                onChange={(e) => setTimePeriod(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
              >
                <option value="last-30">Last 30 days</option>
                <option value="last-90">Last 90 days</option>
                <option value="last-6">Last 6 months</option>
                <option value="last-year">Last year</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Client</label>
              <select
                value={client}
                onChange={(e) => setClient(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
              >
                <option value="all">All Clients</option>
                <option value="abc">ABC Corporation</option>
                <option value="xyz">XYZ Retail Ltd</option>
                <option value="mfg">Manufacturing Co</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
              >
                <option value="all">All Status</option>
                <option value="completed">Completed</option>
                <option value="in-review">In Review</option>
                <option value="draft">Draft</option>
              </select>
            </div>
          </div>
        </div>

        {/* Metrics Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-6">
          {/* Audit Completion Rate */}
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-gray-900">Audit Completion Rate</h3>
            </div>

            {/* Gauge Chart */}
            <div className="relative w-48 h-48 mx-auto mb-4">
              <svg className="w-full h-full transform -rotate-90">
                <circle cx="96" cy="96" r="80" stroke="#e5e7eb" strokeWidth="16" fill="none" />
                <circle
                  cx="96"
                  cy="96"
                  r="80"
                  stroke="#10b981"
                  strokeWidth="16"
                  fill="none"
                  strokeDasharray={`${(87 / 100) * 502.4} 502.4`}
                  strokeLinecap="round"
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center">
                  <p className="text-4xl font-bold text-gray-900">87%</p>
                  <p className="text-sm text-gray-600">Overall completion rate</p>
                </div>
              </div>
            </div>
          </div>

          {/* Risk Assessment */}
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-gray-900">Risk Assessment</h3>
            </div>

            <div className="space-y-4">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-700">High Risk</span>
                  <span className="text-sm font-bold text-red-600">12%</span>
                </div>
                <div className="w-full h-3 bg-gray-200 rounded-full overflow-hidden">
                  <div className="h-full bg-red-500" style={{ width: "12%" }} />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-700">Medium Risk</span>
                  <span className="text-sm font-bold text-yellow-600">35%</span>
                </div>
                <div className="w-full h-3 bg-gray-200 rounded-full overflow-hidden">
                  <div className="h-full bg-yellow-500" style={{ width: "35%" }} />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-700">Low Risk</span>
                  <span className="text-sm font-bold text-green-600">53%</span>
                </div>
                <div className="w-full h-3 bg-gray-200 rounded-full overflow-hidden">
                  <div className="h-full bg-green-500" style={{ width: "53%" }} />
                </div>
              </div>

              <div className="mt-4 pt-4 border-t border-gray-200">
                <div className="flex items-center gap-2 text-yellow-600">
                  <AlertTriangle className="w-5 h-5" />
                  <div>
                    <p className="text-sm font-semibold">3 Critical Issues</p>
                    <p className="text-xs text-gray-600">Require immediate attention</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Financial Metrics */}
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-gray-900">Financial Metrics</h3>
            </div>

            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  <TrendingUp className="w-5 h-5 text-green-600" />
                </div>
                <div>
                  <p className="text-xs text-gray-600 mb-1">Total Assets Audited</p>
                  <p className="text-2xl font-bold text-gray-900">$2.4M</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  <DollarSign className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-xs text-gray-600 mb-1">Revenue Verified</p>
                  <p className="text-2xl font-bold text-gray-900">$1.8M</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  <AlertTriangle className="w-5 h-5 text-orange-600" />
                </div>
                <div>
                  <p className="text-xs text-gray-600 mb-1">Discrepancies Found</p>
                  <p className="text-2xl font-bold text-gray-900">$24K</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  <CheckCircle2 className="w-5 h-5 text-gray-600" />
                </div>
                <div>
                  <p className="text-xs text-gray-600 mb-1">Accuracy Rate</p>
                  <p className="text-2xl font-bold text-gray-900">98.7%</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {/* Audit Trends */}
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold text-gray-900">Audit Trends</h2>
              <div className="flex items-center gap-2 bg-blue-100 rounded-lg p-1">
                <button
                  onClick={() => setTrendView("monthly")}
                  className={`px-3 py-1 rounded text-sm font-medium ${
                    trendView === "monthly" ? "bg-blue-600 text-white" : "text-gray-700"
                  }`}
                >
                  Monthly
                </button>
                <button
                  onClick={() => setTrendView("quarterly")}
                  className={`px-3 py-1 rounded text-sm font-medium ${
                    trendView === "quarterly" ? "bg-blue-600 text-white" : "text-gray-700"
                  }`}
                >
                  Quarterly
                </button>
                <button
                  onClick={() => setTrendView("yearly")}
                  className={`px-3 py-1 rounded text-sm font-medium ${
                    trendView === "yearly" ? "bg-blue-600 text-white" : "text-gray-700"
                  }`}
                >
                  Yearly
                </button>
              </div>
            </div>

            {/* Line Chart */}
            <div className="h-64 relative">
              <svg className="w-full h-full">
                {/* Grid lines */}
                {[0, 1, 2, 3, 4].map((i) => (
                  <line
                    key={i}
                    x1="40"
                    y1={40 + i * 48}
                    x2="100%"
                    y2={40 + i * 48}
                    stroke="#e5e7eb"
                    strokeWidth="1"
                  />
                ))}

                {/* Completed line */}
                <polyline
                  points={auditTrendsData.monthly
                    .map((d, i) => {
                      const x = 60 + (i * 700) / 12;
                      const y = 232 - (d.completed / maxTrendValue) * 180;
                      return `${x},${y}`;
                    })
                    .join(" ")}
                  fill="none"
                  stroke="#10b981"
                  strokeWidth="2"
                  className="drop-shadow-sm"
                />

                {/* Findings line */}
                <polyline
                  points={auditTrendsData.monthly
                    .map((d, i) => {
                      const x = 60 + (i * 700) / 12;
                      const y = 232 - (d.findings / maxTrendValue) * 180;
                      return `${x},${y}`;
                    })
                    .join(" ")}
                  fill="none"
                  stroke="#f97316"
                  strokeWidth="2"
                  className="drop-shadow-sm"
                />

                {/* X-axis labels */}
                {auditTrendsData.monthly.map((d, i) => (
                  <text
                    key={i}
                    x={60 + (i * 700) / 12}
                    y="250"
                    textAnchor="middle"
                    className="text-xs fill-gray-600"
                  >
                    {d.month}
                  </text>
                ))}
              </svg>
            </div>

            <div className="flex items-center justify-center gap-6 mt-4 pt-4 border-t border-gray-200">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 bg-green-500 rounded-full" />
                <span className="text-sm text-gray-600">Completed Audits</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 bg-orange-500 rounded-full" />
                <span className="text-sm text-gray-600">Findings Identified</span>
              </div>
            </div>
          </div>

          {/* Compliance Score */}
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold text-gray-900">Compliance Score</h2>
            </div>

            <div className="h-64 flex items-end justify-between gap-4">
              {complianceScores.map((item, idx) => (
                <div key={idx} className="flex-1 flex flex-col items-center">
                  <div className="relative w-full" style={{ height: "180px" }}>
                    <div className="absolute bottom-0 w-full flex flex-col items-center">
                      <span className="text-sm font-bold text-gray-900 mb-2">{item.score}</span>
                      <div
                        className="w-full bg-blue-600 rounded-t-lg transition-all"
                        style={{ height: `${(item.score / 100) * 160}px` }}
                      />
                    </div>
                  </div>
                  <span className="text-xs text-gray-600 mt-3">{item.framework}</span>
                </div>
              ))}
            </div>

            <div className="mt-6 pt-4 border-t border-gray-200 flex items-center justify-center">
              <span className="text-sm text-gray-600">● Compliance Score</span>
            </div>
          </div>
        </div>

        {/* Generated Reports */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Generated Reports</h2>
            <div className="flex items-center gap-2">
              <button className="px-4 py-2 text-sm bg-white border border-gray-300 rounded-lg hover:bg-gray-50">
                📋 Table View
              </button>
              <button className="px-4 py-2 text-sm bg-blue-50 text-blue-600 border border-blue-200 rounded-lg">
                🗂️ Card View
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {generatedReports.map((report) => (
              <div
                key={report.id}
                className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
              >
                <div className="flex items-start gap-3 mb-3">
                  <div
                    className={`w-12 h-12 rounded-lg flex items-center justify-center text-2xl ${report.color}`}
                  >
                    {report.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-sm font-semibold text-gray-900 mb-1 truncate">{report.name}</h3>
                    <p className="text-xs text-gray-600">Generated: {report.generated}</p>
                  </div>
                </div>

                <div className="flex items-center justify-between text-xs text-gray-600 mb-3">
                  <span>Pages: {report.pages}</span>
                  <span>Size: {report.size}</span>
                </div>

                <div className="flex items-center justify-between">
                  <span
                    className={`text-xs px-2 py-1 rounded ${
                      report.status === "Completed"
                        ? "bg-green-100 text-green-700"
                        : "bg-yellow-100 text-yellow-700"
                    }`}
                  >
                    {report.status}
                  </span>
                  <div className="flex items-center gap-2">
                    <button className="p-1 hover:bg-gray-100 rounded">
                      <FileDown className="w-4 h-4 text-gray-600" />
                    </button>
                    <button className="p-1 hover:bg-gray-100 rounded">
                      <Filter className="w-4 h-4 text-gray-600" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
