"use client";

import { motion } from "framer-motion";
import { useState } from "react";
import { FiChevronDown, FiFileText, FiDollarSign, FiUsers, FiPlus } from "react-icons/fi";
import { useRouter } from "next/navigation";

interface QuickAction {
  id: string;
  label: string;
  icon: typeof FiFileText;
  href: string;
  color: string;
}

export const QuickActionsDropdown = () => {
  const [open, setOpen] = useState(false);
  const router = useRouter();

  const actions: QuickAction[] = [
    {
      id: "invoice",
      label: "Create Invoice",
      icon: FiFileText,
      href: "/accounting/invoices/new",
      color: "text-green-600",
    },
    {
      id: "expense",
      label: "Record Expense",
      icon: FiDollarSign,
      href: "/accounting/expenses/new",
      color: "text-red-600",
    },
    {
      id: "employee",
      label: "Add Employee",
      icon: FiUsers,
      href: "/hr/employees/new",
      color: "text-blue-600",
    },
    {
      id: "bill",
      label: "New Bill",
      icon: FiFileText,
      href: "/accounting/bills/new",
      color: "text-orange-600",
    },
  ];

  return (
    <div className="relative">
      <motion.button
        onClick={() => setOpen((pv) => !pv)}
        className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-white border-2 border-safee-500 text-safee-700 hover:bg-safee-50 transition-colors shadow-sm font-medium"
      >
        <FiPlus className="w-4 h-4" />
        <span className="text-sm">Quick Actions</span>
        <motion.span
          animate={{ rotate: open ? 180 : 0 }}
          transition={{ duration: 0.2 }}
          className="text-safee-600"
        >
          <FiChevronDown className="w-4 h-4" />
        </motion.span>
      </motion.button>

      <motion.ul
        initial={{ scaleY: 0, opacity: 0 }}
        animate={{
          scaleY: open ? 1 : 0,
          opacity: open ? 1 : 0,
        }}
        transition={{
          duration: 0.15,
          ease: "easeOut",
        }}
        style={{ originY: "top" }}
        className="absolute top-[110%] left-0 w-64 overflow-hidden rounded-lg bg-white shadow-xl border border-gray-200 z-50"
      >
        {open && (
          <>
            <div className="p-2 space-y-1">
              {actions.map((action, index) => {
                const Icon = action.icon;
                return (
                  <motion.li
                    key={action.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                  >
                    <button
                      onClick={() => {
                        router.push(action.href);
                        setOpen(false);
                      }}
                      className="flex items-center gap-3 w-full p-3 text-sm font-medium rounded-md hover:bg-gray-50 text-gray-700 hover:text-safee-700 transition-colors"
                    >
                      <Icon className={`w-4 h-4 ${action.color}`} />
                      <span>{action.label}</span>
                    </button>
                  </motion.li>
                );
              })}
            </div>
            <div className="border-t border-gray-100 p-2">
              <button
                onClick={() => {
                  router.push("/accounting");
                  setOpen(false);
                }}
                className="w-full p-2 text-xs text-center text-gray-600 hover:text-safee-700 font-medium rounded hover:bg-gray-50 transition-colors"
              >
                View All Modules →
              </button>
            </div>
          </>
        )}
      </motion.ul>

      {/* Backdrop to close dropdown */}
      {open && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setOpen(false)}
        />
      )}
    </div>
  );
};
