"use client";

import React, { useState } from "react";
import { IconType } from "react-icons";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  FiBarChart,
  FiChevronsRight,
  FiDollarSign,
  FiHome,
  FiMonitor,
  FiShoppingCart,
  FiTag,
  FiUsers,
  FiPlus,
  FiBookmark,
  FiSettings,
  FiFileText,
  FiClipboard,
  FiUserPlus,
  FiMove,
  FiStar,
  FiX,
  FiSliders,
  FiGrid,
  FiActivity,
  FiCheckCircle,
  FiTrendingUp,
} from "react-icons/fi";
import { motion, AnimatePresence, Reorder } from "framer-motion";
import { useTranslation } from "@/lib/providers/TranslationProvider";
import { useOrgStore } from "@/stores/useOrgStore";
import { getAllModules } from "@/lib/config/modules";

export const SidebarLayout = () => {
  return (
    <div className="flex bg-indigo-50">
      <Sidebar />
      <ExampleContent />
    </div>
  );
};

interface AppItem {
  id: string;
  name: string;
  icon: IconType;
  gradient: string;
  pinned: boolean;
}

const moduleIcons: Record<string, IconType> = {
  hisabiq: FiDollarSign,
  kanz: FiUsers,
  nisbah: FiUserPlus,
  audit: FiClipboard,
  // Additional icons for future modules/features
  analytics: FiMonitor,
  shop: FiShoppingCart,
  tags: FiTag,
  reorder: FiMove,
};

const moduleColors: Record<string, string> = {
  hisabiq: "from-green-500 to-emerald-600",
  kanz: "from-indigo-500 to-indigo-600",
  nisbah: "from-pink-500 to-pink-600",
  audit: "from-orange-500 to-orange-600",
};

export const Sidebar = () => {
  const { t, locale } = useTranslation();
  const { setModule, sidebarAutoClose, setSidebarAutoClose, sidebarCollapsed, setSidebarCollapsed } =
    useOrgStore();
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [showCreateMenu, setShowCreateMenu] = useState(false);
  const [showCustomizeMenu, setShowCustomizeMenu] = useState(false);
  const [showMyApps, setShowMyApps] = useState(false);

  const modules = getAllModules();

  const defaultApps: AppItem[] = modules.map((module) => ({
    id: module.key,
    name: module.name[locale],
    icon: moduleIcons[module.key] || FiClipboard,
    gradient: moduleColors[module.key] || "from-gray-500 to-gray-600",
    pinned: true,
  }));

  const [apps, setApps] = useState<AppItem[]>(defaultApps);
  const [tempApps, setTempApps] = useState<AppItem[]>(defaultApps);

  // Update app names when locale changes
  React.useEffect(() => {
    const updatedModules = getAllModules();
    setApps((currentApps) =>
      currentApps.map((app) => {
        const moduleData = updatedModules.find((m) => m.key === app.id);
        return moduleData ? { ...app, name: moduleData.name[locale] } : app;
      }),
    );
    setTempApps((currentApps) =>
      currentApps.map((app) => {
        const moduleData = updatedModules.find((m) => m.key === app.id);
        return moduleData ? { ...app, name: moduleData.name[locale] } : app;
      }),
    );
  }, [locale]);

  React.useEffect(() => {
    const handleEscKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setShowCreateMenu(false);
        setShowCustomizeMenu(false);
        setShowMyApps(false);
      }
    };
    document.addEventListener("keydown", handleEscKey);
    return () => { document.removeEventListener("keydown", handleEscKey); };
  }, []);

  const handleOpenCustomize = () => {
    setTempApps([...apps]);
    setShowCustomizeMenu(true);
  };

  const handleSaveCustomize = () => {
    setApps([...tempApps]);
    setShowCustomizeMenu(false);
  };

  const handleCancelCustomize = () => {
    setTempApps([...apps]);
    setShowCustomizeMenu(false);
  };

  const handleResetToDefault = () => {
    setTempApps([...defaultApps]);
  };

  const handleTogglePin = (appId: string) => {
    setTempApps(tempApps.map((app) => (app.id === appId ? { ...app, pinned: !app.pinned } : app)));
  };

  const getCurrentModule = () => {
    if (pathname?.startsWith("/audit")) return "audit";
    if (pathname?.startsWith("/accounting")) return "hisabiq";
    if (pathname?.startsWith("/kanz")) return "kanz";
    if (pathname?.startsWith("/hr")) return "hr";
    if (pathname?.startsWith("/nisbah")) return "nisbah";
    if (pathname?.startsWith("/crm")) return "crm";
    return null;
  };

  const currentModule = getCurrentModule();

  const moduleNavItems: Record<string, { icon: IconType; title: string; href: string }[]> = {
    audit: [
      { icon: FiActivity, title: t.nav.dashboard, href: "/audit/dashboard" },
      { icon: FiClipboard, title: t.audit.caseManagement, href: "/audit/cases" },
      { icon: FiFileText, title: t.audit.documentRepository, href: "/audit/documents" },
      { icon: FiBarChart, title: t.audit.auditReports, href: "/audit/reports" },
      { icon: FiClipboard, title: t.audit.auditPlanning, href: "/audit/planning" },
    ],
    hisabiq: [
      { icon: FiActivity, title: t.nav.dashboard, href: "/accounting" },
      { icon: FiFileText, title: "Invoices", href: "/accounting/invoices" },
      { icon: FiDollarSign, title: "Expenses", href: "/accounting/expenses" },
      { icon: FiBarChart, title: t.common.reports, href: "/accounting/reports" },
    ],
    kanz: [
      { icon: FiActivity, title: t.nav.dashboard, href: "/kanz/dashboard" },
      { icon: FiUsers, title: "Employees", href: "/kanz/employees" },
      { icon: FiClipboard, title: "Attendance", href: "/kanz/attendance" },
      { icon: FiDollarSign, title: "Payroll", href: "/kanz/payroll" },
    ],
    hr: [
      { icon: FiActivity, title: t.nav.dashboard, href: "/hr" },
      { icon: FiUsers, title: "Employees", href: "/hr/employees" },
      { icon: FiGrid, title: "Departments", href: "/hr/departments" },
    ],
    nisbah: [
      { icon: FiActivity, title: t.nav.dashboard, href: "/nisbah/dashboard" },
      { icon: FiUserPlus, title: "Leads", href: "/nisbah/leads" },
      { icon: FiUsers, title: "Contacts", href: "/nisbah/contacts" },
      { icon: FiDollarSign, title: "Deals", href: "/nisbah/deals" },
    ],
    crm: [
      { icon: FiTrendingUp, title: "Dashboard", href: "/crm" },
      { icon: FiUserPlus, title: "Leads", href: "/crm/leads" },
      { icon: FiUsers, title: "Contacts", href: "/crm/contacts" },
      { icon: FiCheckCircle, title: "Activities", href: "/crm/activities" },
      { icon: FiSettings, title: "Settings", href: "/crm/settings" },
    ],
  };

  const sidebarItems =
    currentModule && moduleNavItems[currentModule]
      ? moduleNavItems[currentModule]
      : [
          { icon: FiBookmark, title: t.common.bookmarks, href: "/bookmarks" },
          { icon: FiBarChart, title: t.common.reports, href: "/reports" },
        ];

  const createMenuItems = {
    hisabiq: [
      { label: t.hisabiq.createMenu.invoice, icon: FiFileText },
      { label: t.hisabiq.createMenu.receivePayment, icon: FiDollarSign },
      { label: t.hisabiq.createMenu.expense, icon: FiFileText },
    ],
    kanz: [
      { label: t.kanz.createMenu.addEmployee, icon: FiUsers },
      { label: t.kanz.createMenu.logAttendance, icon: FiClipboard },
      { label: t.kanz.createMenu.processPayroll, icon: FiDollarSign },
    ],
    nisbah: [
      { label: t.nisbah.createMenu.lead, icon: FiUserPlus },
      { label: t.nisbah.createMenu.contact, icon: FiUsers },
      { label: t.nisbah.createMenu.deal, icon: FiDollarSign },
    ],
    crm: [
      { label: "New Lead", icon: FiUserPlus, href: "/crm/leads/new" },
      { label: "New Contact", icon: FiUsers, href: "/crm/contacts/new" },
      { label: "New Activity", icon: FiCheckCircle, href: "/crm/activities/new" },
    ],
    audit: [
      { label: t.audit.createMenu.newCase, icon: FiFileText },
      { label: t.audit.createMenu.uploadDocument, icon: FiFileText },
      { label: t.audit.createMenu.createReport, icon: FiBarChart },
    ],
  };

  const isExpanded = (open || !sidebarAutoClose) && !sidebarCollapsed;

  return (
    <>
      <motion.nav
        initial={false}
        onMouseEnter={() => {
          if (sidebarAutoClose && !sidebarCollapsed) {
            setOpen(true);
          }
        }}
        onMouseLeave={() => {
          if (sidebarAutoClose && !sidebarCollapsed) {
            setOpen(false);
          }
        }}
        className="h-full bg-white dark:bg-gray-900 pt-4 px-2 pb-2"
        animate={{
          width: isExpanded ? "225px" : "56px",
        }}
        transition={{ duration: 0.15, ease: "easeOut" }}
      >
        <TitleSection />

        <motion.button
          layout
          onClick={() => { setShowCreateMenu(!showCreateMenu); }}
          className="relative flex h-12 w-full items-center justify-center rounded-full bg-safee-600 hover:bg-safee-700 text-white transition-colors mb-3"
        >
          {isExpanded ? (
            <motion.div
              layout
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.05 }}
              className="flex items-center gap-2"
            >
              <FiPlus
                className={`w-5 h-5 transition-transform duration-200 ${showCreateMenu ? "rotate-45" : "rotate-0"}`}
              />
              <span className="text-sm font-medium">{t.common.create}</span>
            </motion.div>
          ) : (
            <FiPlus
              className={`w-5 h-5 transition-transform duration-200 ${showCreateMenu ? "rotate-45" : "rotate-0"}`}
            />
          )}
        </motion.button>

        <Link href="/">
          <motion.button
            layout
            className="relative flex h-10 w-full items-center rounded-lg transition-colors mb-2 hover:bg-safee-50 text-safee-700"
          >
            <motion.div layout className="grid h-full w-10 place-content-center text-lg">
              <FiHome />
            </motion.div>
            {isExpanded && (
              <motion.span
                layout
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.125 }}
                className="text-xs font-medium"
              >
                Home
              </motion.span>
            )}
          </motion.button>
        </Link>

        <div className="border-b border-slate-300 mb-2" />

        {/* Main Nav Items */}
        <div className="space-y-1 mb-2">
          {sidebarItems.map((item) => (
            <Link key={item.href} href={item.href}>
              <Option
                Icon={item.icon}
                title={item.title}
                selected={pathname === item.href}
                open={isExpanded}
              />
            </Link>
          ))}
        </div>

        <div className="border-b border-slate-300 mb-2" />

        {/* My Apps Button */}
        <motion.button
          layout
          onClick={() => { setShowMyApps(!showMyApps); }}
          className="relative flex h-10 w-full items-center rounded-md transition-colors text-slate-500 hover:bg-slate-100"
        >
          <motion.div layout className="grid h-full w-10 place-content-center text-lg">
            <FiGrid />
          </motion.div>
          {isExpanded && (
            <motion.span
              layout
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.125 }}
              className="text-xs font-medium flex-1 text-left"
            >
              {t.common.myApps}
            </motion.span>
          )}
        </motion.button>

        <div className="border-b border-slate-300 mb-2" />

        {/* Pinned Modules Section */}
        <div className={`px-2 mb-2 transition-opacity ${isExpanded ? "opacity-100" : "opacity-0"}`}>
          <span className="text-[10px] font-semibold text-gray-400 dark:text-gray-500 uppercase">
            {t.common.pinned}
          </span>
        </div>

        {/* Pinned Modules */}
        <div className="space-y-2 flex-1 overflow-y-auto">
          {apps
            .filter((app) => app.pinned)
            .map((app) => {
              const Icon = app.icon;
              const moduleData = modules.find((m) => m.key === app.id);
              if (!moduleData) return null;

              const isSelected = pathname?.startsWith(moduleData.path);

              return (
                <Link
                  key={app.id}
                  href={moduleData.path}
                  onClick={() => { setModule(app.id as "hisabiq" | "kanz" | "nisbah" | "audit"); }}
                >
                  <div
                    className={`relative flex h-10 w-full items-center rounded-lg transition-all ${
                      isSelected
                        ? "bg-safee-50 dark:bg-safee-900/20"
                        : "hover:bg-gray-50 dark:hover:bg-gray-800"
                    }`}
                  >
                    {/* Logo Circle - fixed position */}
                    <div className="w-10 flex items-center justify-center shrink-0">
                      <div
                        className={`grid w-8 h-8 place-content-center rounded-full bg-gradient-to-br ${app.gradient} shadow-sm hover:shadow-md transition-shadow`}
                      >
                        <Icon className="w-4 h-4 text-white" />
                      </div>
                    </div>

                    {/* Module Name */}
                    <span
                      className={`text-xs font-medium transition-opacity overflow-hidden whitespace-nowrap ${
                        isExpanded ? "opacity-100" : "opacity-0 w-0"
                      } ${isSelected ? "text-safee-700 dark:text-safee-300" : "text-gray-700 dark:text-gray-300"}`}
                    >
                      {app.name}
                    </span>
                  </div>
                </Link>
              );
            })}
        </div>

        {/* Bottom Section - Settings */}
        <div className="border-t border-slate-300 pt-2 mt-2 pb-20">
          <Link href="/settings">
            <Option
              Icon={FiSettings}
              title={t.common.settings}
              selected={pathname?.startsWith("/settings")}
              open={isExpanded}
            />
          </Link>
        </div>

        {/* Customize Button - At the very bottom, above Hide */}
        <motion.button
          layout
          onClick={handleOpenCustomize}
          className="absolute bottom-12 left-0 right-0 border-t border-slate-300 dark:border-gray-700 transition-colors hover:bg-slate-100 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300"
        >
          <div className="flex items-center p-2">
            <motion.div layout className="grid size-10 place-content-center text-lg">
              <FiSliders />
            </motion.div>
            {isExpanded && (
              <motion.span
                layout
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.125 }}
                className="text-xs font-medium"
              >
                {t.common.customize}
              </motion.span>
            )}
          </div>
        </motion.button>

        {/* Hide/Expand Button - At the very bottom */}
        <motion.button
          layout
          onClick={() => {
            if (sidebarCollapsed) {
              // Expand the sidebar
              setSidebarCollapsed(false);
              setOpen(true);
            } else {
              // Collapse the sidebar
              setOpen(false);
              setSidebarCollapsed(true);
            }
          }}
          className="absolute bottom-0 left-0 right-0 border-t border-slate-300 dark:border-gray-700 transition-colors hover:bg-slate-100 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300"
        >
          <div className="flex items-center p-2">
            <motion.div layout className="grid size-10 place-content-center text-lg">
              <FiChevronsRight className={`transition-transform ${isExpanded && "rotate-180"}`} />
            </motion.div>
            {isExpanded && (
              <motion.span
                layout
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.125 }}
                className="text-xs font-medium"
              >
                {t.common.hide}
              </motion.span>
            )}
          </div>
        </motion.button>
      </motion.nav>

      {/* Create Menu Dropdown */}
      <AnimatePresence>
        {showCreateMenu && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => { setShowCreateMenu(false); }}
              className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40"
            />

            {/* Menu */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, x: -10 }}
              animate={{ opacity: 1, scale: 1, x: 0 }}
              exit={{ opacity: 0, scale: 0.95, x: -10 }}
              className={`fixed ${locale === "ar" ? "right-20" : "left-20"} top-28 z-50 bg-white dark:bg-gray-800 rounded-xl shadow-2xl border border-gray-200 dark:border-gray-700 p-6 w-[500px]`}
            >
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-6">
                {t.common.createNew}
              </h3>

              <div className="grid grid-cols-2 gap-6">
                {/* Hisabiq */}
                <div>
                  <h4 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase mb-2 flex items-center gap-2">
                    <FiDollarSign className="w-3 h-3" />
                    {t.nav.hisabiq}
                  </h4>
                  <div className="space-y-1">
                    {createMenuItems.hisabiq.map((item, idx) => {
                      const Icon = item.icon;
                      return (
                        <button
                          key={idx}
                          onClick={() => { setShowCreateMenu(false); }}
                          className="w-full flex items-center gap-3 px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg transition-colors"
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
                  <h4 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase mb-2 flex items-center gap-2">
                    <FiUsers className="w-3 h-3" />
                    {t.nav.kanz}
                  </h4>
                  <div className="space-y-1">
                    {createMenuItems.kanz.map((item, idx) => {
                      const Icon = item.icon;
                      return (
                        <button
                          key={idx}
                          onClick={() => { setShowCreateMenu(false); }}
                          className="w-full flex items-center gap-3 px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg transition-colors"
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
                  <h4 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase mb-2 flex items-center gap-2">
                    <FiUserPlus className="w-3 h-3" />
                    {t.nav.nisbah}
                  </h4>
                  <div className="space-y-1">
                    {createMenuItems.nisbah.map((item, idx) => {
                      const Icon = item.icon;
                      return (
                        <button
                          key={idx}
                          onClick={() => { setShowCreateMenu(false); }}
                          className="w-full flex items-center gap-3 px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg transition-colors"
                        >
                          <Icon className="w-4 h-4 text-gray-400" />
                          {item.label}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* CRM */}
                <div>
                  <h4 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase mb-2 flex items-center gap-2">
                    <FiTrendingUp className="w-3 h-3" />
                    CRM
                  </h4>
                  <div className="space-y-1">
                    {createMenuItems.crm.map((item, idx) => {
                      const Icon = item.icon;
                      return (
                        <Link key={idx} href={item.href || "#"} onClick={() => { setShowCreateMenu(false); }}>
                          <button className="w-full flex items-center gap-3 px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg transition-colors">
                            <Icon className="w-4 h-4 text-gray-400 dark:text-gray-500" />
                            {item.label}
                          </button>
                        </Link>
                      );
                    })}
                  </div>
                </div>

                {/* Audit */}
                <div>
                  <h4 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase mb-2 flex items-center gap-2">
                    <FiClipboard className="w-3 h-3" />
                    {t.nav.audit}
                  </h4>
                  <div className="space-y-1">
                    {createMenuItems.audit.map((item, idx) => {
                      const Icon = item.icon;
                      return (
                        <button
                          key={idx}
                          onClick={() => { setShowCreateMenu(false); }}
                          className="w-full flex items-center gap-3 px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg transition-colors"
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

      {/* My Apps Menu Dropdown */}
      <AnimatePresence>
        {showMyApps && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => { setShowMyApps(false); }}
              className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40"
            />

            {/* Menu */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, x: -10 }}
              animate={{ opacity: 1, scale: 1, x: 0 }}
              exit={{ opacity: 0, scale: 0.95, x: -10 }}
              className={`fixed ${locale === "ar" ? "right-20" : "left-20"} top-[180px] z-50 bg-white dark:bg-gray-800 rounded-xl shadow-2xl border border-gray-200 dark:border-gray-700 p-4 w-[280px]`}
            >
              <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-3 px-2">
                {t.common.myApps}
              </h3>

              <div className="space-y-1">
                {apps.map((app) => {
                  const Icon = app.icon;
                  const moduleData = modules.find((m) => m.key === app.id);
                  if (!moduleData) return null;

                  return (
                    <Link
                      key={app.id}
                      href={moduleData.path}
                      onClick={() => {
                        setModule(app.id as "hisabiq" | "kanz" | "nisbah" | "audit");
                        setShowMyApps(false);
                      }}
                    >
                      <button className="w-full flex items-center gap-3 px-2 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg transition-colors">
                        <div
                          className={`w-8 h-8 rounded-full bg-gradient-to-br ${app.gradient} flex items-center justify-center shadow-sm flex-shrink-0`}
                        >
                          <Icon className="w-4 h-4 text-white" />
                        </div>

                        {/* App Name */}
                        <span className="flex-1 text-left font-medium">{app.name}</span>

                        {/* Pinned Star */}
                        {app.pinned && (
                          <FiStar className="w-3.5 h-3.5 text-yellow-500 fill-current flex-shrink-0" />
                        )}
                      </button>
                    </Link>
                  );
                })}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Customize Menu Modal */}
      <AnimatePresence>
        {showCustomizeMenu && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={handleCancelCustomize}
              className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50"
            />

            {/* Modal */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-50 bg-white dark:bg-gray-800 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700 w-full max-w-2xl max-h-[80vh] overflow-hidden"
            >
              {/* Header */}
              <div className="flex items-center justify-between px-8 py-6 border-b border-gray-200 dark:border-gray-700">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                    {t.common.customizeAppMenus}
                  </h2>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{t.common.dragDropReorder}</p>
                </div>
                <button
                  onClick={handleCancelCustomize}
                  className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                >
                  <FiX className="w-6 h-6 text-gray-500 dark:text-gray-400" />
                </button>
              </div>

              {/* Apps List */}
              <div className="px-8 py-6 overflow-y-auto max-h-[50vh]">
                <Reorder.Group axis="y" values={tempApps} onReorder={setTempApps} className="space-y-2">
                  {tempApps.map((app) => {
                    const Icon = app.icon;
                    return (
                      <Reorder.Item
                        key={app.id}
                        value={app}
                        className="flex items-center gap-4 px-4 py-3 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg hover:border-gray-300 dark:hover:border-gray-500 transition-colors cursor-grab active:cursor-grabbing"
                      >
                        {/* Drag Handle - Grip Icon */}
                        <div className="flex flex-col gap-1 flex-shrink-0 cursor-grab active:cursor-grabbing">
                          <div className="flex gap-1">
                            <div className="w-1 h-1 rounded-full bg-gray-400"></div>
                            <div className="w-1 h-1 rounded-full bg-gray-400"></div>
                          </div>
                          <div className="flex gap-1">
                            <div className="w-1 h-1 rounded-full bg-gray-400"></div>
                            <div className="w-1 h-1 rounded-full bg-gray-400"></div>
                          </div>
                          <div className="flex gap-1">
                            <div className="w-1 h-1 rounded-full bg-gray-400"></div>
                            <div className="w-1 h-1 rounded-full bg-gray-400"></div>
                          </div>
                        </div>

                        {/* Pin Button */}
                        <button
                          onClick={() => { handleTogglePin(app.id); }}
                          className={`p-2 rounded-lg transition-colors ${
                            app.pinned
                              ? "text-yellow-500 hover:bg-yellow-50"
                              : "text-gray-300 dark:text-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700"
                          }`}
                        >
                          <FiStar className={`w-5 h-5 ${app.pinned ? "fill-current" : ""}`} />
                        </button>

                        <div
                          className={`w-12 h-12 rounded-full bg-gradient-to-br ${app.gradient} flex items-center justify-center shadow-md flex-shrink-0`}
                        >
                          <Icon className="w-6 h-6 text-white" />
                        </div>

                        {/* App Name */}
                        <span className="text-sm font-semibold text-gray-900 dark:text-gray-100 flex-1">
                          {app.name}
                        </span>
                      </Reorder.Item>
                    );
                  })}
                </Reorder.Group>
              </div>

              {/* Auto-close toggle */}
              <div className="px-8 py-4 border-t border-gray-200 dark:border-gray-700">
                <div className="flex items-center justify-between py-3 px-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                  <div>
                    <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                      {t.common.autoCloseSidebar}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                      {t.common.autoCloseSidebarDesc}
                    </p>
                  </div>
                  <button
                    onClick={() => { setSidebarAutoClose(!sidebarAutoClose); }}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                      sidebarAutoClose ? "bg-safee-600" : "bg-gray-300"
                    }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                        sidebarAutoClose ? "translate-x-6" : "translate-x-1"
                      }`}
                    />
                  </button>
                </div>
              </div>

              {/* Footer Actions */}
              <div className="flex items-center justify-between px-8 py-6 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700">
                <button
                  onClick={handleResetToDefault}
                  className="px-4 py-2 text-sm font-medium text-safee-600 dark:text-safee-400 hover:bg-safee-50 dark:hover:bg-safee-900/20 rounded-lg transition-colors"
                >
                  {t.common.resetToDefault}
                </button>
                <div className="flex items-center gap-3">
                  <button
                    onClick={handleCancelCustomize}
                    className="px-6 py-2.5 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-600 border border-gray-300 dark:border-gray-600 rounded-lg transition-colors"
                  >
                    {t.common.cancel}
                  </button>
                  <button
                    onClick={handleSaveCustomize}
                    className="px-6 py-2.5 text-sm font-medium text-white bg-safee-600 hover:bg-safee-700 rounded-lg transition-colors shadow-sm"
                  >
                    {t.common.save}
                  </button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
};

const Option = ({
  Icon,
  title,
  selected,
  open,
  notifs,
}: {
  Icon: IconType;
  title: string;
  selected: boolean;
  open: boolean;
  notifs?: number;
}) => {
  const content = (
    <>
      <motion.div layout className="grid h-full w-10 place-content-center text-lg">
        <Icon />
      </motion.div>
      {open && (
        <motion.span
          layout
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.125 }}
          className="text-xs font-medium"
        >
          {title}
        </motion.span>
      )}

      {notifs && open && (
        <motion.span
          initial={{ scale: 0, opacity: 0 }}
          animate={{
            opacity: 1,
            scale: 1,
          }}
          style={{ y: "-50%" }}
          transition={{ delay: 0.5 }}
          className="absolute right-2 top-1/2 size-4 rounded bg-indigo-500 text-xs text-white"
        >
          {notifs}
        </motion.span>
      )}
    </>
  );

  return (
    <motion.div
      layout
      className={`relative flex h-10 w-full items-center rounded-md transition-colors ${selected ? "bg-safee-100 text-safee-800" : "text-slate-500 hover:bg-slate-100"}`}
    >
      {content}
    </motion.div>
  );
};

const TitleSection = () => {
  return (
    <div className="mb-3 border-b border-slate-300 pb-3">
      <div className="flex cursor-pointer items-center justify-between rounded-md transition-colors hover:bg-slate-100">
        <div className="flex items-center gap-2"></div>
      </div>
    </div>
  );
};

const ExampleContent = () => <div className="h-[200vh] w-full"></div>;
