"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowUpDown, Mail, Phone, MapPin, Building2, User, Package } from "lucide-react";
import type { paths } from "@/lib/api/types";

type ContactResponse =
  paths["/crm/contacts"]["get"]["responses"]["200"]["content"]["application/json"][number];

interface ContactTableViewProps {
  contacts: ContactResponse[];
}

type SortField = "name" | "email" | "city" | "isCompany";
type SortDirection = "asc" | "desc";

function SortButton({
  field,
  sortField,
  handleSort,
  children,
}: {
  field: SortField;
  sortField: SortField;
  handleSort: (field: SortField) => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={() => {
        handleSort(field);
      }}
      className="flex items-center space-x-1 hover:text-gray-900 transition-colors"
    >
      <span>{children}</span>
      <ArrowUpDown className={`h-4 w-4 ${sortField === field ? "text-blue-600" : "text-gray-400"}`} />
    </button>
  );
}

export function ContactTableView({ contacts }: ContactTableViewProps) {
  const [sortField, setSortField] = useState<SortField>("name");
  const [sortDirection, setSortDirection] = useState<SortDirection>("asc");

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
  };

  const sortedContacts = [...contacts].sort((a, b) => {
    let aValue: string | boolean | undefined;
    let bValue: string | boolean | undefined;

    switch (sortField) {
      case "name":
        aValue = a.name.toLowerCase();
        bValue = b.name.toLowerCase();
        break;
      case "email":
        aValue = a.email?.toLowerCase() || "";
        bValue = b.email?.toLowerCase() || "";
        break;
      case "city":
        aValue = a.city?.toLowerCase() || "";
        bValue = b.city?.toLowerCase() || "";
        break;
      case "isCompany":
        aValue = a.isCompany || false;
        bValue = b.isCompany || false;
        break;
    }

    if (aValue === undefined || aValue === "") return 1;
    if (bValue === undefined || bValue === "") return -1;

    if (aValue < bValue) return sortDirection === "asc" ? -1 : 1;
    if (aValue > bValue) return sortDirection === "asc" ? 1 : -1;
    return 0;
  });

  return (
    <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                <SortButton field="name" sortField={sortField} handleSort={handleSort}>
                  Name
                </SortButton>
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                <SortButton field="isCompany" sortField={sortField} handleSort={handleSort}>
                  Type
                </SortButton>
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                <SortButton field="email" sortField={sortField} handleSort={handleSort}>
                  Contact Info
                </SortButton>
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                <SortButton field="city" sortField={sortField} handleSort={handleSort}>
                  Location
                </SortButton>
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Role
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Tags
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {sortedContacts.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-6 py-12 text-center">
                  <User className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-500">No contacts found</p>
                  <Link
                    href="/crm/contacts/new"
                    className="text-blue-600 hover:underline text-sm mt-2 inline-block"
                  >
                    Create your first contact
                  </Link>
                </td>
              </tr>
            ) : (
              sortedContacts.map((contact) => (
                <tr key={contact.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4">
                    <Link href={`/crm/contacts/${contact.id}`} className="flex items-center space-x-3">
                      <div
                        className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-medium ${
                          contact.isCompany ? "bg-purple-100 text-purple-700" : "bg-blue-100 text-blue-700"
                        }`}
                      >
                        {contact.isCompany ? (
                          <Building2 className="h-5 w-5" />
                        ) : (
                          contact.name.charAt(0).toUpperCase()
                        )}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-blue-600 hover:underline">{contact.name}</p>
                        {contact.function && <p className="text-xs text-gray-500">{contact.function}</p>}
                      </div>
                    </Link>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        contact.isCompany ? "bg-purple-100 text-purple-700" : "bg-blue-100 text-blue-700"
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
                  </td>
                  <td className="px-6 py-4">
                    <div className="space-y-1">
                      {contact.email && (
                        <div className="flex items-center text-sm text-gray-600">
                          <Mail className="h-3 w-3 mr-2 text-gray-400" />
                          <a
                            href={`mailto:${contact.email}`}
                            className="hover:text-blue-600 truncate max-w-[200px]"
                          >
                            {contact.email}
                          </a>
                        </div>
                      )}
                      {contact.phone && (
                        <div className="flex items-center text-sm text-gray-600">
                          <Phone className="h-3 w-3 mr-2 text-gray-400" />
                          <a href={`tel:${contact.phone}`} className="hover:text-blue-600">
                            {contact.phone}
                          </a>
                        </div>
                      )}
                      {!contact.email && !contact.phone && <span className="text-sm text-gray-400">-</span>}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    {contact.city || contact.country ? (
                      <div className="flex items-center text-sm text-gray-600">
                        <MapPin className="h-4 w-4 mr-1 text-gray-400" />
                        <span>{[contact.city, contact.country?.name].filter(Boolean).join(", ")}</span>
                      </div>
                    ) : (
                      <span className="text-sm text-gray-400">-</span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex flex-wrap gap-1">
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
                      {!contact.isCustomer && !contact.isSupplier && (
                        <span className="text-sm text-gray-400">-</span>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    {contact.industry ? (
                      <span className="inline-flex px-2 py-1 text-xs text-gray-600 bg-gray-100 rounded">
                        {contact.industry.name}
                      </span>
                    ) : (
                      <span className="text-sm text-gray-400">-</span>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
