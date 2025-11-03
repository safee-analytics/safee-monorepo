'use client'

import React, { Dispatch, SetStateAction, useState } from "react";
import { IconType } from "react-icons";
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  FiBarChart,
  FiChevronDown,
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
  FiHardDrive,
} from "react-icons/fi";
import { motion, AnimatePresence } from "framer-motion";
import { useTranslation } from '@/lib/providers/TranslationProvider';
import { useOrgStore } from '@/stores/useOrgStore';
import { getAllModules } from '@/lib/config/modules';
import arMessages from '@/messages/ar';

type Messages = typeof arMessages;

export const SidebarLayout = () => {
  return (
    <div className="flex bg-indigo-50">
      <Sidebar />
      <ExampleContent />
    </div>
  );
};

export const Sidebar = () => {
  const { t, locale } = useTranslation();
  const { setModule } = useOrgStore();
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [showCreateMenu, setShowCreateMenu] = useState(false);

  const modules = getAllModules();

  const moduleIcons: Record<string, IconType> = {
    hisabiq: FiDollarSign,
    kanz: FiUsers,
    nisbah: FiUserPlus,
    audit: FiClipboard
  };

  // Detect current module from pathname
  const getCurrentModule = () => {
    if (pathname?.startsWith('/audit')) return 'audit';
    if (pathname?.startsWith('/hisabiq')) return 'hisabiq';
    if (pathname?.startsWith('/kanz')) return 'kanz';
    if (pathname?.startsWith('/nisbah')) return 'nisbah';
    return null;
  };

  const currentModule = getCurrentModule();

  // Module-specific navigation items
  const moduleNavItems: Record<string, Array<{ icon: IconType; title: string; href: string }>> = {
    audit: [
      { icon: FiHome, title: t.audit.dashboardTitle, href: '/audit/dashboard' },
      { icon: FiClipboard, title: t.audit.caseManagement, href: '/audit/cases' },
      { icon: FiFileText, title: t.audit.documentRepository, href: '/audit/documents' },
      { icon: FiBarChart, title: t.audit.auditReports, href: '/audit/reports' },
      { icon: FiClipboard, title: t.audit.auditPlanning, href: '/audit/planning' },
      { icon: FiUsers, title: t.audit.teamManagement, href: '/audit/team' },
      { icon: FiSettings, title: t.audit.configurationSettings, href: '/audit/settings' },
    ],
    hisabiq: [
      { icon: FiHome, title: t.nav.dashboard, href: '/hisabiq/dashboard' },
      { icon: FiFileText, title: 'Invoices', href: '/hisabiq/invoices' },
      { icon: FiDollarSign, title: 'Expenses', href: '/hisabiq/expenses' },
      { icon: FiBarChart, title: t.common.reports, href: '/hisabiq/reports' },
    ],
    kanz: [
      { icon: FiHome, title: t.nav.dashboard, href: '/kanz/dashboard' },
      { icon: FiUsers, title: 'Employees', href: '/kanz/employees' },
      { icon: FiClipboard, title: 'Attendance', href: '/kanz/attendance' },
      { icon: FiDollarSign, title: 'Payroll', href: '/kanz/payroll' },
    ],
    nisbah: [
      { icon: FiHome, title: t.nav.dashboard, href: '/nisbah/dashboard' },
      { icon: FiUserPlus, title: 'Leads', href: '/nisbah/leads' },
      { icon: FiUsers, title: 'Contacts', href: '/nisbah/contacts' },
      { icon: FiDollarSign, title: 'Deals', href: '/nisbah/deals' },
    ],
  };

  const sidebarItems = currentModule && moduleNavItems[currentModule]
    ? moduleNavItems[currentModule]
    : [
        { icon: FiHome, title: t.nav.dashboard, href: '/dashboard' },
        { icon: FiBookmark, title: t.common.bookmarks, href: '/bookmarks' },
        { icon: FiBarChart, title: t.common.reports, href: '/reports' },
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
    audit: [
      { label: t.audit.createMenu.newCase, icon: FiFileText },
      { label: t.audit.createMenu.uploadDocument, icon: FiFileText },
      { label: t.audit.createMenu.createReport, icon: FiBarChart },
    ],
  };

  return (
    <>
      <motion.nav
        initial={false}
        onMouseEnter={() => setOpen(true)}
        onMouseLeave={() => setOpen(false)}
        className="fixed top-[65px] left-0 h-[calc(100vh-65px)] border-r border-slate-300 bg-white p-2 z-40"
        animate={{
          width: open ? "225px" : "fit-content",
        }}
        transition={{ duration: 0.2, ease: "easeInOut" }}
      >
        {/* Create Button */}
        <motion.button
          layout
          onClick={() => setShowCreateMenu(!showCreateMenu)}
          className="relative flex h-12 w-full items-center justify-center rounded-full bg-safee-600 hover:bg-safee-700 text-white transition-colors mb-3"
        >
          <motion.div
            layout
            className="grid h-full w-10 place-content-center text-lg"
          >
            <FiPlus className={`transition-transform duration-200 ${showCreateMenu ? 'rotate-45' : 'rotate-0'}`} />
          </motion.div>
          {open && (
            <motion.span
              layout
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.125 }}
              className="text-sm font-medium"
            >
              {t.common.create}
            </motion.span>
          )}
        </motion.button>

        <div className="border-b border-slate-300 mb-2" />

        {/* Main Nav Items */}
        <div className="space-y-1 mb-2">
          {sidebarItems.map((item) => (
            <Link key={item.href} href={item.href}>
              <Option
                Icon={item.icon}
                title={item.title}
                selected={pathname === item.href}
                open={open}
              />
            </Link>
          ))}
        </div>

        <div className="border-b border-slate-300 mb-2" />

        {/* Pinned Modules Section */}
        {open && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.125 }}
            className="px-2 mb-2"
          >
            <span className="text-[10px] font-semibold text-gray-400 uppercase">
              {t.common.pinned}
            </span>
          </motion.div>
        )}

        {/* Pinned Modules */}
        <div className="space-y-1 flex-1 overflow-y-auto">
          {modules.map((module) => {
            const Icon = moduleIcons[module.key] || FiClipboard;
            return (
              <Link
                key={module.key}
                href={module.path}
                onClick={() => setModule(module.key as any)}
              >
                <Option
                  Icon={Icon}
                  title={module.name[locale]}
                  selected={pathname?.startsWith(module.path)}
                  open={open}
                />
              </Link>
            );
          })}
        </div>

        {/* Settings at Bottom */}
        <div className="border-t border-slate-300 pt-2 mt-2">
          <Link href="/settings">
            <Option
              Icon={FiSettings}
              title={t.common.settings}
              selected={pathname?.startsWith('/settings')}
              open={open}
            />
          </Link>
        </div>

        <ToggleClose open={open} setOpen={setOpen} t={t} />
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
              onClick={() => setShowCreateMenu(false)}
              className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40"
            />

            {/* Menu */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, x: -10 }}
              animate={{ opacity: 1, scale: 1, x: 0 }}
              exit={{ opacity: 0, scale: 0.95, x: -10 }}
              className={`fixed ${locale === 'ar' ? 'right-20' : 'left-20'} top-28 z-50 bg-white rounded-xl shadow-2xl border border-gray-200 p-6 w-[500px]`}
            >
              <h3 className="text-lg font-semibold text-gray-900 mb-6">
                {t.common.createNew}
              </h3>

              <div className="grid grid-cols-2 gap-6">
                {/* Hisabiq */}
                <div>
                  <h4 className="text-xs font-semibold text-gray-500 uppercase mb-2 flex items-center gap-2">
                    <FiDollarSign className="w-3 h-3" />
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
                    <FiUsers className="w-3 h-3" />
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
                    <FiUserPlus className="w-3 h-3" />
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
                    <FiClipboard className="w-3 h-3" />
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
      <motion.div
        layout
        className="grid h-full w-10 place-content-center text-lg"
      >
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

const TitleSection = ({ open }: { open: boolean }) => {
  return (
    <div className="mb-3 border-b border-slate-300 pb-3">
      <div className="flex cursor-pointer items-center justify-between rounded-md transition-colors hover:bg-slate-100">
        <div className="flex items-center gap-2">
          <Logo />
          {open && (
            <motion.div
              layout
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.125 }}
            >
              <span className="block text-xs font-semibold">TomIsLoading</span>
              <span className="block text-xs text-slate-500">Pro Plan</span>
            </motion.div>
          )}
        </div>
        {open && <FiChevronDown className="mr-2" />}
      </div>
    </div>
  );
};

const Logo = () => {
  // Temp logo from https://logoipsum.com/
  return (
    <motion.div
      layout
      className="grid size-10 shrink-0 place-content-center rounded-md bg-indigo-600"
    >
      <svg
        width="24"
        height="auto"
        viewBox="0 0 50 39"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="fill-slate-50"
      >
        <path
          d="M16.4992 2H37.5808L22.0816 24.9729H1L16.4992 2Z"
          stopColor="#000000"
        ></path>
        <path
          d="M17.4224 27.102L11.4192 36H33.5008L49 13.0271H32.7024L23.2064 27.102H17.4224Z"
          stopColor="#000000"
        ></path>
      </svg>
    </motion.div>
  );
};

const ToggleClose = ({
  open,
  setOpen,
  t,
}: {
  open: boolean;
  setOpen: Dispatch<SetStateAction<boolean>>;
  t: Messages;
}) => {
  return (
    <motion.button
      layout
      onClick={() => setOpen((pv) => !pv)}
      className="absolute bottom-0 left-0 right-0 border-t border-slate-300 transition-colors hover:bg-slate-100"
    >
      <div className="flex items-center p-2">
        <motion.div
          layout
          className="grid size-10 place-content-center text-lg"
        >
          <FiChevronsRight
            className={`transition-transform ${open && "rotate-180"}`}
          />
        </motion.div>
        {open && (
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
  );
};

const ExampleContent = () => <div className="h-[200vh] w-full"></div>;
