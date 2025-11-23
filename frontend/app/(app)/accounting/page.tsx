"use client";

import { useSearchParams, useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import {
  FileText,
  Receipt,
  CreditCard,
  Building2,
  BarChart3,
  DollarSign,
  TrendingUp,
  TrendingDown,
} from "lucide-react";
import {
  useInvoices,
  useBills,
  usePayments,
  useProfitLoss,
  useAgedReceivable,
  useAgedPayable,
} from "@/lib/api/hooks";

export default function AccountingPage() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // Get date range from URL or use defaults
  const defaultFrom = new Date(new Date().getFullYear(), new Date().getMonth(), 1)
    .toISOString()
    .split("T")[0];
  const defaultTo = new Date().toISOString().split("T")[0];

  const dateRange = {
    from: searchParams.get("from") || defaultFrom,
    to: searchParams.get("to") || defaultTo,
  };

  // Update URL when date range changes
  const setDateRange = (newRange: { from?: string; to?: string }) => {
    const params = new URLSearchParams(searchParams);
    if (newRange.from) params.set("from", newRange.from);
    if (newRange.to) params.set("to", newRange.to);
    router.push(`${pathname}?${params.toString()}`);
  };

  // Fetch data
  const { data: invoices } = useInvoices({ limit: 5 });
  const { data: bills } = useBills({ limit: 5 });
  const { data: payments } = usePayments();
  const { data: profitLoss } = useProfitLoss(dateRange.from, dateRange.to);
  const { data: agedReceivable } = useAgedReceivable();
  const { data: agedPayable } = useAgedPayable();

  // Calculate totals
  const totalReceivable = agedReceivable?.reduce((sum, item) => sum + item.total, 0) || 0;
  const totalPayable = agedPayable?.reduce((sum, item) => sum + item.total, 0) || 0;
  const netProfit = profitLoss?.netProfit || 0;

  const stats = [
    {
      title: "Accounts Receivable",
      value: `$${totalReceivable.toLocaleString()}`,
      change: "+12.5%",
      trend: "up",
      icon: FileText,
      color: "text-blue-600",
      bgColor: "bg-blue-50",
      href: "/accounting/reports/aged-receivable",
    },
    {
      title: "Accounts Payable",
      value: `$${totalPayable.toLocaleString()}`,
      change: "+5.2%",
      trend: "up",
      icon: Receipt,
      color: "text-orange-600",
      bgColor: "bg-orange-50",
      href: "/accounting/reports/aged-payable",
    },
    {
      title: "Net Profit (MTD)",
      value: `$${netProfit.toLocaleString()}`,
      change: "+8.3%",
      trend: netProfit >= 0 ? "up" : "down",
      icon: TrendingUp,
      color: netProfit >= 0 ? "text-green-600" : "text-red-600",
      bgColor: netProfit >= 0 ? "bg-green-50" : "bg-red-50",
      href: "/accounting/reports/profit-loss",
    },
    {
      title: "Total Revenue",
      value: `$${(profitLoss?.income || 0).toLocaleString()}`,
      change: "+15.8%",
      trend: "up",
      icon: DollarSign,
      color: "text-purple-600",
      bgColor: "bg-purple-50",
      href: "/accounting/reports/profit-loss",
    },
  ];

  const quickActions = [
    {
      label: "New Invoice",
      href: "/accounting/invoices/new",
      icon: FileText,
      color: "bg-blue-600 hover:bg-blue-700",
    },
    {
      label: "New Bill",
      href: "/accounting/bills/new",
      icon: Receipt,
      color: "bg-orange-600 hover:bg-orange-700",
    },
    {
      label: "New Payment",
      href: "/accounting/payments/new",
      icon: CreditCard,
      color: "bg-green-600 hover:bg-green-700",
    },
    {
      label: "Reconcile Bank",
      href: "/accounting/bank-reconciliation",
      icon: Building2,
      color: "bg-purple-600 hover:bg-purple-700",
    },
  ];

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Accounting Dashboard</h1>
          <p className="text-gray-600 mt-1">Overview of your financial data</p>
        </div>
        <div className="flex items-center gap-3">
          {/* Date Range Selector */}
          <div className="flex items-center gap-2 bg-white px-4 py-2 rounded-lg border border-gray-200">
            <span className="text-sm text-gray-600">Period:</span>
            <input
              type="date"
              value={dateRange.from}
              onChange={(e) => setDateRange({ from: e.target.value, to: dateRange.to })}
              className="text-sm border-0 focus:ring-0 p-0"
            />
            <span className="text-gray-400">→</span>
            <input
              type="date"
              value={dateRange.to}
              onChange={(e) => setDateRange({ from: dateRange.from, to: e.target.value })}
              className="text-sm border-0 focus:ring-0 p-0"
            />
          </div>

          {/* Quick Actions */}
          {quickActions.map((action) => (
            <Link
              key={action.label}
              href={action.href}
              className={`flex items-center gap-2 px-4 py-2 text-white rounded-lg ${action.color} transition-colors`}
            >
              <action.icon className="w-4 h-4" />
              {action.label}
            </Link>
          ))}
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat) => (
          <Link
            key={stat.title}
            href={stat.href}
            className="bg-white p-6 rounded-lg shadow hover:shadow-md transition-shadow border border-gray-200"
          >
            <div className="flex items-center justify-between">
              <div className={`p-3 rounded-lg ${stat.bgColor}`}>
                <stat.icon className={`w-6 h-6 ${stat.color}`} />
              </div>
              <div className="flex items-center gap-1 text-sm">
                {stat.trend === "up" ? (
                  <TrendingUp className="w-4 h-4 text-green-600" />
                ) : (
                  <TrendingDown className="w-4 h-4 text-red-600" />
                )}
                <span className={stat.trend === "up" ? "text-green-600" : "text-red-600"}>{stat.change}</span>
              </div>
            </div>
            <div className="mt-4">
              <p className="text-sm text-gray-600">{stat.title}</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">{stat.value}</p>
            </div>
          </Link>
        ))}
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Invoices */}
        <div className="bg-white rounded-lg shadow border border-gray-200">
          <div className="p-6 border-b border-gray-200 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900">Recent Invoices</h2>
            <Link href="/accounting/invoices" className="text-sm text-blue-600 hover:text-blue-700">
              View all →
            </Link>
          </div>
          <div className="p-6">
            {invoices?.invoices && invoices.invoices.length > 0 ? (
              <div className="space-y-2">
                {invoices.invoices.map((invoice) => (
                  <Link
                    key={invoice.id}
                    href={`/accounting/invoices/${invoice.id}`}
                    className="block p-3 rounded-lg hover:bg-gray-50 transition-colors border border-transparent hover:border-gray-200"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2 flex-1 min-w-0">
                        <FileText className="w-4 h-4 text-blue-600 flex-shrink-0" />
                        <span className="font-mono text-sm font-medium text-gray-900 truncate" title={invoice.number}>
                          {invoice.number}
                        </span>
                      </div>
                      <span
                        className={`text-xs px-2 py-0.5 rounded-full flex-shrink-0 ml-2 ${
                          invoice.status === "posted"
                            ? "bg-green-100 text-green-700"
                            : invoice.status === "draft"
                              ? "bg-yellow-100 text-yellow-700"
                              : "bg-gray-100 text-gray-700"
                        }`}
                      >
                        {invoice.status}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-500">{new Date(invoice.date).toLocaleDateString()}</span>
                      <span className="font-semibold text-gray-900">${invoice.total.toLocaleString()}</span>
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 text-center py-8">No invoices yet</p>
            )}
          </div>
        </div>

        {/* Recent Bills */}
        <div className="bg-white rounded-lg shadow border border-gray-200">
          <div className="p-6 border-b border-gray-200 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900">Recent Bills</h2>
            <Link href="/accounting/bills" className="text-sm text-blue-600 hover:text-blue-700">
              View all →
            </Link>
          </div>
          <div className="p-6">
            {bills?.bills && bills.bills.length > 0 ? (
              <div className="space-y-2">
                {bills.bills.map((bill) => (
                  <Link
                    key={bill.id}
                    href={`/accounting/bills/${bill.id}`}
                    className="block p-3 rounded-lg hover:bg-gray-50 transition-colors border border-transparent hover:border-gray-200"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2 flex-1 min-w-0">
                        <Receipt className="w-4 h-4 text-orange-600 flex-shrink-0" />
                        <span className="font-mono text-sm font-medium text-gray-900 truncate" title={bill.number}>
                          {bill.number}
                        </span>
                      </div>
                      <span
                        className={`text-xs px-2 py-0.5 rounded-full flex-shrink-0 ml-2 ${
                          bill.status === "posted"
                            ? "bg-green-100 text-green-700"
                            : bill.status === "draft"
                              ? "bg-yellow-100 text-yellow-700"
                              : "bg-gray-100 text-gray-700"
                        }`}
                      >
                        {bill.status}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-500">{new Date(bill.date).toLocaleDateString()}</span>
                      <span className="font-semibold text-gray-900">${bill.total.toLocaleString()}</span>
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 text-center py-8">No bills yet</p>
            )}
          </div>
        </div>

        {/* Recent Payments */}
        <div className="bg-white rounded-lg shadow border border-gray-200">
          <div className="p-6 border-b border-gray-200 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900">Recent Payments</h2>
            <Link href="/accounting/payments" className="text-sm text-blue-600 hover:text-blue-700">
              View all →
            </Link>
          </div>
          <div className="p-6">
            {payments && payments.length > 0 ? (
              <div className="space-y-2">
                {payments.slice(0, 5).map((payment) => (
                  <div
                    key={payment.id}
                    className="block p-3 rounded-lg hover:bg-gray-50 transition-colors border border-transparent hover:border-gray-200"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2 flex-1 min-w-0">
                        <CreditCard className="w-4 h-4 text-green-600 flex-shrink-0" />
                        <span className="font-mono text-sm font-medium text-gray-900 truncate" title={payment.ref || `#${payment.id}`}>
                          {payment.ref || `#${payment.id}`}
                        </span>
                      </div>
                      <span
                        className={`text-xs px-2 py-0.5 rounded-full flex-shrink-0 ml-2 ${
                          payment.state === "posted"
                            ? "bg-green-100 text-green-700"
                            : payment.state === "draft"
                              ? "bg-yellow-100 text-yellow-700"
                              : "bg-gray-100 text-gray-700"
                        }`}
                      >
                        {payment.state}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-500">{new Date(payment.paymentDate).toLocaleDateString()}</span>
                      <span className="font-semibold text-gray-900">${payment.amount.toLocaleString()}</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 text-center py-8">No payments yet</p>
            )}
          </div>
        </div>
      </div>

      {/* Reports Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Link
          href="/accounting/reports/trial-balance"
          className="bg-white p-6 rounded-lg shadow border border-gray-200 hover:shadow-md transition-shadow"
        >
          <div className="flex items-center gap-3 mb-3">
            <BarChart3 className="w-8 h-8 text-blue-600" />
            <h3 className="font-semibold text-gray-900">Trial Balance</h3>
          </div>
          <p className="text-sm text-gray-600">View account balances and verify debits equal credits</p>
        </Link>

        <Link
          href="/accounting/reports/profit-loss"
          className="bg-white p-6 rounded-lg shadow border border-gray-200 hover:shadow-md transition-shadow"
        >
          <div className="flex items-center gap-3 mb-3">
            <TrendingUp className="w-8 h-8 text-green-600" />
            <h3 className="font-semibold text-gray-900">Profit & Loss</h3>
          </div>
          <p className="text-sm text-gray-600">Income statement showing revenue and expenses</p>
        </Link>

        <Link
          href="/accounting/reports/aged-receivable"
          className="bg-white p-6 rounded-lg shadow border border-gray-200 hover:shadow-md transition-shadow"
        >
          <div className="flex items-center gap-3 mb-3">
            <FileText className="w-8 h-8 text-purple-600" />
            <h3 className="font-semibold text-gray-900">Aged Receivables</h3>
          </div>
          <p className="text-sm text-gray-600">Outstanding customer invoices by age</p>
        </Link>

        <Link
          href="/accounting/reports/aged-payable"
          className="bg-white p-6 rounded-lg shadow border border-gray-200 hover:shadow-md transition-shadow"
        >
          <div className="flex items-center gap-3 mb-3">
            <Receipt className="w-8 h-8 text-orange-600" />
            <h3 className="font-semibold text-gray-900">Aged Payables</h3>
          </div>
          <p className="text-sm text-gray-600">Outstanding vendor bills by age</p>
        </Link>
      </div>
    </div>
  );
}
