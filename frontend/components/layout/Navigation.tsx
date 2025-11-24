"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useOrgStore } from "@/stores/useOrgStore";
import { LanguageSwitcher } from "@/components/ui/LanguageSwitcher";
import {
  FiUser,
  FiLogOut,
  FiMenu,
  FiX,
  FiSearch,
  FiCalendar,
  FiBell,
  FiSettings,
  FiHelpCircle,
  FiChevronDown,
} from "react-icons/fi";
import { useState, useRef, useEffect } from "react";
import { getAllModules } from "@/lib/config/modules";
import { useTranslation } from "@/lib/providers/TranslationProvider";
import { useAuth } from "@/lib/auth/hooks";
import { CommandPalette } from "@/components/search/CommandPalette";
import { SearchBar } from "@/components/search/SearchBar";
import { useActiveOrganization, useListOrganizations, useOrganizationMembers } from "@/lib/api/hooks";
import { CompanyMenu } from "./CompanyMenu";

export function Navigation() {
  const pathname = usePathname();
  const { currentUser, currentOrg, locale, setModule, clearSession } = useOrgStore();
  const { t } = useTranslation();
  const { signOut, user } = useAuth();

  const { data: activeOrg } = useActiveOrganization();
  const { data: allOrgs } = useListOrganizations();

  const displayOrg = activeOrg || allOrgs?.[0] || currentOrg;

  const { data: members } = useOrganizationMembers(displayOrg?.id || "");

  const currentMember = members?.find((m) => m.userId === user?.id);
  const userRole = currentMember?.role;
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [commandPaletteOpen, setCommandPaletteOpen] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setUserMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Close menus with ESC key
  useEffect(() => {
    function handleEscKey(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setUserMenuOpen(false);
        setMobileMenuOpen(false);
      }
    }
    document.addEventListener("keydown", handleEscKey);
    return () => document.removeEventListener("keydown", handleEscKey);
  }, []);

  const handleLogout = async () => {
    await signOut();
    clearSession();
    setUserMenuOpen(false);
  };

  const modules = getAllModules().map((m) => ({
    id: m.key,
    name: m.name[locale],
    icon: m.icon,
    href: m.path,
  }));

  const isActive = (path: string) => pathname?.startsWith(path);

  return (
    <nav className="bg-white">
      <div className="px-6 py-3">
        <div className="flex items-center justify-between gap-4">
          {/* Logo & Company Name */}
          <div className="flex items-center gap-3 flex-shrink-0">
            <Link href="/" className="flex items-center gap-2">
              {/* Safee Logo */}
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-safee-500 to-safee-700 flex items-center justify-center shadow">
                <span className="text-white font-bold text-base">S</span>
              </div>
              {/* Platform Name - Stacked */}
              <div className="hidden sm:flex flex-col leading-tight">
                <span className="text-sm font-bold text-gray-900">Safee</span>
                <span className="text-xs font-semibold text-gray-600">Analytics</span>
              </div>
            </Link>

            {/* Divider - always show */}
            <div className="hidden sm:block w-px h-6 bg-gray-300"></div>

            {/* Company Name and Logo */}
            <div className="hidden sm:flex items-center gap-2">
              {displayOrg?.logo && (
                <div className="w-6 h-6 rounded overflow-hidden border border-gray-200 flex items-center justify-center bg-white">
                  <img src={displayOrg.logo} alt={displayOrg.name} className="w-full h-full object-contain" />
                </div>
              )}
              <span className="text-sm font-medium text-gray-700">{displayOrg?.name || "Organization"}</span>
            </div>
          </div>

          {/* Search Bar with Dropdown - Hidden on mobile */}
          <div className="hidden md:block flex-1 max-w-2xl">
            <SearchBar onOpenCommandPalette={() => setCommandPaletteOpen(true)} />
          </div>

          {/* Right Actions */}
          <div className="flex items-center gap-3">
            {/* Mobile Search Toggle */}
            <button
              onClick={() => setMobileSearchOpen(!mobileSearchOpen)}
              className="md:hidden p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <FiSearch className="w-5 h-5" />
            </button>

            <LanguageSwitcher />

            <button className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">
              <FiCalendar className="w-5 h-5" />
            </button>

            <button className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors relative">
              <FiBell className="w-5 h-5" />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full"></span>
            </button>

            <CompanyMenu />

            <button className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">
              <FiHelpCircle className="w-5 h-5" />
            </button>

            {/* User Avatar with Dropdown */}
            {(currentUser || user) && (
              <div className="relative hidden md:block" ref={userMenuRef}>
                <button
                  onClick={() => setUserMenuOpen(!userMenuOpen)}
                  className="flex items-center gap-2 p-1.5 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  {user?.image ? (
                    <img
                      src={user.image}
                      alt={user?.name || "User"}
                      className="w-9 h-9 rounded-full object-cover shadow-md"
                    />
                  ) : (
                    <div className="w-9 h-9 rounded-full bg-gradient-to-br from-safee-500 to-purple-600 flex items-center justify-center text-white font-semibold text-sm shadow-md">
                      {(user?.name || currentUser?.name)?.charAt(0) || "U"}
                    </div>
                  )}
                  <FiChevronDown
                    className={`w-4 h-4 text-gray-600 transition-transform ${userMenuOpen ? "rotate-180" : ""}`}
                  />
                </button>

                {/* Dropdown Menu */}
                {userMenuOpen && (
                  <div className="absolute right-0 mt-2 w-56 bg-white border border-gray-200 rounded-lg shadow-lg py-2 z-50">
                    <div className="px-4 py-3 border-b border-gray-100">
                      <p className="text-sm font-semibold text-gray-900">{user?.name || currentUser?.name}</p>
                      <p className="text-xs text-gray-500 truncate">{user?.email || currentUser?.email}</p>
                      {userRole && (
                        <p className="text-xs text-safee-600 font-medium mt-1 capitalize">{userRole}</p>
                      )}
                    </div>

                    <Link
                      href="/settings/profile"
                      className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                      onClick={() => setUserMenuOpen(false)}
                    >
                      <FiUser className="w-4 h-4" />
                      Profile Settings
                    </Link>

                    <Link
                      href="/settings"
                      className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                      onClick={() => setUserMenuOpen(false)}
                    >
                      <FiSettings className="w-4 h-4" />
                      Settings
                    </Link>

                    <div className="border-t border-gray-100 my-1" />

                    <button
                      onClick={handleLogout}
                      className="flex items-center gap-3 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors w-full"
                    >
                      <FiLogOut className="w-4 h-4" />
                      Logout
                    </button>
                  </div>
                )}
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

        {/* Mobile Search Bar */}
        {mobileSearchOpen && (
          <div className="md:hidden py-3 border-t border-gray-200">
            <SearchBar onOpenCommandPalette={() => setCommandPaletteOpen(true)} />
          </div>
        )}

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden py-4 border-t border-zinc-200">
            <div className="flex flex-col gap-2">
              {modules.map((module) => (
                <Link
                  key={module.id}
                  href={module.href}
                  onClick={() => {
                    setModule(module.id);
                    setMobileMenuOpen(false);
                  }}
                  className={`
                    flex items-center gap-3 px-4 py-3 rounded-lg font-medium transition-all
                    ${isActive(module.href) ? "bg-safee-50 text-safee-700" : "text-zinc-600 hover:bg-zinc-50"}
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
                    onClick={async () => {
                      await signOut();
                      clearSession();
                      setMobileMenuOpen(false);
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

      {/* Command Palette */}
      <CommandPalette open={commandPaletteOpen} onOpenChange={setCommandPaletteOpen} />
    </nav>
  );
}
