"use client";

import { useState, useRef, useEffect, useMemo, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  FiSearch,
  FiClock,
  FiCommand,
  FiHash,
  FiX,
  FiFileText,
  FiUsers,
  FiUserPlus,
  FiShoppingCart,
  FiClipboard,
} from "react-icons/fi";
import type { IconType } from "react-icons";
import { useTranslation } from "@/lib/providers/TranslationProvider";
import { useAuth } from "@/lib/auth/hooks";
import { useTheme } from "@/lib/providers/ThemeProvider";
import { getNavigationItems, getQuickActions, getSystemActions } from "./searchItems";

interface SearchBarProps {
  onOpenCommandPalette: () => void;
}

interface RecentSearch {
  id: string;
  label: string;
  timestamp: number;
}

interface SearchResult {
  id: string;
  type: "navigation" | "action" | "recent" | "entity";
  icon: IconType;
  label: string;
  description?: string;
  action: () => void;
  keywords: string[];
}

const RECENT_SEARCHES_KEY = "safee-recent-searches";
const MAX_RECENT_SEARCHES = 5;

export function SearchBar({ onOpenCommandPalette }: SearchBarProps) {
  const router = useRouter();
  const { t, locale } = useTranslation();
  const { signOut } = useAuth();
  const { theme, setTheme } = useTheme();
  const [query, setQuery] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [recentSearches, setRecentSearches] = useState<RecentSearch[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Load recent searches from localStorage
  useEffect(() => {
    const stored = localStorage.getItem(RECENT_SEARCHES_KEY);
    if (stored) {
      try {
        setRecentSearches(JSON.parse(stored));
      } catch (e) {
        console.error("Failed to parse recent searches", e);
      }
    }
  }, []);

  // Save recent search
  const saveRecentSearch = useCallback(
    (label: string) => {
      const newSearch: RecentSearch = {
        id: Date.now().toString(),
        label,
        timestamp: Date.now(),
      };

      const updated = [newSearch, ...recentSearches.filter((s) => s.label !== label)].slice(
        0,
        MAX_RECENT_SEARCHES,
      );

      setRecentSearches(updated);
      localStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(updated));
    },
    [recentSearches],
  );

  // Clear recent searches
  const clearRecentSearches = () => {
    setRecentSearches([]);
    localStorage.removeItem(RECENT_SEARCHES_KEY);
  };

  // Detect entity IDs (INV-1234, EMP-5678, etc.)
  const detectEntityId = useCallback(
    (query: string): SearchResult | null => {
      const patterns = [
        { regex: /^INV-\d+$/i, type: "Invoice", icon: FiFileText, path: "/accounting/invoices/" },
        { regex: /^EMP-\d+$/i, type: "Employee", icon: FiUsers, path: "/hr/employees/" },
        { regex: /^CONT-\d+$/i, type: "Contact", icon: FiUserPlus, path: "/crm/contacts/" },
        { regex: /^EXP-\d+$/i, type: "Expense", icon: FiShoppingCart, path: "/accounting/expenses/" },
        { regex: /^CASE-\d+$/i, type: "Audit Case", icon: FiClipboard, path: "/audit/cases/" },
      ];

      for (const pattern of patterns) {
        if (pattern.regex.test(query.trim())) {
          const id = query.trim().split("-")[1];
          return {
            id: `entity-${query}`,
            type: "entity",
            icon: pattern.icon,
            label: `${pattern.type} ${query.toUpperCase()}`,
            description: `Open ${pattern.type.toLowerCase()} details`,
            action: () => router.push(`${pattern.path}${id}`),
            keywords: [query],
          };
        }
      }
      return null;
    },
    [router],
  );

  // Get search items from shared configuration
  const handleExport = useCallback(() => {
    console.warn("Export data triggered - implementation pending");
    // TODO: Implement actual export logic
  }, []);

  const handleThemeToggle = useCallback(() => {
    const newTheme = theme === "light" ? "dark" : theme === "dark" ? "auto" : "light";
    setTheme(newTheme);
  }, [theme, setTheme]);

  const navigationItems = getNavigationItems(t);
  const quickActions = getQuickActions(t, signOut);
  const systemActions = getSystemActions(t, signOut, handleExport, handleThemeToggle, theme);

  // Combine all items for search
  const allItems: SearchResult[] = useMemo(
    () => [
      ...navigationItems.map((item) => ({
        ...item,
        action: () => router.push(item.path),
      })),
      ...quickActions.map((item) => ({
        ...item,
        action: () => router.push(item.path),
      })),
      ...systemActions.map((item) => ({
        ...item,
        action: () => {
          if (item.path === "#logout") {
            signOut();
          } else if (item.path === "#export") {
            handleExport();
          } else if (item.path === "#theme") {
            handleThemeToggle();
          } else {
            router.push(item.path);
          }
        },
      })),
    ],
    [navigationItems, quickActions, systemActions, router, signOut, handleExport, handleThemeToggle],
  );

  // Filter results based on query
  const filteredResults = useMemo(() => {
    if (!query.trim()) return [];

    // First check for entity ID
    const entityResult = detectEntityId(query);
    if (entityResult) {
      return [entityResult];
    }

    // Otherwise, filter normal items
    const searchText = query.toLowerCase();
    return allItems.filter((item) => {
      return (
        item.label.toLowerCase().includes(searchText) ||
        item.description?.toLowerCase().includes(searchText) ||
        item.keywords.some((keyword) => keyword.includes(searchText))
      );
    });
  }, [query, allItems, detectEntityId]);

  // Show recent searches when no query
  const showRecent = !query.trim() && recentSearches.length > 0;

  // Handle selection
  const handleSelect = useCallback(
    (result: SearchResult) => {
      // Save to recent searches
      if (result.type !== "recent") {
        saveRecentSearch(result.label);
      }

      result.action();
      setIsOpen(false);
      setQuery("");
      inputRef.current?.blur();
    },
    [saveRecentSearch],
  );

  // Handle keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;

      switch (e.key) {
        case "ArrowDown":
          e.preventDefault();
          setSelectedIndex((prev) => (prev < filteredResults.length - 1 ? prev + 1 : 0));
          break;
        case "ArrowUp":
          e.preventDefault();
          setSelectedIndex((prev) => (prev > 0 ? prev - 1 : filteredResults.length - 1));
          break;
        case "Enter":
          e.preventDefault();
          if (filteredResults[selectedIndex]) {
            handleSelect(filteredResults[selectedIndex]);
          }
          break;
        case "Escape":
          e.preventDefault();
          setIsOpen(false);
          inputRef.current?.blur();
          break;
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, filteredResults, selectedIndex, handleSelect]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node) &&
        !inputRef.current?.contains(e.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Reset selection when results change
  useEffect(() => {
    setSelectedIndex(0);
  }, [query]);

  const handleRecentSearch = (recent: RecentSearch) => {
    setQuery(recent.label);
    setIsOpen(true);
    inputRef.current?.focus();
  };

  return (
    <div className="relative flex-1 max-w-2xl">
      {/* Search Input */}
      <div className="relative">
        <FiSearch
          className={`absolute ${locale === "ar" ? "right-4" : "left-4"} top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none`}
        />
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setIsOpen(true);
          }}
          onFocus={() => setIsOpen(true)}
          placeholder={t.common.searchPlaceholder}
          className={`w-full ${locale === "ar" ? "pr-12 pl-24" : "pl-12 pr-24"} py-2.5 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-safee-500 focus:bg-white dark:focus:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder:text-gray-500 dark:placeholder:text-gray-400 transition-all`}
        />
        {/* Cmd+K Hint */}
        <button
          onClick={onOpenCommandPalette}
          className={`absolute ${locale === "ar" ? "left-3" : "right-3"} top-1/2 transform -translate-y-1/2 hidden sm:flex items-center gap-1 px-2 py-1 text-xs font-medium text-gray-500 dark:text-gray-400 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors`}
        >
          <FiCommand className="w-3 h-3" />
          <span>K</span>
        </button>
      </div>

      {/* Search Results Dropdown */}
      {isOpen && (showRecent || query.trim()) && (
        <div
          ref={dropdownRef}
          className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-gray-800 rounded-xl shadow-2xl border border-gray-200 dark:border-gray-700 overflow-hidden z-50"
        >
          {/* Recent Searches */}
          {showRecent && (
            <div className="py-2">
              <div className="flex items-center justify-between px-4 py-2">
                <span className="text-xs font-semibold text-gray-400 uppercase">Recent</span>
                <button
                  onClick={clearRecentSearches}
                  className="text-xs text-gray-500 hover:text-gray-700 flex items-center gap-1"
                >
                  <FiX className="w-3 h-3" />
                  Clear
                </button>
              </div>
              {recentSearches.map((recent) => (
                <button
                  key={recent.id}
                  onClick={() => handleRecentSearch(recent)}
                  className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                >
                  <div className="w-9 h-9 rounded-lg bg-gray-100 dark:bg-gray-700 flex items-center justify-center">
                    <FiClock className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                  </div>
                  <span className="text-sm text-gray-700 dark:text-gray-300">{recent.label}</span>
                </button>
              ))}
            </div>
          )}

          {/* Search Results */}
          {query.trim() &&
            (filteredResults.length > 0 ? (
              <div className="max-h-[400px] overflow-y-auto py-2">
                {filteredResults.map((result, index) => {
                  const Icon = result.icon;
                  const isSelected = index === selectedIndex;
                  const isEntity = result.type === "entity";

                  return (
                    <button
                      key={result.id}
                      onClick={() => handleSelect(result)}
                      onMouseEnter={() => setSelectedIndex(index)}
                      className={`w-full flex items-center gap-3 px-4 py-3 transition-colors ${
                        isSelected ? "bg-safee-50 dark:bg-safee-900/20" : "hover:bg-gray-50 dark:hover:bg-gray-700"
                      }`}
                    >
                      <div
                        className={`w-9 h-9 rounded-lg flex items-center justify-center ${
                          isEntity
                            ? "bg-purple-100"
                            : result.type === "action"
                              ? "bg-safee-100"
                              : "bg-gray-100 dark:bg-gray-700"
                        }`}
                      >
                        <Icon
                          className={`w-4 h-4 ${
                            isEntity
                              ? "text-purple-600"
                              : result.type === "action"
                                ? "text-safee-600"
                                : "text-gray-600"
                          }`}
                        />
                      </div>
                      <div className="flex-1 text-left">
                        <div
                          className={`text-sm font-medium ${isEntity ? "text-purple-900" : "text-gray-900"}`}
                        >
                          {isEntity && <FiHash className="w-3 h-3 inline mr-1" />}
                          {result.label}
                        </div>
                        {result.description && (
                          <div className="text-xs text-gray-500">{result.description}</div>
                        )}
                      </div>
                      {isSelected && (
                        <kbd className="px-2 py-1 text-xs text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded">
                          ↵
                        </kbd>
                      )}
                    </button>
                  );
                })}
              </div>
            ) : (
              <div className="px-4 py-8 text-center">
                <div className="text-gray-400 mb-2">
                  <FiSearch className="w-8 h-8 mx-auto" />
                </div>
                <p className="text-sm text-gray-500">No results found</p>
                <p className="text-xs text-gray-400 mt-1">Try different keywords</p>
              </div>
            ))}

          {/* Footer */}
          <div className="border-t border-gray-200 dark:border-gray-700 px-4 py-2 bg-gray-50 dark:bg-gray-700 flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
            <span className="flex items-center gap-2">
              <kbd className="px-1.5 py-0.5 bg-white dark:bg-gray-600 border border-gray-200 dark:border-gray-500 rounded">↑↓</kbd>
              Navigate
            </span>
            <span className="flex items-center gap-2">
              <kbd className="px-1.5 py-0.5 bg-white dark:bg-gray-600 border border-gray-200 dark:border-gray-500 rounded">↵</kbd>
              Select
            </span>
            <button onClick={onOpenCommandPalette} className="flex items-center gap-1 hover:text-gray-700 dark:hover:text-gray-300">
              <FiCommand className="w-3 h-3" />
              <span>K for more</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
