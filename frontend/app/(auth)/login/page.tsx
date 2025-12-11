"use client";

import { SafeeLoginForm } from "@/components/auth/SafeeLoginForm";
import { TwoFactorVerification } from "@/components/auth/TwoFactorVerification";
import { useOrgStore } from "@/stores/useOrgStore";
import { useAuth } from "@/lib/auth/hooks";
import { useSendMagicLink } from "@/lib/api/hooks";
import { useRouter } from "next/navigation";
import { useState, useEffect, useRef } from "react";

const translations = {
  ar: {
    title: "تسجيل الدخول إلى حسابك",
    subtitle: "ليس لديك حساب؟",
    createAccount: "إنشاء حساب جديد",
    goBack: "رجوع",
    email: "البريد الإلكتروني",
    emailPlaceholder: "your.email@company.com",
    password: "كلمة المرور",
    passwordPlaceholder: "••••••••••••",
    forgotPassword: "نسيت كلمة المرور؟",
    signIn: "تسجيل الدخول",
    signInWithGoogle: "تسجيل الدخول باستخدام Google",
    signInWithSSO: "تسجيل الدخول باستخدام SSO",
    signInWithMagicLink: "إرسال رابط سحري",
    useMagicLink: "استخدم رابط سحري بدلاً من ذلك",
    usePassword: "استخدم كلمة المرور بدلاً من ذلك",
    magicLinkSent: "تم إرسال الرابط السحري!",
    magicLinkDescription:
      "قم بفحص بريدك الإلكتروني للحصول على رابط تسجيل الدخول. سينتهي الرابط خلال 15 دقيقة.",
    or: "أو",
    termsPrefix: "بتسجيل الدخول، أنت توافق على",
    termsLink: "الشروط والأحكام",
    termsMiddle: "و",
    privacyLink: "سياسة الخصوصية",
  },
  en: {
    title: "Sign in to your account",
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
    signInWithMagicLink: "Send Magic Link",
    useMagicLink: "Use a magic link instead",
    usePassword: "Use password instead",
    magicLinkSent: "Magic Link Sent!",
    magicLinkDescription: "Check your email for a sign-in link. The link will expire in 15 minutes.",
    or: "OR",
    termsPrefix: "By signing in, you agree to our",
    termsLink: "Terms & Conditions",
    termsMiddle: "and",
    privacyLink: "Privacy Policy",
  },
};

export default function LoginPage() {
  const router = useRouter();
  const { locale, setLocale } = useOrgStore();
  const { signIn, signInWithGoogle, isAuthenticated, isLoading } = useAuth();
  const sendMagicLinkMutation = useSendMagicLink();

  const [isArabic, setIsArabic] = useState(locale === "ar");
  const [error, setError] = useState<string | null>(null);
  const [show2FAVerification, setShow2FAVerification] = useState(false);
  const [loginEmail, setLoginEmail] = useState<string>("");
  const [useMagicLinkMode, setUseMagicLinkMode] = useState(false);
  const [magicLinkSent, setMagicLinkSent] = useState(false);
  const hasRedirected = useRef(false);

  // Get redirect URL from session storage or default to '/'
  const getRedirectUrl = () => {
    if (typeof window !== "undefined") {
      const redirectUrl = sessionStorage.getItem("redirectAfterLogin") || "/";
      return redirectUrl;
    }
    return "/";
  };

  useEffect(() => {
    // Only redirect once, even if the effect runs multiple times
    if (isAuthenticated && !isLoading && !hasRedirected.current) {
      hasRedirected.current = true;
      const redirectUrl = getRedirectUrl();
      // Clear the redirect URL from storage
      if (typeof window !== "undefined") {
        sessionStorage.removeItem("redirectAfterLogin");
      }
      router.push(redirectUrl);
    }
  }, [isAuthenticated, isLoading, router]);

  // Show loading state while checking authentication to prevent flash
  if (isLoading) {
    return (
      <div className="bg-gradient-to-br from-gray-50 to-gray-100 min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-safee-500"></div>
      </div>
    );
  }

  // If already authenticated, show loading while redirecting
  if (isAuthenticated) {
    return (
      <div className="bg-gradient-to-br from-gray-50 to-gray-100 min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-safee-500"></div>
      </div>
    );
  }

  const handleSubmit = async (email: string, password: string) => {
    try {
      setError(null);
      setLoginEmail(email);
      const result = await signIn(email, password);

      if (result.success && !hasRedirected.current) {
        hasRedirected.current = true;
        const redirectUrl = getRedirectUrl();
        // Clear the redirect URL from storage
        if (typeof window !== "undefined") {
          sessionStorage.removeItem("redirectAfterLogin");
        }
        router.push(redirectUrl);
      } else if (!result.success) {
        // Check if 2FA is required
        if (
          result.error?.includes("2FA") ||
          result.error?.includes("two-factor") ||
          result.error?.includes("verification required")
        ) {
          setShow2FAVerification(true);
        } else {
          setError(result.error || "Login failed. Please check your credentials.");
        }
      }
    } catch (err) {
      console.error("Login failed:", err);
      const errorMessage = err instanceof Error ? err.message : "An unexpected error occurred";

      // Check if error is related to 2FA requirement
      if (
        errorMessage.includes("2FA") ||
        errorMessage.includes("two-factor") ||
        errorMessage.includes("verification required")
      ) {
        setShow2FAVerification(true);
      } else {
        setError(errorMessage);
      }
    }
  };

  const handleGoogleLogin = async () => {
    try {
      await signInWithGoogle("/");
    } catch (err) {
      console.error("Google login failed:", err);
      setError("Google login failed. Please try again.");
    }
  };

  const handleSSOLogin = async () => {
    try {
      // TODO: Implement SSO (SAML/OIDC) for enterprise customers
      setError("SSO is not yet available. Coming soon!");
    } catch (err) {
      console.error("SSO login failed:", err);
      setError("SSO login failed. Please try again.");
    }
  };

  const handle2FASuccess = () => {
    setShow2FAVerification(false);
    if (!hasRedirected.current) {
      hasRedirected.current = true;
      const redirectUrl = getRedirectUrl();
      if (typeof window !== "undefined") {
        sessionStorage.removeItem("redirectAfterLogin");
      }
      router.push(redirectUrl);
    }
  };

  const handleSendMagicLink = async (email: string) => {
    try {
      setError(null);
      const redirectUrl = getRedirectUrl();
      await sendMagicLinkMutation.mutateAsync({
        email,
        callbackURL: `${window.location.origin}/verify-magic-link?redirect=${encodeURIComponent(redirectUrl)}`,
      });
      setMagicLinkSent(true);
      setLoginEmail(email);
    } catch (err) {
      console.error("Failed to send magic link:", err);
      setError("Failed to send magic link. Please try again.");
    }
  };

  const handleGoBack = () => {
    // Redirect to landing page (different subdomain)
    if (typeof window !== "undefined") {
      window.location.href = process.env.NEXT_PUBLIC_LANDING_URL || "http://localhost:8080";
    }
  };

  const toggleLanguage = () => {
    const newLocale = isArabic ? "en" : "ar";
    setLocale(newLocale);
    setIsArabic(!isArabic);
  };

  const t = translations[locale];

  return (
    <div dir={locale === "ar" ? "rtl" : "ltr"} suppressHydrationWarning>
      <button
        onClick={toggleLanguage}
        className="fixed top-4 right-4 z-50 px-4 py-2 rounded-lg bg-safee-600 hover:bg-safee-700 text-white shadow-lg transition-colors"
        suppressHydrationWarning
      >
        {isArabic ? "English" : "العربية"}
      </button>

      {error && (
        <div className="fixed top-20 right-4 z-50 px-4 py-3 rounded-lg bg-red-500 text-white shadow-lg max-w-md">
          {error}
        </div>
      )}

      {magicLinkSent ? (
        <div className="relative z-10 mx-auto w-full max-w-xl p-4">
          <div className="bg-white rounded-xl shadow-lg p-8 text-center">
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
            <h2 className="text-2xl font-bold text-gray-900 mb-2">{t.magicLinkSent}</h2>
            <p className="text-gray-600 mb-4">{t.magicLinkDescription}</p>
            <p className="text-sm text-gray-500 mb-6">
              Sent to: <span className="font-medium">{loginEmail}</span>
            </p>
            <button
              onClick={() => {
                setMagicLinkSent(false);
                setUseMagicLinkMode(false);
              }}
              className="text-safee-600 hover:text-safee-700 text-sm font-medium"
            >
              {t.usePassword}
            </button>
          </div>
        </div>
      ) : (
        <SafeeLoginForm
          t={t}
          onSubmit={(email, password) => {
            void handleSubmit(email, password);
          }}
          onGoogleLogin={() => {
            void handleGoogleLogin();
          }}
          onSSOLogin={() => {
            void handleSSOLogin();
          }}
          onGoBack={handleGoBack}
          onSendMagicLink={(email) => {
            void handleSendMagicLink(email);
          }}
          useMagicLinkMode={useMagicLinkMode}
          onToggleMagicLink={() => {
            setUseMagicLinkMode(!useMagicLinkMode);
          }}
        />
      )}

      {/* 2FA Verification Modal */}
      <TwoFactorVerification
        isOpen={show2FAVerification}
        onClose={() => {
          setShow2FAVerification(false);
        }}
        onSuccess={handle2FASuccess}
        email={loginEmail}
      />
    </div>
  );
}
