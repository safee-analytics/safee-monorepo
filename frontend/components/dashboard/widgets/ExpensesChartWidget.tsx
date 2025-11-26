"use client";

import { PieChart } from "lucide-react";
import { useTranslation } from "@/lib/providers/TranslationProvider";

export const ExpensesChartWidget = () => {
  const { t } = useTranslation();

  return (
    <div className="h-full flex flex-col">
      <div className="mb-4">
        <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">
          {t.dashboard.expensesWidget}
        </h3>
        <p className="text-sm text-gray-600">{t.dashboard.expensesWidgetDesc}</p>
      </div>

      <div className="flex items-center justify-center py-12 flex-1">
        <div className="w-40 h-40 rounded-full bg-gray-100 flex items-center justify-center">
          <PieChart className="w-20 h-20 text-gray-300" />
        </div>
      </div>

      <button className="w-full py-2.5 bg-gray-50 hover:bg-gray-100 text-gray-700 font-medium rounded-lg transition-colors">
        {t.dashboard.bringTransactionsAuto}
      </button>
    </div>
  );
};
