"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import { User, Bell, Shield, HardDrive, Globe, Palette, Key, Database, Lock } from "lucide-react";
import { useTranslation } from "@/lib/providers/TranslationProvider";

interface SettingLink {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  restricted?: boolean;
}

export default function SettingsLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { t } = useTranslation();

  const settingsLinks: SettingLink[] = [
    { href: "/settings/profile", label: "Profile", icon: User, restricted: false },
    {
      href: "/settings/notifications",
      label: t.common.notifications || "Notifications",
      icon: Bell,
      restricted: false,
    },
    { href: "/settings/appearance", label: "Appearance", icon: Palette, restricted: false },
    { href: "/settings/security", label: "Security", icon: Shield, restricted: true },
    { href: "/settings/storage", label: t.common.storage || "Storage", icon: HardDrive, restricted: true },
    { href: "/settings/integrations", label: "Integrations", icon: Globe, restricted: true },
    { href: "/settings/api", label: "API Keys", icon: Key, restricted: true },
    { href: "/settings/database", label: "Database", icon: Database, restricted: true },
  ];

  const isActive = (href: string) => pathname === href;

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
                      {link.restricted && <Lock className="w-3 h-3 text-gray-400" title="Admin only" />}
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
