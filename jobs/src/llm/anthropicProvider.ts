import { Anthropic } from "@anthropic-ai/sdk";
import { AnthropicModel } from "@safee/database";
import { wrapSDK } from "langsmith/wrappers";
import { type Logger } from "pino";
import { ANTHROPIC_API_KEY, LANGSMITH_TRACING_V2 } from "../env.js";
import { LLMProvider429Error, LLMProvider500Error, LLMProvider529Error } from "./index.js";
import { ChatMessageParams, ChatMessageResponse, LLMProvider } from "./llmProvider.js";
import { traceable } from "langsmith/traceable";

type Dependencies = {
  logger?: Logger;
  model?: AnthropicModel;
};

type MessageContent =
  | Anthropic.TextBlockParam
  | Anthropic.ImageBlockParam
  | Anthropic.ToolUseBlockParam
  | Anthropic.ToolResultBlockParam;

export class AnthropicProvider implements LLMProvider {
  private anthropic: Anthropic;
  logger?: Logger;
  private model: string;

  constructor({ model, logger }: Dependencies = {}) {
    this.anthropic = new Anthropic({
      apiKey: ANTHROPIC_API_KEY,
      // when this is undefined it defaults to actual anthropic api url
      baseURL: process.env.ANTHROPIC_API_URL,
    });
    if (LANGSMITH_TRACING_V2) {
      this.anthropic = wrapSDK(this.anthropic);
    }
    this.logger = logger;

    switch (model) {
      case "haiku-3":
        this.model = "claude-3-haiku-20240307";
        break;
      case "haiku-3.5":
        this.model = "claude-3-5-haiku-20241022";
        break;
      case "sonnet-3.5":
        this.model = "claude-3-5-sonnet-20241022";
        break;
      case "sonnet-3.7":
        this.model = "claude-3-7-sonnet-20250219";
        break;
      case "sonnet-4":
        this.model = "claude-sonnet-4-20250514";
        break;
      case "opus-4":
        this.model = "claude-opus-4-20250514";
        break;
      default:
        this.model = "claude-3-5-haiku-20241022";
        break;
    }
    if (LANGSMITH_TRACING_V2) {
      this.messagesCreate = traceable(this.messagesCreate.bind(this), {
        run_type: "llm",
      });
    }
  }

  private prepareMessages(messages: ChatMessageParams[]): {
    systemMessage: string;
    filteredMessages: Anthropic.MessageParam[];
  } {
    // Filter and concatenate system messages to set the system variable
    const systemMessage = messages
      .filter((message) => message.role === "system")
      .map((message) => message.content)
      .join("\n");

    // Filter messages to include only "user" or "assistant" roles,
    // and combine consecutive messages with the same role
    const filteredMessages = messages
      .filter((message) => message.role !== "system")
      .reduce<Anthropic.MessageParam[]>((agg, curr) => {
        const lastMessage = agg.length > 0 ? agg[agg.length - 1] : null;

        const contentArray = [];

        if (curr.content) {
          contentArray.push({ text: curr.content, type: "text" } as Anthropic.Messages.TextBlockParam);
        }

        if (lastMessage && lastMessage.role === curr.role) {
          (lastMessage.content as MessageContent[]).push(...contentArray);
        } else {
          agg.push({
            role: curr.role as "user" | "assistant",
            content: contentArray,
          });
        }
        return agg;
      }, []);

    if (filteredMessages.length === 0) {
      filteredMessages.push({ role: "user", content: "Follow the system message." });
    }

    // Anthropic throws an error if the first message is NOT user
    if (filteredMessages[0].role !== "user") {
      filteredMessages.unshift({
        role: "user",
        content: "Ignore this message and follow the rest of the prompts.",
      });
    }

    return { systemMessage, filteredMessages };
  }

  async messagesCreate({ messages, maxTokens = 1024 }: { messages: ChatMessageParams[]; maxTokens?: 1024 }) {
    const { systemMessage, filteredMessages } = this.prepareMessages(messages);

    const request = {
      max_tokens: maxTokens,
      messages: filteredMessages,
      system: systemMessage,
      model: this.model,
    } as Anthropic.MessageCreateParamsNonStreaming;

    return this.anthropic.messages.create(request);
  }

  async getResponse({
    messages,
    maxTokens = 1024,
  }: {
    messages: ChatMessageParams[];
    maxTokens?: 1024;
  }): Promise<ChatMessageResponse> {
    // partially format request for langsmith
    const request = {
      max_tokens: maxTokens,
      messages,
    };

    const llmTxId = crypto.randomUUID(); // transaction ID for this LLM call
    this.logger?.info({ request, llmTxId }, "Anthropic request");

    try {
      const response = await this.messagesCreate(request);

      let message = null;

      this.logger?.info({ response, llmTxId }, "Anthropic response");

      for (const block of response.content) {
        if (block.type === "text" && message === null) {
          message = block.text;
        }
      }

      return {
        finish_reason: response.stop_reason,
        message: response.stop_reason === "tool_use" ? null : message,
        tokens: {
          input_tokens: response.usage.input_tokens,
          output_tokens: response.usage.output_tokens,
        },
      };
    } catch (err) {
      this.logger?.error({ err, llmTxId }, "Anthropic response error");
      if (err instanceof Anthropic.RateLimitError)
        throw new LLMProvider429Error("Anthropic Rate Limit Error", { cause: err });
      // anthropic just classifies all 500 errors as internal errors
      if (err instanceof Anthropic.InternalServerError && err.status === 529)
        throw new LLMProvider529Error("Anthropic Overloaded Error", { cause: err });
      if (err instanceof Anthropic.AnthropicError)
        throw new LLMProvider500Error("Anthropic API Error", { cause: err });
      throw err;
    }
  }
}
