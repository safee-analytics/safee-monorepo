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
}

export default function SettingsLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { t } = useTranslation();

  const allSettingsLinks: SettingLink[] = [
    { href: "/settings/profile", label: "Profile", icon: User, pageKey: "profile" },
    {
      href: "/settings/notifications",
      label: t.common.notifications || "Notifications",
      icon: Bell,
      pageKey: "notifications",
    },
    { href: "/settings/appearance", label: "Appearance", icon: Palette, pageKey: "appearance" },
    { href: "/settings/organization", label: "Organization", icon: Building2, pageKey: "organization" },
    { href: "/settings/team", label: "Team", icon: Users, pageKey: "team" },
    { href: "/settings/audit-logs", label: "Audit Logs", icon: FileText, pageKey: "audit-logs" },
    { href: "/settings/security", label: "Security", icon: Shield, pageKey: "security" },
    {
      href: "/settings/storage",
      label: t.common.storage || "Storage",
      icon: HardDrive,
      pageKey: "storage",
    },
    { href: "/settings/integrations", label: "Integrations", icon: Globe, pageKey: "integrations" },
    { href: "/settings/api", label: "API Keys", icon: Key, pageKey: "api" },
    { href: "/settings/database", label: "Database", icon: Database, pageKey: "database" },
    {
      href: "/settings/invoice-styles",
      label: "Invoice Styles",
      icon: FileText,
      pageKey: "invoice-styles",
    },
  ];

  // Filter links based on permissions
  const settingsLinks = allSettingsLinks.filter((link) => {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    return useCanAccessSettingsPage(link.pageKey);
  });

  const isActive = (href: string) => pathname === href || pathname?.startsWith(href + "/");

  // Check if page requires permission
  const hasRestriction = (pageKey: keyof typeof settingsPermissions) => {
    return settingsPermissions[pageKey].length > 0;
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="flex">
        {/* Sidebar */}
        <aside className="w-64 bg-white border-r border-gray-200 min-h-screen sticky top-0">
          <div className="p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-6">{t.common.settings}</h2>
            <nav className="space-y-1">
              {settingsLinks.map((link) => {
                const Icon = link.icon;
                const restricted = hasRestriction(link.pageKey);
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
                      {restricted && (
                        <Lock className="w-3 h-3 text-gray-400" aria-label="Requires permission" />
                      )}
                    </motion.div>
                  </Link>
                );
              })}
            </nav>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1">{children}</main>
      </div>
    </div>
  );
}
