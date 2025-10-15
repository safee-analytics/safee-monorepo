import type { Locale } from "../drizzle/_common.js";

export interface MultilingualText {
  en: string;
  ar?: string;
}

export function getLocalizedText(text: MultilingualText, locale: Locale): string {
  switch (locale) {
    case "ar":
      return text.ar ?? text.en;
    case "en":
    default:
      return text.en;
  }
}

export function createMultilingualText(en: string, ar?: string): MultilingualText {
  return { en, ar };
}

export function isValidLocale(locale: string): locale is Locale {
  return locale === "en" || locale === "ar";
}

export function parseAcceptLanguage(acceptLanguage?: string): Locale {
  if (!acceptLanguage) {
    return "en";
  }

  const languages = acceptLanguage
    .split(",")
    .map((lang) => {
      const [code, priority] = lang.trim().split(";");
      const q = priority ? parseFloat(priority.split("=")[1]) : 1.0;
      return { code: code.split("-")[0].toLowerCase(), q };
    })
    .sort((a, b) => b.q - a.q);

  for (const lang of languages) {
    if (isValidLocale(lang.code)) {
      return lang.code;
    }
  }

  return "en";
}

export type MultilingualField<T extends string> = {
  [K in T as `${K}En`]: string;
} & {
  [K in T as `${K}Ar`]?: string | null;
};

export function extractLocalizedField(
  obj: Record<string, unknown>,
  fieldName: string,
  locale: Locale,
): string {
  const enField = `${fieldName}En`;
  const arField = `${fieldName}Ar`;

  switch (locale) {
    case "ar": {
      const arValue = obj[arField];
      if (
        arValue !== null &&
        arValue !== undefined &&
        arValue !== "" &&
        (typeof arValue === "string" || typeof arValue === "number" || typeof arValue === "boolean")
      ) {
        return String(arValue);
      }
      return String(obj[enField]);
    }
    case "en":
    default:
      return String(obj[enField]);
  }
}

export function localizeObject(
  obj: Record<string, unknown>,
  fields: string[],
  locale: Locale,
): Record<string, unknown> {
  const result: Record<string, unknown> = { ...obj };

  for (const field of fields) {
    const enField = `${field}En`;
    const arField = `${field}Ar`;

    result[field] = extractLocalizedField(obj, field, locale);

    // Remove the language-specific fields
    const { [enField]: _en, [arField]: _ar, ...rest } = result;
    Object.assign(result, rest);
  }

  return result;
}

export function bilingualObject(obj: Record<string, unknown>, fields: string[]): Record<string, unknown> {
  const result: Record<string, unknown> = { ...obj };

  for (const field of fields) {
    const enField = `${field}En`;
    const arField = `${field}Ar`;

    result[field] = {
      en: obj[enField],
      ar: obj[arField] ?? null,
    };

    // Remove the language-specific fields
    const { [enField]: _en, [arField]: _ar, ...rest } = result;
    Object.assign(result, rest);
  }

  return result;
}
