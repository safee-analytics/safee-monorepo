/* eslint-disable no-console */
import { join } from "node:path";
import { fileURLToPath } from "node:url";
function required(name) {
    const value = process.env[name];
    if (!value)
        throw new Error(`Environment variable ${name} is required`);
    return value;
}
function number(name, fallback) {
    const value = process.env[name];
    if (!value && fallback === undefined)
        throw new Error(`Environment variable ${name} is required`);
    if (!value)
        return fallback;
    if (Number.isNaN(+value))
        throw new Error(`Environment variable ${name} must be a number. Found: ${value}`);
    return +value;
}
function boolean(name, fallback) {
    const value = process.env[name];
    if (!value && fallback === undefined)
        throw new Error(`Environment variable ${name} is required`);
    if (!value)
        return fallback;
    return value.toLowerCase() === "true";
}
export const ENV = process.env.ENV ?? "local";
console.log(`Running in ${ENV} mode`);
export const IS_LOCAL = ENV === "local";
export const API_SECRET_KEY = process.env.API_SECRET_KEY;
export const PORT = number("PORT", 4050);
export const HOST = process.env.HOST ?? "0.0.0.0";
export const LOG_LEVEL = process.env.LOG_LEVEL ?? "info";
export const COOKIE_KEY = process.env.COOKIE_KEY;
export const JWT_SECRET = process.env.JWT_SECRET ?? "fake-jwt-secret";
export const DATABASE_URL = ENV !== "test" ? required("DATABASE_URL") : null;
// export const PUBSUB_TOPIC_PREFIX = process.env.PUBSUB_TOPIC_PREFIX ?? "colony";
// export const PROJECT_ID = process.env.PROJECT_ID ?? process.env.PUBSUB_PROJECT_ID ?? "parallel-dev-332718";
const __dirname = fileURLToPath(new URL(".", import.meta.url));
export const USE_CLOUD_STORAGE = boolean("USE_CLOUD_STORAGE", false);
export const FILE_UPLOAD_BUCKET = USE_CLOUD_STORAGE
    ? (process.env.FILE_UPLOAD_BUCKET ?? "dev-safee-private-storage")
    : join(__dirname, "../../.cache");
export const FILE_UPLOAD_PATH = process.env.FILE_UPLOAD_PATH ?? "gateway/uploads";
export const PUBLIC_DIR = process.env.PUBLIC_DIR ?? join(__dirname, "../public");
export const CORS_ORIGIN = process.env.CORS_ORIGIN
    ? [process.env.CORS_ORIGIN, "http://localhost:4049"]
    : ["http://localhost:4049"];
export const DASHBOARD_BASE_URL = process.env.DASHBOARD_BASE_URL ?? "http://localhost:4050/";
