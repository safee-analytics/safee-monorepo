import { OpenAI } from "openai";
import { Logger } from "pino";
import { GROK_API_KEY } from "../env.js";
import { GrokModel } from "@safee/database";
import { ChatMessageParams, ChatMessageResponse, LLMProvider } from "./llmProvider.js";
import { LLMProvider429Error, LLMProvider529Error, LLMProvider500Error } from "./index.js";

type Dependencies = {
  logger?: Logger;
  model?: GrokModel;
};

export class GrokAIProvider implements LLMProvider {
  private grok: OpenAI;
  logger?: Logger;
  private model: string;

  constructor({ model, logger }: Dependencies = {}) {
    this.logger = logger;
    this.grok = new OpenAI({
      apiKey: GROK_API_KEY,
      baseURL: "https://api.x.ai/v1",
    });

    switch (model) {
      case "grok-3":
        this.model = "grok-3-beta";
        break;
      case "grok-3-mini":
        this.model = "grok-3-mini";
        break;
      case "grok-4":
        this.model = "grok-4-0709";
        break;
      default:
        this.model = "grok-3-mini";
        break;
    }
  }

  async getResponse({
    messages,
    maxTokens = 1024,
  }: {
    messages: ChatMessageParams[];
    maxTokens?: number;
  }): Promise<ChatMessageResponse> {
    const request = {
      model: this.model,
      messages: messages as unknown as OpenAI.ChatCompletionMessageParam[],
      max_completion_tokens: maxTokens,
    };

    const llmTxId = crypto.randomUUID(); // transaction ID for this LLM call
    this.logger?.info({ request, llmTxId }, "Grok request");

    try {
      const response = await this.grok.chat.completions.create(request, {
        maxRetries: 3,
      });
      this.logger?.info({ response, llmTxId }, "Grok response");

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
      this.logger?.error({ err, llmTxId }, "Grok response error");
      if (err instanceof OpenAI.RateLimitError)
        throw new LLMProvider429Error("Grok Rate Limit Error", { cause: err });
      // openai just classifies ALL 500 as internal errors
      if (err instanceof OpenAI.InternalServerError && err.status === 529)
        throw new LLMProvider529Error("Grok Overloaded Error", { cause: err });
      if (err instanceof OpenAI.OpenAIError) throw new LLMProvider500Error("Grok Error", { cause: err });
      throw err;
    }
  }
}
