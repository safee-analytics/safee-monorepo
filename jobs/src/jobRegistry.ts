import type { Logger } from "pino";
import { EmailHandler } from "./emailHandler.js";
import type { EmailJobPayload, EmailMessage } from "./emailTypes.js";

export interface JobHandlerContext {
  logger: Logger;
  emailService: {
    sendEmail(message: EmailMessage): Promise<void>;
  };
}

export interface JobDefinition<TPayload = unknown> {
  name: string;
  description: string;
  maxRetries: number;
  retryDelayMs: number;
  timeoutMs: number;
  handler: (context: JobHandlerContext, payload: TPayload) => Promise<void>;
}

// Job type definitions
export const JOB_DEFINITIONS = {
  SEND_EMAIL: {
    name: "send_email",
    description: "Send email using configured email provider",
    maxRetries: 3,
    retryDelayMs: 60000, // 1 minute
    timeoutMs: 300000, // 5 minutes
    handler: async (context: JobHandlerContext, payload: unknown) => {
      const emailHandler = new EmailHandler(context);
      await emailHandler.handleEmailJob(payload as EmailJobPayload);
    },
  } satisfies JobDefinition,
} as const;

export type JobType = keyof typeof JOB_DEFINITIONS;

export class JobRouter {
  private context: JobHandlerContext;

  constructor(context: JobHandlerContext) {
    this.context = context;
  }

  async routeJob(jobType: string, payload: unknown): Promise<void> {
    const definition = Object.values(JOB_DEFINITIONS).find((def) => def.name === jobType);

    if (!definition) {
      throw new Error(`Unknown job type: ${jobType}`);
    }

    this.context.logger.info({ jobType, definition: definition.name }, "Routing job to handler");

    try {
      await definition.handler(this.context, payload);
    } catch (err) {
      this.context.logger.error({ error: err, jobType }, "Job handler failed");
      throw err;
    }
  }

  getDefinition(jobType: string): JobDefinition | undefined {
    return Object.values(JOB_DEFINITIONS).find((def) => def.name === jobType);
  }

  getAllDefinitions(): JobDefinition[] {
    return Object.values(JOB_DEFINITIONS);
  }
}
