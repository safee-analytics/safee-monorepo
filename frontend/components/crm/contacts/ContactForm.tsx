"use client";

import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { contactFormSchema, type ContactFormData } from "@/lib/api/schemas";
import { Building2, Mail, Phone, Globe, MapPin, Briefcase } from "lucide-react";
import { AnimatedButton } from "@safee/ui";
import type { paths } from "@/lib/api/types";

type ContactResponse =
  paths["/crm/contacts"]["get"]["responses"]["200"]["content"]["application/json"][number];

interface ContactFormProps {
  contact?: ContactResponse;
  onSubmit: (data: ContactFormData) => void;
  isSubmitting?: boolean;
}

export function ContactForm({ contact, onSubmit, isSubmitting = false }: ContactFormProps) {
  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
  } = useForm<ContactFormData>({
    resolver: zodResolver(contactFormSchema),
    defaultValues: contact
      ? {
          name: contact.name,
          isCompany: contact.isCompany || false,
          email: contact.email || "",
          phone: contact.phone || "",
          mobile: contact.mobile || "",
          website: contact.website || "",
          street: contact.street || "",
          street2: contact.street2 || "",
          city: contact.city || "",
          zip: contact.zip || "",
          function: contact.function || "",
          vat: contact.vat || "",
        }
      : {
          isCompany: false,
        },
  });

  const isCompany = useWatch({ control, name: "isCompany" });

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
              Name <span className="text-red-500">*</span>
            </label>
            <input
              {...register("name")}
              type="text"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder={isCompany ? "Company name" : "Contact name"}
            />
            {errors.name && <p className="mt-1 text-sm text-red-600">{errors.name.message}</p>}
          </div>

          <div className="md:col-span-2">
            <label className="flex items-center space-x-3">
              <input
                {...register("isCompany")}
                type="checkbox"
                className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              />
              <span className="text-sm font-medium text-gray-700 flex items-center">
                <Building2 className="h-4 w-4 mr-1" />
                This is a company
              </span>
            </label>
          </div>

          {!isCompany && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center">
                <Briefcase className="h-4 w-4 mr-1" />
                Job Position
              </label>
              <input
                {...register("function")}
                type="text"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="CEO, Manager, Developer, etc."
              />
            </div>
          )}

          {isCompany && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">VAT Number</label>
              <input
                {...register("vat")}
                type="text"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Tax ID / VAT Number"
              />
            </div>
          )}
        </div>
      </div>

      {/* Contact Methods */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Contact Methods</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center">
              <Mail className="h-4 w-4 mr-1" />
              Email
            </label>
            <input
              {...register("email")}
              type="email"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="contact@example.com"
            />
            {errors.email && <p className="mt-1 text-sm text-red-600">{errors.email.message}</p>}
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
              <Phone className="h-4 w-4 mr-1" />
              Mobile
            </label>
            <input
              {...register("mobile")}
              type="tel"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="+1 (555) 987-6543"
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
            <label className="block text-sm font-medium text-gray-700 mb-2">Street 2 (Optional)</label>
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
          {isSubmitting ? "Saving..." : contact ? "Update Contact" : "Create Contact"}
        </AnimatedButton>
      </div>
    </form>
  );
}
