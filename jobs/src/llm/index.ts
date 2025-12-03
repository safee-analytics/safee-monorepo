/**
 * LLM Module for Safee Analytics
 *
 * Provides unified interface to multiple AI providers for text generation,
 * data extraction, and intelligent automation across all Safee modules.
 *
 * Supported Providers:
 * - OpenAI: GPT-4o, GPT-4.1, O1, O3-mini, GPT-5 series
 * - Anthropic: Claude Haiku, Sonnet, Opus (3.x/4.x)
 * - Google: Gemini 2.5 Pro, Flash
 * - Xai: Grok 3, Grok 4
 *
 * Features:
 * - Automatic provider fallback on errors
 * - Structured JSON output with Zod validation
 * - BigQuery telemetry for cost tracking
 * - LangSmith debugging integration
 */
import { LlmModel } from "@safee/database";
import { Logger } from "pino";
import { AnthropicProvider } from "./anthropicProvider.js";
import { GeminiAIProvider } from "./GeminiAIProvider.js";
import { GrokAIProvider } from "./grokProvider.js";
import { LLMProvider } from "./llmProvider.js";
import { OpenAIProvider } from "./openAIProvider.js";

export * from "./aiChatSession.js";

/**
 * Fallback mapping for provider errors (rate limits, outages)
 * Automatically switches to alternative provider with similar capabilities
 */
export const PROVIDER_FALLBACKS: Record<LlmModel, LlmModel> = {
  "haiku-3.5": "gpt-4.1-nano",
  "haiku-3": "gpt-4.1-nano",
  "sonnet-3.5": "gpt-4.1-mini",
  "sonnet-3.7": "gpt-4.1-mini",
  "sonnet-4": "gpt-4.1-mini",
  "opus-4": "gpt-4.1-mini",
  "gpt-4o-mini": "haiku-3.5",
  "gpt-4o": "sonnet-3.7",
  o1: "opus-4",
  "o3-mini": "sonnet-3.7",
  "o1-mini": "sonnet-3.7",
  "gemini-2.5-pro": "gpt-4.1-mini",
  "gemini-2.5-flash-lite": "gpt-4.1-nano",
  "gemini-2.5-flash": "gpt-4.1-nano",
  "grok-3": "gpt-4.1-mini",
  "grok-3-mini": "gpt-4.1-mini",
  "grok-4": "gpt-4.1-mini",
  "gpt-4.1": "haiku-3.5",
  "gpt-4.1-mini": "haiku-3.5",
  "gpt-4.1-nano": "gemini-2.5-flash-lite",
  "gpt-5": "gpt-4.1-mini",
  "gpt-5-mini": "gpt-4.1-mini",
  "gpt-5-nano": "gpt-4.1-nano",
} as const;

export function createProvider(model: LlmModel, logger?: Logger): LLMProvider {
  switch (model) {
    case "gpt-4o":
    case "gpt-4o-mini":
    case "o1":
    case "o1-mini":
    case "o3-mini":
    case "gpt-4.1":
    case "gpt-4.1-mini":
    case "gpt-4.1-nano":
    case "gpt-5":
    case "gpt-5-mini":
    case "gpt-5-nano":
      return new OpenAIProvider({ model, logger });
    case "haiku-3":
    case "haiku-3.5":
    case "sonnet-3.5":
    case "sonnet-3.7":
    case "sonnet-4":
    case "opus-4":
      return new AnthropicProvider({ model, logger });
    case "gemini-2.5-pro":
    case "gemini-2.5-flash-lite":
    case "gemini-2.5-flash":
      return new GeminiAIProvider({ model, logger });
    case "grok-4":
    case "grok-3":
    case "grok-3-mini":
      return new GrokAIProvider({ model, logger });
    default:
      model satisfies never;
      throw new Error("Model has not been defined for createProvider");
  }
}

export class LLMProviderError extends Error {}
export class LLMProvider429Error extends LLMProviderError {}
export class LLMProvider500Error extends LLMProviderError {}
export class LLMProvider529Error extends LLMProviderError {}
