import { BigQuery } from "@google-cloud/bigquery";
import { randomUUID } from "node:crypto";
import { BQ_ENABLED, IS_DEV, IS_LOCAL, BQ_DATASET } from "../env.js";
import { Logger } from "pino";
import { ChatMessageParams, LLMTokenResponse } from "./llmProvider.js";

/**
 * BigQueryInserter - Telemetry and cost tracking for LLM usage in Safee Analytics
 *
 * Tracks AI feature usage across:
 * - Hisabiq (Accounting): Invoice analysis, financial insights
 * - Kanz (HR): Employee data processing, payroll automation
 * - Nisbah (CRM): Lead scoring, customer insights
 *
 * Logs token usage to monitor costs and optimize model selection.
 * In dev/local environments, also logs full prompts for debugging.
 */
export class BigQueryInserter {
  private bigquery: BigQuery;
  private promptType: string;
  logger?: Logger;

  constructor({
    logger,
    promptType,
    bigQuery,
  }: {
    logger?: Logger;
    promptType: string;
    bigQuery?: BigQuery;
  }) {
    this.bigquery = bigQuery ?? new BigQuery();
    this.logger = logger;
    this.promptType = promptType;
  }

  public async insertBatchTokens({ tokens, model }: { tokens: LLMTokenResponse[]; model: string }) {
    if (!BQ_ENABLED) {
      return;
    }

    try {
      const rows = tokens.map((token) => ({
        timestamp: new Date(),
        prompt_id: randomUUID(),
        prompt_type: this.promptType,
        input_tokens: token.input_tokens,
        output_tokens: token.output_tokens,
        llm_model: model,
        tags: null,
      }));

      await this.bigquery.dataset(BQ_DATASET).table("llm_usage").insert(rows);
    } catch (err) {
      this.logger?.error({ err }, "Failed to insert batch tokens into BigQuery");
    }
  }

  public async insertIntoBigQuery({
    tokens,
    model,
    messages,
    tags = "",
  }: {
    tokens: LLMTokenResponse;
    model: string;
    messages: ChatMessageParams[];
    tags?: string;
  }) {
    if (!BQ_ENABLED) {
      return;
    }

    try {
      const promptId = randomUUID();
      await this.insertTokens(promptId, tokens, model, tags);

      if (IS_DEV || IS_LOCAL) {
        await this.insertPrompts({ promptId, messages, model });
      }
    } catch (err) {
      this.logger?.error({ err }, "Failed to insert into BigQuery");
    }
  }

  private async insertTokens(promptId: string, tokens: LLMTokenResponse, model: string, tags = "") {
    await this.bigquery.dataset(BQ_DATASET).table("llm_usage").insert({
      timestamp: new Date(),
      prompt_id: promptId,
      prompt_type: this.promptType,
      input_tokens: tokens.input_tokens,
      output_tokens: tokens.output_tokens,
      llm_model: model,
      tags,
    });
  }

  private async insertPrompts({
    promptId,
    messages,
    model,
  }: {
    promptId: string;
    messages: ChatMessageParams[];
    model: string;
  }) {
    // Convert all messages to BQ format
    const insertMessages = messages.map((message) => ({
      role: message.role,
      message: message.content,
    }));

    const row = {
      prompt_id: promptId,
      created_at: new Date(),
      prompt_type: this.promptType,
      llm_model: model,
      messages: insertMessages,
    };
    await this.bigquery.dataset(BQ_DATASET).table("llm_prompts").insert(row);
  }
}
