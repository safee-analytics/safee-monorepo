"use client";

import { useState } from "react";
import Link from "next/link";
import { Plus, Filter, Download, RefreshCw, Users, Grid3x3, List } from "lucide-react";
import { ContactTableView } from "@/components/crm/contacts/ContactTableView";
import { ContactCardView } from "@/components/crm/contacts/ContactCardView";
import { useContacts, useSyncCRM } from "@/lib/api/hooks";
import { useCrmStore } from "@/stores/useCrmStore";
import { AnimatedButton } from "@safee/ui";

export default function ContactsPage() {
  const { contactFilters, setContactFilters } = useCrmStore();
  const [showFilters, setShowFilters] = useState(false);
  const [viewMode, setViewMode] = useState<"card" | "table">("card");

  const { data: contacts, isLoading } = useContacts(contactFilters);
  const syncMutation = useSyncCRM();

  const handleSync = async () => {
    try {
      await syncMutation.mutateAsync("contacts");
    } catch (error) {
      console.error("Failed to sync contacts:", error);
    }
  };

  const handleTypeFilter = (filterType: "all" | "companies" | "individuals" | "customers" | "suppliers") => {
    switch (filterType) {
      case "all":
        setContactFilters({});
        break;
      case "companies":
        setContactFilters({ isCompany: true });
        break;
      case "individuals":
        setContactFilters({ isCompany: false });
        break;
      case "customers":
        setContactFilters({ isCustomer: true });
        break;
      case "suppliers":
        setContactFilters({ isSupplier: true });
        break;
    }
  };

  const activeFilterType =
    contactFilters.isCompany === true
      ? "companies"
      : contactFilters.isCompany === false
        ? "individuals"
        : contactFilters.isCustomer
          ? "customers"
          : contactFilters.isSupplier
            ? "suppliers"
            : "all";

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="sticky top-[57px] z-30 bg-white border-b border-gray-200">
        <div className="px-6 py-4">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Contacts</h1>
              <p className="text-sm text-gray-600 mt-1">Manage customers, suppliers, and business contacts</p>
            </div>
            <div className="flex items-center space-x-3">
              <AnimatedButton
                onClick={handleSync}
                variant="outline"
                size="md"
                disabled={syncMutation.isPending}
                className="flex items-center space-x-2 whitespace-nowrap"
              >
                <RefreshCw className={`h-4 w-4 ${syncMutation.isPending ? "animate-spin" : ""}`} />
                <span>Refresh</span>
              </AnimatedButton>
              <Link href="/crm/contacts/new">
                <AnimatedButton
                  variant="primary"
                  size="md"
                  className="flex items-center space-x-2 whitespace-nowrap"
                >
                  <Plus className="h-4 w-4" />
                  <span>New Contact</span>
                </AnimatedButton>
              </Link>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <button
                onClick={() => handleTypeFilter("all")}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                  activeFilterType === "all" ? "bg-blue-100 text-blue-700" : "text-gray-600 hover:bg-gray-100"
                }`}
              >
                All
              </button>
              <button
                onClick={() => handleTypeFilter("companies")}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                  activeFilterType === "companies"
                    ? "bg-blue-100 text-blue-700"
                    : "text-gray-600 hover:bg-gray-100"
                }`}
              >
                Companies
              </button>
              <button
                onClick={() => handleTypeFilter("individuals")}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                  activeFilterType === "individuals"
                    ? "bg-blue-100 text-blue-700"
                    : "text-gray-600 hover:bg-gray-100"
                }`}
              >
                Individuals
              </button>
              <button
                onClick={() => handleTypeFilter("customers")}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                  activeFilterType === "customers"
                    ? "bg-blue-100 text-blue-700"
                    : "text-gray-600 hover:bg-gray-100"
                }`}
              >
                Customers
              </button>
              <button
                onClick={() => handleTypeFilter("suppliers")}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                  activeFilterType === "suppliers"
                    ? "bg-blue-100 text-blue-700"
                    : "text-gray-600 hover:bg-gray-100"
                }`}
              >
                Suppliers
              </button>
            </div>

            <div className="flex items-center space-x-3">
              {/* View Toggle */}
              <div className="flex items-center bg-gray-100 rounded-lg p-1">
                <button
                  onClick={() => setViewMode("card")}
                  className={`p-1.5 rounded transition-colors ${
                    viewMode === "card"
                      ? "bg-white text-blue-600 shadow-sm"
                      : "text-gray-600 hover:text-gray-900"
                  }`}
                  title="Card view"
                >
                  <Grid3x3 className="h-4 w-4" />
                </button>
                <button
                  onClick={() => setViewMode("table")}
                  className={`p-1.5 rounded transition-colors ${
                    viewMode === "table"
                      ? "bg-white text-blue-600 shadow-sm"
                      : "text-gray-600 hover:text-gray-900"
                  }`}
                  title="Table view"
                >
                  <List className="h-4 w-4" />
                </button>
              </div>

              <button
                onClick={() => setShowFilters(!showFilters)}
                className="flex items-center space-x-2 px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <Filter className="h-4 w-4" />
                <span>More Filters</span>
              </button>
              <button className="flex items-center space-x-2 px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg transition-colors">
                <Download className="h-4 w-4" />
                <span>Export</span>
              </button>
            </div>
          </div>

          {showFilters && (
            <div className="mt-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
              <div className="flex items-center justify-between">
                <p className="text-sm text-gray-600">Advanced filters coming soon...</p>
                <button
                  onClick={() => {
                    setContactFilters({});
                    setShowFilters(false);
                  }}
                  className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-200 rounded-lg transition-colors"
                >
                  Clear Filters
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="px-6 py-6">
        {isLoading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" />
          </div>
        ) : contacts && contacts.length > 0 ? (
          viewMode === "card" ? (
            <ContactCardView contacts={contacts} />
          ) : (
            <ContactTableView contacts={contacts} />
          )
        ) : (
          <div className="text-center py-20">
            <Users className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No contacts yet</h3>
            <p className="text-gray-500 mb-6">
              Get started by creating your first contact or click Refresh to load existing contacts.
            </p>
            <Link href="/crm/contacts/new">
              <AnimatedButton
                variant="primary"
                size="md"
                className="inline-flex items-center space-x-2 whitespace-nowrap"
              >
                <Plus className="h-4 w-4" />
                <span>Create First Contact</span>
              </AnimatedButton>
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
