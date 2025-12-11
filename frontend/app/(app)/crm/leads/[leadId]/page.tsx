"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Edit,
  MoreVertical,
  Target,
  CheckCircle2,
  XCircle,
  Mail,
  Phone,
  Globe,
  MapPin,
  DollarSign,
  Calendar,
  User,
  TrendingUp,
} from "lucide-react";
import { useLead, useWinLead, useLoseLead, useConvertLead } from "@/lib/api/hooks";
import { AnimatedButton } from "@safee/ui";
import { toast } from "react-hot-toast";

export default function LeadDetailPage() {
  const params = useParams();
  const router = useRouter();
  const leadId = parseInt(params.leadId as string);

  const [activeTab, setActiveTab] = useState<"overview" | "activities" | "history">("overview");

  const { data: lead, isLoading } = useLead(leadId);
  const winLeadMutation = useWinLead();
  const loseLeadMutation = useLoseLead();
  const convertLeadMutation = useConvertLead();

  const handleWin = async () => {
    try {
      await winLeadMutation.mutateAsync(leadId);
      toast.success("Lead marked as won!");
    } catch (err) {
      toast.error("Failed to mark lead as won");
    }
  };

  const handleLose = async () => {
    try {
      await loseLeadMutation.mutateAsync({ leadId });
      toast.success("Lead marked as lost");
    } catch (err) {
      toast.error("Failed to mark lead as lost");
    }
  };

  const handleConvert = async () => {
    try {
      await convertLeadMutation.mutateAsync({ leadId });
      toast.success("Lead converted to opportunity!");
    } catch (err) {
      toast.error("Failed to convert lead");
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" />
      </div>
    );
  }

  if (!lead) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <Target className="h-16 w-16 text-gray-300 mb-4" />
        <h2 className="text-xl font-semibold text-gray-900 mb-2">Lead Not Found</h2>
        <p className="text-gray-600 mb-4">The lead you&apos;re looking for doesn&apos;t exist.</p>
        <Link href="/crm/leads">
          <AnimatedButton variant="primary">Back to Leads</AnimatedButton>
        </Link>
      </div>
    );
  }

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
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="sticky top-[57px] z-30 bg-white border-b border-gray-200">
        <div className="whitespace-nowrap py-4">
          <button
            onClick={() => { router.back(); }}
            className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 mb-4"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Back to Leads</span>
          </button>

          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center space-x-3 mb-2">
                <h1 className="text-2xl font-bold text-gray-900">{lead.name}</h1>
                <span
                  className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                    lead.type === "opportunity"
                      ? "bg-purple-100 text-purple-700"
                      : "bg-blue-100 text-blue-700"
                  }`}
                >
                  {lead.type === "opportunity" ? "Opportunity" : "Lead"}
                </span>
                {lead.priority && lead.priority !== "0" && (
                  <span
                    className={`inline-flex px-3 py-1 text-sm font-medium rounded-full ${
                      priorityColors[lead.priority as keyof typeof priorityColors]
                    }`}
                  >
                    {priorityLabels[lead.priority as keyof typeof priorityLabels]}
                  </span>
                )}
              </div>
              <div className="flex items-center space-x-4 text-sm text-gray-600">
                {lead.stage && (
                  <span className="flex items-center">
                    <TrendingUp className="h-4 w-4 mr-1" />
                    {lead.stage.name}
                  </span>
                )}
                {lead.team && (
                  <span className="flex items-center">
                    <User className="h-4 w-4 mr-1" />
                    {lead.team.name}
                  </span>
                )}
              </div>
            </div>

            <div className="flex items-center space-x-3">
              {lead.type === "lead" && (
                <AnimatedButton
                  variant="outline"
                  size="md"
                  onClick={handleConvert}
                  disabled={convertLeadMutation.isPending}
                  className="flex items-center space-x-2 whitespace-nowrap"
                >
                  <Target className="h-4 w-4" />
                  <span>Convert to Opportunity</span>
                </AnimatedButton>
              )}
              <AnimatedButton
                variant="outline"
                size="md"
                onClick={handleWin}
                disabled={winLeadMutation.isPending}
                className="flex items-center space-x-2 text-green-600 hover:bg-green-50"
              >
                <CheckCircle2 className="h-4 w-4" />
                <span>Mark as Won</span>
              </AnimatedButton>
              <AnimatedButton
                variant="outline"
                size="md"
                onClick={handleLose}
                disabled={loseLeadMutation.isPending}
                className="flex items-center space-x-2 text-red-600 hover:bg-red-50"
              >
                <XCircle className="h-4 w-4" />
                <span>Mark as Lost</span>
              </AnimatedButton>
              <Link href={`/crm/leads/${leadId}/edit`}>
                <AnimatedButton
                  variant="primary"
                  size="md"
                  className="flex items-center space-x-2 whitespace-nowrap"
                >
                  <Edit className="h-4 w-4" />
                  <span>Edit</span>
                </AnimatedButton>
              </Link>
              <button className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100">
                <MoreVertical className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex items-center space-x-6 mt-6 border-b border-gray-200">
            <button
              onClick={() => { setActiveTab("overview"); }}
              className={`pb-3 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === "overview"
                  ? "border-blue-600 text-blue-600"
                  : "border-transparent text-gray-600 hover:text-gray-900"
              }`}
            >
              Overview
            </button>
            <button
              onClick={() => { setActiveTab("activities"); }}
              className={`pb-3 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === "activities"
                  ? "border-blue-600 text-blue-600"
                  : "border-transparent text-gray-600 hover:text-gray-900"
              }`}
            >
              Activities
            </button>
            <button
              onClick={() => { setActiveTab("history"); }}
              className={`pb-3 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === "history"
                  ? "border-blue-600 text-blue-600"
                  : "border-transparent text-gray-600 hover:text-gray-900"
              }`}
            >
              History
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto whitespace-nowrap py-8">
        {activeTab === "overview" && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Main Content */}
            <div className="lg:col-span-2 space-y-6">
              {/* Contact Information */}
              <div className="bg-white rounded-lg border border-gray-200 p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Contact Information</h2>
                <div className="grid grid-cols-2 gap-6">
                  {lead.contactName && (
                    <div>
                      <p className="text-sm text-gray-500 mb-1">Contact Name</p>
                      <p className="text-gray-900">{lead.contactName}</p>
                    </div>
                  )}
                  {lead.partnerName && (
                    <div>
                      <p className="text-sm text-gray-500 mb-1">Company</p>
                      <p className="text-gray-900">{lead.partnerName}</p>
                    </div>
                  )}
                  {lead.emailFrom && (
                    <div>
                      <p className="text-sm text-gray-500 mb-1 flex items-center">
                        <Mail className="h-4 w-4 mr-1" />
                        Email
                      </p>
                      <a href={`mailto:${lead.emailFrom}`} className="text-blue-600 hover:underline">
                        {lead.emailFrom}
                      </a>
                    </div>
                  )}
                  {lead.phone && (
                    <div>
                      <p className="text-sm text-gray-500 mb-1 flex items-center">
                        <Phone className="h-4 w-4 mr-1" />
                        Phone
                      </p>
                      <a href={`tel:${lead.phone}`} className="text-blue-600 hover:underline">
                        {lead.phone}
                      </a>
                    </div>
                  )}
                  {lead.website && (
                    <div>
                      <p className="text-sm text-gray-500 mb-1 flex items-center">
                        <Globe className="h-4 w-4 mr-1" />
                        Website
                      </p>
                      <a
                        href={lead.website}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:underline"
                      >
                        {lead.website}
                      </a>
                    </div>
                  )}
                  {lead.function && (
                    <div>
                      <p className="text-sm text-gray-500 mb-1">Job Position</p>
                      <p className="text-gray-900">{lead.function}</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Address */}
              {(lead.street || lead.city || lead.zip) && (
                <div className="bg-white rounded-lg border border-gray-200 p-6">
                  <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                    <MapPin className="h-4 w-4 mr-2" />
                    Address
                  </h2>
                  <div className="text-gray-900">
                    {lead.street && <p>{lead.street}</p>}
                    {lead.street2 && <p>{lead.street2}</p>}
                    <p>{[lead.city, lead.zip].filter(Boolean).join(", ")}</p>
                  </div>
                </div>
              )}

              {/* Description */}
              {lead.description && (
                <div className="bg-white rounded-lg border border-gray-200 p-6">
                  <h2 className="text-lg font-semibold text-gray-900 mb-4">Description</h2>
                  <p className="text-gray-700 whitespace-pre-wrap">{lead.description}</p>
                </div>
              )}
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Sales Information */}
              <div className="bg-white rounded-lg border border-gray-200 p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                  <DollarSign className="h-4 w-4 mr-2" />
                  Sales Information
                </h2>
                <div className="space-y-4">
                  {lead.expectedRevenue !== undefined && (
                    <div>
                      <p className="text-sm text-gray-500 mb-1">Expected Revenue</p>
                      <p className="text-2xl font-bold text-green-600">
                        ${lead.expectedRevenue.toLocaleString()}
                      </p>
                    </div>
                  )}
                  {lead.probability !== undefined && (
                    <div>
                      <p className="text-sm text-gray-500 mb-1">Probability</p>
                      <div className="flex items-center space-x-3">
                        <div className="flex-1 bg-gray-200 rounded-full h-2">
                          <div
                            className="bg-blue-600 h-2 rounded-full"
                            style={{ width: `${lead.probability}%` }}
                          />
                        </div>
                        <span className="text-sm font-medium text-gray-900">{lead.probability}%</span>
                      </div>
                    </div>
                  )}
                  {lead.dateDeadline && (
                    <div>
                      <p className="text-sm text-gray-500 mb-1 flex items-center">
                        <Calendar className="h-4 w-4 mr-1" />
                        Expected Closing
                      </p>
                      <p className="text-gray-900">{new Date(lead.dateDeadline).toLocaleDateString()}</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Assignment */}
              <div className="bg-white rounded-lg border border-gray-200 p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Assignment</h2>
                <div className="space-y-3">
                  {lead.user && (
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-sm font-medium text-blue-700">
                        {lead.user.name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Assigned to</p>
                        <p className="font-medium text-gray-900">{lead.user.name}</p>
                      </div>
                    </div>
                  )}
                  {lead.team && (
                    <div>
                      <p className="text-sm text-gray-500 mb-1">Team</p>
                      <p className="font-medium text-gray-900">{lead.team.name}</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === "activities" && (
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <p className="text-gray-500 text-center py-12">Activities coming soon...</p>
          </div>
        )}

        {activeTab === "history" && (
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <p className="text-gray-500 text-center py-12">History coming soon...</p>
          </div>
        )}
      </div>
    </div>
  );
}
