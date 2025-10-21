'use client'

import { SafeeLoginForm } from '@/components/auth/SafeeLoginForm'
import { useOrgStore } from '@/stores/useOrgStore'
import { useRouter } from 'next/navigation'
import { useState } from 'react'

// Translation strings
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
  const [isArabic, setIsArabic] = useState(locale === 'ar')

  const handleSubmit = async (email: string, password: string) => {
    try {
      // TODO: Call your authentication API here
      alert(`Login attempt:\nEmail: ${email}\nPassword: ${password}`)

      // Example: Simulate API call
      // const response = await api.auth.login(email, password)
      // setUser(response.user)
      // setOrg(response.organization)

      // Redirect to dashboard
      // router.push('/org-id/hisabiq')
    } catch (error) {
      console.error('Login failed:', error)
      // Show error toast
    }
  }

  const handleGoogleLogin = async () => {
    try {
      // TODO: Implement Google OAuth
      alert('Google login clicked')
      // Example: Redirect to Google OAuth
      // window.location.href = '/api/auth/google'
    } catch (error) {
      console.error('Google login failed:', error)
    }
  }

  const handleSSOLogin = async () => {
    try {
      // TODO: Implement SSO
      alert('SSO login clicked')
      // Example: Redirect to SSO provider
      // window.location.href = '/api/auth/sso'
    } catch (error) {
      console.error('SSO login failed:', error)
    }
  }

  const handleGoBack = () => {
    router.push('/')
  }

  const toggleLanguage = () => {
    const newLocale = isArabic ? 'en' : 'ar'
    setLocale(newLocale)
    setIsArabic(!isArabic)
  }

  const t = translations[locale]

  return (
    <div dir={locale === 'ar' ? 'rtl' : 'ltr'}>
      {/* Language switcher */}
      <button
        onClick={toggleLanguage}
        className="fixed top-4 right-4 z-50 px-4 py-2 rounded-lg bg-safee-600 hover:bg-safee-700 text-white shadow-lg transition-colors"
      >
        {isArabic ? 'English' : 'العربية'}
      </button>

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
