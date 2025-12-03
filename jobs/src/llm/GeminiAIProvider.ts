import { type Logger } from "pino";
import { GEMINI_API_KEY } from "../env.js";
import { ChatMessageParams, ChatMessageResponse, LLMProvider } from "./llmProvider.js";
import { GenerateContentConfig, GoogleGenAI, ThinkingConfig } from "@google/genai";

import { GeminiModel } from "@safee/database";
import { LLMProvider429Error, LLMProvider500Error } from "./index.js";
import { ZodType, toJSONSchema } from "zod";

type Dependencies = {
  logger?: Logger;
  model?: GeminiModel;
};

export class GeminiAIProvider implements LLMProvider {
  private gemini: GoogleGenAI;
  logger?: Logger;
  private model: string;

  constructor({ model, logger }: Dependencies = {}) {
    this.logger = logger;
    this.gemini = new GoogleGenAI({
      apiKey: GEMINI_API_KEY,
    });

    this.model = model ?? "gemini-2.5-flash-lite";
  }

  private prepareMessages(messages: ChatMessageParams[]) {
    // Filter and concatenate system messages to set the system variable
    const systemMessage = messages
      .filter((message) => message.role === "system")
      .map((message) => message.content)
      .join("\n");

    const filteredMessages = [];

    for (const message of messages) {
      if ((message.role === "user" || message.role === "assistant") && message.content) {
        filteredMessages.push({
          role: message.role === "user" ? "user" : "model",
          parts: [{ text: message.content }],
        });
      }
    }

    return { systemMessage, filteredMessages };
  }

  async getResponse({
    messages,
    schema,
    maxTokens = 1024,
    temperature = 1,
  }: {
    messages: ChatMessageParams[];
    maxTokens?: number;
    schema?: ZodType;
    temperature?: number;
  }): Promise<ChatMessageResponse> {
    const { systemMessage, filteredMessages } = this.prepareMessages(messages);

    const thinkingConfig: ThinkingConfig = {
      includeThoughts: false,
      thinkingBudget: 0,
    };

    const config: GenerateContentConfig = {
      maxOutputTokens: maxTokens,
      systemInstruction: systemMessage,
      thinkingConfig,
      temperature,
    };

    if (schema) {
      config.responseMimeType = "application/json";
      config.responseJsonSchema = toJSONSchema(schema);
    }

    const request = {
      model: this.model,
      config,
      contents: filteredMessages,
    };

    const llmTxId = crypto.randomUUID(); // transaction ID for this LLM call
    this.logger?.info({ request, llmTxId }, "Gemini request");

    try {
      const response = await this.gemini.models.generateContent(request);
      this.logger?.info({ response, llmTxId }, "Gemini response");

      if (!response.text) {
        throw new Error("Gemini response error");
      }

      return {
        message: response.text,
        finish_reason: "stop",
        tokens: {
          input_tokens: response.usageMetadata?.promptTokenCount ?? 0,
          output_tokens:
            (response.usageMetadata?.toolUsePromptTokenCount ?? 0) +
            (response.usageMetadata?.candidatesTokenCount ?? 0),
        },
      };
    } catch (err: unknown) {
      this.logger?.error({ err, llmTxId }, "Gemini response error");

      // gemini doesnt provide errors like openai
      if (typeof err === "object" && err !== null && "status" in err) {
        if (err.status === 429) {
          throw new LLMProvider429Error("Gemini Rate Limit Error", { cause: err });
        }
        throw new LLMProvider500Error("Gemini API Error", { cause: err });
      }

      throw err;
    }
  }
}
