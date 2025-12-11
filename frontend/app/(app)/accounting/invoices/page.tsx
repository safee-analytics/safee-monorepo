"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  FileText,
  Plus,
  Search,
  Filter,
  Download,
  Eye,
  Edit,
  CheckCircle,
  XCircle,
  Clock,
} from "lucide-react";
import { useInvoices } from "@/lib/api/hooks";

export default function InvoicesPage() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "draft" | "posted" | "cancel">("all");
  const [typeFilter, setTypeFilter] = useState<"all" | "SALES" | "PURCHASE">("all");

  const { data: invoicesData, isLoading } = useInvoices({
    state: statusFilter === "all" ? undefined : statusFilter,
    type: typeFilter === "all" ? undefined : typeFilter,
  });

  const invoices = invoicesData?.invoices || [];

  const filteredInvoices = invoices.filter((invoice) => {
    const matchesSearch = !searchQuery || invoice.number?.toLowerCase().includes(searchQuery.toLowerCase());

    return matchesSearch;
  });

  const stats = [
    {
      label: "Total Invoices",
      value: invoices.length,
      icon: FileText,
      color: "text-blue-600",
      bgColor: "bg-blue-50",
    },
    {
      label: "Draft",
      value: invoices.filter((i) => i.status === "draft").length,
      icon: Clock,
      color: "text-yellow-600",
      bgColor: "bg-yellow-50",
    },
    {
      label: "Posted",
      value: invoices.filter((i) => i.status === "posted").length,
      icon: CheckCircle,
      color: "text-green-600",
      bgColor: "bg-green-50",
    },
    {
      label: "Cancelled",
      value: invoices.filter((i) => i.status === "cancel").length,
      icon: XCircle,
      color: "text-red-600",
      bgColor: "bg-red-50",
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
          <h1 className="text-3xl font-bold text-gray-900">Invoices</h1>
          <p className="text-gray-600 mt-1">Manage customer invoices and vendor bills</p>
        </div>
        <Link
          href="/accounting/invoices/new"
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus className="w-4 h-4" />
          New Invoice
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {stats.map((stat) => (
          <div key={stat.label} className="bg-white p-6 rounded-lg shadow border border-gray-200">
            <div className="flex items-center gap-3">
              <div className={`p-3 rounded-lg ${stat.bgColor}`}>
                <stat.icon className={`w-6 h-6 ${stat.color}`} />
              </div>
              <div>
                <p className="text-sm text-gray-600">{stat.label}</p>
                <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
              </div>
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
                placeholder="Search by invoice number or customer..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                }}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>

          {/* Type Filter */}
          <div className="flex items-center gap-2">
            <Filter className="w-5 h-5 text-gray-400" />
            <select
              value={typeFilter}
              onChange={(e) => {
                setTypeFilter(e.target.value as typeof typeFilter);
              }}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="all">All Types</option>
              <option value="SALES">Sales</option>
              <option value="PURCHASE">Purchase</option>
            </select>
          </div>

          {/* Status Filter */}
          <div className="flex items-center gap-2">
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
            <button
              onClick={() => {
                setStatusFilter("cancel");
              }}
              className={`px-4 py-2 rounded-lg transition-colors ${
                statusFilter === "cancel"
                  ? "bg-red-600 text-white"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              Cancelled
            </button>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        {isLoading ? (
          <div className="p-12 text-center">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            <p className="mt-4 text-gray-600">Loading invoices...</p>
          </div>
        ) : filteredInvoices.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                    Invoice #
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
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredInvoices.map((invoice) => (
                  <tr
                    key={invoice.id}
                    className="hover:bg-gray-50 transition-colors cursor-pointer"
                    onClick={() => {
                      router.push(`/accounting/invoices/${invoice.id}`);
                    }}
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <FileText className="w-4 h-4 text-gray-400" />
                        <span className="font-medium text-gray-900">{invoice.number}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-sm text-gray-900">{invoice.type}</p>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-sm text-gray-900">{invoice.date}</p>
                    </td>
                    <td className="px-6 py-4">
                      <p className="font-semibold text-gray-900">${invoice.total.toLocaleString()}</p>
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex px-2 py-1 text-xs font-medium rounded ${getStatusBadge(invoice.status)}`}
                      >
                        {invoice.status}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            router.push(`/accounting/invoices/${invoice.id}`);
                          }}
                          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                          title="View"
                        >
                          <Eye className="w-4 h-4 text-gray-600" />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            router.push(`/accounting/invoices/${invoice.id}/edit`);
                          }}
                          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                          title="Edit"
                        >
                          <Edit className="w-4 h-4 text-gray-600" />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            // TODO: Download PDF
                          }}
                          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                          title="Download PDF"
                        >
                          <Download className="w-4 h-4 text-gray-600" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-12 text-center">
            <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-600 font-medium">No invoices found</p>
            <p className="text-gray-500 text-sm mt-1">
              {searchQuery || statusFilter !== "all" || typeFilter !== "all"
                ? "Try adjusting your filters"
                : "Get started by creating your first invoice"}
            </p>
            {!searchQuery && statusFilter === "all" && typeFilter === "all" && (
              <Link
                href="/accounting/invoices/new"
                className="inline-flex items-center gap-2 mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <Plus className="w-4 h-4" />
                New Invoice
              </Link>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
