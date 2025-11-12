"use client";

import { createContext, useContext, ReactNode } from "react";
import { useOrgStore } from "@/stores/useOrgStore";
import arMessages from "@/messages/ar";
import enMessages from "@/messages/en";

type Messages = typeof arMessages | typeof enMessages;

interface TranslationContextType {
  t: Messages;
  locale: "ar" | "en";
}

const TranslationContext = createContext<TranslationContextType | undefined>(undefined);

export function TranslationProvider({ children }: { children: ReactNode }) {
  const { locale } = useOrgStore();

  const messages: Messages = locale === "ar" ? arMessages : enMessages;

  return (
    <TranslationContext.Provider value={{ t: messages, locale }}>{children}</TranslationContext.Provider>
  );
}

export function useTranslation() {
  const context = useContext(TranslationContext);
  if (!context) {
    throw new Error("useTranslation must be used within TranslationProvider");
  }
  return context;
}
