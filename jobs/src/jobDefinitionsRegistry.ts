export interface JobDefinitionConfig {
  name: string;
  description: string;
  handlerName: string;
  maxRetries?: number;
  retryDelayMs?: number;
  timeoutMs?: number;
}

export const JOB_DEFINITIONS: Record<string, JobDefinitionConfig> = {
  SEND_EMAIL: {
    name: "send_email",
    description: "Send email using configured email provider",
    handlerName: "EmailHandler",
    maxRetries: 3,
    retryDelayMs: 60000,
    timeoutMs: 300000,
  },
} as const;
