"use client";

import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { ContactForm } from "@/components/crm/contacts/ContactForm";
import { useCreateContact } from "@/lib/api/hooks";
import { toast } from "react-hot-toast";
import type { ContactFormData } from "@/lib/api/schemas";

export default function NewContactPage() {
  const router = useRouter();
  const createContactMutation = useCreateContact();

  const handleSubmit = async (data: ContactFormData) => {
    try {
      await createContactMutation.mutateAsync(data as any);
      toast.success("Contact created successfully!");
      router.push("/crm/contacts");
    } catch (error) {
      toast.error("Failed to create contact. Please try again.");
      console.error("Failed to create contact:", error);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="sticky top-[57px] z-30 bg-white border-b border-gray-200">
        <div className="whitespace-nowrap py-4">
          <button
            onClick={() => router.back()}
            className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 mb-4"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Back to Contacts</span>
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Create New Contact</h1>
            <p className="text-sm text-gray-600 mt-1">Add a new contact to your CRM</p>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto whitespace-nowrap py-8">
        <ContactForm onSubmit={handleSubmit} isSubmitting={createContactMutation.isPending} />
      </div>
    </div>
  );
}
