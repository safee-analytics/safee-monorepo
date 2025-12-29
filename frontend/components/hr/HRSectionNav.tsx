"use client";

import { useAccessibleHRSections } from "@/lib/api/hooks";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { User, Users, Building2, DollarSign, Calendar, FileText, Briefcase } from "lucide-react";

// Icon mapping for HR sections
const sectionIcons: Record<string, React.ComponentType<{ className?: string }>> = {
  "my-info": User,
  "my-time-off": Calendar,
  "my-payslips": DollarSign,
  "my-documents": FileText,
  employees: Users,
  departments: Building2,
  payroll: DollarSign,
  "time-off-approvals": Calendar,
  contracts: Briefcase,
};

export function HRSectionNav() {
  const { data: sections, isLoading } = useAccessibleHRSections();
  const pathname = usePathname();

  if (isLoading) {
    return (
      <nav className="space-y-6 p-4">
        {/* Loading skeleton */}
        {[1, 2].map((i) => (
          <div key={i} className="space-y-2">
            <div className="h-4 w-32 bg-gray-200 dark:bg-gray-700 rounded animate-pulse mb-3" />
            {[1, 2, 3].map((j) => (
              <div key={j} className="h-10 bg-gray-100 dark:bg-gray-800 rounded animate-pulse" />
            ))}
          </div>
        ))}
      </nav>
    );
  }

  if (!sections || sections.length === 0) {
    return (
      <nav className="p-4">
        <p className="text-sm text-gray-500 dark:text-gray-400">No HR sections available</p>
      </nav>
    );
  }

  const selfServiceSections = sections.filter((s) => s.sectionType === "self_service");
  const managementSections = sections.filter((s) => s.sectionType === "management");

  return (
    <nav className="space-y-6 p-4">
      {/* Self-service section - visible to all */}
      {selfServiceSections.length > 0 && (
        <div>
          <h3 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3 px-3">
            My Information
          </h3>
          <ul className="space-y-1">
            {selfServiceSections
              .sort((a, b) => a.sortOrder - b.sortOrder)
              .map((section) => {
                const Icon = sectionIcons[section.sectionKey] || FileText;
                const isActive = pathname === section.path;

                return (
                  <li key={section.id}>
                    <Link
                      href={section.path}
                      className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors group ${
                        isActive
                          ? "bg-safee-50 dark:bg-safee-900/20 text-safee-700 dark:text-safee-300"
                          : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
                      }`}
                      title={section.description || undefined}
                    >
                      <Icon
                        className={`w-5 h-5 ${
                          isActive
                            ? "text-safee-600 dark:text-safee-400"
                            : "text-gray-400 dark:text-gray-500 group-hover:text-gray-600 dark:group-hover:text-gray-400"
                        }`}
                      />
                      <span className="text-sm font-medium">{section.displayName}</span>
                    </Link>
                  </li>
                );
              })}
          </ul>
        </div>
      )}

      {/* Management section - HR roles only */}
      {managementSections.length > 0 && (
        <div>
          <h3 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3 px-3">
            Management
          </h3>
          <ul className="space-y-1">
            {managementSections
              .sort((a, b) => a.sortOrder - b.sortOrder)
              .map((section) => {
                const Icon = sectionIcons[section.sectionKey] || Briefcase;
                const isActive = pathname === section.path;

                return (
                  <li key={section.id}>
                    <Link
                      href={section.path}
                      className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors group ${
                        isActive
                          ? "bg-safee-50 dark:bg-safee-900/20 text-safee-700 dark:text-safee-300"
                          : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
                      }`}
                      title={section.description || undefined}
                    >
                      <Icon
                        className={`w-5 h-5 ${
                          isActive
                            ? "text-safee-600 dark:text-safee-400"
                            : "text-gray-400 dark:text-gray-500 group-hover:text-gray-600 dark:group-hover:text-gray-400"
                        }`}
                      />
                      <span className="text-sm font-medium">{section.displayName}</span>
                    </Link>
                  </li>
                );
              })}
          </ul>
        </div>
      )}
    </nav>
  );
}
