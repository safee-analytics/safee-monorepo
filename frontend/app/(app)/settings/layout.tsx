"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  User,
  Bell,
  Shield,
  HardDrive,
  Globe,
  Palette,
  Key,
  Database,
  Users,
  FileText,
  Building2,
} from "lucide-react";
import { useTranslation } from "@/lib/providers/TranslationProvider";
import { useCanAccessSettingsPage } from "@/lib/api/hooks/permissions";
import { settingsPermissions } from "@/lib/permissions/accessControl";

interface SettingLink {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  pageKey: keyof typeof settingsPermissions;
  order: number;
  category: "personal" | "organization" | "advanced";
}

export default function SettingsLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { t } = useTranslation();

  // Organized settings with explicit ordering
  const allSettingsLinks: SettingLink[] = [
    // Personal Settings (1-10)
    {
      href: "/settings/profile",
      label: t.settings.nav.profile,
      icon: User,
      pageKey: "profile",
      order: 1,
      category: "personal",
    },
    {
      href: "/settings/notifications",
      label: t.settings.nav.notifications,
      icon: Bell,
      pageKey: "notifications",
      order: 2,
      category: "personal",
    },
    {
      href: "/settings/appearance",
      label: t.settings.nav.appearance,
      icon: Palette,
      pageKey: "appearance",
      order: 3,
      category: "personal",
    },

    // Organization Settings (11-20)
    {
      href: "/settings/organization",
      label: t.settings.nav.organization,
      icon: Building2,
      pageKey: "organization",
      order: 11,
      category: "organization",
    },
    {
      href: "/settings/team",
      label: t.settings.nav.team,
      icon: Users,
      pageKey: "team",
      order: 12,
      category: "organization",
    },
    {
      href: "/settings/documents",
      label: t.settings.nav.documents,
      icon: FileText,
      pageKey: "documents",
      order: 13,
      category: "organization",
    },
    {
      href: "/settings/invoice-styles",
      label: t.settings.nav.invoiceStyles,
      icon: FileText,
      pageKey: "invoice-styles",
      order: 14,
      category: "organization",
    },
    {
      href: "/settings/audit-logs",
      label: t.settings.nav.auditLogs,
      icon: FileText,
      pageKey: "audit-logs",
      order: 15,
      category: "organization",
    },

    // Advanced Settings (21-30)
    {
      href: "/settings/security",
      label: t.settings.nav.security,
      icon: Shield,
      pageKey: "security",
      order: 21,
      category: "advanced",
    },
    {
      href: "/settings/storage",
      label: t.settings.nav.storage,
      icon: HardDrive,
      pageKey: "storage",
      order: 22,
      category: "advanced",
    },
    {
      href: "/settings/integrations",
      label: t.settings.nav.integrations,
      icon: Globe,
      pageKey: "integrations",
      order: 23,
      category: "advanced",
    },
    {
      href: "/settings/api",
      label: t.settings.nav.apiKeys,
      icon: Key,
      pageKey: "api",
      order: 24,
      category: "advanced",
    },
    {
      href: "/settings/database",
      label: t.settings.nav.database,
      icon: Database,
      pageKey: "database",
      order: 25,
      category: "advanced",
    },
  ];

  // Filter links based on permissions and sort by order
  const settingsLinks = allSettingsLinks
    .filter((link) => {
      // eslint-disable-next-line react-hooks/rules-of-hooks
      return useCanAccessSettingsPage(link.pageKey);
    })
    .sort((a, b) => a.order - b.order);

  const isActive = (href: string) => pathname === href || pathname?.startsWith(`${href}/`);

  // Group links by category
  const groupedLinks = {
    personal: settingsLinks.filter((link) => link.category === "personal"),
    organization: settingsLinks.filter((link) => link.category === "organization"),
    advanced: settingsLinks.filter((link) => link.category === "advanced"),
  };

  const categoryLabels = {
    personal: t.settings.nav.personal,
    organization: t.settings.nav.organization,
    advanced: t.settings.nav.advanced,
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex">
      {/* Sidebar - Sticky */}
      <aside className="w-64 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 h-screen sticky top-0 overflow-y-auto">
        <div className="p-6">
          <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-6">{t.common.settings}</h2>
          <nav className="space-y-6">
            {(Object.keys(groupedLinks) as (keyof typeof groupedLinks)[]).map((category) => {
              const links = groupedLinks[category];
              if (links.length === 0) return null;

              return (
                <div key={category}>
                  <h3 className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wide mb-2 px-4">
                    {categoryLabels[category]}
                  </h3>
                  <div className="space-y-1">
                    {links.map((link) => {
                      const Icon = link.icon;
                      return (
                        <Link key={link.href} href={link.href}>
                          <motion.div
                            whileHover={{ x: 4 }}
                            className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                              isActive(link.href)
                                ? "bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 font-medium"
                                : "text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
                            }`}
                          >
                            <Icon className="w-5 h-5" />
                            <span className="flex-1">{link.label}</span>
                          </motion.div>
                        </Link>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </nav>
        </div>
      </aside>

      {/* Main Content - Scrollable */}
      <main className="flex-1 overflow-y-auto h-screen">{children}</main>
    </div>
  );
}
