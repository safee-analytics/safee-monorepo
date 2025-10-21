'use client'

import { LanguageSwitcher } from "@/components/ui/LanguageSwitcher";

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-safee-50 via-white to-safee-100">
      <LanguageSwitcher />

      <main className="container mx-auto px-4 py-16">
        <h1 className="text-4xl font-bold text-safee-600 text-center">
          Safee Analytics
        </h1>
      </main>
    </div>
  );
}
