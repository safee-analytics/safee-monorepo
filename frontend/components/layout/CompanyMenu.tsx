"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Settings,
  Building2,
  Users,
  FileText,
  Package,
  Paperclip,
  Download,
  Upload,
  FileBarChart,
  CreditCard,
  Lock,
  X,
  ChevronRight,
} from "lucide-react";

interface MenuItem {
  label: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
}

interface MenuSection {
  title: string;
  items: MenuItem[];
}

export function CompanyMenu() {
  const [isOpen, setIsOpen] = useState(false);
  const pathname = usePathname();

  const menuSections: MenuSection[] = [
    {
      title: "YOUR COMPANY",
      items: [
        { label: "Organization Settings", href: "/settings/organization", icon: Building2 },
        { label: "Manage Users", href: "/settings/team", icon: Users },
        { label: "Invoice Styles", href: "/settings/invoice-styles", icon: FileText },
        { label: "Chart of Accounts", href: "/accounting/chart-of-accounts", icon: FileText },
      ],
    },
    {
      title: "DATA",
      items: [
        { label: "Products & Services", href: "/accounting/products", icon: Package },
        { label: "Storage & Files", href: "/settings/storage", icon: Paperclip },
        { label: "Import Data", href: "/tools/import", icon: Upload },
        { label: "Export Data", href: "/tools/export", icon: Download },
      ],
    },
    {
      title: "SECURITY & BILLING",
      items: [
        { label: "Audit Logs", href: "/settings/audit-logs", icon: FileBarChart },
        { label: "Security", href: "/settings/security", icon: Lock },
        { label: "Billing", href: "/settings/billing", icon: CreditCard },
      ],
    },
  ];

  return (
    <>
      {/* Gear Icon Trigger */}
      <button
        onClick={() => {
          setIsOpen(true);
        }}
        className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors relative"
        title="Settings"
      >
        <Settings className="w-5 h-5" />
      </button>

      {/* Full-Screen Overlay Menu */}
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => {
                setIsOpen(false);
              }}
              className="fixed inset-0 bg-black bg-opacity-50 z-50"
            />

            {/* Menu Panel */}
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="fixed top-20 left-1/2 transform -translate-x-1/2 bg-white rounded-lg shadow-2xl z-50 w-full max-w-4xl"
            >
              {/* Header */}
              <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 bg-gray-50">
                <div className="flex items-center gap-3">
                  <Settings className="w-6 h-6 text-blue-600" />
                  <h2 className="text-xl font-semibold text-gray-900">Company Settings</h2>
                </div>
                <button
                  onClick={() => {
                    setIsOpen(false);
                  }}
                  className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-200 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Menu Content */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8 p-8">
                {menuSections.map((section) => (
                  <div key={section.title} className="space-y-3">
                    <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      {section.title}
                    </h3>
                    <div className="space-y-1">
                      {section.items.map((item) => {
                        const Icon = item.icon;
                        const isActive = pathname === item.href;

                        return (
                          <Link
                            key={item.label}
                            href={item.href}
                            onClick={() => {
                              setIsOpen(false);
                            }}
                          >
                            <motion.div
                              whileHover={{ x: 4 }}
                              className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                                isActive
                                  ? "bg-blue-50 text-blue-700 font-medium"
                                  : "text-gray-700 hover:bg-gray-50"
                              }`}
                            >
                              <Icon className="w-5 h-5 flex-shrink-0" />
                              <span className="text-sm flex-1">{item.label}</span>
                              <ChevronRight className="w-4 h-4 text-gray-400" />
                            </motion.div>
                          </Link>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
