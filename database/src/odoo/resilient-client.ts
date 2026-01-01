import type { Logger } from "pino";
import type { OdooClient, OdooConnectionConfig } from "./client.service.js";
import { OdooClientService } from "./client.service.js";
import { OdooAuditLogService } from "./audit-log.service.js";
import type { DrizzleClient } from "../drizzle.js";

/**
 * Circuit Breaker States
 */
enum CircuitState {
  Closed = "CLOSED", // Normal operation
  Open = "OPEN", // Failures threshold reached, blocking requests
  HalfOpen = "HALF_OPEN", // Testing if service recovered
}

/**
 * Retry Configuration
 */
interface RetryConfig {
  maxRetries: number;
  initialDelayMs: number;
  maxDelayMs: number;
  backoffMultiplier: number;
  retryableErrors: RegExp[];
}

/**
 * Circuit Breaker Configuration
 */
interface CircuitBreakerConfig {
  failureThreshold: number; // Number of failures before opening circuit
  successThreshold: number; // Number of successes to close circuit from half-open
  timeout: number; // Time in ms to wait before trying again (half-open state)
  monitoringPeriodMs: number; // Time window to count failures
}

/**
 * Operation Metadata for logging
 */
interface OperationMetadata {
  operation: string;
  model?: string;
  method?: string;
  recordIds?: number[];
  domain?: unknown[];
  startTime: number;
  attemptNumber: number;
  userId?: string;
  organizationId?: string;
  requestPayload?: Record<string, unknown>;
  enableIdempotency?: boolean; // Whether to use idempotency for this operation
}

/**
 * Resilient Odoo Client with retry, circuit breaker, and comprehensive logging
 */
export class ResilientOdooClient implements OdooClient {
  private client: OdooClient;
  private logger: Logger;
  private config: OdooConnectionConfig;
  private auditLogService: OdooAuditLogService;

  // Circuit Breaker state
  private circuitState: CircuitState = CircuitState.Closed;
  private failureCount = 0;
  private successCount = 0;
  private lastFailureTime = 0;
  private circuitOpenTime = 0;
  private recentFailures: number[] = []; // Timestamps of recent failures

  // Configuration
  private retryConfig: RetryConfig = {
    maxRetries: 3,
    initialDelayMs: 1000,
    maxDelayMs: 10000,
    backoffMultiplier: 2,
    retryableErrors: [
      /ECONNREFUSED/i,
      /ETIMEDOUT/i,
      /ENOTFOUND/i,
      /network/i,
      /timeout/i,
      /session.*expired/i,
      /connection.*reset/i,
      /ECONNRESET/i,
    ],
  };

  private circuitBreakerConfig: CircuitBreakerConfig = {
    failureThreshold: 5,
    successThreshold: 2,
    timeout: 60000, // 1 minute
    monitoringPeriodMs: 120000, // 2 minutes
  };

  // Metrics
  private metrics = {
    totalRequests: 0,
    successfulRequests: 0,
    failedRequests: 0,
    retriedRequests: 0,
    circuitBreakerTrips: 0,
    totalDurationMs: 0,
  };

  constructor(config: OdooConnectionConfig, logger: Logger, drizzle: DrizzleClient) {
    this.config = config;
    this.logger = logger.child({ component: "ResilientOdooClient" });
    this.client = new OdooClientService(config, logger);
    this.auditLogService = new OdooAuditLogService(logger, drizzle);
  }

  /**
   * Check if error is retryable
   */
  private isRetryableError(error: Error): boolean {
    const errorMessage = error.message;
    return this.retryConfig.retryableErrors.some((pattern) => pattern.test(errorMessage));
  }

  /**
   * Calculate delay for exponential backoff
   */
  private calculateBackoffDelay(attemptNumber: number): number {
    const delay = Math.min(
      this.retryConfig.initialDelayMs * Math.pow(this.retryConfig.backoffMultiplier, attemptNumber),
      this.retryConfig.maxDelayMs,
    );
    // Add jitter (random 0-20% variation)
    const jitter = delay * 0.2 * Math.random();
    return Math.floor(delay + jitter);
  }

  /**
   * Sleep for specified milliseconds
   */
  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  /**
   * Clean old failures from tracking
   */
  private cleanOldFailures(): void {
    const cutoffTime = Date.now() - this.circuitBreakerConfig.monitoringPeriodMs;
    this.recentFailures = this.recentFailures.filter((timestamp) => timestamp > cutoffTime);
  }

  /**
   * Record failure for circuit breaker
   */
  private recordFailure(): void {
    this.failureCount++;
    this.lastFailureTime = Date.now();
    this.recentFailures.push(Date.now());
    this.cleanOldFailures();

    // Check if we should open the circuit
    if (
      this.circuitState === CircuitState.Closed &&
      this.recentFailures.length >= this.circuitBreakerConfig.failureThreshold
    ) {
      this.openCircuit();
    } else if (this.circuitState === CircuitState.HalfOpen) {
      // Failed during testing, reopen circuit
      this.openCircuit();
    }
  }

  /**
   * Record success for circuit breaker
   */
  private recordSuccess(): void {
    this.successCount++;
    this.failureCount = 0;

    if (this.circuitState === CircuitState.HalfOpen) {
      // Check if we've had enough successes to close circuit
      if (this.successCount >= this.circuitBreakerConfig.successThreshold) {
        this.closeCircuit();
      }
    }
  }

  /**
   * Open circuit breaker
   */
  private openCircuit(): void {
    this.logger.error(
      {
        previousState: this.circuitState,
        recentFailures: this.recentFailures.length,
        failureThreshold: this.circuitBreakerConfig.failureThreshold,
        database: this.config.database,
      },
      "🔴 Circuit breaker OPENED - Odoo integration failing",
    );

    this.circuitState = CircuitState.Open;
    this.circuitOpenTime = Date.now();
    this.successCount = 0;
    this.metrics.circuitBreakerTrips++;
  }

  /**
   * Close circuit breaker
   */
  private closeCircuit(): void {
    this.logger.info(
      {
        previousState: this.circuitState,
        database: this.config.database,
      },
      "🟢 Circuit breaker CLOSED - Odoo integration recovered",
    );

    this.circuitState = CircuitState.Closed;
    this.failureCount = 0;
    this.successCount = 0;
    this.recentFailures = [];
  }

  /**
   * Check circuit breaker state and transition to half-open if timeout passed
   */
  private checkCircuitState(): void {
    if (this.circuitState === CircuitState.Open) {
      const timeSinceOpen = Date.now() - this.circuitOpenTime;
      if (timeSinceOpen >= this.circuitBreakerConfig.timeout) {
        this.logger.info(
          {
            timeSinceOpenMs: timeSinceOpen,
            database: this.config.database,
          },
          "🟡 Circuit breaker transitioning to HalfOpen - testing recovery",
        );
        this.circuitState = CircuitState.HalfOpen;
        this.successCount = 0;
      }
    }
  }

  /**
   * Execute operation with retry logic, circuit breaker, idempotency, and comprehensive logging
   */
  private async executeWithResilience<T>(
    operation: () => Promise<T>,
    metadata: OperationMetadata,
  ): Promise<T> {
    const operationId = `${metadata.operation}-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;

    this.metrics.totalRequests++;

    // Check idempotency for operations that need it (CREATE operations)
    if (metadata.enableIdempotency && metadata.organizationId) {
      const idempotencyKey = this.auditLogService.generateIdempotencyKey(
        metadata.operation,
        metadata.model,
        metadata.requestPayload ?? {},
        metadata.organizationId,
      );

      // Check if operation already executed
      const existingKey = await this.auditLogService.checkIdempotencyKey(idempotencyKey);

      if (existingKey) {
        if (existingKey.status === "success") {
          this.logger.info(
            {
              operationId,
              idempotencyKey,
              cachedOperationId: existingKey.operationId,
            },
            "♻️  Returning cached result from idempotency key",
          );
          return existingKey.resultData as T;
        } else if (existingKey.status === "processing") {
          throw new Error(
            `Operation already in progress (idempotency key: ${idempotencyKey.substring(0, 16)}...)`,
          );
        } else if (existingKey.status === "failed") {
          this.logger.warn(
            {
              operationId,
              idempotencyKey,
            },
            "Previous attempt failed, allowing retry",
          );
        }
      } else {
        // Create idempotency key to mark operation as processing
        await this.auditLogService.createIdempotencyKey({
          idempotencyKey,
          operationType: metadata.operation,
          odooModel: metadata.model,
          status: "processing",
          operationId,
          firstAttemptAt: new Date(),
          expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours TTL
          userId: metadata.userId ?? null,
          organizationId: metadata.organizationId,
        });
      }
    }

    // Check circuit breaker
    this.checkCircuitState();

    if (this.circuitState === CircuitState.Open) {
      this.metrics.failedRequests++;
      const error = new Error("Circuit breaker is Open - Odoo service unavailable");
      this.logger.error(
        {
          operationId,
          circuitState: this.circuitState,
          timeSinceOpen: Date.now() - this.circuitOpenTime,
          ...metadata,
        },
        "⛔ Request blocked by circuit breaker",
      );
      throw error;
    }

    let lastError: Error | null = null;
    let attempt = 0;
    let idempotencyKey: string | undefined;

    // Calculate idempotency key once for all retries
    if (metadata.enableIdempotency && metadata.organizationId) {
      idempotencyKey = this.auditLogService.generateIdempotencyKey(
        metadata.operation,
        metadata.model,
        metadata.requestPayload ?? {},
        metadata.organizationId,
      );
    }

    while (attempt <= this.retryConfig.maxRetries) {
      const attemptStartTime = Date.now();
      const startTime = new Date(attemptStartTime);

      // Log operation start to audit log
      if (metadata.organizationId) {
        await this.auditLogService.logOperationStart({
          operationId,
          operationType: metadata.operation,
          odooModel: metadata.model ?? null,
          odooMethod: metadata.method ?? null,
          odooRecordIds: metadata.recordIds ?? null,
          odooDomain: metadata.domain ?? null,
          requestPayload: metadata.requestPayload ?? null,
          responseData: null,
          status: "processing",
          errorMessage: null,
          errorStack: null,
          startTime,
          endTime: null,
          durationMs: null,
          attemptNumber: attempt + 1,
          maxRetries: this.retryConfig.maxRetries,
          isRetry: attempt > 0,
          parentOperationId: attempt > 0 ? operationId : null,
          circuitState: this.circuitState,
          userId: metadata.userId ?? null,
          organizationId: metadata.organizationId,
          metadata: null,
        });
      }

      try {
        this.logger.info(
          {
            operationId,
            attempt: attempt + 1,
            maxRetries: this.retryConfig.maxRetries + 1,
            circuitState: this.circuitState,
            database: this.config.database,
            ...metadata,
          },
          `🔄 Executing Odoo operation: ${metadata.operation}`,
        );

        const result = await operation();
        const duration = Date.now() - attemptStartTime;
        const endTime = new Date();

        this.metrics.successfulRequests++;
        this.metrics.totalDurationMs += duration;
        this.recordSuccess();

        // Update audit log with success
        if (metadata.organizationId) {
          await this.auditLogService.updateOperation(operationId, {
            status: "success",
            responseData: result,
            endTime,
            durationMs: duration,
          });
        }

        // Update idempotency key with result
        if (idempotencyKey) {
          await this.auditLogService.updateIdempotencyKey(idempotencyKey, "success", result);
        }

        this.logger.info(
          {
            operationId,
            attempt: attempt + 1,
            durationMs: duration,
            circuitState: this.circuitState,
            ...metadata,
          },
          `✅ Odoo operation succeeded: ${metadata.operation}`,
        );

        if (attempt > 0) {
          this.metrics.retriedRequests++;
          this.logger.info(
            {
              operationId,
              totalAttempts: attempt + 1,
              ...metadata,
            },
            "♻️  Operation succeeded after retry",
          );
        }

        return result;
      } catch (err) {
        const duration = Date.now() - attemptStartTime;
        const endTime = new Date();
        lastError = err instanceof Error ? err : new Error(String(err));

        const isRetryable = this.isRetryableError(lastError);
        const willRetry = isRetryable && attempt < this.retryConfig.maxRetries;

        // Update audit log with error
        if (metadata.organizationId) {
          await this.auditLogService.updateOperation(operationId, {
            status: willRetry ? "retrying" : "failed",
            errorMessage: lastError.message,
            errorStack: lastError.stack,
            endTime,
            durationMs: duration,
          });
        }

        this.logger.error(
          {
            operationId,
            attempt: attempt + 1,
            maxRetries: this.retryConfig.maxRetries + 1,
            durationMs: duration,
            error: {
              message: lastError.message,
              name: lastError.name,
              stack: lastError.stack,
            },
            isRetryable,
            willRetry,
            circuitState: this.circuitState,
            ...metadata,
          },
          `❌ Odoo operation failed: ${metadata.operation}`,
        );

        if (willRetry) {
          const backoffDelay = this.calculateBackoffDelay(attempt);
          this.logger.warn(
            {
              operationId,
              attempt: attempt + 1,
              nextAttempt: attempt + 2,
              backoffDelayMs: backoffDelay,
              ...metadata,
            },
            `⏳ Retrying after ${backoffDelay}ms...`,
          );
          await this.sleep(backoffDelay);
        } else {
          this.metrics.failedRequests++;
          this.metrics.totalDurationMs += duration;
          this.recordFailure();

          // Update idempotency key with failure
          if (idempotencyKey) {
            await this.auditLogService.updateIdempotencyKey(
              idempotencyKey,
              "failed",
              undefined,
              lastError.message,
            );
          }

          break;
        }

        attempt++;
      }
    }

    // All retries exhausted
    this.logger.error(
      {
        operationId,
        totalAttempts: attempt + 1,
        finalError: lastError?.message,
        metrics: this.getMetrics(),
        ...metadata,
      },
      `🚫 Odoo operation failed after all retries: ${metadata.operation}`,
    );

    if (lastError) {
      throw lastError;
    }

    throw new Error("Unknown error during resilient Odoo operation");
  }

  /**
   * Get current metrics
   */
  public getMetrics() {
    return {
      ...this.metrics,
      averageDurationMs:
        this.metrics.successfulRequests > 0
          ? Math.round(this.metrics.totalDurationMs / this.metrics.successfulRequests)
          : 0,
      successRate:
        this.metrics.totalRequests > 0
          ? `${((this.metrics.successfulRequests / this.metrics.totalRequests) * 100).toFixed(2)}%`
          : "N/A",
      circuitState: this.circuitState,
      recentFailuresCount: this.recentFailures.length,
    };
  }

  /**
   * Get circuit breaker status
   */
  public getCircuitStatus() {
    return {
      state: this.circuitState,
      failureCount: this.failureCount,
      successCount: this.successCount,
      recentFailures: this.recentFailures.length,
      lastFailureTime: this.lastFailureTime,
      circuitOpenTime: this.circuitOpenTime,
      timeSinceLastFailure: this.lastFailureTime > 0 ? Date.now() - this.lastFailureTime : null,
    };
  }

  // Implement OdooClient interface methods with resilience

  setApiKeyCredentials(uid: number) {
    return this.client.setApiKeyCredentials(uid);
  }

  async authenticate() {
    return this.executeWithResilience(() => this.client.authenticate(), {
      operation: "authenticate",
      startTime: Date.now(),
      attemptNumber: 1,
    });
  }

  async search(model: string, domain: unknown[], options = {}) {
    return this.executeWithResilience(() => this.client.search(model, domain, options), {
      operation: "search",
      model,
      domain,
      startTime: Date.now(),
      attemptNumber: 1,
    });
  }

  async searchRead<T = Record<string, unknown>>(
    model: string,
    domain: unknown[],
    fields?: string[],
    options = {},
    context?: Record<string, unknown>,
  ) {
    return this.executeWithResilience(
      () => this.client.searchRead<T>(model, domain, fields, options, context),
      {
        operation: "searchRead",
        model,
        domain,
        startTime: Date.now(),
        attemptNumber: 1,
      },
    );
  }

  async read<T = Record<string, unknown>>(
    model: string,
    ids: number[],
    fields?: string[],
    context?: Record<string, unknown>,
  ) {
    return this.executeWithResilience(() => this.client.read<T>(model, ids, fields, context), {
      operation: "read",
      model,
      recordIds: ids,
      startTime: Date.now(),
      attemptNumber: 1,
    });
  }

  async create(
    model: string,
    values: Record<string, unknown>,
    context?: Record<string, unknown>,
    organizationId?: string,
    userId?: string,
  ) {
    return this.executeWithResilience(() => this.client.create(model, values, context), {
      operation: "create",
      model,
      startTime: Date.now(),
      attemptNumber: 1,
      requestPayload: { model, values, context },
      enableIdempotency: true, // Enable idempotency for CREATE operations
      organizationId,
      userId,
    });
  }

  async write(
    model: string,
    ids: number[],
    values: Record<string, unknown>,
    context?: Record<string, unknown>,
  ) {
    return this.executeWithResilience(() => this.client.write(model, ids, values, context), {
      operation: "write",
      model,
      recordIds: ids,
      startTime: Date.now(),
      attemptNumber: 1,
    });
  }

  async unlink(model: string, ids: number[], context?: Record<string, unknown>) {
    return this.executeWithResilience(() => this.client.unlink(model, ids, context), {
      operation: "unlink",
      model,
      recordIds: ids,
      startTime: Date.now(),
      attemptNumber: 1,
    });
  }

  async execute<T = unknown>(
    model: string,
    method: string,
    args?: unknown[],
    kwargs?: Record<string, unknown>,
  ) {
    return this.executeWithResilience(() => this.client.execute<T>(model, method, args, kwargs), {
      operation: "execute",
      model,
      method,
      startTime: Date.now(),
      attemptNumber: 1,
    });
  }

  async executeKw<T = unknown>(
    model: string,
    method: string,
    args?: unknown[],
    kwargs?: Record<string, unknown>,
  ) {
    return this.executeWithResilience(() => this.client.executeKw<T>(model, method, args, kwargs), {
      operation: "executeKw",
      model,
      method,
      startTime: Date.now(),
      attemptNumber: 1,
    });
  }

  async action<T = unknown>(
    model: string,
    actionName: string,
    recordIds: number[],
    context?: Record<string, unknown>,
  ) {
    return this.executeWithResilience(() => this.client.action<T>(model, actionName, recordIds, context), {
      operation: "action",
      model,
      method: actionName,
      recordIds,
      startTime: Date.now(),
      attemptNumber: 1,
    });
  }

  async searchByExternalId(externalId: string) {
    return this.executeWithResilience(() => this.client.searchByExternalId(externalId), {
      operation: "searchByExternalId",
      startTime: Date.now(),
      attemptNumber: 1,
    });
  }

  async readByExternalId<T = Record<string, unknown>>(externalId: string, fields?: string[]) {
    return this.executeWithResilience(() => this.client.readByExternalId<T>(externalId, fields), {
      operation: "readByExternalId",
      startTime: Date.now(),
      attemptNumber: 1,
    });
  }

  async createWithExternalId(
    model: string,
    values: Record<string, unknown>,
    externalId: string,
    context?: Record<string, unknown>,
  ) {
    return this.executeWithResilience(
      () => this.client.createWithExternalId(model, values, externalId, context),
      {
        operation: "createWithExternalId",
        model,
        startTime: Date.now(),
        attemptNumber: 1,
      },
    );
  }

  async nameSearch(model: string, name: string, domain?: unknown[], limit?: number) {
    return this.executeWithResilience(() => this.client.nameSearch(model, name, domain, limit), {
      operation: "nameSearch",
      model,
      startTime: Date.now(),
      attemptNumber: 1,
    });
  }

  async fieldsGet(model: string, fields?: string[]) {
    return this.executeWithResilience(() => this.client.fieldsGet(model, fields), {
      operation: "fieldsGet",
      model,
      startTime: Date.now(),
      attemptNumber: 1,
    });
  }
}

/**
 * Factory function to create a resilient Odoo client
 */
export function createResilientOdooClient(
  config: OdooConnectionConfig,
  logger: Logger,
  drizzle: DrizzleClient,
): ResilientOdooClient {
  return new ResilientOdooClient(config, logger, drizzle);
}
