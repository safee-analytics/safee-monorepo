"use client";

import { ReactNode } from "react";
import { ToastProvider } from "@safee/ui";
import { DirectionWrapper } from "@/components/layout/DirectionWrapper";
import { TranslationProvider } from "./TranslationProvider";
import { ThemeProvider } from "./ThemeProvider";

interface ClientProvidersProps {
  children: ReactNode;
}

export function ClientProviders({ children }: ClientProvidersProps) {
  return (
    <ThemeProvider>
      <ToastProvider>
        <TranslationProvider>
          <DirectionWrapper>{children}</DirectionWrapper>
        </TranslationProvider>
      </ToastProvider>
    </ThemeProvider>
  );
}
