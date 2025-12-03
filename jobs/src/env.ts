/**
 * Environment configuration for Safee Jobs
 * Includes LLM provider API keys and telemetry settings
 */

// Environment
export const IS_LOCAL = process.env.NODE_ENV === "local" || process.env.NODE_ENV === "development";
export const IS_DEV = process.env.NODE_ENV === "development";
export const IS_PROD = process.env.NODE_ENV === "production";

// LLM Provider API Keys
export const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY ?? "";
export const ANTHROPIC_API_URL = process.env.ANTHROPIC_API_URL; // Optional custom endpoint

export const OPENAI_API_KEY = process.env.OPENAI_API_KEY ?? "";
export const OPENAI_BASE_URL = process.env.OPENAI_BASE_URL;
export const OPENAI_ORGANIZATION = process.env.OPENAI_ORGANIZATION;

export const GEMINI_API_KEY = process.env.GEMINI_API_KEY ?? "";

export const GROK_API_KEY = process.env.GROK_API_KEY ?? "";

// BigQuery Telemetry
export const BQ_ENABLED = process.env.BQ_ENABLED === "true";
export const BQ_DATASET = process.env.BQ_DATASET ?? "safee_analytics";

// LangSmith Debugging
export const LANGSMITH_TRACING_V2 = process.env.LANGSMITH_TRACING_V2 === "true";
export const LANGSMITH_PROJECT = process.env.LANGSMITH_PROJECT ?? "safee-analytics";

// Debug logging
export const LLM_DEBUG_FILEPATH = process.env.LLM_DEBUG_FILEPATH;
