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

  /**
   * Start the job scheduler
   */
  async start(deps: DbDeps): Promise<void> {
    if (this.isRunning) {
      logger.warn("Job scheduler is already running");
      return;
    }

    logger.info("Starting job scheduler");

    // Create necessary topics
    await this.pubsub.createTopic(this.topics.jobQueue);
    await this.pubsub.createTopic(this.topics.jobEvents);

    // Load and schedule all active job schedules
    await this.loadSchedules(deps);

    // Subscribe to job queue messages
    await this.subscribeToJobQueue(deps);

    this.isRunning = true;
    logger.info("Job scheduler started");
  }

  /**
   * Stop the job scheduler
   */
  async stop(): Promise<void> {
    if (!this.isRunning) {
      return;
    }

    logger.info("Stopping job scheduler");

    // Stop all cron jobs
    for (const [scheduleId, cronJob] of this.cronJobs) {
      cronJob.stop();
      logger.debug({ scheduleId }, "Stopped cron job");
    }

    this.cronJobs.clear();

    // Close pub/sub connections
    await this.pubsub.close();

    this.isRunning = false;
    logger.info("Job scheduler stopped");
  }

  /**
   * Add or update a job schedule
   */
  async scheduleJob(deps: DbDeps, scheduleId: string): Promise<void> {
    logger.debug({ scheduleId }, "Scheduling job");

    const schedule = await deps.drizzle.query.jobSchedules.findFirst({
      where: eq(jobSchedules.id, scheduleId),
      with: {
        definition: true,
      },
    });

    if (!schedule) {
      logger.error({ scheduleId }, "Job schedule not found");
      return;
    }

    if (!schedule.isActive || !schedule.cronExpression) {
      logger.debug({ scheduleId }, "Job schedule is inactive or has no cron expression");
      return;
    }

    // Stop existing cron job if it exists
    const existingJob = this.cronJobs.get(scheduleId);
    if (existingJob) {
      existingJob.stop();
      this.cronJobs.delete(scheduleId);
    }

    // Create new cron job
    const cronJob = new CronJob(
      schedule.cronExpression,
      async () => {
        if (schedule.cronExpression) {
          await this.executeCronJob(deps, {
            id: schedule.id,
            jobDefinitionId: schedule.jobDefinitionId,
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

  /**
   * Remove a job schedule
   */
  async unscheduleJob(scheduleId: string): Promise<void> {
    logger.debug({ scheduleId }, "Unscheduling job");

    const cronJob = this.cronJobs.get(scheduleId);
    if (cronJob) {
      cronJob.stop();
      this.cronJobs.delete(scheduleId);
      logger.info({ scheduleId }, "Job unscheduled");
    }
  }

  /**
   * Queue a job for immediate execution
   */
  async queueJob(jobId: string): Promise<void> {
    logger.debug({ jobId }, "Queueing job for execution");

    await this.pubsub.publish(this.topics.jobQueue, JSON.stringify({ jobId }));

    logger.debug({ jobId }, "Job queued successfully");
  }

  /**
   * Load all active schedules from database
   */
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

  /**
   * Execute a cron job
   */
  private async executeCronJob(
    deps: DbDeps,
    schedule: { id: string; jobDefinitionId: string; cronExpression: string; timezone?: string },
  ): Promise<void> {
    logger.debug({ scheduleId: schedule.id }, "Executing cron job");

    try {
      // Create job instance
      const job = await createJob(deps, {
        jobDefinitionId: schedule.jobDefinitionId,
        scheduleId: schedule.id,
        type: "cron",
        priority: "normal",
        scheduledFor: new Date(),
      });

      // Update schedule's last run time
      await deps.drizzle
        .update(jobSchedules)
        .set({
          lastRunAt: new Date(),
          nextRunAt: this.getNextRunTime(schedule.cronExpression, schedule.timezone ?? "UTC"),
        })
        .where(eq(jobSchedules.id, schedule.id));

      // Queue the job for execution
      await this.queueJob(job.id);

      // Log the event
      await logJobEvent(deps, job.id, "created");

      logger.info({ scheduleId: schedule.id, jobId: job.id }, "Cron job executed and queued");
    } catch (err) {
      logger.error({ error: err, scheduleId: schedule.id }, "Error executing cron job");
    }
  }

  /**
   * Subscribe to job queue messages
   */
  private async subscribeToJobQueue(deps: DbDeps): Promise<void> {
    const subscription = `${this.topics.jobQueue}-worker`;

    await this.pubsub.createSubscription(this.topics.jobQueue, subscription);

    await this.pubsub.subscribe(subscription, async (message) => {
      logger.debug({ messageId: message.id }, "Processing job queue message");

      try {
        const { jobId } = JSON.parse(message.data.toString()) as { jobId: string };
        await this.processJob(deps, jobId);
      } catch (err) {
        logger.error({ error: err, messageId: message.id }, "Error processing job queue message");
        throw err; // Re-throw to nack the message
      }
    });
  }

  /**
   * Process a job
   */
  private async processJob(deps: DbDeps, jobId: string): Promise<void> {
    logger.debug({ jobId }, "Processing job");

    try {
      // Update job status to running
      await updateJobStatus(deps, jobId, "running", { startedAt: new Date() });
      await logJobEvent(deps, jobId, "started");

      // Publish job started event
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

  /**
   * Calculate next run time for cron expression
   */
  private getNextRunTime(cronExpression: string, timezone = "UTC"): Date {
    const tempJob = new CronJob(cronExpression, () => {}, null, false, timezone);
    return tempJob.nextDate().toJSDate();
  }
}
