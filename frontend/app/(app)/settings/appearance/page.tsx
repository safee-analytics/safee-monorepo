"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Sun, Moon, Monitor, Type, Layout, Eye, Save } from "lucide-react";
import { useToast, SafeeToastContainer } from "@/components/feedback";
import { useTranslation } from "@/lib/providers/TranslationProvider";
import { useTheme, type ColorScheme } from "@/lib/providers/ThemeProvider";
import { useUpdateUserLocale } from "@/lib/api/hooks/user";

export default function AppearanceSettings() {
  const { t, locale } = useTranslation();
  const toast = useToast();
  const { theme, setTheme, colorScheme, setColorScheme } = useTheme();
  const updateLocaleMutation = useUpdateUserLocale();
  const [isSaving, setIsSaving] = useState(false);
  const [appearance, setAppearance] = useState({
    fontSize: "medium",
    density: "comfortable",
    animations: true,
    reducedMotion: false,
  });

  const handleSave = async () => {
    setIsSaving(true);
    await new Promise((resolve) => setTimeout(resolve, 1000));
    setIsSaving(false);
    toast.success("Appearance settings updated successfully");
  };

  const colorSchemes: { id: ColorScheme; name: string; color: string }[] = [
    { id: "blue", name: t.settings.appearance.colors.blue, color: "bg-blue-600" },
    { id: "purple", name: t.settings.appearance.colors.purple, color: "bg-purple-600" },
    { id: "green", name: t.settings.appearance.colors.green, color: "bg-green-600" },
    { id: "orange", name: t.settings.appearance.colors.orange, color: "bg-orange-600" },
    { id: "red", name: t.settings.appearance.colors.red, color: "bg-red-600" },
    { id: "teal", name: t.settings.appearance.colors.teal, color: "bg-teal-600" },
  ];

  return (
    <div className="p-6">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="max-w-4xl">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">
            {t.settings.appearance.title}
          </h1>
          <p className="text-gray-600 dark:text-gray-400">{t.settings.appearance.subtitle}</p>
        </div>

        {/* Theme */}
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
            {t.settings.appearance.theme}
          </h2>
          <div className="grid grid-cols-3 gap-4">
            <button
              onClick={() => setTheme("light")}
              className={`p-4 border-2 rounded-lg transition-all ${
                theme === "light"
                  ? "border-blue-600 bg-blue-50 dark:bg-blue-900/20"
                  : "border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500"
              }`}
            >
              <div className="flex flex-col items-center gap-2">
                <div className="w-12 h-12 bg-white border border-gray-300 rounded-lg flex items-center justify-center">
                  <Sun className="w-6 h-6 text-gray-700" />
                </div>
                <span className="font-medium text-gray-900 dark:text-gray-100">
                  {t.settings.appearance.themeLight}
                </span>
              </div>
            </button>

            <button
              onClick={() => setTheme("dark")}
              className={`p-4 border-2 rounded-lg transition-all ${
                theme === "dark"
                  ? "border-blue-600 bg-blue-50 dark:bg-blue-900/20"
                  : "border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500"
              }`}
            >
              <div className="flex flex-col items-center gap-2">
                <div className="w-12 h-12 bg-gray-900 border border-gray-700 rounded-lg flex items-center justify-center">
                  <Moon className="w-6 h-6 text-white" />
                </div>
                <span className="font-medium text-gray-900 dark:text-gray-100">
                  {t.settings.appearance.themeDark}
                </span>
              </div>
            </button>

            <button
              onClick={() => setTheme("auto")}
              className={`p-4 border-2 rounded-lg transition-all ${
                theme === "auto"
                  ? "border-blue-600 bg-blue-50 dark:bg-blue-900/20"
                  : "border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500"
              }`}
            >
              <div className="flex flex-col items-center gap-2">
                <div className="w-12 h-12 bg-gradient-to-br from-white to-gray-900 border border-gray-300 rounded-lg flex items-center justify-center">
                  <Monitor className="w-6 h-6 text-gray-700" />
                </div>
                <span className="font-medium text-gray-900 dark:text-gray-100">
                  {t.settings.appearance.themeAuto}
                </span>
              </div>
            </button>
          </div>
        </div>

        {/* Color Scheme */}
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
            {t.settings.appearance.colorScheme}
          </h2>
          <div className="grid grid-cols-6 gap-3">
            {colorSchemes.map((scheme) => (
              <button
                key={scheme.id}
                onClick={() => setColorScheme(scheme.id)}
                className={`p-3 border-2 rounded-lg transition-all ${
                  colorScheme === scheme.id
                    ? "border-gray-900 dark:border-gray-100"
                    : "border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500"
                }`}
              >
                <div className="flex flex-col items-center gap-2">
                  <div className={`w-8 h-8 ${scheme.color} rounded-full`}></div>
                  <span className="text-xs font-medium text-gray-900 dark:text-gray-100">{scheme.name}</span>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Language */}
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
            {t.settings.appearance.language}
          </h2>
          <div className="grid grid-cols-2 gap-4">
            <button
              onClick={() => updateLocaleMutation.mutate("en")}
              disabled={updateLocaleMutation.isPending}
              className={`p-4 border-2 rounded-lg transition-all disabled:opacity-50 ${
                locale === "en"
                  ? "border-blue-600 bg-blue-50 dark:bg-blue-900/20"
                  : "border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500"
              }`}
            >
              <div className="flex items-center gap-3">
                <div className="text-2xl">🇬🇧</div>
                <div className="text-left">
                  <p className="font-medium text-gray-900 dark:text-gray-100">
                    {t.settings.appearance.languageEn}
                  </p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {t.settings.appearance.languageEnDesc}
                  </p>
                </div>
              </div>
            </button>

            <button
              onClick={() => updateLocaleMutation.mutate("ar")}
              disabled={updateLocaleMutation.isPending}
              className={`p-4 border-2 rounded-lg transition-all disabled:opacity-50 ${
                locale === "ar"
                  ? "border-blue-600 bg-blue-50 dark:bg-blue-900/20"
                  : "border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500"
              }`}
            >
              <div className="flex items-center gap-3">
                <div className="text-2xl">🇸🇦</div>
                <div className="text-left">
                  <p className="font-medium text-gray-900 dark:text-gray-100">
                    {t.settings.appearance.languageAr}
                  </p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {t.settings.appearance.languageArDesc}
                  </p>
                </div>
              </div>
            </button>
          </div>
        </div>

        {/* Font Size */}
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
            {t.settings.appearance.fontSize}
          </h2>
          <div className="grid grid-cols-3 gap-4">
            <button
              onClick={() => setAppearance({ ...appearance, fontSize: "small" })}
              className={`p-4 border-2 rounded-lg transition-all ${
                appearance.fontSize === "small"
                  ? "border-blue-600 bg-blue-50 dark:bg-blue-900/20"
                  : "border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500"
              }`}
            >
              <div className="flex flex-col items-center gap-2">
                <Type className="w-4 h-4 text-gray-700 dark:text-gray-300" />
                <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                  {t.settings.appearance.fontSizeSmall}
                </span>
              </div>
            </button>

            <button
              onClick={() => setAppearance({ ...appearance, fontSize: "medium" })}
              className={`p-4 border-2 rounded-lg transition-all ${
                appearance.fontSize === "medium"
                  ? "border-blue-600 bg-blue-50 dark:bg-blue-900/20"
                  : "border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500"
              }`}
            >
              <div className="flex flex-col items-center gap-2">
                <Type className="w-5 h-5 text-gray-700 dark:text-gray-300" />
                <span className="text-base font-medium text-gray-900 dark:text-gray-100">
                  {t.settings.appearance.fontSizeMedium}
                </span>
              </div>
            </button>

            <button
              onClick={() => setAppearance({ ...appearance, fontSize: "large" })}
              className={`p-4 border-2 rounded-lg transition-all ${
                appearance.fontSize === "large"
                  ? "border-blue-600 bg-blue-50 dark:bg-blue-900/20"
                  : "border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500"
              }`}
            >
              <div className="flex flex-col items-center gap-2">
                <Type className="w-6 h-6 text-gray-700 dark:text-gray-300" />
                <span className="text-lg font-medium text-gray-900 dark:text-gray-100">
                  {t.settings.appearance.fontSizeLarge}
                </span>
              </div>
            </button>
          </div>
        </div>

        {/* Display Density */}
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
            {t.settings.appearance.displayDensity}
          </h2>
          <div className="grid grid-cols-3 gap-4">
            <button
              onClick={() => setAppearance({ ...appearance, density: "compact" })}
              className={`p-4 border-2 rounded-lg transition-all ${
                appearance.density === "compact"
                  ? "border-blue-600 bg-blue-50 dark:bg-blue-900/20"
                  : "border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500"
              }`}
            >
              <div className="flex flex-col items-center gap-2">
                <Layout className="w-4 h-4 text-gray-700 dark:text-gray-300" />
                <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                  {t.settings.appearance.densityCompact}
                </span>
                <span className="text-xs text-gray-500 dark:text-gray-400">
                  {t.settings.appearance.densityCompactDesc}
                </span>
              </div>
            </button>

            <button
              onClick={() => setAppearance({ ...appearance, density: "comfortable" })}
              className={`p-4 border-2 rounded-lg transition-all ${
                appearance.density === "comfortable"
                  ? "border-blue-600 bg-blue-50 dark:bg-blue-900/20"
                  : "border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500"
              }`}
            >
              <div className="flex flex-col items-center gap-2">
                <Layout className="w-5 h-5 text-gray-700 dark:text-gray-300" />
                <span className="text-base font-medium text-gray-900 dark:text-gray-100">
                  {t.settings.appearance.densityComfortable}
                </span>
                <span className="text-xs text-gray-500 dark:text-gray-400">
                  {t.settings.appearance.densityComfortableDesc}
                </span>
              </div>
            </button>

            <button
              onClick={() => setAppearance({ ...appearance, density: "spacious" })}
              className={`p-4 border-2 rounded-lg transition-all ${
                appearance.density === "spacious"
                  ? "border-blue-600 bg-blue-50 dark:bg-blue-900/20"
                  : "border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500"
              }`}
            >
              <div className="flex flex-col items-center gap-2">
                <Layout className="w-6 h-6 text-gray-700 dark:text-gray-300" />
                <span className="text-lg font-medium text-gray-900 dark:text-gray-100">
                  {t.settings.appearance.densitySpacious}
                </span>
                <span className="text-xs text-gray-500 dark:text-gray-400">
                  {t.settings.appearance.densitySpaciousDesc}
                </span>
              </div>
            </button>
          </div>
        </div>

        {/* Accessibility */}
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
            {t.settings.appearance.accessibility}
          </h2>
          <div className="space-y-4">
            <div className="flex items-center justify-between py-3 border-b border-gray-100 dark:border-gray-700">
              <div className="flex items-center gap-3">
                <Eye className="w-5 h-5 text-gray-500" />
                <div>
                  <p className="font-medium text-gray-900 dark:text-gray-100">
                    {t.settings.appearance.enableAnimations}
                  </p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {t.settings.appearance.enableAnimationsDesc}
                  </p>
                </div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={appearance.animations}
                  onChange={(e) => setAppearance({ ...appearance, animations: e.target.checked })}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>

            <div className="flex items-center justify-between py-3">
              <div className="flex items-center gap-3">
                <Eye className="w-5 h-5 text-gray-500" />
                <div>
                  <p className="font-medium text-gray-900 dark:text-gray-100">
                    {t.settings.appearance.reduceMotion}
                  </p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {t.settings.appearance.reduceMotionDesc}
                  </p>
                </div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={appearance.reducedMotion}
                  onChange={(e) => setAppearance({ ...appearance, reducedMotion: e.target.checked })}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>
          </div>
        </div>

        {/* Save Button */}
        <div className="flex justify-end">
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            {isSaving ? t.settings.appearance.saving : t.settings.appearance.saveChanges}
          </button>
        </div>
      </motion.div>
      <SafeeToastContainer notifications={toast.notifications} onRemove={toast.removeToast} />
    </div>
  );
}
