"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Command } from "cmdk";
import * as Dialog from "@radix-ui/react-dialog";
import * as VisuallyHidden from "@radix-ui/react-visually-hidden";
import { FiSearch, FiPlus } from "react-icons/fi";
import { useTranslation } from "@/lib/providers/TranslationProvider";
import { useAuth } from "@/lib/auth/hooks";
import { getNavigationItems, getQuickActions, getSystemActions } from "./searchItems";

interface CommandPaletteProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CommandPalette({ open, onOpenChange }: CommandPaletteProps) {
  const router = useRouter();
  const { t } = useTranslation();
  const { signOut } = useAuth();
  const [search, setSearch] = useState("");
  const handleSignOut = () => {
    void signOut();
  };

  // Handle keyboard shortcuts
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        onOpenChange(!open);
      }
    };

    document.addEventListener("keydown", down);
    return () => {
      document.removeEventListener("keydown", down);
    };
  }, [open, onOpenChange]);

  const handleSelect = (path: string, isAction?: boolean) => {
    onOpenChange(false);
    setSearch(""); // Clear search when closing

    // Handle action-type items differently
    if (isAction) {
      // Handle special action paths
      if (path === "#logout") {
        handleSignOut();
        return;
      }
      if (path === "#export") {
        // TODO: [Backend/Frontend] - Implement export data logic for command palette
        //   Details: The export data action currently has a placeholder. Implement the actual data export logic, potentially by calling a backend API, and integrate it here.
        //   Priority: Medium
        return;
      }
      if (path === "#theme") {
        // TODO: [Frontend] - Implement theme toggle logic for command palette
        //   Details: The theme toggle action currently has a placeholder. Implement the actual theme switching logic and integrate it here.
        //   Priority: Medium
        return;
      }
    }

    // Navigate to path for navigation items
    router.push(path);
  };

  const navigationItems = getNavigationItems(t);
  const quickActions = getQuickActions(t, handleSignOut);
  const systemActions = getSystemActions(t, handleSignOut);

  return (
    <Command.Dialog
      open={open}
      onOpenChange={onOpenChange}
      label="Global Command Menu"
      className="fixed top-0 left-0 right-0 bottom-0 z-[100]"
    >
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 backdrop-blur-sm"
        onClick={() => {
          onOpenChange(false);
          setSearch("");
        }}
      />

      {/* Command Palette */}
      <div className="fixed top-[20%] left-1/2 -translate-x-1/2 w-full max-w-2xl">
        <div className="bg-white rounded-2xl shadow-2xl border border-gray-200 overflow-hidden">
          {/* Visually Hidden Title for Screen Readers */}
          <VisuallyHidden.Root>
            <Dialog.Title>Command Menu</Dialog.Title>
          </VisuallyHidden.Root>

          {/* Search Input */}
          <div className="flex items-center border-b border-gray-200 px-4">
            <FiSearch className="w-5 h-5 text-gray-400 mr-3" />
            <Command.Input
              value={search}
              onValueChange={setSearch}
              placeholder={t.common.searchPlaceholder}
              className="w-full py-4 text-base outline-none placeholder:text-gray-400"
            />
            <kbd className="hidden sm:inline-flex items-center gap-1 px-2 py-1 text-xs font-medium text-gray-500 bg-gray-100 border border-gray-200 rounded">
              <span className="text-xs">⌘</span>K
            </kbd>
          </div>

          {/* Results */}
          <Command.List className="max-h-[400px] overflow-y-auto p-2">
            <Command.Empty className="py-8 text-center text-sm text-gray-500">
              No results found.
            </Command.Empty>

            {/* Navigation Group */}
            <Command.Group heading="Navigation" className="px-2 py-2">
              <div className="text-xs font-semibold text-gray-400 uppercase mb-2 px-2">Navigate</div>
              {navigationItems.map((item) => {
                const Icon = item.icon;
                return (
                  <Command.Item
                    key={item.id}
                    value={`${item.label} ${item.keywords.join(" ")}`}
                    onSelect={() => {
                      handleSelect(item.path);
                    }}
                    className="flex items-center gap-3 px-3 py-2.5 rounded-lg cursor-pointer hover:bg-gray-100 data-[selected=true]:bg-gray-100 transition-colors"
                  >
                    <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center">
                      <Icon className="w-4 h-4 text-gray-600" />
                    </div>
                    <div className="flex-1">
                      <div className="text-sm font-medium text-gray-900">{item.label}</div>
                      {item.description && <div className="text-xs text-gray-500">{item.description}</div>}
                    </div>
                  </Command.Item>
                );
              })}
            </Command.Group>

            <Command.Separator className="h-px bg-gray-200 my-2" />

            {/* Quick Actions Group */}
            <Command.Group heading="Actions" className="px-2 py-2">
              <div className="text-xs font-semibold text-gray-400 uppercase mb-2 px-2">Quick Actions</div>
              {quickActions.map((item) => {
                const Icon = item.icon;
                return (
                  <Command.Item
                    key={item.id}
                    value={`${item.label} ${item.keywords.join(" ")}`}
                    onSelect={() => {
                      handleSelect(item.path);
                    }}
                    className="flex items-center gap-3 px-3 py-2.5 rounded-lg cursor-pointer hover:bg-safee-50 data-[selected=true]:bg-safee-50 transition-colors"
                  >
                    <div className="w-8 h-8 rounded-lg bg-safee-100 flex items-center justify-center">
                      <Icon className="w-4 h-4 text-safee-600" />
                    </div>
                    <div className="flex-1">
                      <div className="text-sm font-medium text-gray-900">{item.label}</div>
                      {item.description && <div className="text-xs text-gray-500">{item.description}</div>}
                    </div>
                    <FiPlus className="w-4 h-4 text-gray-400 ml-auto" />
                  </Command.Item>
                );
              })}
            </Command.Group>

            <Command.Separator className="h-px bg-gray-200 my-2" />

            {/* System Actions Group */}
            <Command.Group heading="System" className="px-2 py-2">
              <div className="text-xs font-semibold text-gray-400 uppercase mb-2 px-2">System</div>
              {systemActions.map((item) => {
                const Icon = item.icon;
                return (
                  <Command.Item
                    key={item.id}
                    value={`${item.label} ${item.keywords.join(" ")}`}
                    onSelect={() => {
                      handleSelect(item.path, true);
                    }}
                    className="flex items-center gap-3 px-3 py-2.5 rounded-lg cursor-pointer hover:bg-gray-50 data-[selected=true]:bg-gray-50 transition-colors"
                  >
                    <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center">
                      <Icon className="w-4 h-4 text-gray-600" />
                    </div>
                    <div className="flex-1">
                      <div className="text-sm font-medium text-gray-900">{item.label}</div>
                      {item.description && <div className="text-xs text-gray-500">{item.description}</div>}
                    </div>
                  </Command.Item>
                );
              })}
            </Command.Group>
          </Command.List>

          {/* Footer */}
          <div className="border-t border-gray-200 px-4 py-3 flex items-center justify-between text-xs text-gray-500">
            <div className="flex items-center gap-4">
              <span className="flex items-center gap-1">
                <kbd className="px-1.5 py-0.5 bg-gray-100 border border-gray-200 rounded text-xs">↑↓</kbd>
                Navigate
              </span>
              <span className="flex items-center gap-1">
                <kbd className="px-1.5 py-0.5 bg-gray-100 border border-gray-200 rounded text-xs">↵</kbd>
                Select
              </span>
              <span className="flex items-center gap-1">
                <kbd className="px-1.5 py-0.5 bg-gray-100 border border-gray-200 rounded text-xs">esc</kbd>
                Close
              </span>
            </div>
          </div>
        </div>
      </div>
    </Command.Dialog>
  );
}
