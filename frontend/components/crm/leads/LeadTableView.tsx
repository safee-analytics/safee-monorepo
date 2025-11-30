"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowUpDown, Mail, Phone, DollarSign, Target, Calendar } from "lucide-react";
import type { paths } from "@/lib/api/types";

type LeadResponse = paths["/crm/leads"]["get"]["responses"]["200"]["content"]["application/json"][number];

interface LeadTableViewProps {
  leads: LeadResponse[];
}

type SortField = "name" | "expectedRevenue" | "probability" | "dateDeadline" | "stage";
type SortDirection = "asc" | "desc";

export function LeadTableView({ leads }: LeadTableViewProps) {
  const [sortField, setSortField] = useState<SortField>("name");
  const [sortDirection, setSortDirection] = useState<SortDirection>("asc");

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
  };

  const sortedLeads = [...leads].sort((a, b) => {
    let aValue: string | number | undefined;
    let bValue: string | number | undefined;

    switch (sortField) {
      case "name":
        aValue = a.name.toLowerCase();
        bValue = b.name.toLowerCase();
        break;
      case "expectedRevenue":
        aValue = a.expectedRevenue || 0;
        bValue = b.expectedRevenue || 0;
        break;
      case "probability":
        aValue = a.probability || 0;
        bValue = b.probability || 0;
        break;
      case "dateDeadline":
        aValue = a.dateDeadline ? new Date(a.dateDeadline).getTime() : 0;
        bValue = b.dateDeadline ? new Date(b.dateDeadline).getTime() : 0;
        break;
      case "stage":
        aValue = a.stage?.name.toLowerCase() || "";
        bValue = b.stage?.name.toLowerCase() || "";
        break;
    }

    if (aValue === undefined || aValue === "") return 1;
    if (bValue === undefined || bValue === "") return -1;

    if (aValue < bValue) return sortDirection === "asc" ? -1 : 1;
    if (aValue > bValue) return sortDirection === "asc" ? 1 : -1;
    return 0;
  });

  const SortButton = ({ field, children }: { field: SortField; children: React.ReactNode }) => (
    <button
      onClick={() => handleSort(field)}
      className="flex items-center space-x-1 hover:text-gray-900 transition-colors"
    >
      <span>{children}</span>
      <ArrowUpDown className={`h-4 w-4 ${sortField === field ? "text-blue-600" : "text-gray-400"}`} />
    </button>
  );

  const priorityColors = {
    "0": "bg-gray-100 text-gray-600",
    "1": "bg-blue-100 text-blue-600",
    "2": "bg-yellow-100 text-yellow-700",
    "3": "bg-red-100 text-red-600",
  };

  const priorityLabels = {
    "0": "Low",
    "1": "Normal",
    "2": "High",
    "3": "Urgent",
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                <SortButton field="name">Lead Name</SortButton>
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Type
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Contact
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                <SortButton field="stage">Stage</SortButton>
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                <SortButton field="expectedRevenue">Expected Revenue</SortButton>
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                <SortButton field="probability">Probability</SortButton>
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                <SortButton field="dateDeadline">Deadline</SortButton>
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Assignee
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Priority
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {sortedLeads.length === 0 ? (
              <tr>
                <td colSpan={9} className="px-6 py-12 text-center">
                  <Target className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-500">No leads found</p>
                  <Link
                    href="/crm/leads/new"
                    className="text-blue-600 hover:underline text-sm mt-2 inline-block"
                  >
                    Create your first lead
                  </Link>
                </td>
              </tr>
            ) : (
              sortedLeads.map((lead) => (
                <tr key={lead.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <Link
                      href={`/crm/leads/${lead.id}`}
                      className="text-sm font-medium text-blue-600 hover:underline"
                    >
                      {lead.name}
                    </Link>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        lead.type === "opportunity"
                          ? "bg-purple-100 text-purple-700"
                          : "bg-blue-100 text-blue-700"
                      }`}
                    >
                      {lead.type === "opportunity" ? "Opportunity" : "Lead"}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-gray-900">{lead.partnerName || lead.contactName || "-"}</div>
                    <div className="flex items-center space-x-3 mt-1">
                      {lead.emailFrom && (
                        <div className="flex items-center text-xs text-gray-500">
                          <Mail className="h-3 w-3 mr-1" />
                          <span className="truncate max-w-[150px]">{lead.emailFrom}</span>
                        </div>
                      )}
                      {lead.phone && (
                        <div className="flex items-center text-xs text-gray-500">
                          <Phone className="h-3 w-3 mr-1" />
                          <span>{lead.phone}</span>
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="text-sm text-gray-900">{lead.stage?.name || "-"}</span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {lead.expectedRevenue !== undefined && lead.expectedRevenue > 0 ? (
                      <div className="flex items-center text-sm font-semibold text-green-600">
                        <DollarSign className="h-4 w-4" />
                        <span>{lead.expectedRevenue.toLocaleString()}</span>
                      </div>
                    ) : (
                      <span className="text-sm text-gray-400">-</span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {lead.probability !== undefined ? (
                      <div className="flex items-center">
                        <div className="w-full bg-gray-200 rounded-full h-2 max-w-[100px]">
                          <div
                            className="bg-blue-600 h-2 rounded-full"
                            style={{ width: `${lead.probability}%` }}
                          />
                        </div>
                        <span className="ml-2 text-sm text-gray-600">{lead.probability}%</span>
                      </div>
                    ) : (
                      <span className="text-sm text-gray-400">-</span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {lead.dateDeadline ? (
                      <div className="flex items-center text-sm text-gray-600">
                        <Calendar className="h-4 w-4 mr-1" />
                        <span>{new Date(lead.dateDeadline).toLocaleDateString()}</span>
                      </div>
                    ) : (
                      <span className="text-sm text-gray-400">-</span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {lead.user ? (
                      <div className="flex items-center">
                        <div className="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center text-xs font-medium text-blue-700">
                          {lead.user.name.charAt(0).toUpperCase()}
                        </div>
                        <span className="ml-2 text-sm text-gray-600">{lead.user.name}</span>
                      </div>
                    ) : (
                      <span className="text-sm text-gray-400">Unassigned</span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {lead.priority && lead.priority !== "0" ? (
                      <span
                        className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                          priorityColors[lead.priority as keyof typeof priorityColors]
                        }`}
                      >
                        {priorityLabels[lead.priority as keyof typeof priorityLabels]}
                      </span>
                    ) : (
                      <span className="text-sm text-gray-400">-</span>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
