'use client'

import { SafeeLoginForm } from '@/components/auth/SafeeLoginForm'
import { useOrgStore } from '@/stores/useOrgStore'
import { useAuth } from '@/lib/auth/hooks'
import { useRouter } from 'next/navigation'
import { useState, useEffect } from 'react'

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
    or: "OR",
    termsPrefix: "By signing in, you agree to our",
    termsLink: "Terms & Conditions",
    termsMiddle: "and",
    privacyLink: "Privacy Policy",
  },
}

export default function LoginPage() {
  const router = useRouter()
  const { locale, setLocale } = useOrgStore()
  const { signIn, signInWithGoogle, isAuthenticated, isLoading } = useAuth()
  const [isArabic, setIsArabic] = useState(locale === 'ar')
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (isAuthenticated && !isLoading) {
      router.push('/')
    }
  }, [isAuthenticated, isLoading, router])

  const handleSubmit = async (email: string, password: string) => {
    try {
      setError(null)
      const result = await signIn(email, password)

      if (result.success) {
        router.push('/')
      } else {
        setError(result.error || 'Login failed. Please check your credentials.')
      }
    } catch (error) {
      console.error('Login failed:', error)
      setError('An unexpected error occurred. Please try again.')
    }
  }

  const handleGoogleLogin = async () => {
    try {
      signInWithGoogle()
    } catch (error) {
      console.error('Google login failed:', error)
      setError('Google login failed. Please try again.')
    }
  }

  const handleSSOLogin = async () => {
    try {
      // TODO: Implement SSO (SAML/OIDC) for enterprise customers
      setError('SSO is not yet available. Coming soon!')
    } catch (error) {
      console.error('SSO login failed:', error)
      setError('SSO login failed. Please try again.')
    }
  }

  const handleGoBack = () => {
    // Redirect to landing page (different subdomain)
    if (typeof window !== 'undefined') {
      window.location.href = process.env.NEXT_PUBLIC_LANDING_URL || 'http://localhost:8080'
    }
  }

  const toggleLanguage = () => {
    const newLocale = isArabic ? 'en' : 'ar'
    setLocale(newLocale)
    setIsArabic(!isArabic)
  }

  const t = translations[locale]

  return (
    <div dir={locale === 'ar' ? 'rtl' : 'ltr'}>
      <button
        onClick={toggleLanguage}
        className="fixed top-4 right-4 z-50 px-4 py-2 rounded-lg bg-safee-600 hover:bg-safee-700 text-white shadow-lg transition-colors"
      >
        {isArabic ? 'English' : 'العربية'}
      </button>

      {error && (
        <div className="fixed top-20 right-4 z-50 px-4 py-3 rounded-lg bg-red-500 text-white shadow-lg max-w-md">
          {error}
        </div>
      )}

      <SafeeLoginForm
        t={t}
        onSubmit={handleSubmit}
        onGoogleLogin={handleGoogleLogin}
        onSSOLogin={handleSSOLogin}
        onGoBack={handleGoBack}
      />
    </div>
  )
}
