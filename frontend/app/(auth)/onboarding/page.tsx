"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useOrgStore } from "@/stores/useOrgStore";
import { motion } from "framer-motion";
import { twMerge } from "tailwind-merge";

const translations = {
  ar: {
    title: "إنشاء مؤسستك",
    subtitle: "أخبرنا عن مؤسستك لبدء الاستخدام",
    organizationName: "اسم المؤسسة",
    organizationNamePlaceholder: "شركة مثال",
    organizationSlug: "معرّف المؤسسة",
    organizationSlugPlaceholder: "acme-corp",
    slugHelpText: "سيتم استخدامه في عنوان URL الخاص بك",
    continue: "متابعة",
    skip: "تخطي الآن",
  },
  en: {
    title: "Create your organization",
    subtitle: "Tell us about your organization to get started",
    organizationName: "Organization Name",
    organizationNamePlaceholder: "Acme Inc.",
    organizationSlug: "Organization Identifier",
    organizationSlugPlaceholder: "acme-corp",
    slugHelpText: "This will be used in your organization URL",
    continue: "Continue",
    skip: "Skip for now",
  },
};

export default function OnboardingPage() {
  const router = useRouter();
  const { locale } = useOrgStore();
  const [organizationName, setOrganizationName] = useState("");
  const [organizationSlug, setOrganizationSlug] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const t = translations[locale];

  // Auto-generate slug from organization name
  const handleNameChange = (value: string) => {
    setOrganizationName(value);
    const slug = value
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, "")
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-")
      .trim()
      .slice(0, 50);
    setOrganizationSlug(slug);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      // Import authClient
      const { authClient } = await import("@/lib/auth/client");

      // Call Better Auth organization creation API
      const response = await authClient.organization.create({
        name: organizationName,
        slug: organizationSlug,
      });

      if (response.error) {
        throw new Error(response.error.message || "Failed to create organization");
      }

      // Success - redirect to dashboard
      router.push("/");
    } catch (err) {
      console.error("Organization creation failed:", err);
      setError(err instanceof Error ? err.message : "Failed to create organization");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSkip = () => {
    router.push("/dashboard");
  };

  return (
    <div
      className="bg-zinc-950 min-h-screen flex items-center justify-center p-4"
      dir={locale === "ar" ? "rtl" : "ltr"}
    >
      {error && (
        <div className="fixed top-4 right-4 z-50 px-4 py-3 rounded-lg bg-red-500 text-white shadow-lg max-w-md">
          {error}
        </div>
      )}

      <motion.div
        initial={{ opacity: 0, y: 25 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: "easeInOut" }}
        className="w-full max-w-xl bg-zinc-900 border border-zinc-800 rounded-2xl p-8 shadow-2xl"
      >
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-safee-500 to-safee-700 flex items-center justify-center shadow-lg shadow-safee-500/50">
              <span className="text-white font-bold text-2xl">S</span>
            </div>
            <span className="text-2xl font-bold text-zinc-50">Safee Analytics</span>
          </div>
          <h1 className="text-3xl font-bold text-zinc-50 mb-2">{t.title}</h1>
          <p className="text-zinc-400">{t.subtitle}</p>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label htmlFor="org-name" className="block text-zinc-400 mb-2">
              {t.organizationName}
            </label>
            <input
              id="org-name"
              type="text"
              value={organizationName}
              onChange={(e) => handleNameChange(e.target.value)}
              placeholder={t.organizationNamePlaceholder}
              className="w-full rounded-lg border border-zinc-700 bg-zinc-800 px-4 py-3 text-zinc-50 placeholder-zinc-500 ring-1 ring-transparent transition-all focus:outline-0 focus:ring-safee-500 focus:border-safee-500"
              required
              disabled={isLoading}
            />
          </div>

          <div className="mb-6">
            <label htmlFor="org-slug" className="block text-zinc-400 mb-2">
              {t.organizationSlug}
            </label>
            <input
              id="org-slug"
              type="text"
              value={organizationSlug}
              onChange={(e) => setOrganizationSlug(e.target.value)}
              placeholder={t.organizationSlugPlaceholder}
              className="w-full rounded-lg border border-zinc-700 bg-zinc-800 px-4 py-3 text-zinc-50 placeholder-zinc-500 ring-1 ring-transparent transition-all focus:outline-0 focus:ring-safee-500 focus:border-safee-500"
              required
              disabled={isLoading}
              pattern="[a-z0-9-]+"
            />
            <p className="text-xs text-zinc-500 mt-1">{t.slugHelpText}</p>
          </div>

          <div className="flex gap-3">
            <button
              type="submit"
              disabled={isLoading}
              className={twMerge(
                "flex-1 rounded-lg bg-gradient-to-br from-safee-400 to-safee-700 px-6 py-3 text-lg font-semibold text-zinc-50 ring-2 ring-safee-500/50 ring-offset-2 ring-offset-zinc-900 transition-all hover:scale-[1.02] hover:ring-transparent active:scale-[0.98] active:ring-safee-500/70",
                isLoading && "opacity-50 cursor-not-allowed",
              )}
            >
              {isLoading ? "Creating..." : t.continue}
            </button>

            <button
              type="button"
              onClick={handleSkip}
              disabled={isLoading}
              className="px-6 py-3 rounded-lg border border-zinc-700 bg-zinc-800 text-zinc-300 hover:bg-zinc-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {t.skip}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}
