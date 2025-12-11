"use client";

import { Suspense, useEffect, useState, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useVerifyEmail } from "@/lib/api/hooks/auth";
import { useOrgStore } from "@/stores/useOrgStore";

const translations = {
  ar: {
    verifying: "جاري التحقق من البريد الإلكتروني...",
    success: "تم التحقق!",
    successDescription: "تم التحقق من بريدك الإلكتروني بنجاح.",
    error: "فشل التحقق",
    invalidToken: "رابط التحقق غير صالح أو منتهي الصلاحية.",
    continueToApp: "الانتقال إلى التطبيق",
    backToLogin: "العودة إلى تسجيل الدخول",
  },
  en: {
    verifying: "Verifying your email...",
    success: "Verified!",
    successDescription: "Your email has been successfully verified.",
    error: "Verification Failed",
    invalidToken: "This verification link is invalid or has expired.",
    continueToApp: "Continue to App",
    backToLogin: "Back to Login",
  },
};

function VerifyEmailContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { locale, setLocale } = useOrgStore();
  const verifyEmailMutation = useVerifyEmail();
  const [isVerifying, setIsVerifying] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isArabic, setIsArabic] = useState(locale === "ar");

  const token = searchParams.get("token");
  const t = translations[locale];

  const verifyEmail = useCallback(async () => {
    if (!token) {
      setError(t.invalidToken);
      setIsVerifying(false);
      return;
    }

    try {
      await verifyEmailMutation.mutateAsync(token);
      setIsVerifying(false);
    } catch (err) {
      console.error("Email verification failed:", err);
      setError(err instanceof Error ? err.message : t.invalidToken);
      setIsVerifying(false);
    }
  }, [token, t.invalidToken, verifyEmailMutation]);

  useEffect(() => {
    verifyEmail();
  }, [verifyEmail]);

  const toggleLanguage = () => {
    const newLocale = isArabic ? "en" : "ar";
    setLocale(newLocale);
    setIsArabic(!isArabic);
  };

  // Verifying state
  if (isVerifying) {
    return (
      <div
        dir={locale === "ar" ? "rtl" : "ltr"}
        className="bg-gradient-to-br from-gray-50 to-gray-100 min-h-screen flex items-center justify-center p-4"
      >
        <button
          onClick={toggleLanguage}
          className="fixed top-4 right-4 z-50 px-4 py-2 rounded-lg bg-safee-600 hover:bg-safee-700 text-white shadow-lg transition-colors"
        >
          {isArabic ? "English" : "العربية"}
        </button>

        <div className="bg-white rounded-xl shadow-lg p-8 max-w-md w-full text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-safee-500 mx-auto mb-4"></div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">{t.verifying}</h2>
          <p className="text-gray-600">Please wait...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div
        dir={locale === "ar" ? "rtl" : "ltr"}
        className="bg-gradient-to-br from-gray-50 to-gray-100 min-h-screen flex items-center justify-center p-4"
      >
        <button
          onClick={toggleLanguage}
          className="fixed top-4 right-4 z-50 px-4 py-2 rounded-lg bg-safee-600 hover:bg-safee-700 text-white shadow-lg transition-colors"
        >
          {isArabic ? "English" : "العربية"}
        </button>

        <div className="bg-white rounded-xl shadow-lg p-8 max-w-md w-full text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">{t.error}</h2>
          <p className="text-gray-600 mb-6">{error}</p>
          <button
            onClick={() => { router.push("/login"); }}
            className="w-full bg-safee-600 hover:bg-safee-700 text-white font-medium py-3 px-4 rounded-lg transition-colors"
          >
            {t.backToLogin}
          </button>
        </div>
      </div>
    );
  }

  // Success state
  return (
    <div
      dir={locale === "ar" ? "rtl" : "ltr"}
      className="bg-gradient-to-br from-gray-50 to-gray-100 min-h-screen flex items-center justify-center p-4"
    >
      <button
        onClick={toggleLanguage}
        className="fixed top-4 right-4 z-50 px-4 py-2 rounded-lg bg-safee-600 hover:bg-safee-700 text-white shadow-lg transition-colors"
      >
        {isArabic ? "English" : "العربية"}
      </button>

      <div className="bg-white rounded-xl shadow-lg p-8 max-w-md w-full text-center">
        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">{t.success}</h2>
        <p className="text-gray-600 mb-6">{t.successDescription}</p>
        <button
          onClick={() => { router.push("/"); }}
          className="w-full bg-safee-600 hover:bg-safee-700 text-white font-medium py-3 px-4 rounded-lg transition-colors"
        >
          {t.continueToApp}
        </button>
      </div>
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense
      fallback={
        <div className="bg-gradient-to-br from-gray-50 to-gray-100 min-h-screen flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-lg p-8 max-w-md w-full text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-safee-500 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading...</p>
          </div>
        </div>
      }
    >
      <VerifyEmailContent />
    </Suspense>
  );
}
