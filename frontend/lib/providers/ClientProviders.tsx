"use client";

import { ReactNode } from "react";
import { ToastProvider } from "@safee/ui";
import { DirectionWrapper } from "@/components/layout/DirectionWrapper";

interface ClientProvidersProps {
  children: ReactNode;
}

export function ClientProviders({ children }: ClientProvidersProps) {
  return (
    <ToastProvider>
      <DirectionWrapper>{children}</DirectionWrapper>
    </ToastProvider>
  );
}
