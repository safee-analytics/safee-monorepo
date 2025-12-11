"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Receipt, Plus, Search, Filter, Calendar, DollarSign, TrendingDown, FileText } from "lucide-react";
import { useBills } from "@/lib/api/hooks";

export default function ExpensesPage() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "draft" | "posted" | "cancel">("all");
  const [dateRange, setDateRange] = useState({
    from: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split("T")[0],
    to: new Date().toISOString().split("T")[0],
  });

  const { data: billsData, isLoading } = useBills({
    state: statusFilter === "all" ? undefined : statusFilter,
    dateFrom: dateRange.from,
    dateTo: dateRange.to,
  });

  const bills = billsData?.bills || [];

  const filteredBills = bills.filter((bill) => {
    const matchesSearch = !searchQuery || bill.number?.toLowerCase().includes(searchQuery.toLowerCase());

    return matchesSearch;
  });

  // Calculate stats
  const totalExpenses = bills.reduce((sum, bill) => sum + (bill.total || 0), 0);
  const monthlyExpenses = bills
    .filter((bill) => {
      const billDate = new Date(bill.date);
      const currentMonth = new Date().getMonth();
      return billDate.getMonth() === currentMonth;
    })
    .reduce((sum, bill) => sum + (bill.total || 0), 0);

  const stats = [
    {
      label: "Total Expenses",
      value: `$${totalExpenses.toLocaleString()}`,
      icon: TrendingDown,
      color: "text-red-600",
      bgColor: "bg-red-50",
      description: "All time",
    },
    {
      label: "This Month",
      value: `$${monthlyExpenses.toLocaleString()}`,
      icon: Calendar,
      color: "text-orange-600",
      bgColor: "bg-orange-50",
      description: new Date().toLocaleString("default", { month: "long" }),
    },
    {
      label: "Total Bills",
      value: bills.length,
      icon: Receipt,
      color: "text-blue-600",
      bgColor: "bg-blue-50",
      description: "All statuses",
    },
    {
      label: "Pending",
      value: bills.filter((b) => b.status === "draft").length,
      icon: FileText,
      color: "text-yellow-600",
      bgColor: "bg-yellow-50",
      description: "Draft bills",
    },
  ];

  const getStatusBadge = (status: string) => {
    const statusColors = {
      draft: "bg-yellow-100 text-yellow-800",
      posted: "bg-green-100 text-green-800",
      cancel: "bg-red-100 text-red-800",
    };
    return statusColors[status as keyof typeof statusColors] || "bg-gray-100 text-gray-800";
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Expenses</h1>
          <p className="text-gray-600 mt-1">Track and manage vendor bills and expenses</p>
        </div>
        <div className="flex items-center gap-3">
          <Link
            href="/accounting/bills/new"
            className="flex items-center gap-2 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors"
          >
            <Plus className="w-4 h-4" />
            New Bill
          </Link>
          <Link
            href="/accounting/expenses/new"
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Plus className="w-4 h-4" />
            Quick Expense
          </Link>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {stats.map((stat) => (
          <div key={stat.label} className="bg-white p-6 rounded-lg shadow border border-gray-200">
            <div className="flex items-center justify-between mb-3">
              <div className={`p-3 rounded-lg ${stat.bgColor}`}>
                <stat.icon className={`w-6 h-6 ${stat.color}`} />
              </div>
              <div className="text-right">
                <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
              </div>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-700">{stat.label}</p>
              <p className="text-xs text-gray-500">{stat.description}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow border border-gray-200 p-4">
        <div className="flex flex-wrap items-center gap-4">
          {/* Search */}
          <div className="flex-1 min-w-[300px]">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search by bill number or vendor..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                }}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>

          {/* Date Range */}
          <div className="flex items-center gap-2">
            <Calendar className="w-5 h-5 text-gray-400" />
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
          </div>

          {/* Status Filter */}
          <div className="flex items-center gap-2">
            <Filter className="w-5 h-5 text-gray-400" />
            <button
              onClick={() => {
                setStatusFilter("all");
              }}
              className={`px-4 py-2 rounded-lg transition-colors ${
                statusFilter === "all"
                  ? "bg-blue-600 text-white"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              All
            </button>
            <button
              onClick={() => {
                setStatusFilter("draft");
              }}
              className={`px-4 py-2 rounded-lg transition-colors ${
                statusFilter === "draft"
                  ? "bg-yellow-600 text-white"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              Draft
            </button>
            <button
              onClick={() => {
                setStatusFilter("posted");
              }}
              className={`px-4 py-2 rounded-lg transition-colors ${
                statusFilter === "posted"
                  ? "bg-green-600 text-white"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              Posted
            </button>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        {isLoading ? (
          <div className="p-12 text-center">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            <p className="mt-4 text-gray-600">Loading expenses...</p>
          </div>
        ) : filteredBills.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                    Bill #
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                    Type
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                    Amount
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredBills.map((bill) => (
                  <tr
                    key={bill.id}
                    className="hover:bg-gray-50 transition-colors cursor-pointer"
                    onClick={() => {
                      router.push(`/accounting/bills/${bill.id}`);
                    }}
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <Receipt className="w-4 h-4 text-gray-400" />
                        <span className="font-medium text-gray-900">{bill.number}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-sm text-gray-900">{bill.type}</p>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-gray-400" />
                        <p className="text-sm text-gray-900">{bill.date}</p>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <DollarSign className="w-4 h-4 text-gray-400" />
                        <p className="font-semibold text-gray-900">${bill.total?.toLocaleString()}</p>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex px-2 py-1 text-xs font-medium rounded ${getStatusBadge(bill.status)}`}
                      >
                        {bill.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-12 text-center">
            <Receipt className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-600 font-medium">No expenses found</p>
            <p className="text-gray-500 text-sm mt-1">
              {searchQuery || statusFilter !== "all"
                ? "Try adjusting your filters"
                : "Get started by recording your first expense"}
            </p>
            {!searchQuery && statusFilter === "all" && (
              <div className="flex items-center justify-center gap-3 mt-4">
                <Link
                  href="/accounting/bills/new"
                  className="inline-flex items-center gap-2 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors"
                >
                  <Plus className="w-4 h-4" />
                  New Bill
                </Link>
                <Link
                  href="/accounting/expenses/new"
                  className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <Plus className="w-4 h-4" />
                  Quick Expense
                </Link>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Expense Categories Chart (Placeholder) */}
      <div className="bg-white rounded-lg shadow border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Expense Categories</h2>
        <div className="flex items-center justify-center h-64 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
          <div className="text-center">
            <TrendingDown className="w-12 h-12 text-gray-400 mx-auto mb-2" />
            <p className="text-gray-600">Category breakdown chart coming soon</p>
          </div>
        </div>
      </div>
    </div>
  );
}
