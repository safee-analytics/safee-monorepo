function required(name: string) {
  const value = process.env[name];
  if (!value) throw new Error(`Environment variable ${name} is required`);
  return value;
}

export const IS_LOCAL = process.env.NODE_ENV === "local" || process.env.NODE_ENV === "development";
export const IS_DEV = process.env.NODE_ENV === "development";
export const IS_PROD = process.env.NODE_ENV === "production";

export const JWT_SECRET = IS_PROD ? required("JWT_SECRET") : (process.env.JWT_SECRET ?? "dev-secret");

export const ODOO_URL = process.env.ODOO_URL ?? "http://localhost:8069";
export const ODOO_PORT = parseInt(process.env.ODOO_PORT ?? "8069", 10);
export const ODOO_ADMIN_PASSWORD = IS_PROD
  ? required("ODOO_ADMIN_PASSWORD")
  : (process.env.ODOO_ADMIN_PASSWORD ?? "admin");

export const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY ?? "";
export const ANTHROPIC_API_URL = process.env.ANTHROPIC_API_URL; // Optional custom endpoint

export const OPENAI_API_KEY = process.env.OPENAI_API_KEY ?? "";
export const OPENAI_BASE_URL = process.env.OPENAI_BASE_URL;
export const OPENAI_ORGANIZATION = process.env.OPENAI_ORGANIZATION;

export const GEMINI_API_KEY = process.env.GEMINI_API_KEY ?? "";

export const GROK_API_KEY = process.env.GROK_API_KEY ?? "";

export const BQ_ENABLED = process.env.BQ_ENABLED === "true";
export const BQ_DATASET = process.env.BQ_DATASET ?? "safee_analytics";

export const LANGSMITH_TRACING_V2 = process.env.LANGSMITH_TRACING_V2 === "true";
export const LANGSMITH_PROJECT = process.env.LANGSMITH_PROJECT ?? "safee-analytics";

export const LLM_DEBUG_FILEPATH = process.env.LLM_DEBUG_FILEPATH;
