"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useResetPassword } from "@/lib/api/hooks/auth";
import { useOrgStore } from "@/stores/useOrgStore";

const translations = {
  ar: {
    title: "إعادة تعيين كلمة المرور",
    subtitle: "أدخل كلمة المرور الجديدة",
    password: "كلمة المرور الجديدة",
    passwordPlaceholder: "••••••••••••",
    confirmPassword: "تأكيد كلمة المرور",
    confirmPasswordPlaceholder: "••••••••••••",
    resetPassword: "إعادة تعيين كلمة المرور",
    backToLogin: "العودة إلى تسجيل الدخول",
    passwordRequirements: "يجب أن تحتوي كلمة المرور على 8 أحرف على الأقل",
    passwordMismatch: "كلمات المرور غير متطابقة",
    success: "تم إعادة تعيين كلمة المرور!",
    successDescription: "تم تحديث كلمة المرور الخاصة بك. يمكنك الآن تسجيل الدخول.",
    invalidToken: "رابط غير صالح",
    invalidTokenDescription: "رابط إعادة تعيين كلمة المرور غير صالح أو منتهي الصلاحية.",
  },
  en: {
    title: "Reset Password",
    subtitle: "Enter your new password",
    password: "New Password",
    passwordPlaceholder: "••••••••••••",
    confirmPassword: "Confirm Password",
    confirmPasswordPlaceholder: "••••••••••••",
    resetPassword: "Reset Password",
    backToLogin: "Back to Login",
    passwordRequirements: "Password must be at least 8 characters",
    passwordMismatch: "Passwords do not match",
    success: "Password Reset!",
    successDescription: "Your password has been updated. You can now sign in.",
    invalidToken: "Invalid Link",
    invalidTokenDescription: "This password reset link is invalid or has expired.",
  },
};

function ResetPasswordContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { locale, setLocale } = useOrgStore();
  const resetPasswordMutation = useResetPassword();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [isArabic, setIsArabic] = useState(locale === "ar");

  const token = searchParams.get("token");
  const t = translations[locale];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validation
    if (password.length < 8) {
      setError(t.passwordRequirements);
      return;
    }

    if (password !== confirmPassword) {
      setError(t.passwordMismatch);
      return;
    }

    if (!token) {
      setError(t.invalidTokenDescription);
      return;
    }

    void (async () => {
      try {
        await resetPasswordMutation.mutateAsync({ token, password });
        setSuccess(true);
        // Redirect to login after 2 seconds
        setTimeout(() => {
          router.push("/login");
        }, 2000);
      } catch (err) {
        console.error("Failed to reset password:", err);
        setError(err instanceof Error ? err.message : "Failed to reset password. Please try again.");
      }
    })();
  };

  const toggleLanguage = () => {
    const newLocale = isArabic ? "en" : "ar";
    setLocale(newLocale);
    setIsArabic(!isArabic);
  };

  // Invalid token state
  if (!token) {
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
          <h2 className="text-2xl font-bold text-gray-900 mb-2">{t.invalidToken}</h2>
          <p className="text-gray-600 mb-6">{t.invalidTokenDescription}</p>
          <button
            onClick={() => { router.push("/forgot-password"); }}
            className="w-full bg-safee-600 hover:bg-safee-700 text-white font-medium py-3 px-4 rounded-lg transition-colors"
          >
            Request New Link
          </button>
        </div>
      </div>
    );
  }

  // Success state
  if (success) {
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
          <p className="text-sm text-gray-500">Redirecting to login...</p>
        </div>
      </div>
    );
  }

  // Reset password form
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
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
              {t.password}
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => { setPassword(e.target.value); }}
              placeholder={t.passwordPlaceholder}
              required
              minLength={8}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-safee-500 focus:border-transparent transition-colors"
            />
            <p className="text-xs text-gray-500 mt-1">{t.passwordRequirements}</p>
          </div>

          <div>
            <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-2">
              {t.confirmPassword}
            </label>
            <input
              id="confirmPassword"
              type="password"
              value={confirmPassword}
              onChange={(e) => { setConfirmPassword(e.target.value); }}
              placeholder={t.confirmPasswordPlaceholder}
              required
              minLength={8}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-safee-500 focus:border-transparent transition-colors"
            />
          </div>

          <button
            type="submit"
            disabled={resetPasswordMutation.isPending}
            className="w-full bg-safee-600 hover:bg-safee-700 disabled:bg-gray-400 text-white font-medium py-3 px-4 rounded-lg transition-colors"
          >
            {resetPasswordMutation.isPending ? "Resetting..." : t.resetPassword}
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

export default function ResetPasswordPage() {
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
      <ResetPasswordContent />
    </Suspense>
  );
}
