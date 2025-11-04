'use client'

import { Sidebar } from '@/components/layout/Sidebar'
import { Navigation } from '@/components/layout/Navigation'
import { TranslationProvider } from '@/lib/providers/TranslationProvider'
import { SafeeToastContainer } from '@/components/feedback/SafeeToast'
import { StackedNotificationsContainer } from '@/components/feedback/Toast'
import { ProtectedRoute } from '@/components/auth'

export default function AppLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <ProtectedRoute>
      <TranslationProvider>
        <div className="min-h-screen bg-gray-50">
          <Navigation />
          <Sidebar />
          <main className="pt-[65px] pl-[64px]">
            {children}
          </main>
          <SafeeToastContainer notifications={[]} onRemove={() => {}} />
          <StackedNotificationsContainer />
        </div>
      </TranslationProvider>
    </ProtectedRoute>
  )
}
