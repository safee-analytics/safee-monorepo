"use client";

import { Sidebar } from "@/components/layout/Sidebar";
import { Navigation } from "@/components/layout/Navigation";
import { TranslationProvider } from "@/lib/providers/TranslationProvider";
import { SafeeToastContainer } from "@/components/feedback/SafeeToast";
import { StackedNotificationsContainer } from "@/components/feedback/Toast";
import { ProtectedRoute } from "@/components/auth";
import { useOrgStore } from "@/stores/useOrgStore";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const { sidebarAutoClose, sidebarCollapsed } = useOrgStore();

  // Sidebar is narrow if auto-close is on OR if it's manually collapsed
  const isNarrow = sidebarAutoClose || sidebarCollapsed;

  return (
    <ProtectedRoute>
      <TranslationProvider>
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
          {/* Top Navigation with bottom rounded corners */}
          <div className="fixed top-0 left-0 right-0 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 z-50">
            <Navigation />
          </div>

          {/* Sidebar with right rounded corners */}
          <div className="fixed top-[57px] ltr:left-0 rtl:right-0 h-[calc(100vh-57px)] bg-white dark:bg-gray-900 ltr:rounded-br-3xl rtl:rounded-bl-3xl ltr:border-r rtl:border-l border-gray-200 dark:border-gray-800 z-40 overflow-hidden">
            <Sidebar />
          </div>

          {/* Main Content */}
          <main
            className={`pt-[57px] transition-all duration-200 ${
              isNarrow ? "ltr:pl-[56px] rtl:pr-[56px]" : "ltr:pl-[225px] rtl:pr-[225px]"
            }`}
          >
            {children}
          </main>
          <SafeeToastContainer notifications={[]} onRemove={() => {}} />
          <StackedNotificationsContainer />
        </div>
      </TranslationProvider>
    </ProtectedRoute>
  );
}
