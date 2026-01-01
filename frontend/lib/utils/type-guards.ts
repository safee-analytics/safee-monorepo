export function isString(value: unknown): value is string {
  return typeof value === "string";
}

export type Direction = "ltr" | "rtl";

export function isDirection(value: unknown): value is Direction {
  return value === "ltr" || value === "rtl";
}

export interface ExtendedUser {
  id: string;
  name?: string | null;
  email: string;
  image?: string | null;
  username?: string | null;
  phone?: string | null;
  jobTitle?: string | null;
  department?: string | null;
  company?: string | null;
  location?: string | null;
  bio?: string | null;
  preferredLocale?: "en" | "ar";
}

export function isExtendedUser(user: unknown): user is ExtendedUser {
  if (typeof user !== "object" || user === null) {
    return false;
  }
  const u = user as Record<string, unknown>;
  return (
    typeof u.id === "string" &&
    typeof u.email === "string" &&
    (!u.phone || typeof u.phone === "string") &&
    (!u.jobTitle || typeof u.jobTitle === "string") &&
    (!u.department || typeof u.department === "string")
  );
}
