"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Sun, Moon, Monitor, Type, Layout, Eye, Save } from "lucide-react";
import { useTranslation } from "@/lib/providers/TranslationProvider";
import { useUpdateUserLocale } from "@/lib/api/hooks/user";

export default function AppearanceSettings() {
  const { t: _t, locale } = useTranslation();
  const updateLocaleMutation = useUpdateUserLocale();
  const [isSaving, setIsSaving] = useState(false);
  const [appearance, setAppearance] = useState({
    theme: "light",
    colorScheme: "blue",
    fontSize: "medium",
    density: "comfortable",
    animations: true,
    reducedMotion: false,
  });

  const handleSave = async () => {
    setIsSaving(true);
    await new Promise((resolve) => setTimeout(resolve, 1000));
    setIsSaving(false);
    alert("Appearance settings updated successfully");
  };

  const colorSchemes = [
    { id: "blue", name: "Blue", color: "bg-blue-600" },
    { id: "purple", name: "Purple", color: "bg-purple-600" },
    { id: "green", name: "Green", color: "bg-green-600" },
    { id: "orange", name: "Orange", color: "bg-orange-600" },
    { id: "red", name: "Red", color: "bg-red-600" },
    { id: "teal", name: "Teal", color: "bg-teal-600" },
  ];

  return (
    <div className="p-6">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="max-w-4xl">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Appearance Settings</h1>
          <p className="text-gray-600">Customize the look and feel of your workspace</p>
        </div>

        {/* Theme */}
        <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Theme</h2>
          <div className="grid grid-cols-3 gap-4">
            <button
              onClick={() => setAppearance({ ...appearance, theme: "light" })}
              className={`p-4 border-2 rounded-lg transition-all ${
                appearance.theme === "light"
                  ? "border-blue-600 bg-blue-50"
                  : "border-gray-200 hover:border-gray-300"
              }`}
            >
              <div className="flex flex-col items-center gap-2">
                <div className="w-12 h-12 bg-white border border-gray-300 rounded-lg flex items-center justify-center">
                  <Sun className="w-6 h-6 text-gray-700" />
                </div>
                <span className="font-medium text-gray-900">Light</span>
              </div>
            </button>

            <button
              onClick={() => setAppearance({ ...appearance, theme: "dark" })}
              className={`p-4 border-2 rounded-lg transition-all ${
                appearance.theme === "dark"
                  ? "border-blue-600 bg-blue-50"
                  : "border-gray-200 hover:border-gray-300"
              }`}
            >
              <div className="flex flex-col items-center gap-2">
                <div className="w-12 h-12 bg-gray-900 border border-gray-700 rounded-lg flex items-center justify-center">
                  <Moon className="w-6 h-6 text-white" />
                </div>
                <span className="font-medium text-gray-900">Dark</span>
              </div>
            </button>

            <button
              onClick={() => setAppearance({ ...appearance, theme: "auto" })}
              className={`p-4 border-2 rounded-lg transition-all ${
                appearance.theme === "auto"
                  ? "border-blue-600 bg-blue-50"
                  : "border-gray-200 hover:border-gray-300"
              }`}
            >
              <div className="flex flex-col items-center gap-2">
                <div className="w-12 h-12 bg-gradient-to-br from-white to-gray-900 border border-gray-300 rounded-lg flex items-center justify-center">
                  <Monitor className="w-6 h-6 text-gray-700" />
                </div>
                <span className="font-medium text-gray-900">Auto</span>
              </div>
            </button>
          </div>
        </div>

        {/* Color Scheme */}
        <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Color Scheme</h2>
          <div className="grid grid-cols-6 gap-3">
            {colorSchemes.map((scheme) => (
              <button
                key={scheme.id}
                onClick={() => setAppearance({ ...appearance, colorScheme: scheme.id })}
                className={`p-3 border-2 rounded-lg transition-all ${
                  appearance.colorScheme === scheme.id
                    ? "border-gray-900"
                    : "border-gray-200 hover:border-gray-300"
                }`}
              >
                <div className="flex flex-col items-center gap-2">
                  <div className={`w-8 h-8 ${scheme.color} rounded-full`}></div>
                  <span className="text-xs font-medium text-gray-900">{scheme.name}</span>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Language */}
        <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Language</h2>
          <div className="grid grid-cols-2 gap-4">
            <button
              onClick={() => updateLocaleMutation.mutate("en")}
              disabled={updateLocaleMutation.isPending}
              className={`p-4 border-2 rounded-lg transition-all disabled:opacity-50 ${
                locale === "en" ? "border-blue-600 bg-blue-50" : "border-gray-200 hover:border-gray-300"
              }`}
            >
              <div className="flex items-center gap-3">
                <div className="text-2xl">🇬🇧</div>
                <div className="text-left">
                  <p className="font-medium text-gray-900">English</p>
                  <p className="text-sm text-gray-500">Left-to-right layout</p>
                </div>
              </div>
            </button>

            <button
              onClick={() => updateLocaleMutation.mutate("ar")}
              disabled={updateLocaleMutation.isPending}
              className={`p-4 border-2 rounded-lg transition-all disabled:opacity-50 ${
                locale === "ar" ? "border-blue-600 bg-blue-50" : "border-gray-200 hover:border-gray-300"
              }`}
            >
              <div className="flex items-center gap-3">
                <div className="text-2xl">🇸🇦</div>
                <div className="text-left">
                  <p className="font-medium text-gray-900">العربية</p>
                  <p className="text-sm text-gray-500">Right-to-left layout</p>
                </div>
              </div>
            </button>
          </div>
        </div>

        {/* Font Size */}
        <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Font Size</h2>
          <div className="grid grid-cols-3 gap-4">
            <button
              onClick={() => setAppearance({ ...appearance, fontSize: "small" })}
              className={`p-4 border-2 rounded-lg transition-all ${
                appearance.fontSize === "small"
                  ? "border-blue-600 bg-blue-50"
                  : "border-gray-200 hover:border-gray-300"
              }`}
            >
              <div className="flex flex-col items-center gap-2">
                <Type className="w-4 h-4 text-gray-700" />
                <span className="text-sm font-medium text-gray-900">Small</span>
              </div>
            </button>

            <button
              onClick={() => setAppearance({ ...appearance, fontSize: "medium" })}
              className={`p-4 border-2 rounded-lg transition-all ${
                appearance.fontSize === "medium"
                  ? "border-blue-600 bg-blue-50"
                  : "border-gray-200 hover:border-gray-300"
              }`}
            >
              <div className="flex flex-col items-center gap-2">
                <Type className="w-5 h-5 text-gray-700" />
                <span className="text-base font-medium text-gray-900">Medium</span>
              </div>
            </button>

            <button
              onClick={() => setAppearance({ ...appearance, fontSize: "large" })}
              className={`p-4 border-2 rounded-lg transition-all ${
                appearance.fontSize === "large"
                  ? "border-blue-600 bg-blue-50"
                  : "border-gray-200 hover:border-gray-300"
              }`}
            >
              <div className="flex flex-col items-center gap-2">
                <Type className="w-6 h-6 text-gray-700" />
                <span className="text-lg font-medium text-gray-900">Large</span>
              </div>
            </button>
          </div>
        </div>

        {/* Display Density */}
        <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Display Density</h2>
          <div className="grid grid-cols-3 gap-4">
            <button
              onClick={() => setAppearance({ ...appearance, density: "compact" })}
              className={`p-4 border-2 rounded-lg transition-all ${
                appearance.density === "compact"
                  ? "border-blue-600 bg-blue-50"
                  : "border-gray-200 hover:border-gray-300"
              }`}
            >
              <div className="flex flex-col items-center gap-2">
                <Layout className="w-4 h-4 text-gray-700" />
                <span className="text-sm font-medium text-gray-900">Compact</span>
                <span className="text-xs text-gray-500">More content</span>
              </div>
            </button>

            <button
              onClick={() => setAppearance({ ...appearance, density: "comfortable" })}
              className={`p-4 border-2 rounded-lg transition-all ${
                appearance.density === "comfortable"
                  ? "border-blue-600 bg-blue-50"
                  : "border-gray-200 hover:border-gray-300"
              }`}
            >
              <div className="flex flex-col items-center gap-2">
                <Layout className="w-5 h-5 text-gray-700" />
                <span className="text-base font-medium text-gray-900">Comfortable</span>
                <span className="text-xs text-gray-500">Balanced</span>
              </div>
            </button>

            <button
              onClick={() => setAppearance({ ...appearance, density: "spacious" })}
              className={`p-4 border-2 rounded-lg transition-all ${
                appearance.density === "spacious"
                  ? "border-blue-600 bg-blue-50"
                  : "border-gray-200 hover:border-gray-300"
              }`}
            >
              <div className="flex flex-col items-center gap-2">
                <Layout className="w-6 h-6 text-gray-700" />
                <span className="text-lg font-medium text-gray-900">Spacious</span>
                <span className="text-xs text-gray-500">More space</span>
              </div>
            </button>
          </div>
        </div>

        {/* Accessibility */}
        <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Accessibility</h2>
          <div className="space-y-4">
            <div className="flex items-center justify-between py-3 border-b border-gray-100">
              <div className="flex items-center gap-3">
                <Eye className="w-5 h-5 text-gray-500" />
                <div>
                  <p className="font-medium text-gray-900">Enable animations</p>
                  <p className="text-sm text-gray-500">Show smooth transitions and effects</p>
                </div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={appearance.animations}
                  onChange={(e) => setAppearance({ ...appearance, animations: e.target.checked })}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>

            <div className="flex items-center justify-between py-3">
              <div className="flex items-center gap-3">
                <Eye className="w-5 h-5 text-gray-500" />
                <div>
                  <p className="font-medium text-gray-900">Reduce motion</p>
                  <p className="text-sm text-gray-500">Minimize animations for better accessibility</p>
                </div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={appearance.reducedMotion}
                  onChange={(e) => setAppearance({ ...appearance, reducedMotion: e.target.checked })}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
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
            {isSaving ? "Saving..." : "Save Changes"}
          </button>
        </div>
      </motion.div>
    </div>
  );
}
