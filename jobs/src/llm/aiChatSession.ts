import { LlmModel, generalUtils } from "@safee/database";
import { traceable } from "langsmith/traceable";
import assert from "node:assert";
import { Logger } from "pino";
import { BigQueryInserter } from "./bigQueryInserter.js";
import { LANGSMITH_PROJECT, LANGSMITH_TRACING_V2, IS_LOCAL } from "../env.js";
import { createProvider, LLMProviderError, PROVIDER_FALLBACKS } from "./index.js";
import { ChatMessageParams, LLMProvider, LLMTokenResponse } from "./llmProvider.js";
import { z, ZodType } from "zod";
import { join } from "node:path";

export type AIMessage =
  | { role: "user"; message: string }
  | { role: "assistant"; message: string; toolCalls: null }
  | { role: "system"; message: string };

/**
 * AIChatSession - Core LLM orchestration for Safee Analytics
 *
 * Manages conversational AI sessions across the platform with:
 * - Multi-provider support (OpenAI, Anthropic, Gemini, Grok)
 * - Automatic fallback on provider errors (429, 500, 529)
 * - Structured JSON outputs with Zod schema validation
 * - Token usage tracking via BigQuery
 * - LangSmith tracing for debugging
 *
 * Use cases in Safee:
 * - Hisabiq: Invoice data extraction, financial report generation
 * - Kanz: Employee record processing, payroll insights
 * - Nisbah: Lead qualification, CRM data enrichment
 *
 * Sessions persist across requests by saving messages to the database,
 * enabling continuity for complex multi-turn AI interactions.
 */
export class AIChatSession {
  private providers: LLMProvider[] = [];
  private modelStrings: LlmModel[] = [];
  private currentProviderIndex = 0;
  messages: ChatMessageParams[] = [];
  logger?: Logger;
  private promptType = "";

  private bq: BigQueryInserter;

  constructor({
    model,
    logger,
    useFallback,
    promptType,
  }: {
    model: LlmModel;
    logger?: Logger;
    useFallback: boolean;
    promptType: string;
  }) {
    if (useFallback) {
      const fallbackModel = PROVIDER_FALLBACKS[model];
      this.providers = [createProvider(model, logger), createProvider(fallbackModel, logger)];
      this.modelStrings = [model, fallbackModel];
    } else {
      this.providers = [createProvider(model, logger)];
      this.modelStrings = [model];
    }

    this.logger = logger;

    if (LANGSMITH_TRACING_V2) {
      this.getResponse = traceable(this.getResponse.bind(this), {
        run_type: "chain",
        project_name: LANGSMITH_PROJECT,
        processInputs: () => ({}),
      });
    }

    this.promptType = promptType;
    this.bq = new BigQueryInserter({ logger, promptType });
  }

  private get currentProvider(): LLMProvider {
    return this.providers[this.currentProviderIndex];
  }

  private get currentModelString(): LlmModel {
    return this.modelStrings[this.currentProviderIndex];
  }

  append(message: ChatMessageParams): this {
    this.messages.push(message);
    return this;
  }

  userMessage(content: string): this {
    return this.append({
      role: "user",
      content,
    });
  }

  systemMessage(content: string, name?: string): this {
    return this.append({ role: "system", content, name });
  }

  assistantMessage(content: string): this {
    return this.append({
      role: "assistant",
      content,
    });
  }

  clearMessages(): this {
    this.messages = [];
    return this;
  }

  addChatMessage(chatMessage: AIMessage) {
    switch (chatMessage.role) {
      case "user":
        this.userMessage(chatMessage.message);
        break;
      case "assistant":
        this.assistantMessage(chatMessage.message);
        break;
      case "system":
        this.systemMessage(chatMessage.message);
        break;
    }
    return this;
  }

  /**
   * Add a response from the underlying LLM provider to the current session.
   *
   * Returns the string that the LLM responded with.
   *
   * The returned message is not automatically added to this chat session's message history.
   * Intermediate function calls, however, ARE added.
   */
  async getResponse({
    maxTokens,
    validateFn,
    maxAttempts = 3,
    schema,
    temperature = 1,
  }: {
    maxTokens?: number;
    validateFn?: (message: string) => true | string;
    maxAttempts?: number;
    schema?: ZodType;
    temperature?: number;
  } = {}): Promise<{ message: string }> {
    let validationAttempts = 0;
    let iterations = 0;

    const tokens: LLMTokenResponse = { input_tokens: 0, output_tokens: 0 };
    let currentModel = this.currentModelString;

    for (;;) {
      iterations += 1;
      if (iterations > 10) {
        throw new Error("Too many iterations");
      }
      this.currentProvider.logger?.debug({ messages: this.messages });
      await this.debugWriteToFile("req", JSON.stringify(this.messages, null, 2));

      try {
        const response = await this.currentProvider.getResponse({
          messages: this.messages,
          maxTokens,
          schema,
          temperature,
        });

        tokens.input_tokens += response.tokens.input_tokens;
        tokens.output_tokens += response.tokens.output_tokens;

        switch (response.finish_reason) {
          case "stop":
          case "length":
          case "max_tokens":
          case "end_turn": {
            if (!response.message && validationAttempts < maxAttempts) {
              this.userMessage(
                "You just provided an empty response.  You cannot do that.  Please provide a response.",
              );
              validationAttempts++;
              break;
            }
            assert(response.message);
            await this.debugWriteToFile("res", response.message);

            // Validate response if validation function is provided
            if (validateFn) {
              const validationResult = validateFn(response.message);
              if (validationResult !== true) {
                if (validationAttempts < maxAttempts) {
                  this.userMessage(
                    `Validation error: ${validationResult}. Please try again with a valid response.`,
                  );
                  validationAttempts++;
                  break;
                } else {
                  await this.bq.insertIntoBigQuery({
                    model: currentModel,
                    tokens,
                    messages: [...this.messages, { role: "assistant", content: response.message }],
                  });
                  throw new Error(`Validation failed after ${maxAttempts} attempts: ${validationResult}`);
                }
              }
            }

            await this.bq.insertIntoBigQuery({
              model: currentModel,
              tokens,
              messages: [...this.messages, { role: "assistant", content: response.message }],
            });
            return { message: response.message };
          }
          case "tool_calls":
          case "tool_use":
            throw new Error(
              "Tool calls are not supported in this method. Use getJsonResponse with structured output instead.",
            );
          default:
            await this.bq.insertIntoBigQuery({
              model: currentModel,
              tokens,
              messages: this.messages,
            });
            throw new TypeError("Unexpected response was returned");
        }
      } catch (err) {
        if (err instanceof LLMProviderError && this.currentProviderIndex < this.providers.length - 1) {
          this.currentProvider.logger?.info("Switching to backup provider due to 500 error");
          this.currentProviderIndex++;
          currentModel = this.currentModelString;
          continue;
        }
        this.currentProvider.logger?.error({ err }, "LLM API error");
        await this.bq.insertIntoBigQuery({
          model: currentModel,
          tokens,
          messages: this.messages,
        });
        throw err;
      }
    }
  }

  async debugWriteToFile(filename: string, content: string) {
    const filePath = process.env.LLM_DEBUG_FILEPATH;
    if (!filePath || !IS_LOCAL) return;
    try {
      const jsonObject = JSON.parse(content) as unknown;
      content = JSON.stringify(jsonObject, null, 2);
    } catch {
      // If JSON.parse() throws an error, the string is not valid JSON and can just output the string
    }
    const now = new Date();
    await generalUtils.writeToFileAndCreateFoldersIfNeeded(
      join(
        filePath,
        `${now.getDay()}_${now.getHours()}_${now.getSeconds()}_${now.getMilliseconds()}_${this.promptType}_${filename}_.txt`,
      ),
      content.replace(/\\n/g, "\n"),
    );
  }

  async getJsonResponse<T extends ZodType>(
    schema: T,
    opts?: {
      maxAttempts?: number;
      maxTokens?: number;
      temperature?: number;
      validateFn?: (data: z.infer<T>) => Promise<true | string> | true | string;
    },
  ): Promise<z.infer<T>> {
    const { maxAttempts = 3, maxTokens = 1024, validateFn, temperature } = opts ?? {};

    for (let attempts = 0; attempts < maxAttempts; ++attempts) {
      try {
        const response = await this.getResponse({ maxTokens, schema, temperature });

        const parsedResponse = JSON.parse(response.message) as unknown;
        this.assistantMessage(response.message);

        const validationResult = schema.safeParse(parsedResponse);
        if (validationResult.success) {
          const data = validationResult.data;
          if (validateFn) {
            const customValidationResult = await Promise.resolve(validateFn(data));
            if (customValidationResult !== true) {
              throw new Error(customValidationResult);
            }
          }
          return validationResult.data;
        }

        const errorTree = z.treeifyError(validationResult.error);
        const errorMessages = errorTree.errors.join(", ");
        throw new Error(errorMessages);
      } catch (err) {
        if (err instanceof LLMProviderError) throw err;

        if (err instanceof Error) {
          this.userMessage(
            `Error: ${err.message}. Please try again and ensure your response matches the required format.`,
          );
        } else {
          this.userMessage("A JSON parsing or validation error occurred, please try again");
        }
      }
    }

    const errorDetails = {
      messages: this.messages,
      modelString: this.currentModelString,
    };

    this.logger?.error({ errorDetails }, "Failed to parse and validate LLM Response after all retries");

    throw new Error("Failed to parse and validate LLM Response");
  }
}
