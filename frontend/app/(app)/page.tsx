"use client";

import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import {
  FileCheck,
  Calculator,
  Users,
  DollarSign,
  ShoppingCart,
  Receipt,
  Settings,
  Plus,
  AlertCircle,
  Sparkles,
  BarChart3,
} from "lucide-react";
import { useTranslation } from "@/lib/providers/TranslationProvider";
import { useOrgStore } from "@/stores/useOrgStore";
import { useAuth } from "@/lib/auth/hooks";
import { useState } from "react";
import { TodoWidget } from "@/components/dashboard/TodoWidget";
import { QuickActionsDropdown } from "@/components/dashboard/QuickActionsDropdown";
import { CustomizableGrid, type Widget, type WidgetSize } from "@/components/dashboard/CustomizableGrid";
import { ProfitLossWidget } from "@/components/dashboard/widgets/ProfitLossWidget";
import { BankAccountsWidget } from "@/components/dashboard/widgets/BankAccountsWidget";
import { RecentActivityWidget } from "@/components/dashboard/widgets/RecentActivityWidget";
import { ExpensesChartWidget } from "@/components/dashboard/widgets/ExpensesChartWidget";

export default function HomePage() {
  const { t } = useTranslation();
  const router = useRouter();
  const { currentUser } = useOrgStore();
  const { user } = useAuth();
  const [hoveredModule, setHoveredModule] = useState<string | null>(null);

  const [dashboardWidgets, setDashboardWidgets] = useState<Widget[]>([
    {
      id: "todo",
      title: "Today's Tasks",
      component: TodoWidget,
      size: "large",
      minSize: "medium",
      maxSize: "large",
    },
    {
      id: "profit-loss",
      title: "Profit & Loss",
      component: ProfitLossWidget,
      size: "small",
      minSize: "small",
      maxSize: "medium",
    },
    {
      id: "recent-activity",
      title: "Recent Activity",
      component: RecentActivityWidget,
      size: "small",
      minSize: "small",
      maxSize: "medium",
    },
    {
      id: "bank-accounts",
      title: "Bank Accounts",
      component: BankAccountsWidget,
      size: "medium",
      minSize: "small",
      maxSize: "large",
    },
    {
      id: "expenses-chart",
      title: "Expenses Chart",
      component: ExpensesChartWidget,
      size: "small",
      minSize: "small",
      maxSize: "medium",
    },
  ]);

  const handleReorderWidgets = (newOrder: Widget[]) => {
    setDashboardWidgets(newOrder);
  };

  const handleRemoveWidget = (id: string) => {
    setDashboardWidgets((prev) => prev.filter((w) => w.id !== id));
  };

  const handleResizeWidget = (id: string, newSize: WidgetSize) => {
    setDashboardWidgets((prev) => prev.map((w) => (w.id === id ? { ...w, size: newSize } : w)));
  };

  const displayUser = user || currentUser;
  const displayName = displayUser?.name?.split(" ")[0] || "User";

  const currentHour = new Date().getHours();
  const getGreeting = () => {
    if (currentHour < 12) {
      return t.dashboard.goodMorning;
    } else if (currentHour < 18) {
      return t.dashboard.goodAfternoon;
    }
    return t.dashboard.goodEvening;
  };

  const modules = [
    {
      id: "hisabiq",
      name: t.dashboard.accounting,
      icon: Calculator,
      color: "from-green-500 to-emerald-600",
      href: "/accounting",
    },
    {
      id: "expenses",
      name: t.dashboard.expenses,
      icon: Receipt,
      color: "from-blue-500 to-blue-600",
      href: "/accounting/expenses",
    },
    {
      id: "sales",
      name: t.dashboard.sales,
      icon: ShoppingCart,
      color: "from-purple-500 to-purple-600",
      href: "/accounting/sales",
    },
    {
      id: "nisbah",
      name: t.dashboard.customers,
      icon: Users,
      color: "from-pink-500 to-pink-600",
      href: "/crm",
    },
    {
      id: "kanz",
      name: t.dashboard.payroll,
      icon: DollarSign,
      color: "from-indigo-500 to-indigo-600",
      href: "/hr",
    },
    {
      id: "team",
      name: t.dashboard.team,
      icon: Users,
      color: "from-cyan-500 to-cyan-600",
      href: "/hr/team",
    },
    {
      id: "audit",
      name: t.nav.audit,
      icon: FileCheck,
      color: "from-orange-500 to-orange-600",
      href: "/audit",
    },
    {
      id: "reports",
      name: t.dashboard.reports,
      icon: BarChart3,
      color: "from-teal-500 to-teal-600",
      href: "/reports",
    },
  ];

  const quickActions = [
    {
      id: "payroll",
      label: t.dashboard.runPayroll,
      onClick: () => {
        router.push("/hr/payroll");
      },
    },
    {
      id: "get-paid",
      label: t.dashboard.getPaidOnline,
      onClick: () => {
        router.push("/accounting/payments");
      },
    },
    {
      id: "invoice",
      label: t.dashboard.createInvoice,
      onClick: () => {
        router.push("/accounting/invoices/new");
      },
    },
    {
      id: "expense",
      label: t.dashboard.recordExpense,
      onClick: () => {
        router.push("/accounting/expenses/new");
      },
    },
    {
      id: "bank",
      label: t.dashboard.addBankDeposit,
      onClick: () => {
        router.push("/accounting/banking/deposit");
      },
    },
    {
      id: "show-all",
      label: t.dashboard.showAll,
      onClick: () => {},
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-[1600px] mx-auto p-6">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            {getGreeting()} {displayName}!
          </h1>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mb-6 -mx-6 px-6"
        >
          <div className="flex items-center gap-3 overflow-x-auto pb-4 scrollbar-hide">
            {modules.map((module) => {
              const Icon = module.icon;
              return (
                <button
                  key={module.id}
                  onClick={() => {
                    router.push(module.href);
                  }}
                  onMouseEnter={() => {
                    setHoveredModule(module.id);
                  }}
                  onMouseLeave={() => {
                    setHoveredModule(null);
                  }}
                  className={`
                    group flex items-center gap-3 px-4 py-3 rounded-xl border-2 transition-all duration-200 flex-shrink-0
                    ${
                      hoveredModule === module.id
                        ? "bg-white border-safee-500 shadow-lg scale-105"
                        : "bg-white border-gray-200 hover:border-gray-300"
                    }
                  `}
                >
                  <div
                    className={`w-10 h-10 rounded-full bg-gradient-to-br ${module.color} flex items-center justify-center`}
                  >
                    <Icon className="w-5 h-5 text-white" />
                  </div>
                  <span className="text-sm font-semibold text-gray-900 whitespace-nowrap">{module.name}</span>
                </button>
              );
            })}
            <button className="flex items-center justify-center w-10 h-10 rounded-full bg-gray-100 hover:bg-gray-200 transition-colors flex-shrink-0">
              <Settings className="w-5 h-5 text-gray-600" />
            </button>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mb-8"
        >
          <div className="flex items-center gap-4">
            <QuickActionsDropdown />
            <div className="flex items-center gap-2 flex-wrap">
              {quickActions.slice(0, 3).map((action) => (
                <button
                  key={action.id}
                  onClick={action.onClick}
                  className="px-4 py-2 bg-white border border-gray-300 rounded-full text-sm font-medium text-gray-700 hover:bg-gray-50 hover:border-gray-400 transition-all"
                >
                  {action.label}
                </button>
              ))}
            </div>
          </div>
        </motion.div>

        {/* Customizable Grid Dashboard */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <CustomizableGrid
            widgets={dashboardWidgets}
            onReorderWidgets={handleReorderWidgets}
            onRemoveWidget={handleRemoveWidget}
            onResizeWidget={handleResizeWidget}
          />
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="mt-6"
        >
          <button className="w-full max-w-sm mx-auto flex flex-col items-center justify-center py-8 bg-white border-2 border-dashed border-gray-300 rounded-lg hover:border-safee-500 hover:bg-safee-50 transition-all group">
            <Plus className="w-8 h-8 text-gray-400 group-hover:text-safee-600 mb-2" />
            <span className="text-sm font-semibold text-gray-600 group-hover:text-safee-700">
              {t.dashboard.addWidgets}
            </span>
          </button>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
          className="mt-8"
        >
          <div className="flex items-center gap-2 mb-4">
            <Sparkles className="w-5 h-5 text-safee-600" />
            <h3 className="text-sm font-semibold text-gray-900">{t.dashboard.smartSuggestions}</h3>
          </div>
          <div className="flex items-center gap-3">
            <button className="px-4 py-2 bg-white border border-gray-300 rounded-full text-sm font-medium text-gray-700 hover:bg-gray-50 hover:border-gray-400 transition-all">
              {t.dashboard.sales}
            </button>
            <button className="px-4 py-2 bg-white border border-gray-300 rounded-full text-sm font-medium text-gray-700 hover:bg-gray-50 hover:border-gray-400 transition-all">
              {t.dashboard.accountsReceivable}
            </button>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
          className="mt-4"
        >
          <button className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900">
            <AlertCircle className="w-4 h-4" />
            <span>{t.dashboard.whySeeSuggestions}</span>
          </button>
        </motion.div>
      </div>
    </div>
  );
}
