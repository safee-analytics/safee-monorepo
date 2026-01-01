import { getRequestConfig } from "next-intl/server";
import { notFound } from "next/navigation";

// Define supported locales
export const locales = ["ar", "en"] as const;
export type Locale = (typeof locales)[number];

// Import translations
const translations = {
  ar: () => import("@/messages/ar").then((module) => module.default),
  en: () => import("@/messages/en").then((module) => module.default),
};

export default getRequestConfig(async ({ locale }) => {
  // Validate that the incoming `locale` parameter is valid
  if (!locales.includes(locale as Locale)) notFound();

  return {
    locale,
    messages: await translations[locale as Locale](),
  };
});
