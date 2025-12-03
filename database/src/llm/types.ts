/**
 * LLM Model Type Definitions for Safee Analytics
 *
 * Defines all supported AI models across multiple providers.
 * Used for type-safe model selection in LLM operations.
 */

// OpenAI Models
export const OpenAiModels = [
  "gpt-4o",
  "gpt-4o-mini",
  "o1",
  "o1-mini",
  "o3-mini",
  "gpt-4.1",
  "gpt-4.1-mini",
  "gpt-4.1-nano",
  "gpt-5",
  "gpt-5-mini",
  "gpt-5-nano",
] as const;

export type OpenAiModel = (typeof OpenAiModels)[number];

// Anthropic Claude Models
export const AnthropicModels = [
  "haiku-3",
  "haiku-3.5",
  "sonnet-3.5",
  "sonnet-3.7",
  "sonnet-4",
  "opus-4",
] as const;

export type AnthropicModel = (typeof AnthropicModels)[number];

// Google Gemini Models
export const GeminiModels = ["gemini-2.5-pro", "gemini-2.5-flash", "gemini-2.5-flash-lite"] as const;

export type GeminiModel = (typeof GeminiModels)[number];

// Xai Grok Models
export const GrokModels = ["grok-3", "grok-3-mini", "grok-4"] as const;

export type GrokModel = (typeof GrokModels)[number];

// Union of all LLM models
export type LlmModel = OpenAiModel | AnthropicModel | GeminiModel | GrokModel;

// Helper function to check if a string is a valid LLM model
export function isValidLlmModel(model: string): model is LlmModel {
  return (
    (OpenAiModels as readonly string[]).includes(model) ||
    (AnthropicModels as readonly string[]).includes(model) ||
    (GeminiModels as readonly string[]).includes(model) ||
    (GrokModels as readonly string[]).includes(model)
  );
}

// Get provider from model name
export function getProviderFromModel(model: LlmModel): "openai" | "anthropic" | "gemini" | "grok" {
  if ((OpenAiModels as readonly string[]).includes(model)) return "openai";
  if ((AnthropicModels as readonly string[]).includes(model)) return "anthropic";
  if ((GeminiModels as readonly string[]).includes(model)) return "gemini";
  if ((GrokModels as readonly string[]).includes(model)) return "grok";
  throw new Error(`Unknown model: ${model}`);
}
