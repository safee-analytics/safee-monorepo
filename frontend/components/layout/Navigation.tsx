'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useOrgStore } from '@/stores/useOrgStore'
import { LanguageSwitcher } from '@/components/ui/LanguageSwitcher'
import { FiUser, FiLogOut, FiMenu, FiX, FiSearch, FiCalendar, FiBell, FiSettings, FiHelpCircle } from 'react-icons/fi'
import { useState } from 'react'
import { getAllModules } from '@/lib/config/modules'
import { useTranslation } from '@/lib/providers/TranslationProvider'

export function Navigation() {
  const pathname = usePathname()
  const { currentUser, locale, setModule, clearSession } = useOrgStore()
  const { t } = useTranslation()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')

  const modules = getAllModules().map(m => ({
    id: m.key,
    name: m.name[locale],
    icon: m.icon,
    href: m.path
  }))

  const isActive = (path: string) => pathname?.startsWith(path)

  return (
    <nav className="bg-white border-b border-zinc-200 sticky top-0 z-50">
      <div className="px-6 py-3">
        <div className="flex items-center justify-between gap-4">
          {/* Logo & Company Name */}
          <Link href="/" className="flex items-center gap-3 flex-shrink-0">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-safee-500 to-safee-700 flex items-center justify-center shadow-lg">
              <span className="text-white font-bold text-xl">S</span>
            </div>
            <span className="text-lg font-semibold text-gray-900 hidden sm:block">
              Safee Analytics
            </span>
          </Link>

          {/* Search Bar */}
          <div className="flex-1 max-w-2xl">
            <div className="relative">
              <FiSearch className={`absolute ${locale === 'ar' ? 'right-4' : 'left-4'} top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400`} />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={t.common.searchPlaceholder}
                className={`w-full ${locale === 'ar' ? 'pr-12 pl-4' : 'pl-12 pr-4'} py-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-safee-500 focus:bg-white transition-all`}
              />
            </div>
          </div>

          {/* Right Actions */}
          <div className="flex items-center gap-3">
            <LanguageSwitcher />

            <button className="text-sm text-safee-600 hover:text-safee-700 font-medium hidden lg:flex items-center gap-2">
              <FiUser className="w-4 h-4" />
              {t.common.contactExperts}
            </button>

            <button className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">
              <FiCalendar className="w-5 h-5" />
            </button>

            <button className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors relative">
              <FiBell className="w-5 h-5" />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full"></span>
            </button>

            <button className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">
              <FiSettings className="w-5 h-5" />
            </button>

            <button className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">
              <FiHelpCircle className="w-5 h-5" />
            </button>

            {/* User Avatar */}
            {currentUser && (
              <button className="w-9 h-9 rounded-full bg-gradient-to-br from-safee-500 to-purple-600 flex items-center justify-center text-white font-semibold text-sm shadow-md hover:shadow-lg transition-shadow">
                {currentUser.name?.charAt(0) || 'U'}
              </button>
            )}

            {/* Mobile Menu Button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 rounded-lg hover:bg-zinc-50"
            >
              {mobileMenuOpen ? <FiX size={24} /> : <FiMenu size={24} />}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden py-4 border-t border-zinc-200">
            <div className="flex flex-col gap-2">
              {modules.map((module) => (
                <Link
                  key={module.id}
                  href={module.href}
                  onClick={() => {
                    setModule(module.id)
                    setMobileMenuOpen(false)
                  }}
                  className={`
                    flex items-center gap-3 px-4 py-3 rounded-lg font-medium transition-all
                    ${isActive(module.href)
                      ? 'bg-safee-50 text-safee-700'
                      : 'text-zinc-600 hover:bg-zinc-50'
                    }
                  `}
                >
                  <span className="text-2xl">{module.icon}</span>
                  <span>{module.name}</span>
                </Link>
              ))}

              {currentUser && (
                <>
                  <div className="my-2 border-t border-zinc-200" />
                  <div className="flex items-center gap-3 px-4 py-3 text-zinc-700">
                    <FiUser />
                    <span className="font-medium">{currentUser.name}</span>
                  </div>
                  <button
                    onClick={() => {
                      clearSession()
                      setMobileMenuOpen(false)
                    }}
                    className="flex items-center gap-3 px-4 py-3 text-red-600 hover:bg-red-50 rounded-lg"
                  >
                    <FiLogOut />
                    <span>{t.auth.logout}</span>
                  </button>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </nav>
  )
}
