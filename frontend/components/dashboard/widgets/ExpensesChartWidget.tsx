"use client";

import { PieChart } from "lucide-react";
import { useTranslation } from "@/lib/providers/TranslationProvider";
import { Button } from "@safee/ui";
import { type Expense, expenseSchema } from "@/lib/validation";

export const ExpensesChartWidget = () => {
  const { t } = useTranslation();

  // TODO: [Backend/Frontend] - Fetch expense data from API
  //   Details: The expenses chart is currently a placeholder. Implement a backend API endpoint to fetch expense data and integrate it here to display a real chart.
  //   Priority: High
  const expenses: Expense[] = expenseSchema.array().parse([]);

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

      <Button variant="outline" className="w-full">
        {t.dashboard.bringTransactionsAuto}
      </Button>
    </div>
  );
};
