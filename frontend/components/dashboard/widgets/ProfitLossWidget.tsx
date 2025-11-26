"use client";

import { useTranslation } from "@/lib/providers/TranslationProvider";

export const ProfitLossWidget = () => {
  const { t } = useTranslation();

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
            <span className="text-lg font-semibold text-gray-900">$0</span>
          </div>
          <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
            <div className="h-full bg-green-500 rounded-full" style={{ width: "0%" }}></div>
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-600">{t.dashboard.expensesLabel}</span>
            <span className="text-lg font-semibold text-gray-900">$0</span>
          </div>
          <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
            <div className="h-full bg-red-500 rounded-full" style={{ width: "0%" }}></div>
          </div>
        </div>
      </div>

      <button className="w-full py-2.5 bg-gray-50 hover:bg-gray-100 text-gray-700 font-medium rounded-lg transition-colors">
        {t.dashboard.bringTransactionsAuto}
      </button>
    </div>
  );
};
