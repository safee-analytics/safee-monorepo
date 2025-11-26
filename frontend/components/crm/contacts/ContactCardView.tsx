"use client";

import Link from "next/link";
import { Mail, Phone, MapPin, Building2, User, Package } from "lucide-react";
import { motion } from "framer-motion";
import type { paths } from "@/lib/api/types";

type ContactResponse =
  paths["/crm/contacts"]["get"]["responses"]["200"]["content"]["application/json"][number];

interface ContactCardViewProps {
  contacts: ContactResponse[];
}

export function ContactCardView({ contacts }: ContactCardViewProps) {
  if (contacts.length === 0) {
    return (
      <div className="text-center py-20">
        <User className="h-16 w-16 text-gray-300 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-gray-900 mb-2">No contacts yet</h3>
        <p className="text-gray-500 mb-6">
          Get started by creating your first contact or click Refresh to load existing contacts.
        </p>
        <Link
          href="/crm/contacts/new"
          className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <User className="h-4 w-4 mr-2" />
          Create First Contact
        </Link>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
      {contacts.map((contact, index) => (
        <motion.div
          key={contact.id}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2, delay: index * 0.03 }}
        >
          <Link href={`/crm/contacts/${contact.id}`}>
            <div className="bg-white rounded-xl border border-gray-200 p-6 hover:shadow-lg hover:border-gray-300 transition-all group h-full flex flex-col">
              {/* Avatar and Name */}
              <div className="flex items-start space-x-3 mb-4">
                <div
                  className={`w-12 h-12 rounded-full flex items-center justify-center text-lg font-medium flex-shrink-0 ${
                    contact.isCompany
                      ? "bg-purple-100 text-purple-700"
                      : "bg-blue-100 text-blue-700"
                  }`}
                >
                  {contact.isCompany ? (
                    <Building2 className="h-6 w-6" />
                  ) : (
                    contact.name.charAt(0).toUpperCase()
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-gray-900 truncate group-hover:text-blue-600 transition-colors">
                    {contact.name}
                  </h3>
                  {contact.function && (
                    <p className="text-sm text-gray-500 truncate">{contact.function}</p>
                  )}
                </div>
              </div>

              {/* Type Badge */}
              <div className="mb-3">
                <span
                  className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${
                    contact.isCompany
                      ? "bg-purple-100 text-purple-700"
                      : "bg-blue-100 text-blue-700"
                  }`}
                >
                  {contact.isCompany ? (
                    <>
                      <Building2 className="h-3 w-3 mr-1" />
                      Company
                    </>
                  ) : (
                    <>
                      <User className="h-3 w-3 mr-1" />
                      Individual
                    </>
                  )}
                </span>
              </div>

              {/* Contact Info */}
              <div className="space-y-2 mb-4 flex-1">
                {contact.email && (
                  <div className="flex items-center text-sm text-gray-600">
                    <Mail className="h-4 w-4 mr-2 text-gray-400 flex-shrink-0" />
                    <span className="truncate">{contact.email}</span>
                  </div>
                )}
                {contact.phone && (
                  <div className="flex items-center text-sm text-gray-600">
                    <Phone className="h-4 w-4 mr-2 text-gray-400 flex-shrink-0" />
                    <span className="truncate">{contact.phone}</span>
                  </div>
                )}
                {(contact.city || contact.country) && (
                  <div className="flex items-center text-sm text-gray-600">
                    <MapPin className="h-4 w-4 mr-2 text-gray-400 flex-shrink-0" />
                    <span className="truncate">
                      {[contact.city, contact.country?.name].filter(Boolean).join(", ")}
                    </span>
                  </div>
                )}
              </div>

              {/* Roles and Tags */}
              <div className="pt-3 border-t border-gray-100">
                <div className="flex flex-wrap gap-2">
                  {contact.isCustomer && (
                    <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-green-100 text-green-700">
                      <Package className="h-3 w-3 mr-1" />
                      Customer
                    </span>
                  )}
                  {contact.isSupplier && (
                    <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-orange-100 text-orange-700">
                      <Package className="h-3 w-3 mr-1" />
                      Supplier
                    </span>
                  )}
                  {contact.industry && (
                    <span className="inline-flex px-2 py-1 text-xs text-gray-600 bg-gray-100 rounded">
                      {contact.industry.name}
                    </span>
                  )}
                </div>
              </div>
            </div>
          </Link>
        </motion.div>
      ))}
    </div>
  );
}
