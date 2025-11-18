import { eq, and, isNotNull } from "drizzle-orm";
import { CronJob } from "cron";
import type { PubSub } from "../pubsub/index.js";
import type { DbDeps } from "../deps.js";
import { jobSchedules } from "../drizzle/index.js";
import { createJob, updateJobStatus } from "../jobs/jobs.js";
import { logJobEvent } from "../jobs/auditEvents.js";
import { logger } from "../logger.js";

export interface JobSchedulerConfig {
  pubsub: PubSub;
  topics: {
    jobQueue: string;
    jobEvents: string;
  };
}

export class JobScheduler {
  private pubsub: PubSub;
  private topics: JobSchedulerConfig["topics"];
  private cronJobs = new Map<string, CronJob>();
  private isRunning = false;

  constructor(private config: JobSchedulerConfig) {
    this.pubsub = config.pubsub;
    this.topics = config.topics;
  }

  async start(deps: DbDeps): Promise<void> {
    if (this.isRunning) {
      logger.warn("Job scheduler is already running");
      return;
    }

    logger.info("Starting job scheduler");

    await this.pubsub.createTopic(this.topics.jobQueue);
    await this.pubsub.createTopic(this.topics.jobEvents);

    await this.loadSchedules(deps);

    await this.subscribeToJobQueue(deps);

    this.isRunning = true;
    logger.info("Job scheduler started");
  }

  async stop(): Promise<void> {
    if (!this.isRunning) {
      return;
    }

    logger.info("Stopping job scheduler");

    for (const [scheduleId, cronJob] of this.cronJobs) {
      cronJob.stop();
      logger.debug({ scheduleId }, "Stopped cron job");
    }

    this.cronJobs.clear();

    await this.pubsub.close();

    this.isRunning = false;
    logger.info("Job scheduler stopped");
  }

  async scheduleJob(deps: DbDeps, scheduleId: string): Promise<void> {
    logger.debug({ scheduleId }, "Scheduling job");

    const schedule = await deps.drizzle.query.jobSchedules.findFirst({
      where: eq(jobSchedules.id, scheduleId),
    });

    if (!schedule) {
      logger.error({ scheduleId }, "Job schedule not found");
      return;
    }

    if (!schedule.isActive || !schedule.cronExpression) {
      logger.debug({ scheduleId }, "Job schedule is inactive or has no cron expression");
      return;
    }

    const existingJob = this.cronJobs.get(scheduleId);
    if (existingJob) {
      existingJob.stop();
      this.cronJobs.delete(scheduleId);
    }

    const cronJob = new CronJob(
      schedule.cronExpression,
      async () => {
        if (schedule.cronExpression) {
          await this.executeCronJob(deps, {
            id: schedule.id,
            jobName: schedule.jobName,
            cronExpression: schedule.cronExpression,
            timezone: schedule.timezone,
          });
        }
      },
      null,
      true,
      schedule.timezone,
    );

    this.cronJobs.set(scheduleId, cronJob);

    logger.info(
      {
        scheduleId,
        cronExpression: schedule.cronExpression,
        timezone: schedule.timezone,
      },
      "Job scheduled",
    );
  }

  async unscheduleJob(scheduleId: string): Promise<void> {
    logger.debug({ scheduleId }, "Unscheduling job");

    const cronJob = this.cronJobs.get(scheduleId);
    if (cronJob) {
      cronJob.stop();
      this.cronJobs.delete(scheduleId);
      logger.info({ scheduleId }, "Job unscheduled");
    }
  }

  async queueJob(jobId: string): Promise<void> {
    this.assertValidJobId(jobId);
    logger.debug({ jobId }, "Queueing job for execution");

    await this.pubsub.publish(this.topics.jobQueue, JSON.stringify({ jobId }));

    logger.debug({ jobId }, "Job queued successfully");
  }

  private async loadSchedules(deps: DbDeps): Promise<void> {
    logger.debug("Loading job schedules from database");

    const activeSchedules = await deps.drizzle.query.jobSchedules.findMany({
      where: and(eq(jobSchedules.isActive, true), isNotNull(jobSchedules.cronExpression)),
    });

    logger.info({ count: activeSchedules.length }, "Loading active job schedules");

    for (const schedule of activeSchedules) {
      await this.scheduleJob(deps, schedule.id);
    }
  }

  private async executeCronJob(
    deps: DbDeps,
    schedule: { id: string; jobName: "send_email"; cronExpression: string; timezone?: string },
  ): Promise<void> {
    logger.debug({ scheduleId: schedule.id }, "Executing cron job");

    try {
      const job = await createJob(deps, {
        jobName: schedule.jobName,
        scheduleId: schedule.id,
        type: "cron",
        priority: "normal",
        scheduledFor: new Date(),
      });

      await deps.drizzle
        .update(jobSchedules)
        .set({
          lastRunAt: new Date(),
          nextRunAt: this.getNextRunTime(schedule.cronExpression, schedule.timezone ?? "UTC"),
        })
        .where(eq(jobSchedules.id, schedule.id));

      await this.queueJob(job.id);

      await logJobEvent(deps, job.id, "created");

      logger.info({ scheduleId: schedule.id, jobId: job.id }, "Cron job executed and queued");
    } catch (err) {
      logger.error({ error: err, scheduleId: schedule.id }, "Error executing cron job");
    }
  }

  private async subscribeToJobQueue(deps: DbDeps): Promise<void> {
    const subscription = `${this.topics.jobQueue}-worker`;

    await this.pubsub.createSubscription(this.topics.jobQueue, subscription);

    await this.pubsub.subscribe(subscription, async (message) => {
      logger.debug({ messageId: message.id }, "Processing job queue message");

      try {
        const { jobId } = JSON.parse(message.data.toString()) as { jobId: string };
        this.assertValidJobId(jobId);
        await this.processJob(deps, jobId);
      } catch (err) {
        logger.error({ error: err, messageId: message.id }, "Error processing job queue message");
        throw err;
      }
    });
  }

  private async processJob(deps: DbDeps, jobId: string): Promise<void> {
    logger.debug({ jobId }, "Processing job");

    try {
      await updateJobStatus(deps, jobId, "running", { startedAt: new Date() });
      await logJobEvent(deps, jobId, "started");

      await this.pubsub.publish(
        this.topics.jobEvents,
        JSON.stringify({
          type: "job.started",
          jobId,
          timestamp: new Date().toISOString(),
        }),
      );

      // Here you would implement the actual job execution logic
      // For now, we'll just simulate success
      logger.info({ jobId }, "Job processing completed successfully");

      await updateJobStatus(deps, jobId, "completed", { completedAt: new Date() });
      await logJobEvent(deps, jobId, "completed");

      // Publish job completed event
      await this.pubsub.publish(
        this.topics.jobEvents,
        JSON.stringify({
          type: "job.completed",
          jobId,
          timestamp: new Date().toISOString(),
        }),
      );
    } catch (err) {
      logger.error({ error: err, jobId }, "Job processing failed");

      const errorMessage = err instanceof Error ? err.message : String(err);
      await updateJobStatus(deps, jobId, "failed", {
        error: errorMessage,
        completedAt: new Date(),
      });
      await logJobEvent(deps, jobId, "failed");

      // Publish job failed event
      await this.pubsub.publish(
        this.topics.jobEvents,
        JSON.stringify({
          type: "job.failed",
          jobId,
          error: errorMessage,
          timestamp: new Date().toISOString(),
        }),
      );
    }
  }

  private getNextRunTime(cronExpression: string, timezone = "UTC"): Date {
    const tempJob = new CronJob(cronExpression, () => {}, null, false, timezone);
    return tempJob.nextDate().toJSDate();
  }

  private assertValidJobId(jobId: string): void {
    if (!uuidRegex.test(jobId)) {
      const error = new Error(`Invalid job ID format: ${jobId}`);
      logger.error({ jobId, err: error }, "Invalid job ID format");
      throw error;
    }
  }
}

const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
