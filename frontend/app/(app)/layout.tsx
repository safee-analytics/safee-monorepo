'use client'

import { Sidebar } from '@/components/layout/Sidebar'
import { TranslationProvider } from '@/lib/providers/TranslationProvider'
import { SafeeToastContainer } from '@/components/feedback/SafeeToast'
import { StackedNotificationsContainer } from '@/components/feedback/Toast'

export default function AppLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <TranslationProvider>
      <div className="min-h-screen bg-indigo-50">
        <Sidebar />
        <main className="p-8 ml-[60px]">
          {children}
        </main>
        <SafeeToastContainer notifications={[]} onRemove={() => {}} />
        <StackedNotificationsContainer />
      </div>
    </TranslationProvider>
  )
}
