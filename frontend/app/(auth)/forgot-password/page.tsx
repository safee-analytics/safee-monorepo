"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForgotPassword } from "@/lib/api/hooks/auth";
import { useOrgStore } from "@/stores/useOrgStore";

const translations = {
  ar: {
    title: "نسيت كلمة المرور؟",
    subtitle: "أدخل بريدك الإلكتروني وسنرسل لك رابط إعادة تعيين كلمة المرور",
    email: "البريد الإلكتروني",
    emailPlaceholder: "your.email@company.com",
    sendResetLink: "إرسال رابط إعادة التعيين",
    backToLogin: "العودة إلى تسجيل الدخول",
    emailSent: "تم إرسال البريد الإلكتروني!",
    emailSentDescription:
      "قم بفحص بريدك الإلكتروني للحصول على رابط إعادة تعيين كلمة المرور. سينتهي الرابط خلال 15 دقيقة.",
    sentTo: "تم الإرسال إلى:",
  },
  en: {
    title: "Forgot Password?",
    subtitle: "Enter your email and we'll send you a link to reset your password",
    email: "Email",
    emailPlaceholder: "your.email@company.com",
    sendResetLink: "Send Reset Link",
    backToLogin: "Back to Login",
    emailSent: "Email Sent!",
    emailSentDescription: "Check your email for a password reset link. The link will expire in 15 minutes.",
    sentTo: "Sent to:",
  },
};

export default function ForgotPasswordPage() {
  const router = useRouter();
  const { locale, setLocale } = useOrgStore();
  const forgotPasswordMutation = useForgotPassword();
  const [email, setEmail] = useState("");
  const [emailSent, setEmailSent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isArabic, setIsArabic] = useState(locale === "ar");

  const t = translations[locale];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    void (async () => {
      try {
        await forgotPasswordMutation.mutateAsync({ email });
        setEmailSent(true);
      } catch (err) {
        console.error("Failed to send reset email:", err);
        setError(err instanceof Error ? err.message : "Failed to send reset email. Please try again.");
      }
    })();
  };

  const toggleLanguage = () => {
    const newLocale = isArabic ? "en" : "ar";
    setLocale(newLocale);
    setIsArabic(!isArabic);
  };

  if (emailSent) {
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
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
              />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">{t.emailSent}</h2>
          <p className="text-gray-600 mb-4">{t.emailSentDescription}</p>
          <p className="text-sm text-gray-500 mb-6">
            {t.sentTo} <span className="font-medium">{email}</span>
          </p>
          <button
            onClick={() => { router.push("/login"); }}
            className="text-safee-600 hover:text-safee-700 text-sm font-medium"
          >
            {t.backToLogin}
          </button>
        </div>
      </div>
    );
  }

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

      {error && (
        <div className="fixed top-20 right-4 z-50 px-4 py-3 rounded-lg bg-red-500 text-white shadow-lg max-w-md">
          {error}
        </div>
      )}

      <div className="bg-white rounded-xl shadow-lg p-8 max-w-md w-full">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-safee-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-safee-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
              />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">{t.title}</h2>
          <p className="text-gray-600">{t.subtitle}</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
              {t.email}
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => { setEmail(e.target.value); }}
              placeholder={t.emailPlaceholder}
              required
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-safee-500 focus:border-transparent transition-colors"
            />
          </div>

          <button
            type="submit"
            disabled={forgotPasswordMutation.isPending}
            className="w-full bg-safee-600 hover:bg-safee-700 disabled:bg-gray-400 text-white font-medium py-3 px-4 rounded-lg transition-colors"
          >
            {forgotPasswordMutation.isPending ? "Sending..." : t.sendResetLink}
          </button>

          <button
            type="button"
            onClick={() => { router.push("/login"); }}
            className="w-full text-gray-600 hover:text-gray-800 text-sm font-medium"
          >
            {t.backToLogin}
          </button>
        </form>
      </div>
    </div>
  );
}
