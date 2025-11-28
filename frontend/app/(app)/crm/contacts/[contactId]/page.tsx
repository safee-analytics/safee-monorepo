"use client";

import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Edit,
  Building2,
  User,
  Mail,
  Phone,
  Globe,
  MapPin,
  Package,
  Briefcase,
} from "lucide-react";
import { useContact, useLeads } from "@/lib/api/hooks";
import { AnimatedButton } from "@safee/ui";

export default function ContactDetailPage() {
  const params = useParams();
  const router = useRouter();
  const contactId = parseInt(params.contactId as string);

  const { data: contact, isLoading: contactLoading } = useContact(contactId);
  const { data: relatedLeads, isLoading: leadsLoading } = useLeads({ partnerId: contactId });

  if (contactLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" />
      </div>
    );
  }

  if (!contact) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <User className="h-16 w-16 text-gray-300 mb-4" />
        <h2 className="text-xl font-semibold text-gray-900 mb-2">Contact Not Found</h2>
        <p className="text-gray-600 mb-4">The contact you&apos;re looking for doesn&apos;t exist.</p>
        <Link href="/crm/contacts">
          <AnimatedButton variant="primary">Back to Contacts</AnimatedButton>
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="sticky top-[57px] z-30 bg-white border-b border-gray-200">
        <div className="whitespace-nowrap py-4">
          <button
            onClick={() => router.back()}
            className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 mb-4"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Back to Contacts</span>
          </button>

          <div className="flex items-start justify-between">
            <div className="flex items-center space-x-4">
              <div
                className={`w-16 h-16 rounded-full flex items-center justify-center text-xl font-medium ${
                  contact.isCompany ? "bg-purple-100 text-purple-700" : "bg-blue-100 text-blue-700"
                }`}
              >
                {contact.isCompany ? <Building2 className="h-8 w-8" /> : contact.name.charAt(0).toUpperCase()}
              </div>
              <div>
                <div className="flex items-center space-x-3 mb-2">
                  <h1 className="text-2xl font-bold text-gray-900">{contact.name}</h1>
                  <span
                    className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                      contact.isCompany ? "bg-purple-100 text-purple-700" : "bg-blue-100 text-blue-700"
                    }`}
                  >
                    {contact.isCompany ? "Company" : "Individual"}
                  </span>
                </div>
                <div className="flex items-center space-x-4 text-sm text-gray-600">
                  {contact.function && (
                    <span className="flex items-center">
                      <Briefcase className="h-4 w-4 mr-1" />
                      {contact.function}
                    </span>
                  )}
                  <div className="flex space-x-2">
                    {contact.isCustomer && (
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-700">
                        <Package className="h-3 w-3 mr-1" />
                        Customer
                      </span>
                    )}
                    {contact.isSupplier && (
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-orange-100 text-orange-700">
                        <Package className="h-3 w-3 mr-1" />
                        Supplier
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>

            <Link href={`/crm/contacts/${contactId}/edit`}>
              <AnimatedButton
                variant="primary"
                size="md"
                className="flex items-center space-x-2 whitespace-nowrap"
              >
                <Edit className="h-4 w-4" />
                <span>Edit</span>
              </AnimatedButton>
            </Link>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto whitespace-nowrap py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Contact Information */}
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Contact Information</h2>
              <div className="grid grid-cols-2 gap-6">
                {contact.email && (
                  <div>
                    <p className="text-sm text-gray-500 mb-1 flex items-center">
                      <Mail className="h-4 w-4 mr-1" />
                      Email
                    </p>
                    <a href={`mailto:${contact.email}`} className="text-blue-600 hover:underline">
                      {contact.email}
                    </a>
                  </div>
                )}
                {contact.phone && (
                  <div>
                    <p className="text-sm text-gray-500 mb-1 flex items-center">
                      <Phone className="h-4 w-4 mr-1" />
                      Phone
                    </p>
                    <a href={`tel:${contact.phone}`} className="text-blue-600 hover:underline">
                      {contact.phone}
                    </a>
                  </div>
                )}
                {contact.mobile && (
                  <div>
                    <p className="text-sm text-gray-500 mb-1 flex items-center">
                      <Phone className="h-4 w-4 mr-1" />
                      Mobile
                    </p>
                    <a href={`tel:${contact.mobile}`} className="text-blue-600 hover:underline">
                      {contact.mobile}
                    </a>
                  </div>
                )}
                {contact.website && (
                  <div>
                    <p className="text-sm text-gray-500 mb-1 flex items-center">
                      <Globe className="h-4 w-4 mr-1" />
                      Website
                    </p>
                    <a
                      href={contact.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:underline"
                    >
                      {contact.website}
                    </a>
                  </div>
                )}
              </div>
            </div>

            {/* Address */}
            {(contact.street || contact.city) && (
              <div className="bg-white rounded-lg border border-gray-200 p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                  <MapPin className="h-4 w-4 mr-2" />
                  Address
                </h2>
                <div className="text-gray-900">
                  {contact.street && <p>{contact.street}</p>}
                  {contact.street2 && <p>{contact.street2}</p>}
                  <p>{[contact.city, contact.zip].filter(Boolean).join(", ")}</p>
                  {contact.country && <p>{contact.country.name}</p>}
                </div>
              </div>
            )}

            {/* Related Leads */}
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Related Leads</h2>
              {leadsLoading ? (
                <p className="text-sm text-gray-500">Loading...</p>
              ) : relatedLeads && relatedLeads.length > 0 ? (
                <div className="space-y-3">
                  {relatedLeads.map((lead) => (
                    <Link
                      key={lead.id}
                      href={`/crm/leads/${lead.id}`}
                      className="block p-4 border border-gray-100 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="font-medium text-gray-900">{lead.name}</h3>
                          <p className="text-sm text-gray-500 mt-1">Stage: {lead.stage?.name || "N/A"}</p>
                        </div>
                        {lead.expectedRevenue && (
                          <p className="text-lg font-bold text-green-600">
                            ${lead.expectedRevenue.toLocaleString()}
                          </p>
                        )}
                      </div>
                    </Link>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-gray-500 text-center py-8">
                  No leads associated with this contact
                </p>
              )}
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Details */}
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Details</h2>
              <div className="space-y-3">
                {contact.vat && (
                  <div>
                    <p className="text-sm text-gray-500 mb-1">VAT Number</p>
                    <p className="text-gray-900">{contact.vat}</p>
                  </div>
                )}
                {contact.industry && (
                  <div>
                    <p className="text-sm text-gray-500 mb-1">Industry</p>
                    <p className="text-gray-900">{contact.industry.name}</p>
                  </div>
                )}
                {contact.ref && (
                  <div>
                    <p className="text-sm text-gray-500 mb-1">Reference</p>
                    <p className="text-gray-900">{contact.ref}</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
