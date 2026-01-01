"use client";

import Link from "next/link";
import { DollarSign, Mail, Phone, Clock, MoreVertical, Target } from "lucide-react";
import { type Lead, leadSchema } from "@/lib/validation";

type LeadResponse = Lead;

interface LeadCardProps {
  lead: LeadResponse;
  isDragging?: boolean;
}

export function LeadCard({ lead, isDragging = false }: LeadCardProps) {
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
    <Link
      href={`/crm/leads/${lead.id}`}
      className={`block bg-white rounded-lg border border-gray-200 p-4 hover:shadow-md transition-all ${
        isDragging ? "opacity-50 rotate-2" : ""
      }`}
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-gray-900 truncate">{lead.name}</h3>
          {(lead.partnerName || lead.contactName) && (
            <p className="text-sm text-gray-600 truncate mt-1">{lead.partnerName || lead.contactName}</p>
          )}
        </div>
        <button
          onClick={(e) => {
            e.preventDefault();
            // TODO: [Frontend] - Implement actions menu for LeadCard
//   Details: When the MoreVertical icon is clicked, a dropdown or modal should appear, providing options for lead-specific actions (e.g., Edit, Delete, Convert).
//   Priority: Medium
          }}
          className="text-gray-400 hover:text-gray-600"
        >
          <MoreVertical className="h-4 w-4" />
        </button>
      </div>

      {lead.expectedRevenue !== undefined && lead.expectedRevenue > 0 && (
        <div className="flex items-center space-x-2 mb-3">
          <div className="flex items-center text-green-600 font-semibold">
            <DollarSign className="h-4 w-4" />
            <span>{lead.expectedRevenue.toLocaleString()}</span>
          </div>
          {lead.probability !== undefined && (
            <span className="text-xs text-gray-500">• {lead.probability}%</span>
          )}
        </div>
      )}

      <div className="flex flex-wrap gap-2 mb-3">
        {lead.type && (
          <span
            className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
              lead.type === "opportunity" ? "bg-purple-100 text-purple-700" : "bg-blue-100 text-blue-700"
            }`}
          >
            <Target className="h-3 w-3 mr-1" />
            {lead.type === "opportunity" ? "Opportunity" : "Lead"}
          </span>
        )}
        {lead.priority &&
          lead.priority !== "0" &&
          (leadSchema.shape.priority.safeParse(lead.priority).success ? (
            <span
              className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                priorityColors[lead.priority as keyof typeof priorityColors]
              }`}
            >
              {priorityLabels[lead.priority as keyof typeof priorityLabels]}
            </span>
          ) : null)}
      </div>

      <div className="space-y-2 text-sm text-gray-600">
        {lead.emailFrom && (
          <div className="flex items-center space-x-2">
            <Mail className="h-4 w-4 text-gray-400" />
            <span className="truncate">{lead.emailFrom}</span>
          </div>
        )}
        {lead.phone && (
          <div className="flex items-center space-x-2">
            <Phone className="h-4 w-4 text-gray-400" />
            <span>{lead.phone}</span>
          </div>
        )}
        {lead.dateDeadline && (
          <div className="flex items-center space-x-2">
            <Clock className="h-4 w-4 text-gray-400" />
            <span className="text-xs">Due: {new Date(lead.dateDeadline).toLocaleDateString()}</span>
          </div>
        )}
      </div>

      {lead.user && (
        <div className="mt-3 pt-3 border-t border-gray-100">
          <div className="flex items-center space-x-2">
            <div className="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center text-xs font-medium text-blue-700">
              {lead.user.name.charAt(0).toUpperCase()}
            </div>
            <span className="text-xs text-gray-600">{lead.user.name}</span>
          </div>
        </div>
      )}
    </Link>
  );
}
