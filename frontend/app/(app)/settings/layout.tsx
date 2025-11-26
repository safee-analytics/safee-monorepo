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
  Lock,
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
    { href: "/settings/profile", label: "Profile", icon: User, pageKey: "profile", order: 1, category: "personal" },
    {
      href: "/settings/notifications",
      label: t.common.notifications || "Notifications",
      icon: Bell,
      pageKey: "notifications",
      order: 2,
      category: "personal",
    },
    { href: "/settings/appearance", label: "Appearance", icon: Palette, pageKey: "appearance", order: 3, category: "personal" },

    // Organization Settings (11-20)
    { href: "/settings/organization", label: "Organization", icon: Building2, pageKey: "organization", order: 11, category: "organization" },
    { href: "/settings/team", label: "Team", icon: Users, pageKey: "team", order: 12, category: "organization" },
    {
      href: "/settings/invoice-styles",
      label: "Invoice Styles",
      icon: FileText,
      pageKey: "invoice-styles",
      order: 13,
      category: "organization",
    },
    { href: "/settings/audit-logs", label: "Audit Logs", icon: FileText, pageKey: "audit-logs", order: 14, category: "organization" },

    // Advanced Settings (21-30)
    { href: "/settings/security", label: "Security", icon: Shield, pageKey: "security", order: 21, category: "advanced" },
    {
      href: "/settings/storage",
      label: t.common.storage || "Storage",
      icon: HardDrive,
      pageKey: "storage",
      order: 22,
      category: "advanced",
    },
    { href: "/settings/integrations", label: "Integrations", icon: Globe, pageKey: "integrations", order: 23, category: "advanced" },
    { href: "/settings/api", label: "API Keys", icon: Key, pageKey: "api", order: 24, category: "advanced" },
    { href: "/settings/database", label: "Database", icon: Database, pageKey: "database", order: 25, category: "advanced" },
  ];

  // Filter links based on permissions and sort by order
  const settingsLinks = allSettingsLinks
    .filter((link) => {
      // eslint-disable-next-line react-hooks/rules-of-hooks
      return useCanAccessSettingsPage(link.pageKey);
    })
    .sort((a, b) => a.order - b.order);

  const isActive = (href: string) => pathname === href || pathname?.startsWith(href + "/");

  // Group links by category
  const groupedLinks = {
    personal: settingsLinks.filter((link) => link.category === "personal"),
    organization: settingsLinks.filter((link) => link.category === "organization"),
    advanced: settingsLinks.filter((link) => link.category === "advanced"),
  };

  const categoryLabels = {
    personal: "Personal",
    organization: "Organization",
    advanced: "Advanced",
  };

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar - Sticky */}
      <aside className="w-64 bg-white border-r border-gray-200 h-screen sticky top-0 overflow-y-auto">
        <div className="p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-6">{t.common.settings}</h2>
          <nav className="space-y-6">
            {(Object.keys(groupedLinks) as Array<keyof typeof groupedLinks>).map((category) => {
              const links = groupedLinks[category];
              if (links.length === 0) return null;

              return (
                <div key={category}>
                  <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2 px-4">
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
                                ? "bg-blue-50 text-blue-700 font-medium"
                                : "text-gray-700 hover:bg-gray-50"
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
