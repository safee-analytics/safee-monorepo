'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useOrgStore } from '@/stores/useOrgStore'
import { LanguageSwitcher } from '@/components/ui/LanguageSwitcher'
import { FiUser, FiLogOut, FiMenu, FiX } from 'react-icons/fi'
import { useState } from 'react'
import { getAllModules } from '@/lib/config/modules'

export function Navigation() {
  const pathname = usePathname()
  const { currentUser, locale, setModule, clearSession } = useOrgStore()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  const modules = getAllModules().map(m => ({
    id: m.key,
    name: m.name[locale],
    icon: m.icon,
    href: m.path
  }))

  const isActive = (path: string) => pathname?.startsWith(path)

  return (
    <nav className="bg-white border-b border-zinc-200 sticky top-0 z-40">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-safee-500 to-safee-700 flex items-center justify-center shadow-lg shadow-safee-500/30">
              <span className="text-white font-bold text-xl">S</span>
            </div>
            <span className="text-xl font-bold text-zinc-900 hidden sm:block">
              Safee Analytics
            </span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-1">
            {modules.map((module) => (
              <Link
                key={module.id}
                href={module.href}
                onClick={() => setModule(module.id)}
                className={`
                  flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all
                  ${isActive(module.href)
                    ? 'bg-safee-50 text-safee-700'
                    : 'text-zinc-600 hover:bg-zinc-50 hover:text-zinc-900'
                  }
                `}
              >
                <span className="text-xl">{module.icon}</span>
                <span>{module.name}</span>
              </Link>
            ))}
          </div>

          {/* Right Section */}
          <div className="flex items-center gap-3">
            <LanguageSwitcher />

            {currentUser && (
              <div className="hidden md:flex items-center gap-3">
                <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-zinc-50">
                  <FiUser className="text-zinc-600" />
                  <span className="text-sm font-medium text-zinc-700">
                    {currentUser.name}
                  </span>
                </div>

                <button
                  onClick={clearSession}
                  className="flex items-center gap-2 px-3 py-2 rounded-lg text-red-600 hover:bg-red-50 transition-colors"
                  title="Logout"
                >
                  <FiLogOut />
                </button>
              </div>
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
                    <span>Logout</span>
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
