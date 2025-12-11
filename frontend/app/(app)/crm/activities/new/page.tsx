"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { ActivityForm } from "@/components/crm/activities/ActivityForm";
import { useCreateCrmActivity } from "@/lib/api/hooks";
import { toast } from "react-hot-toast";
import type { ActivityFormData } from "@/lib/api/schemas";

export default function NewActivityPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const createActivityMutation = useCreateCrmActivity();

  // Check if a lead ID was passed as a query param
  const defaultLeadId = searchParams.get("leadId") ? parseInt(searchParams.get("leadId")!) : undefined;

  const handleSubmit = async (data: ActivityFormData) => {
    try {
      await createActivityMutation.mutateAsync(data);
      toast.success("Activity created successfully!");

      // Redirect to activities list or back to lead detail if came from there
      if (defaultLeadId) {
        router.push(`/crm/leads/${defaultLeadId}`);
      } else {
        router.push("/crm/activities");
      }
    } catch (err) {
      toast.error("Failed to create activity. Please try again.");
      console.error("Failed to create activity:", err);
    }
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
            <span>Back</span>
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Create New Activity</h1>
            <p className="text-sm text-gray-600 mt-1">Schedule a new sales activity</p>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto whitespace-nowrap py-8">
        <ActivityForm
          onSubmit={handleSubmit}
          isSubmitting={createActivityMutation.isPending}
          defaultLeadId={defaultLeadId}
        />
      </div>
    </div>
  );
}
