"use client";

import { useOrgStore } from "@/stores/useOrgStore";
import { useEffect } from "react";

interface DirectionWrapperProps {
  children: React.ReactNode;
}

export const DirectionWrapper = ({ children }: DirectionWrapperProps) => {
  const { locale } = useOrgStore();

  useEffect(() => {
    // Update document direction and lang attribute
    const isRTL = locale === "ar";
    document.documentElement.dir = isRTL ? "rtl" : "ltr";
    document.documentElement.lang = locale;

    // Update font based on locale
    const body = document.body;
    if (isRTL) {
      body.style.fontFamily = "var(--font-cairo), system-ui, sans-serif";
    } else {
      body.style.fontFamily = "var(--font-inter), system-ui, sans-serif";
    }
  }, [locale]);

  return <>{children}</>;
};

export default DirectionWrapper;
