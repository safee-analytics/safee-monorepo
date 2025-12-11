"use client";

import { useEffect } from "react";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { leadFormSchema, type LeadFormData } from "@/lib/api/schemas";
import { useStages, useCrmTeams, useContacts } from "@/lib/api/hooks";
import { Mail, Phone, Globe, MapPin, DollarSign, Calendar, User } from "lucide-react";
import { AnimatedButton } from "@safee/ui";
import type { paths } from "@/lib/api/types";

type LeadResponse = paths["/crm/leads"]["get"]["responses"]["200"]["content"]["application/json"][number];

interface LeadFormProps {
  lead?: LeadResponse;
  onSubmit: (data: LeadFormData) => void;
  isSubmitting?: boolean;
}

export function LeadForm({ lead, onSubmit, isSubmitting = false }: LeadFormProps) {
  const { data: stages } = useStages();
  const { data: teams } = useCrmTeams();
  const { data: contacts } = useContacts();

  const {
    register,
    handleSubmit,
    control,
    setValue,
    formState: { errors },
  } = useForm<LeadFormData>({
    resolver: zodResolver(leadFormSchema),
    defaultValues: lead
      ? {
          name: lead.name,
          type: lead.type as "lead" | "opportunity",
          contactName: lead.contactName || "",
          partnerName: lead.partnerName || "",
          emailFrom: lead.emailFrom || "",
          phone: lead.phone || "",
          website: lead.website || "",
          function: lead.function || "",
          street: lead.street || "",
          street2: lead.street2 || "",
          city: lead.city || "",
          zip: lead.zip || "",
          stageId: lead.stage?.id,
          teamId: lead.team?.id,
          userId: lead.user?.id,
          partnerId: lead.partner?.id,
          expectedRevenue: lead.expectedRevenue,
          probability: lead.probability,
          dateDeadline: lead.dateDeadline || "",
          priority: lead.priority as "0" | "1" | "2" | "3",
          description: lead.description || "",
        }
      : {
          type: "lead",
          priority: "1",
        },
  });

  const selectedPartnerId = useWatch({ control, name: "partnerId" });
  const selectedStageId = useWatch({ control, name: "stageId" });
  const stageId = useWatch({ control, name: "stageId" });

  // Auto-fill from selected contact
  useEffect(() => {
    if (selectedPartnerId && contacts) {
      const selectedContact = contacts.find((c) => c.id === selectedPartnerId);
      if (selectedContact) {
        setValue("partnerName", selectedContact.name);
        setValue("emailFrom", selectedContact.email || "");
        setValue("phone", selectedContact.phone || "");
        setValue("website", selectedContact.website || "");
        setValue("street", selectedContact.street || "");
        setValue("street2", selectedContact.street2 || "");
        setValue("city", selectedContact.city || "");
        setValue("zip", selectedContact.zip || "");
      }
    }
  }, [selectedPartnerId, contacts, setValue]);

  // Auto-fill probability based on stage
  useEffect(() => {
    if (selectedStageId && stages) {
      const selectedStage = stages.find((s) => s.id === selectedStageId);
      if (selectedStage?.isWon) {
        setValue("probability", 100);
      }
    }
  }, [selectedStageId, stages, setValue]);

  // Default stage for new leads
  useEffect(() => {
    if (!lead && stages && stages.length > 0 && !stageId) {
      const firstStage = [...stages].sort((a, b) => (a.sequence || 0) - (b.sequence || 0))[0];
      if (firstStage) {
        setValue("stageId", firstStage.id);
      }
    }
  }, [lead, stages, setValue, stageId]);

  return (
    <form
      onSubmit={(event) => {
        void handleSubmit((data) => {
          onSubmit(data);
        })(event);
      }}
      className="space-y-8"
    >
      {/* Basic Information */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Basic Information</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Lead Name <span className="text-red-500">*</span>
            </label>
            <input
              {...register("name")}
              type="text"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Enter lead name"
            />
            {errors.name && <p className="mt-1 text-sm text-red-600">{errors.name.message}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Type</label>
            <select
              {...register("type")}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="lead">Lead</option>
              <option value="opportunity">Opportunity</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Priority</label>
            <select
              {...register("priority")}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="0">Low</option>
              <option value="1">Normal</option>
              <option value="2">High</option>
              <option value="3">Urgent</option>
            </select>
          </div>
        </div>
      </div>

      {/* Contact Information */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
          <User className="h-5 w-5 mr-2" />
          Contact Information
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Select Contact (Auto-fill)</label>
            <select
              {...register("partnerId", { valueAsNumber: true })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">No Contact Selected</option>
              {contacts?.map((contact) => (
                <option key={contact.id} value={contact.id}>
                  {contact.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Contact Name</label>
            <input
              {...register("contactName")}
              type="text"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Contact person name"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Company Name</label>
            <input
              {...register("partnerName")}
              type="text"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Company or partner name"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center">
              <Mail className="h-4 w-4 mr-1" />
              Email
            </label>
            <input
              {...register("emailFrom")}
              type="email"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="email@example.com"
            />
            {errors.emailFrom && <p className="mt-1 text-sm text-red-600">{errors.emailFrom.message}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center">
              <Phone className="h-4 w-4 mr-1" />
              Phone
            </label>
            <input
              {...register("phone")}
              type="tel"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="+1 (555) 123-4567"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center">
              <Globe className="h-4 w-4 mr-1" />
              Website
            </label>
            <input
              {...register("website")}
              type="url"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="https://example.com"
            />
            {errors.website && <p className="mt-1 text-sm text-red-600">{errors.website.message}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Job Position</label>
            <input
              {...register("function")}
              type="text"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="CEO, Manager, etc."
            />
          </div>
        </div>
      </div>

      {/* Address */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
          <MapPin className="h-5 w-5 mr-2" />
          Address
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-2">Street</label>
            <input
              {...register("street")}
              type="text"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="123 Main Street"
            />
          </div>

          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-2">Street 2</label>
            <input
              {...register("street2")}
              type="text"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Apt, Suite, Building"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">City</label>
            <input
              {...register("city")}
              type="text"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="City"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">ZIP Code</label>
            <input
              {...register("zip")}
              type="text"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="12345"
            />
          </div>
        </div>
      </div>

      {/* Sales Information */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
          <DollarSign className="h-5 w-5 mr-2" />
          Sales Information
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Stage</label>
            <select
              {...register("stageId", { valueAsNumber: true })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">Select Stage</option>
              {stages
                ?.sort((a, b) => (a.sequence || 0) - (b.sequence || 0))
                .map((stage) => (
                  <option key={stage.id} value={stage.id}>
                    {stage.name}
                  </option>
                ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Team</label>
            <select
              {...register("teamId", { valueAsNumber: true })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">No Team</option>
              {teams?.map((team) => (
                <option key={team.id} value={team.id}>
                  {team.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Expected Revenue</label>
            <input
              {...register("expectedRevenue", { valueAsNumber: true })}
              type="number"
              step="0.01"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="0.00"
            />
            {errors.expectedRevenue && (
              <p className="mt-1 text-sm text-red-600">{errors.expectedRevenue.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Probability (%)</label>
            <input
              {...register("probability", { valueAsNumber: true })}
              type="number"
              min="0"
              max="100"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="50"
            />
            {errors.probability && <p className="mt-1 text-sm text-red-600">{errors.probability.message}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center">
              <Calendar className="h-4 w-4 mr-1" />
              Expected Closing Date
            </label>
            <input
              {...register("dateDeadline")}
              type="date"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>
      </div>

      {/* Description */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Description</h2>
        <textarea
          {...register("description")}
          rows={4}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          placeholder="Add any additional notes or description..."
        />
      </div>

      {/* Form Actions */}
      <div className="flex items-center justify-end space-x-4">
        <AnimatedButton
          type="button"
          variant="secondary"
          onClick={() => {
            window.history.back();
          }}
        >
          Cancel
        </AnimatedButton>
        <AnimatedButton type="submit" variant="primary" disabled={isSubmitting}>
          {isSubmitting ? "Saving..." : lead ? "Update Lead" : "Create Lead"}
        </AnimatedButton>
      </div>
    </form>
  );
}
