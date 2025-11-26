"use client";

import { useParams, useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { LeadForm } from "@/components/crm/leads/LeadForm";
import { useLead, useUpdateLead } from "@/lib/api/hooks";
import { toast } from "react-hot-toast";
import type { LeadFormData } from "@/lib/api/schemas";

export default function EditLeadPage() {
  const params = useParams();
  const router = useRouter();
  const leadId = parseInt(params.leadId as string);

  const { data: lead, isLoading } = useLead(leadId);
  const updateLeadMutation = useUpdateLead();

  const handleSubmit = async (data: LeadFormData) => {
    try {
      await updateLeadMutation.mutateAsync({ leadId, data: data as any });
      toast.success("Lead updated successfully!");
      router.push(`/crm/leads/${leadId}`);
    } catch (error) {
      toast.error("Failed to update lead. Please try again.");
      console.error("Failed to update lead:", error);
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
        <h2 className="text-xl font-semibold text-gray-900 mb-2">Lead Not Found</h2>
        <p className="text-gray-600">The lead you're trying to edit doesn't exist.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="sticky top-[57px] z-30 bg-white border-b border-gray-200">
        <div className="whitespace-nowrap py-4">
          <button
            onClick={() => router.back()}
            className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 mb-4"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Back to Lead</span>
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Edit Lead</h1>
            <p className="text-sm text-gray-600 mt-1">Update lead information</p>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto whitespace-nowrap py-8">
        <LeadForm
          lead={lead}
          onSubmit={handleSubmit}
          isSubmitting={updateLeadMutation.isPending}
        />
      </div>
    </div>
  );
}
