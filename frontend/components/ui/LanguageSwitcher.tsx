"use client";

import { useOrgStore } from "@/stores/useOrgStore";
import { useEffect } from "react";
import { useProfile } from "@/lib/auth/useProfile";

export const LanguageSwitcher = () => {
  const { locale } = useOrgStore();
  const { changeLocale } = useProfile();
  const isArabic = locale === "ar";

  // Update document direction whenever locale changes
  useEffect(() => {
    document.documentElement.dir = locale === "ar" ? "rtl" : "ltr";
    document.documentElement.lang = locale;
  }, [locale]);

  const toggleLanguage = async () => {
    const newLocale = isArabic ? "en" : "ar";
    // Persist to API (also updates store)
    await changeLocale(newLocale);
  };

  return (
    <button
      onClick={toggleLanguage}
      className="flex items-center gap-2 px-3 py-2 rounded-lg text-gray-700 hover:bg-gray-100 transition-colors"
      title={isArabic ? "Switch to English" : "Switch to Arabic"}
    >
      <LanguageIcon isArabic={isArabic} />
      <span className="text-sm font-medium hidden lg:block">{isArabic ? "EN" : "ع"}</span>
    </button>
  );
};

const LanguageIcon = ({ isArabic }: { isArabic: boolean }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="18"
    height="18"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className="transition-transform"
    style={{ transform: isArabic ? "scaleX(-1)" : "scaleX(1)" }}
  >
    <circle cx="12" cy="12" r="10" />
    <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
    <path d="M2 12h20" />
  </svg>
);

export default LanguageSwitcher;
