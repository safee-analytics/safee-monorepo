import { eq, and, isNotNull } from "drizzle-orm";
import { CronJob } from "cron";
import type { DbDeps } from "../deps.js";
import { jobSchedules, type JobName } from "../drizzle/index.js";
import { createJob } from "../jobs/jobs.js";
import { logJobEvent } from "../jobs/auditEvents.js";
import { logger } from "../logger.js";

// QueueManager type - will be injected from gateway
interface QueueManager {
  addJobByName(
    jobName: JobName,
    data: Record<string, unknown>,
    options?: { priority?: string; organizationId?: string },
  ): Promise<{ bullmqJobId: string; pgJobId: string }>;
}

export interface JobSchedulerConfig {
  queueManager: QueueManager;
}

export class JobScheduler {
  private queueManager: QueueManager;
  private cronJobs = new Map<string, CronJob>();
  private isRunning = false;

  constructor(private config: JobSchedulerConfig) {
    this.queueManager = config.queueManager;
  }

  async start(deps: DbDeps): Promise<void> {
    if (this.isRunning) {
      logger.warn("Job scheduler is already running");
      return;
    }

    logger.info("Starting job scheduler");

    await this.loadSchedules(deps);

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

  async queueJob(jobId: string, jobName: JobName): Promise<void> {
    this.assertValidJobId(jobId);
    logger.debug({ jobId, jobName }, "Queueing job for execution via BullMQ");

    await this.queueManager.addJobByName(jobName, { jobId }, {});

    logger.debug({ jobId, jobName }, "Job queued successfully in BullMQ");
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
    schedule: { id: string; jobName: JobName; cronExpression: string; timezone?: string },
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

      await this.queueJob(job.id, schedule.jobName);

      await logJobEvent(deps, job.id, "created");

      logger.info({ scheduleId: schedule.id, jobId: job.id }, "Cron job executed and queued");
    } catch (err) {
      logger.error({ error: err, scheduleId: schedule.id }, "Error executing cron job");
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
