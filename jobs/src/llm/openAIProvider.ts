import { OpenAI } from "openai";
import { type Logger } from "pino";
import { OPENAI_API_KEY, OPENAI_BASE_URL, OPENAI_ORGANIZATION } from "../env.js";
import { LLMProvider429Error, LLMProvider500Error, LLMProvider529Error } from "./index.js";
import { ChatMessageParams, ChatMessageResponse, LLMProvider } from "./llmProvider.js";

import { OpenAiModel } from "@safee/database";
import { z, ZodType } from "zod";

type Dependencies = {
  logger?: Logger;
  model?: OpenAiModel;
};

export class OpenAIProvider implements LLMProvider {
  private openai: OpenAI;
  logger?: Logger;
  private model: string;
  private useTemperature = true;

  constructor({ model, logger }: Dependencies = {}) {
    this.logger = logger;
    this.openai = new OpenAI({
      apiKey: OPENAI_API_KEY,
      organization: OPENAI_ORGANIZATION,
      baseURL: OPENAI_BASE_URL,
    });

    this.useTemperature = true;

    switch (model) {
      case "gpt-4o-mini":
        this.model = "gpt-4o-mini-2024-07-18";
        break;
      case "gpt-4o":
        this.model = "gpt-4o-2024-08-06";
        break;
      case "o1":
        this.model = "o1-2024-12-17";
        break;
      case "o1-mini":
        this.model = "o1-mini-2024-09-12";
        break;
      case "o3-mini":
        this.model = "o3-mini-2025-01-31";
        break;
      case "gpt-4.1":
        this.model = "gpt-4.1-2025-04-14";
        break;
      case "gpt-4.1-mini":
        this.model = "gpt-4.1-mini-2025-04-14";
        break;
      case "gpt-4.1-nano":
        this.model = "gpt-4.1-nano-2025-04-14";
        break;
      case "gpt-5":
        this.model = "gpt-5-2025-08-07";
        this.useTemperature = false;
        break;
      case "gpt-5-mini":
        this.model = "gpt-5-mini-2025-08-07";
        this.useTemperature = false;
        break;
      case "gpt-5-nano":
        this.model = "gpt-5-nano-2025-08-07";
        this.useTemperature = false;
        break;
      default:
        this.model = "gpt-4o-mini-2024-07-18";
        break;
    }
  }

  private prepMessages(messages: ChatMessageParams[]) {
    return messages.map((message) => ({
      ...message,
      role: message.role === "system" ? "developer" : message.role,
    }));
  }

  async getResponse({
    messages,
    maxTokens = 1024,
    schema,
    temperature = 1,
  }: {
    messages: ChatMessageParams[];
    maxTokens?: number;
    schema?: ZodType;
    temperature?: number;
  }): Promise<ChatMessageResponse> {
    const openAIMessages = this.prepMessages(messages);

    const request = {
      model: this.model,
      messages: openAIMessages as unknown as OpenAI.ChatCompletionMessageParam[],
      max_completion_tokens: maxTokens,
      temperature: this.useTemperature ? temperature : 1,
      response_format: schema
        ? {
            type: "json_schema" as const,
            json_schema: {
              name: "schema",
              strict: true,
              schema: z.toJSONSchema(schema),
            },
          }
        : undefined,
    };

    const llmTxId = crypto.randomUUID(); // transaction ID for this LLM call
    this.logger?.info({ request, llmTxId }, "OpenAI request");

    try {
      const response = await this.openai.chat.completions.create(request, {
        maxRetries: 3,
      });
      this.logger?.info({ response, llmTxId }, "OpenAI response");

      const choice = response.choices[0];

      return {
        message: choice.message.content,
        finish_reason: choice.finish_reason,
        tokens: {
          input_tokens: response.usage?.prompt_tokens ?? 0,
          output_tokens: response.usage?.completion_tokens ?? 0,
        },
      };
    } catch (err) {
      this.logger?.error({ err, llmTxId }, "OpenAI response error");
      if (err instanceof OpenAI.RateLimitError)
        throw new LLMProvider429Error("OpenAI Rate Limit Error", { cause: err });
      // openai just classifies ALL 500 as internal errors
      if (err instanceof OpenAI.InternalServerError && err.status === 529)
        throw new LLMProvider529Error("OpenAI Overloaded Error", { cause: err });
      if (err instanceof OpenAI.OpenAIError) throw new LLMProvider500Error("OpenAI Error", { cause: err });
      throw err;
    }
  }
}
