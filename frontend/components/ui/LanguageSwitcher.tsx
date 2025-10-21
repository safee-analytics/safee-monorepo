'use client'

import { useOrgStore } from '@/stores/useOrgStore'
import { useEffect } from 'react'
import { motion } from 'framer-motion'

export const LanguageSwitcher = () => {
  const { locale, setLocale } = useOrgStore()
  const isArabic = locale === 'ar'

  // Update document direction whenever locale changes
  useEffect(() => {
    document.documentElement.dir = locale === 'ar' ? 'rtl' : 'ltr'
    document.documentElement.lang = locale
  }, [locale])

  const toggleLanguage = () => {
    const newLocale = isArabic ? 'en' : 'ar'
    setLocale(newLocale)
  }

  return (
    <button
      onClick={toggleLanguage}
      className="fixed top-4 right-4 z-50 flex items-center gap-2 px-4 py-2 rounded-lg bg-safee-600 hover:bg-safee-700 text-white shadow-lg transition-all hover:scale-105 active:scale-95"
    >
      <motion.span
        key={locale}
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 10 }}
        transition={{ duration: 0.2 }}
        className="font-medium"
      >
        {isArabic ? 'English' : 'العربية'}
      </motion.span>
      <LanguageIcon isArabic={isArabic} />
    </button>
  )
}

const LanguageIcon = ({ isArabic }: { isArabic: boolean }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="20"
    height="20"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className="transition-transform"
    style={{ transform: isArabic ? 'scaleX(-1)' : 'scaleX(1)' }}
  >
    <circle cx="12" cy="12" r="10" />
    <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
    <path d="M2 12h20" />
  </svg>
)

export default LanguageSwitcher
