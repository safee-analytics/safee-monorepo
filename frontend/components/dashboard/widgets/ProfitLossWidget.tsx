"use client";

import { useTranslation } from "@/lib/providers/TranslationProvider";
import { Button } from "@safee/ui";

export const ProfitLossWidget = () => {
  const { t } = useTranslation();

  // TODO: [Backend/Frontend] - Fetch profit and loss data from API
  //   Details: The income and expenses data is currently hardcoded to $0. Implement a backend API endpoint to fetch real profit and loss data and integrate it here.
  //   Priority: High
  const income = 0;
  const expenses = 0;

  return (
    <div className="h-full flex flex-col">
      <div className="mb-4">
        <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">
          {t.dashboard.profitLoss}
        </h3>
        <p className="text-sm text-gray-600">{t.dashboard.profitLossDesc}</p>
      </div>

      <div className="space-y-4 mb-6 flex-1">
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-600">{t.dashboard.income}</span>
            <span className="text-lg font-semibold text-gray-900">${income.toLocaleString()}</span>
          </div>
          <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-green-500 rounded-full"
              style={{ width: `${Math.min(100, (income / (income + expenses || 1)) * 100)}%` }}
            ></div>
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-600">{t.dashboard.expensesLabel}</span>
            <span className="text-lg font-semibold text-gray-900">${expenses.toLocaleString()}</span>
          </div>
          <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-red-500 rounded-full"
              style={{ width: `${Math.min(100, (expenses / (income + expenses || 1)) * 100)}%` }}
            ></div>
          </div>
        </div>
      </div>

      <Button variant="outline" className="w-full">
        {t.dashboard.bringTransactionsAuto}
      </Button>
    </div>
  );
};
