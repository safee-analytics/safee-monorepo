function number(name: string, fallback?: number): number;
function number(name: string, fallback: null): number | null;
function number(name: string, fallback?: number | null): number | null {
  const value = process.env[name];
  if (!value) {
    if (fallback === null) return null;
    if (fallback === undefined) throw new Error(`Environment variable ${name} is required`);
    return fallback;
  }
  if (Number.isNaN(+value)) throw new Error(`Environment variable ${name} must be a number. Found: ${value}`);
  return +value;
}

export function required(name: string) {
  const value = process.env[name];
  if (!value) throw new Error(`Environment variable ${name} is required`);
  return value;
}

export const ENV = process.env.ENV ?? "local";
export const IS_LOCAL = ENV === "local";

export const LOG_LEVEL = process.env.LOG_LEVEL ?? "info";
export const SQL_LOG_LEVEL = process.env.SQL_LOG_LEVEL ?? LOG_LEVEL;

export const REDIS_URL = process.env.REDIS_URL;

const DATABASE_URL = process.env.DATABASE_URL;
export const DATABASE_CONNECTION_LIMIT = number("DATABASE_CONNECTION_LIMIT", null);
const FULL_DATABASE_URL =
  DATABASE_CONNECTION_LIMIT && DATABASE_URL
    ? `${DATABASE_URL}?connection_limit=${DATABASE_CONNECTION_LIMIT}`
    : DATABASE_URL;
export { FULL_DATABASE_URL as DATABASE_URL };
