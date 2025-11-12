"use client";

import { useState } from "react";
import Link from "next/link";
import { Search, Calendar, Bell, Settings, HelpCircle, User } from "lucide-react";
import { useTranslation } from "@/lib/providers/TranslationProvider";
import { LanguageSwitcher } from "@/components/ui/LanguageSwitcher";
import { useOrgStore } from "@/stores/useOrgStore";

export function SafeeNavigation() {
  const { t, locale } = useTranslation();
  const { currentUser } = useOrgStore();
  const [searchQuery, setSearchQuery] = useState("");

  return (
    <nav className="bg-white border-b border-gray-200 sticky top-0 z-50">
      <div className="px-6 py-3">
        <div className="flex items-center justify-between gap-4">
          {/* Logo & Company Name */}
          <Link href="/" className="flex items-center gap-3 flex-shrink-0">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-safee-500 to-safee-700 flex items-center justify-center shadow-lg">
              <span className="text-white font-bold text-xl">S</span>
            </div>
            <span className="text-lg font-semibold text-gray-900 hidden sm:block">Safee Analytics</span>
          </Link>

          {/* Search Bar */}
          <div className="flex-1 max-w-2xl">
            <div className="relative">
              <Search
                className={`absolute ${locale === "ar" ? "right-4" : "left-4"} top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400`}
              />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={
                  locale === "ar"
                    ? "ابحث عن المعاملات، جهات الاتصال، التقارير والمزيد"
                    : "Navigate or search for transactions, contacts, reports, and more"
                }
                className={`w-full ${locale === "ar" ? "pr-12 pl-4" : "pl-12 pr-4"} py-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-safee-500 focus:bg-white transition-all`}
              />
            </div>
          </div>

          {/* Right Actions */}
          <div className="flex items-center gap-3">
            <LanguageSwitcher />

            <button className="text-sm text-safee-600 hover:text-safee-700 font-medium hidden lg:flex items-center gap-2">
              <User className="w-4 h-4" />
              {locale === "ar" ? "اتصل بالخبراء" : "Contact experts"}
            </button>

            <button className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">
              <Calendar className="w-5 h-5" />
            </button>

            <button className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors relative">
              <Bell className="w-5 h-5" />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full"></span>
            </button>

            <button className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">
              <Settings className="w-5 h-5" />
            </button>

            <button className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">
              <HelpCircle className="w-5 h-5" />
            </button>

            {/* User Avatar */}
            <button className="w-9 h-9 rounded-full bg-gradient-to-br from-safee-500 to-purple-600 flex items-center justify-center text-white font-semibold text-sm shadow-md hover:shadow-lg transition-shadow">
              {currentUser?.name?.charAt(0) || "U"}
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
}
