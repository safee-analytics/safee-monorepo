"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Plus,
  Bookmark,
  LayoutDashboard,
  DollarSign,
  Users,
  UserPlus,
  FileText,
  ClipboardList,
  Search as SearchIcon,
  Settings,
  BarChart3,
} from "lucide-react";
import { useTranslation } from "@/lib/providers/TranslationProvider";
import { useOrgStore } from "@/stores/useOrgStore";
import { getAllModules } from "@/lib/config/modules";

export function SafeeSidebar() {
  const { t, locale } = useTranslation();
  const { setModule } = useOrgStore();
  const pathname = usePathname();
  const [showCreateMenu, setShowCreateMenu] = useState(false);

  const modules = getAllModules();

  const moduleIcons: Record<string, React.ComponentType<{ className?: string }>> = {
    hisabiq: DollarSign,
    kanz: Users,
    nisbah: UserPlus,
    audit: ClipboardList,
  };

  const moduleColors: Record<string, string> = {
    hisabiq: "bg-green-100 text-green-700",
    kanz: "bg-blue-100 text-blue-700",
    nisbah: "bg-purple-100 text-purple-700",
    audit: "bg-orange-100 text-orange-700",
  };

  const sidebarItems = [
    {
      icon: LayoutDashboard,
      label: t.nav.dashboard,
      href: "/",
    },
    {
      icon: Bookmark,
      label: locale === "ar" ? "الإشارات المرجعية" : "Bookmarks",
      href: "/bookmarks",
    },
    {
      icon: BarChart3,
      label: locale === "ar" ? "التقارير" : "Reports",
      href: "/reports",
    },
  ];

  const createMenuItems = {
    hisabiq: [
      { label: locale === "ar" ? "فاتورة" : "Invoice", icon: FileText },
      { label: locale === "ar" ? "استلام دفعة" : "Receive payment", icon: DollarSign },
      { label: locale === "ar" ? "مصروف" : "Expense", icon: FileText },
    ],
    kanz: [
      { label: locale === "ar" ? "إضافة موظف" : "Add employee", icon: Users },
      { label: locale === "ar" ? "تسجيل حضور" : "Log attendance", icon: ClipboardList },
      { label: locale === "ar" ? "معالجة رواتب" : "Process payroll", icon: DollarSign },
    ],
    nisbah: [
      { label: locale === "ar" ? "عميل محتمل" : "Lead", icon: UserPlus },
      { label: locale === "ar" ? "جهة اتصال" : "Contact", icon: Users },
      { label: locale === "ar" ? "صفقة" : "Deal", icon: DollarSign },
    ],
    audit: [
      { label: locale === "ar" ? "حالة جديدة" : "New case", icon: FileText },
      { label: locale === "ar" ? "تحميل مستند" : "Upload document", icon: FileText },
      { label: locale === "ar" ? "إنشاء تقرير" : "Create report", icon: BarChart3 },
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
          className="w-12 h-12 rounded-full bg-safee-600 hover:bg-safee-700 text-white flex items-center justify-center shadow-lg transition-all hover:scale-105 active:scale-95"
        >
          <Plus
            className={`w-6 h-6 transition-transform duration-200 ${showCreateMenu ? "rotate-45" : "rotate-0"}`}
          />
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
                isActive ? "bg-safee-50 text-safee-600" : "text-gray-600 hover:bg-gray-100"
              }`}
            >
              <Icon className="w-5 h-5" />
              <span className="text-[9px] font-medium truncate max-w-[48px]">{item.label.slice(0, 8)}</span>

              {/* Tooltip */}
              <div
                className={`absolute ${locale === "ar" ? "right-full mr-2" : "left-full ml-2"} top-1/2 -translate-y-1/2 px-3 py-1.5 bg-gray-900 text-white text-xs rounded-lg whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity z-50`}
              >
                {item.label}
              </div>
            </Link>
          );
        })}

        <div className="w-10 h-px bg-gray-200 my-2" />

        {/* Pinned Modules */}
        <div className="flex-1 flex flex-col gap-2 overflow-y-auto">
          <div className="px-1 text-[9px] font-semibold text-gray-400 uppercase text-center">
            {locale === "ar" ? "مثبت" : "Pinned"}
          </div>
          {modules.map((module) => {
            const Icon = moduleIcons[module.key] || ClipboardList;
            const isActive = pathname?.startsWith(module.path);
            return (
              <Link
                key={module.key}
                href={module.path}
                onClick={() => setModule(module.key as "hisabiq" | "kanz" | "nisbah" | "audit")}
                className={`w-12 h-12 rounded-lg flex items-center justify-center transition-all relative group ${
                  isActive ? moduleColors[module.key] : "text-gray-600 hover:bg-gray-100"
                }`}
              >
                <Icon className="w-5 h-5" />

                {/* Tooltip */}
                <div
                  className={`absolute ${locale === "ar" ? "right-full mr-2" : "left-full ml-2"} top-1/2 -translate-y-1/2 px-3 py-1.5 bg-gray-900 text-white text-xs rounded-lg whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity z-50`}
                >
                  {module.name[locale]}
                </div>
              </Link>
            );
          })}
        </div>

        {/* Settings at Bottom */}
        <Link
          href="/settings"
          className="w-12 h-12 rounded-lg flex items-center justify-center text-gray-600 hover:bg-gray-100 transition-all group relative"
        >
          <Settings className="w-5 h-5" />

          {/* Tooltip */}
          <div
            className={`absolute ${locale === "ar" ? "right-full mr-2" : "left-full ml-2"} top-1/2 -translate-y-1/2 px-3 py-1.5 bg-gray-900 text-white text-xs rounded-lg whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity z-50`}
          >
            {locale === "ar" ? "الإعدادات" : "Settings"}
          </div>
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
              className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40"
            />

            {/* Menu */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, x: -10 }}
              animate={{ opacity: 1, scale: 1, x: 0 }}
              exit={{ opacity: 0, scale: 0.95, x: -10 }}
              className={`fixed ${locale === "ar" ? "right-20" : "left-20"} top-24 z-50 bg-white rounded-xl shadow-2xl border border-gray-200 p-6 w-[500px]`}
            >
              <h3 className="text-lg font-semibold text-gray-900 mb-6">
                {locale === "ar" ? "إنشاء جديد" : "Create new"}
              </h3>

              <div className="grid grid-cols-2 gap-6">
                {/* Hisabiq */}
                <div>
                  <h4 className="text-xs font-semibold text-gray-500 uppercase mb-2 flex items-center gap-2">
                    <DollarSign className="w-3 h-3" />
                    {t.nav.hisabiq}
                  </h4>
                  <div className="space-y-1">
                    {createMenuItems.hisabiq.map((item, idx) => {
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

                {/* Kanz */}
                <div>
                  <h4 className="text-xs font-semibold text-gray-500 uppercase mb-2 flex items-center gap-2">
                    <Users className="w-3 h-3" />
                    {t.nav.kanz}
                  </h4>
                  <div className="space-y-1">
                    {createMenuItems.kanz.map((item, idx) => {
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

                {/* Nisbah */}
                <div>
                  <h4 className="text-xs font-semibold text-gray-500 uppercase mb-2 flex items-center gap-2">
                    <UserPlus className="w-3 h-3" />
                    {t.nav.nisbah}
                  </h4>
                  <div className="space-y-1">
                    {createMenuItems.nisbah.map((item, idx) => {
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

                {/* Audit */}
                <div>
                  <h4 className="text-xs font-semibold text-gray-500 uppercase mb-2 flex items-center gap-2">
                    <ClipboardList className="w-3 h-3" />
                    {t.nav.audit}
                  </h4>
                  <div className="space-y-1">
                    {createMenuItems.audit.map((item, idx) => {
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
