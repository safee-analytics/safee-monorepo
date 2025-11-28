"use client";

import { useParams, useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { ContactForm } from "@/components/crm/contacts/ContactForm";
import { useContact, useUpdateContact } from "@/lib/api/hooks";
import { toast } from "react-hot-toast";
import type { ContactFormData } from "@/lib/api/schemas";

export default function EditContactPage() {
  const params = useParams();
  const router = useRouter();
  const contactId = parseInt(params.contactId as string);

  const { data: contact, isLoading } = useContact(contactId);
  const updateContactMutation = useUpdateContact();

  const handleSubmit = async (data: ContactFormData) => {
    try {
      await updateContactMutation.mutateAsync({ contactId, data });
      toast.success("Contact updated successfully!");
      router.push(`/crm/contacts/${contactId}`);
    } catch (error) {
      toast.error("Failed to update contact. Please try again.");
      console.error("Failed to update contact:", error);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" />
      </div>
    );
  }

  if (!contact) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <h2 className="text-xl font-semibold text-gray-900 mb-2">Contact Not Found</h2>
        <p className="text-gray-600">The contact you&apos;re trying to edit doesn&apos;t exist.</p>
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
            <span>Back to Contact</span>
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Edit Contact</h1>
            <p className="text-sm text-gray-600 mt-1">Update contact information</p>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto whitespace-nowrap py-8">
        <ContactForm
          contact={contact}
          onSubmit={handleSubmit}
          isSubmitting={updateContactMutation.isPending}
        />
      </div>
    </div>
  );
}
