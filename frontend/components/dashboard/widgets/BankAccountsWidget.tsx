"use client";

import { Plus, Building2, CreditCard } from "lucide-react";
import { useTranslation } from "@/lib/providers/TranslationProvider";

export const BankAccountsWidget = () => {
  const { t } = useTranslation();

  const banks = [
    { name: "Desjardins Online Solutions", icon: Building2, color: "from-green-500 to-green-600" },
    { name: "RBC Bank (CAN)", icon: CreditCard, color: "from-blue-500 to-blue-600" },
    { name: "TD Canada Trust", icon: Building2, color: "from-emerald-500 to-emerald-600" },
  ];

  return (
    <div className="h-full flex flex-col">
      <div className="mb-4">
        <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">
          {t.dashboard.bankAccounts}
        </h3>
        <p className="text-sm text-gray-600">{t.dashboard.bankAccountsDesc}</p>
      </div>

      <div className="space-y-3 mb-4 flex-1">
        {banks.map((bank) => {
          const Icon = bank.icon;
          return (
            <div
              key={bank.name}
              className="flex items-center gap-3 p-3 rounded-lg border border-gray-200 hover:border-safee-300 transition-colors"
            >
              <div
                className={`w-10 h-10 rounded bg-gradient-to-br ${bank.color} flex items-center justify-center flex-shrink-0`}
              >
                <Icon className="w-5 h-5 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-gray-900 truncate">{bank.name}</p>
              </div>
              <button className="flex-shrink-0 hover:scale-110 transition-transform">
                <Plus className="w-5 h-5 text-safee-600" />
              </button>
            </div>
          );
        })}
      </div>

      <button className="w-full py-2.5 bg-gray-50 hover:bg-gray-100 text-gray-700 font-medium rounded-lg transition-colors">
        {t.dashboard.findYourBank}
      </button>
    </div>
  );
};
