'use client'

// Auth Components
import { DarkGridAuth } from "@/components/auth/LoginForm";
import { SafeeLoginForm } from "@/components/auth/SafeeLoginForm";

// Layout Components
import { Example as SidebarExample } from "@/components/layout/Sidebar";
import { ShiftHightlightTabs } from "@/components/layout/Tabs";

// Data Display Components
import { CustomKanban } from "@/components/data-display/KanbanBoard";
import ShuffleSortTable from "@/components/data-display/DataTable";
import { FlipCalendarExample } from "@/components/data-display/Calendar";

// Feedback Components
import { SafeeToastContainer } from "@/components/feedback/SafeeToast";
import StackedNotifications from "@/components/feedback/Toast";
import SteppedProgress from "@/components/feedback/StepProgress";
import { Example as ShuffleLoaderExample } from "@/components/feedback/ShuffleLoader";

// UI Components
import ExampleWrapper from "@/components/ui/Modal";
import StaggeredDropDown from "@/components/ui/Dropdown";
import HoverDevCards from "@/components/ui/HoverCard";
import DotExpandButton from "@/components/ui/ExpandButton";
import { VanishList } from "@/components/ui/AnimatedList";
import { LanguageSwitcher } from "@/components/ui/LanguageSwitcher";
import { useOrgStore } from "@/stores/useOrgStore";
import Link from "next/link";

export default function ComponentGallery() {
  const { locale } = useOrgStore()

  const translations = {
    ar: {
      title: "معرض مكونات Safee Analytics",
      description: "جميع المكونات جاهزة للاختبار. استخدم زر تبديل اللغة في الأعلى للتبديل بين العربية والإنجليزية.",
      backHome: "العودة للصفحة الرئيسية",
      auth: "مكونات المصادقة",
      layout: "مكونات التخطيط",
      dataDisplay: "مكونات عرض البيانات",
      feedback: "مكونات التغذية الراجعة",
      ui: "عناصر واجهة المستخدم",
    },
    en: {
      title: "Safee Analytics Component Gallery",
      description: "All components are imported and ready for testing. Use the language switcher at the top to toggle between Arabic and English.",
      backHome: "Back to Home",
      auth: "Authentication Components",
      layout: "Layout Components",
      dataDisplay: "Data Display Components",
      feedback: "Feedback Components",
      ui: "UI Elements",
    },
  }

  const t = translations[locale]

  return (
    <div className="p-8 space-y-8 min-h-screen bg-gradient-to-br from-zinc-50 to-zinc-100">
      <LanguageSwitcher />

      <div className="max-w-7xl mx-auto">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-safee-600 hover:text-safee-700 mb-6 transition-colors"
        >
          <span>←</span>
          {t.backHome}
        </Link>
        <h1 className="text-4xl font-bold text-safee-600 mb-4">{t.title}</h1>
        <p className="text-lg text-zinc-600 mb-8">{t.description}</p>

        {/* Auth Components */}
        <section className="bg-white rounded-lg shadow-md p-6 mb-8">
          <h2 className="text-2xl font-semibold mb-4 text-zinc-800">{t.auth}</h2>
        <DarkGridAuth />
        <SafeeLoginForm
          t={{
            title: "Sign in",
            subtitle: "Don't have an account?",
            createAccount: "Create one",
            goBack: "Go back",
            email: "Email",
            emailPlaceholder: "your.email@company.com",
            password: "Password",
            passwordPlaceholder: "••••••••••••",
            forgotPassword: "Forgot password?",
            signIn: "Sign in",
            signInWithGoogle: "Sign in with Google",
            signInWithSSO: "Sign in with SSO",
            or: "OR",
            termsPrefix: "By signing in, you agree to our",
            termsLink: "Terms & Conditions",
            termsMiddle: "and",
            privacyLink: "Privacy Policy",
          }}
        />
        </section>

        {/* Layout Components */}
        <section className="bg-white rounded-lg shadow-md p-6 mb-8">
          <h2 className="text-2xl font-semibold mb-4 text-zinc-800">{t.layout}</h2>
        <SidebarExample />
        <ShiftHightlightTabs />
        </section>

        {/* Data Display Components */}
        <section className="bg-white rounded-lg shadow-md p-6 mb-8">
          <h2 className="text-2xl font-semibold mb-4 text-zinc-800">{t.dataDisplay}</h2>
        <CustomKanban />
        <ShuffleSortTable />
        <FlipCalendarExample />
        </section>

        {/* Feedback Components */}
        <section className="bg-white rounded-lg shadow-md p-6 mb-8">
          <h2 className="text-2xl font-semibold mb-4 text-zinc-800">{t.feedback}</h2>
        <SafeeToastContainer
          notifications={[
            { id: "1", type: "success", message: "Action completed" }
          ]}
          onRemove={() => { }}
        />
        <StackedNotifications />
        <SteppedProgress />
        <ShuffleLoaderExample />
        </section>

        {/* UI Components */}
        <section className="bg-white rounded-lg shadow-md p-6 mb-8">
          <h2 className="text-2xl font-semibold mb-4 text-zinc-800">{t.ui}</h2>
        <ExampleWrapper />
        <StaggeredDropDown />
        <HoverDevCards />
        <DotExpandButton />
        <VanishList />
        </section>
      </div>
    </div>
  );
}
