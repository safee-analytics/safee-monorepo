"use client";

import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { LeadForm } from "@/components/crm/leads/LeadForm";
import { useCreateLead } from "@/lib/api/hooks";
import { toast } from "react-hot-toast";
import type { LeadFormData } from "@/lib/api/schemas";

export default function NewLeadPage() {
  const router = useRouter();
  const createLeadMutation = useCreateLead();

  const handleSubmit = (data: LeadFormData) => {
    void (async () => {
      try {
        await createLeadMutation.mutateAsync(data);
        toast.success("Lead created successfully!");
        router.push("/crm/leads");
      } catch (err) {
        toast.error("Failed to create lead. Please try again.");
        console.error("Failed to create lead:", err);
      }
    })();
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="sticky top-[57px] z-30 bg-white border-b border-gray-200">
        <div className="whitespace-nowrap py-4">
          <button
            onClick={() => { router.back(); }}
            className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 mb-4"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Back to Leads</span>
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Create New Lead</h1>
            <p className="text-sm text-gray-600 mt-1">Add a new lead to your sales pipeline</p>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto whitespace-nowrap py-8">
        <LeadForm onSubmit={handleSubmit} isSubmitting={createLeadMutation.isPending} />
      </div>
    </div>
  );
}
