import { Logger } from "pino";
import { ZodType } from "zod";

export type ChatMessageParams = {
  role: "user" | "assistant" | "system";
  content: string;
  name?: string;
};

export type ChatMessageResponse = {
  finish_reason: string | null;
  message: string | null;
  tokens: LLMTokenResponse;
};

export type LLMTokenResponse = {
  input_tokens: number;
  output_tokens: number;
};

export interface LLMProvider {
  logger?: Logger;
  getResponse({
    messages,
    maxTokens,
    schema,
    temperature,
  }: {
    messages: ChatMessageParams[];
    maxTokens?: number;
    schema?: ZodType;
    temperature?: number;
  }): Promise<ChatMessageResponse>;
}
