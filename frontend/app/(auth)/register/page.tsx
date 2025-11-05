'use client'

import { SafeeSignupForm } from '@/components/auth/SafeeSignupForm'
import { useAuth } from '@/lib/auth/hooks'
import { useOrgStore } from '@/stores/useOrgStore'
import { useRouter } from 'next/navigation'
import { useState, useEffect } from 'react'

const translations = {
  ar: {
    title: "إنشاء حساب جديد",
    subtitle: "لديك حساب بالفعل؟",
    signIn: "تسجيل الدخول",
    goBack: "رجوع",
    name: "الاسم الكامل",
    namePlaceholder: "أحمد محمد",
    organizationName: "اسم الشركة",
    organizationNamePlaceholder: "شركة مثال",
    email: "البريد الإلكتروني",
    emailPlaceholder: "your.email@company.com",
    password: "كلمة المرور",
    passwordPlaceholder: "••••••••••••",
    confirmPassword: "تأكيد كلمة المرور",
    confirmPasswordPlaceholder: "••••••••••••",
    signUp: "إنشاء حساب",
    signUpWithGoogle: "التسجيل باستخدام Google",
    or: "أو",
    termsPrefix: "بإنشاء حساب، أنت توافق على",
    termsLink: "الشروط والأحكام",
    termsMiddle: "و",
    privacyLink: "سياسة الخصوصية",
  },
  en: {
    title: "Create your account",
    subtitle: "Already have an account?",
    signIn: "Sign in",
    goBack: "Go back",
    name: "Full Name",
    namePlaceholder: "John Doe",
    organizationName: "Company Name",
    organizationNamePlaceholder: "Acme Inc.",
    email: "Email",
    emailPlaceholder: "your.email@company.com",
    password: "Password",
    passwordPlaceholder: "••••••••••••",
    confirmPassword: "Confirm Password",
    confirmPasswordPlaceholder: "••••••••••••",
    signUp: "Sign up",
    signUpWithGoogle: "Sign up with Google",
    or: "OR",
    termsPrefix: "By signing up, you agree to our",
    termsLink: "Terms & Conditions",
    termsMiddle: "and",
    privacyLink: "Privacy Policy",
  },
}

export default function RegisterPage() {
  const router = useRouter()
  const { locale, setLocale } = useOrgStore()
  const { signUp, signInWithGoogle, isAuthenticated, isLoading } = useAuth()
  const [isArabic, setIsArabic] = useState(locale === 'ar')
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (isAuthenticated && !isLoading) {
      router.push('/onboarding')
    }
  }, [isAuthenticated, isLoading, router])

  const handleSubmit = async (name: string, email: string, password: string, confirmPassword: string) => {
    try {
      setError(null)

      if (password !== confirmPassword) {
        setError('Passwords do not match')
        return
      }

      if (password.length < 8) {
        setError('Password must be at least 8 characters')
        return
      }

      const result = await signUp(email, password, name)

      if (result.success) {
        router.push('/onboarding')
      } else {
        setError(result.error || 'Registration failed. Please try again.')
      }
    } catch (error) {
      console.error('Registration failed:', error)
      setError('An unexpected error occurred. Please try again.')
    }
  }

  const handleGoogleSignUp = async () => {
    try {
      signInWithGoogle()
    } catch (error) {
      console.error('Google signup failed:', error)
      setError('Google signup failed. Please try again.')
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

      {error && (
        <div className="fixed top-20 right-4 z-50 px-4 py-3 rounded-lg bg-red-500 text-white shadow-lg max-w-md">
          {error}
        </div>
      )}

      <SafeeSignupForm
        t={t}
        onSubmit={handleSubmit}
        onGoogleSignup={handleGoogleSignUp}
        onGoBack={handleGoBack}
      />
    </div>
  )
}
