"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Plus,
  Bookmark,
  LayoutDashboard,
  FileText,
  BarChart3,
  Settings,
  FolderOpen,
  Users,
  ClipboardList,
  Calendar,
  FileCheck,
} from "lucide-react";
import { useTranslation } from "@/lib/providers/TranslationProvider";

export function AuditSidebar() {
  const { t, locale } = useTranslation();
  const pathname = usePathname();
  const [showCreateMenu, setShowCreateMenu] = useState(false);

  const sidebarItems = [
    {
      icon: LayoutDashboard,
      label: locale === "ar" ? "لوحة التحكم" : "Dashboard",
      href: "/audit/dashboard",
    },
    {
      icon: FileText,
      label: locale === "ar" ? "الحالات" : "Cases",
      href: "/audit/cases",
    },
    {
      icon: BarChart3,
      label: locale === "ar" ? "التقارير" : "Reports",
      href: "/audit/reports",
    },
  ];

  const pinnedItems = [
    {
      icon: ClipboardList,
      label: locale === "ar" ? "التخطيط" : "Planning",
      href: "/audit/planning",
      color: "bg-green-100 text-green-700",
    },
    {
      icon: FolderOpen,
      label: locale === "ar" ? "المستندات" : "Documents",
      href: "/audit/documents",
      color: "bg-blue-100 text-blue-700",
    },
    {
      icon: Users,
      label: locale === "ar" ? "الفريق" : "Team",
      href: "/audit/team",
      color: "bg-purple-100 text-purple-700",
    },
  ];

  const createMenuItems = {
    cases: [
      { label: locale === "ar" ? "حالة جديدة" : "New case", icon: FileText },
      { label: locale === "ar" ? "من قالب" : "From template", icon: FileCheck },
      { label: locale === "ar" ? "طلب مراجعة" : "Request review", icon: ClipboardList },
    ],
    documents: [
      { label: locale === "ar" ? "تحميل مستند" : "Upload document", icon: FolderOpen },
      { label: locale === "ar" ? "إنشاء تقرير" : "Create report", icon: BarChart3 },
      { label: locale === "ar" ? "جدولة اجتماع" : "Schedule meeting", icon: Calendar },
    ],
  };

  return (
    <>
      <motion.aside
        className="fixed top-[65px] left-0 h-[calc(100vh-65px)] w-16 bg-white border-r border-gray-200 z-40 flex flex-col items-center py-4 gap-2"
        initial={false}
      >
        {/* Create Button */}
        <button
          onClick={() => setShowCreateMenu(!showCreateMenu)}
          className="w-12 h-12 rounded-full bg-blue-600 hover:bg-blue-700 text-white flex items-center justify-center shadow-lg transition-all hover:scale-105"
        >
          <Plus className={`w-6 h-6 transition-transform ${showCreateMenu ? "rotate-45" : "rotate-0"}`} />
        </button>

        <div className="w-10 h-px bg-gray-200 my-2" />

        {/* Main Nav Items */}
        {sidebarItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`w-12 h-12 rounded-lg flex flex-col items-center justify-center gap-0.5 transition-all group relative ${
                isActive ? "bg-blue-50 text-blue-600" : "text-gray-600 hover:bg-gray-100"
              }`}
            >
              <Icon className="w-5 h-5" />
              <span className="text-[9px] font-medium">{item.label}</span>

              {/* Tooltip on hover */}
              <div
                className={`absolute ${locale === "ar" ? "right-full mr-2" : "left-full ml-2"} top-1/2 -translate-y-1/2 px-3 py-1.5 bg-gray-900 text-white text-xs rounded-lg whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity`}
              >
                {item.label}
              </div>
            </Link>
          );
        })}

        <div className="w-10 h-px bg-gray-200 my-2" />

        {/* Pinned Section */}
        <div className="flex-1 flex flex-col gap-2">
          <div className="px-2 text-[9px] font-semibold text-gray-400 uppercase">
            {locale === "ar" ? "مثبت" : "Pinned"}
          </div>
          {pinnedItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`w-12 h-12 rounded-lg flex items-center justify-center transition-all relative group ${
                  isActive ? item.color : "text-gray-600 hover:bg-gray-100"
                }`}
              >
                <Icon className="w-5 h-5" />

                {/* Tooltip */}
                <div
                  className={`absolute ${locale === "ar" ? "right-full mr-2" : "left-full ml-2"} top-1/2 -translate-y-1/2 px-3 py-1.5 bg-gray-900 text-white text-xs rounded-lg whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity`}
                >
                  {item.label}
                </div>
              </Link>
            );
          })}
        </div>

        {/* Settings at Bottom */}
        <Link
          href="/audit/settings"
          className="w-12 h-12 rounded-lg flex items-center justify-center text-gray-600 hover:bg-gray-100 transition-all"
        >
          <Settings className="w-5 h-5" />
        </Link>
      </motion.aside>

      {/* Create Menu Dropdown */}
      <AnimatePresence>
        {showCreateMenu && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowCreateMenu(false)}
              className="fixed inset-0 bg-black/20 z-40"
            />

            {/* Menu */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: -10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: -10 }}
              className={`fixed ${locale === "ar" ? "right-20" : "left-20"} top-24 z-50 bg-white rounded-xl shadow-2xl border border-gray-200 p-6 w-96`}
            >
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                {locale === "ar" ? "إنشاء جديد" : "Create new"}
              </h3>

              <div className="space-y-6">
                {/* Cases Section */}
                <div>
                  <h4 className="text-xs font-semibold text-gray-500 uppercase mb-2">
                    {locale === "ar" ? "الحالات" : "Cases"}
                  </h4>
                  <div className="space-y-1">
                    {createMenuItems.cases.map((item, idx) => {
                      const Icon = item.icon;
                      return (
                        <button
                          key={idx}
                          onClick={() => setShowCreateMenu(false)}
                          className="w-full flex items-center gap-3 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-lg transition-colors"
                        >
                          <Icon className="w-4 h-4 text-gray-400" />
                          {item.label}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Documents Section */}
                <div>
                  <h4 className="text-xs font-semibold text-gray-500 uppercase mb-2">
                    {locale === "ar" ? "المستندات" : "Documents"}
                  </h4>
                  <div className="space-y-1">
                    {createMenuItems.documents.map((item, idx) => {
                      const Icon = item.icon;
                      return (
                        <button
                          key={idx}
                          onClick={() => setShowCreateMenu(false)}
                          className="w-full flex items-center gap-3 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-lg transition-colors"
                        >
                          <Icon className="w-4 h-4 text-gray-400" />
                          {item.label}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
