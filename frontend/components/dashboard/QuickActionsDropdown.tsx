"use client";

import { motion } from "framer-motion";
import { useState } from "react";
import { FiChevronDown, FiFileText, FiDollarSign, FiUsers, FiPlus } from "react-icons/fi";
import { useRouter } from "next/navigation";
import { Button } from "@safee/ui";
import { type QuickAction, quickActionSchema } from "@/lib/validation";

export const QuickActionsDropdown = () => {
  const [open, setOpen] = useState(false);
  const router = useRouter();

  // TODO: [Backend/Frontend] - Fetch quick actions from API
  //   Details: The `actions` array is currently mocked. Implement a backend API endpoint to fetch a list of quick actions, potentially based on user role or preferences, and integrate it here.
  //   Priority: Medium
  const actions: QuickAction[] = quickActionSchema.array().parse([
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
  ]);

  return (
    <div className="relative">
      <Button
        onClick={() => {
          setOpen((pv) => !pv);
        }}
        variant="primary"
        className="flex items-center gap-2"
      >
        <FiPlus className="w-4 h-4" />
        <span className="text-sm">Quick Actions</span>
        <motion.span animate={{ rotate: open ? 180 : 0 }} transition={{ duration: 0.2 }}>
          <FiChevronDown className="w-4 h-4" />
        </motion.span>
      </Button>

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
                    <Button
                      variant="ghost"
                      className="w-full justify-start gap-3 p-3 text-sm"
                      onClick={() => {
                        router.push(action.href);
                        setOpen(false);
                      }}
                    >
                      <Icon className={`w-4 h-4 ${action.color}`} />
                      <span>{action.label}</span>
                    </Button>
                  </motion.li>
                );
              })}
            </div>
            <div className="border-t border-gray-100 p-2">
              <Button
                variant="ghost"
                className="w-full text-xs"
                onClick={() => {
                  router.push("/accounting");
                  setOpen(false);
                }}
              >
                View All Modules →
              </Button>
            </div>
          </>
        )}
      </motion.ul>

      {/* Backdrop to close dropdown */}
      {open && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => {
            setOpen(false);
          }}
        />
      )}
    </div>
  );
};
