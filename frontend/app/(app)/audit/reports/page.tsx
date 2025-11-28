"use client";

import { useState, useMemo } from "react";
import { Filter, FileDown, TrendingUp, DollarSign, AlertTriangle, CheckCircle2 } from "lucide-react";
import { ReportWizard } from "@/components/audit/reports/ReportWizard";
import { ReportViewer } from "@/components/audit/reports/ReportViewer";
import { useReports, useExportReport } from "@/lib/api/hooks/reports";
import { useDashboardStats, useDashboardActivity } from "@/lib/api/hooks/dashboard";
import { useCases, type CaseData } from "@/lib/api/hooks/cases";
import type { AuditReportResponse } from "@/lib/types/reports";

export default function AuditReports() {
  const [_reportType, _setReportType] = useState("financial");
  const [_timePeriod, _setTimePeriod] = useState("last-30");
  const [_client, _setClient] = useState("all");
  const [_status, _setStatus] = useState("all");
  const [_autoRefresh, _setAutoRefresh] = useState(true);
  const [trendView, setTrendView] = useState("monthly");
  const [showWizard, setShowWizard] = useState(false);
  const [viewingReport, setViewingReport] = useState<AuditReportResponse | null>(null);

  const { data: reports = [] } = useReports();
  const { data: dashboardStats } = useDashboardStats();
  const { data: activity = [] } = useDashboardActivity(12);
  const { data: cases = [] } = useCases({});
  const exportMutation = useExportReport();

  // Calculate audit trends from activity data
  const auditTrendsData = useMemo(() => {
    const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const now = new Date();
    const monthlyData = [];

    for (let i = 11; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthName = monthNames[date.getMonth()];

      // Count completed cases and findings for this month
      const monthStart = date.getTime();
      const monthEnd = new Date(date.getFullYear(), date.getMonth() + 1, 0).getTime();

      const monthActivity = activity.filter((a) => {
        const activityDate = new Date(a.updatedAt).getTime();
        return activityDate >= monthStart && activityDate <= monthEnd;
      });

      const completed = monthActivity.filter((a) => a.status === "completed").length;
      const findings = monthActivity.filter((a) => a.status === "in_review" || a.status === "pending").length;

      monthlyData.push({
        month: monthName,
        completed,
        findings,
      });
    }

    return monthlyData;
  }, [activity]);

  const maxTrendValue = Math.max(...auditTrendsData.map((d) => Math.max(d.completed, d.findings)), 10);

  // Calculate compliance scores from cases
  const complianceScores = useMemo(() => {
    const frameworks = ["ISO 27001", "SOC 2", "GDPR", "PCI DSS", "NIST"];

    return frameworks.map((framework) => {
      // Calculate score based on completed cases
      const frameworkCases = cases.filter((c: CaseData) =>
        c.auditType.toLowerCase().includes(framework.toLowerCase().replace(/\s+/g, ""))
      );

      const completedCases = frameworkCases.filter((c: CaseData) => c.status === "completed").length;
      const totalCases = frameworkCases.length || 1;
      const score = Math.round((completedCases / totalCases) * 100);

      return {
        framework,
        score: score || 0,
      };
    });
  }, [cases]);

  // Calculate risk assessment from cases
  const riskAssessment = useMemo(() => {
    const highRisk = cases.filter((c: CaseData) => c.priority === "high").length;
    const mediumRisk = cases.filter((c: CaseData) => c.priority === "medium").length;
    const lowRisk = cases.filter((c: CaseData) => c.priority === "low").length;
    const total = cases.length || 1;

    return {
      high: Math.round((highRisk / total) * 100),
      medium: Math.round((mediumRisk / total) * 100),
      low: Math.round((lowRisk / total) * 100),
      criticalIssues: highRisk,
    };
  }, [cases]);

  // Calculate financial metrics (placeholder until we have actual financial data)
  const financialMetrics = {
    totalAssets: "$2.4M",
    revenueVerified: "$1.8M",
    discrepancies: "$24K",
    accuracyRate: dashboardStats?.completionRate
      ? `${dashboardStats.completionRate.toFixed(1)}%`
      : "98.7%",
  };

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
            <button
              onClick={() => setShowWizard(true)}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
            >
              + Generate Report
            </button>
          </div>
        </div>

        {/* Report Wizard Modal */}
        {showWizard && <ReportWizard onClose={() => setShowWizard(false)} />}

        {/* Report Viewer Modal */}
        {viewingReport && (
          <ReportViewer
            report={viewingReport}
            onClose={() => setViewingReport(null)}
            onExport={(format) => exportMutation.mutate({ reportId: viewingReport.id, format })}
          />
        )}

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <FileDown className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Total Reports</p>
                <p className="text-2xl font-bold text-gray-900">{reports.length}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <CheckCircle2 className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Ready</p>
                <p className="text-2xl font-bold text-gray-900">
                  {reports.filter((r) => r.status === "ready").length}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
                <AlertTriangle className="w-6 h-6 text-yellow-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Generating</p>
                <p className="text-2xl font-bold text-gray-900">
                  {reports.filter((r) => r.status === "generating").length}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Metrics Cards Row */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
          {/* Completion Rate Gauge */}
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-gray-900">Audit Completion Rate</h3>
            </div>

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
                  strokeDasharray={`${((dashboardStats?.completionRate || 0) / 100) * 502.4} 502.4`}
                  strokeLinecap="round"
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center">
                  <p className="text-4xl font-bold text-gray-900">
                    {dashboardStats?.completionRate.toFixed(0) || 0}%
                  </p>
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
                  <span className="text-sm font-bold text-red-600">{riskAssessment.high}%</span>
                </div>
                <div className="w-full h-3 bg-gray-200 rounded-full overflow-hidden">
                  <div className="h-full bg-red-500" style={{ width: `${riskAssessment.high}%` }} />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-700">Medium Risk</span>
                  <span className="text-sm font-bold text-yellow-600">{riskAssessment.medium}%</span>
                </div>
                <div className="w-full h-3 bg-gray-200 rounded-full overflow-hidden">
                  <div className="h-full bg-yellow-500" style={{ width: `${riskAssessment.medium}%` }} />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-700">Low Risk</span>
                  <span className="text-sm font-bold text-green-600">{riskAssessment.low}%</span>
                </div>
                <div className="w-full h-3 bg-gray-200 rounded-full overflow-hidden">
                  <div className="h-full bg-green-500" style={{ width: `${riskAssessment.low}%` }} />
                </div>
              </div>

              <div className="mt-4 pt-4 border-t border-gray-200">
                <div className="flex items-center gap-2 text-yellow-600">
                  <AlertTriangle className="w-5 h-5" />
                  <div>
                    <p className="text-sm font-semibold">{riskAssessment.criticalIssues} Critical Issues</p>
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
                  <p className="text-2xl font-bold text-gray-900">{financialMetrics.totalAssets}</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  <DollarSign className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-xs text-gray-600 mb-1">Revenue Verified</p>
                  <p className="text-2xl font-bold text-gray-900">{financialMetrics.revenueVerified}</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  <AlertTriangle className="w-5 h-5 text-orange-600" />
                </div>
                <div>
                  <p className="text-xs text-gray-600 mb-1">Discrepancies Found</p>
                  <p className="text-2xl font-bold text-gray-900">{financialMetrics.discrepancies}</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  <CheckCircle2 className="w-5 h-5 text-gray-600" />
                </div>
                <div>
                  <p className="text-xs text-gray-600 mb-1">Accuracy Rate</p>
                  <p className="text-2xl font-bold text-gray-900">{financialMetrics.accuracyRate}</p>
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
                  points={auditTrendsData
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
                  points={auditTrendsData
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
                {auditTrendsData.map((d, i) => (
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
            {reports.length === 0 ? (
              <div className="col-span-3 text-center py-12 text-gray-500">
                <p>No reports generated yet. Click &quot;Generate Report&quot; to create your first report.</p>
              </div>
            ) : (
              reports.map((report) => (
                <button
                  key={report.id}
                  onClick={() => setViewingReport(report)}
                  className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow text-left"
                >
                  <div className="flex items-start gap-3 mb-3">
                    <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center text-2xl">
                      📄
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-sm font-semibold text-gray-900 mb-1 truncate">{report.title}</h3>
                      <p className="text-xs text-gray-600">
                        Generated: {report.generatedAt ? new Date(report.generatedAt).toLocaleDateString() : "Processing..."}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <span
                      className={`text-xs px-2 py-1 rounded ${
                        report.status === "ready"
                          ? "bg-green-100 text-green-700"
                          : report.status === "generating"
                            ? "bg-yellow-100 text-yellow-700"
                            : "bg-red-100 text-red-700"
                      }`}
                    >
                      {report.status === "ready" ? "Ready" : report.status === "generating" ? "Generating..." : "Failed"}
                    </span>
                    <div className="flex items-center gap-2">
                      <FileDown className="w-4 h-4 text-gray-600" />
                    </div>
                  </div>
                </button>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
