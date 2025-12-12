import type { Logger } from "pino";
import { schema, type DrizzleClient, eq, and, gt, lt } from "@safee/database";

type NewOdooAuditLog = typeof schema.odooAuditLogs.$inferInsert;
type NewOdooIdempotencyKey = typeof schema.odooIdempotencyKeys.$inferInsert;
type OdooIdempotencyKey = typeof schema.odooIdempotencyKeys.$inferSelect;
import { createHash } from "node:crypto";

const { odooAuditLogs, odooIdempotencyKeys } = schema;

/**
 * Audit log service for tracking all Odoo operations
 * Provides comprehensive logging and idempotency support
 */
export class OdooAuditLogService {
  private logger: Logger;
  private drizzle: DrizzleClient;

  constructor(logger: Logger, drizzle: DrizzleClient) {
    this.logger = logger.child({ component: "OdooAuditLogService" });
    this.drizzle = drizzle;
  }

  /**
   * Generate idempotency key from operation parameters
   */
  generateIdempotencyKey(
    operationType: string,
    model: string | undefined,
    params: Record<string, unknown>,
    organizationId: string,
  ): string {
    const data = JSON.stringify({
      operationType,
      model,
      params,
      organizationId,
    });

    const hash = createHash("sha256").update(data).digest("hex");
    return `${operationType}-${model ?? "none"}-${hash.substring(0, 16)}`;
  }

  /**
   * Check if operation with idempotency key exists and return cached result
   */
  async checkIdempotencyKey(idempotencyKey: string): Promise<OdooIdempotencyKey | null> {
    try {
      const now = new Date();

      // Find non-expired idempotency key
      const results = await this.drizzle
        .select()
        .from(odooIdempotencyKeys)
        .where(
          and(eq(odooIdempotencyKeys.idempotencyKey, idempotencyKey), gt(odooIdempotencyKeys.expiresAt, now)),
        )
        .limit(1);

      // result is always defined from query, log if found
      if (results.length > 0) {
        const result = results[0];
        this.logger.info(
          {
            idempotencyKey,
            status: result.status,
            operationType: result.operationType,
          },
          "Found existing idempotency key",
        );
        return result;
      }

      this.logger.info(
        {
          idempotencyKey,
        },
        "No idempotency key found",
      );
      return null;
    } catch (err) {
      this.logger.error({ error: err, idempotencyKey }, "Failed to check idempotency key");
      return null;
    }
  }

  /**
   * Create idempotency key for operation
   */
  async createIdempotencyKey(
    data: Omit<NewOdooIdempotencyKey, "id" | "createdAt" | "updatedAt">,
  ): Promise<void> {
    try {
      await this.drizzle.insert(odooIdempotencyKeys).values(data);

      this.logger.debug(
        {
          idempotencyKey: data.idempotencyKey,
          operationType: data.operationType,
        },
        "Created idempotency key",
      );
    } catch (err) {
      this.logger.error({ error: err, data }, "Failed to create idempotency key");
    }
  }

  /**
   * Update idempotency key with result
   */
  async updateIdempotencyKey(
    idempotencyKey: string,
    status: "success" | "failed",
    resultData?: unknown,
    errorMessage?: string,
  ): Promise<void> {
    try {
      await this.drizzle
        .update(odooIdempotencyKeys)
        .set({
          status,
          resultData,
          errorMessage,
          completedAt: new Date(),
          updatedAt: new Date(),
        })
        .where(eq(odooIdempotencyKeys.idempotencyKey, idempotencyKey));

      this.logger.debug(
        {
          idempotencyKey,
          status,
        },
        "Updated idempotency key",
      );
    } catch (err) {
      this.logger.error({ error: err, idempotencyKey }, "Failed to update idempotency key");
    }
  }

  /**
   * Log operation start
   */
  async logOperationStart(data: Omit<NewOdooAuditLog, "id" | "createdAt">): Promise<void> {
    try {
      await this.drizzle.insert(odooAuditLogs).values(data);

      this.logger.debug(
        {
          operationId: data.operationId,
          operationType: data.operationType,
          model: data.odooModel,
        },
        "Logged operation start",
      );
    } catch (err) {
      this.logger.error({ error: err, data }, "Failed to log operation start");
    }
  }

  /**
   * Update operation with result
   */
  async updateOperation(
    operationId: string,
    updates: {
      status: "success" | "failed" | "retrying";
      responseData?: unknown;
      errorMessage?: string;
      errorStack?: string;
      endTime?: Date;
      durationMs?: number;
    },
  ): Promise<void> {
    try {
      await this.drizzle.update(odooAuditLogs).set(updates).where(eq(odooAuditLogs.operationId, operationId));

      this.logger.debug(
        {
          operationId,
          status: updates.status,
        },
        "Updated operation",
      );
    } catch (err) {
      this.logger.error({ error: err, operationId }, "Failed to update operation");
    }
  }

  /**
   * Get operation by ID
   */
  async getOperation(operationId: string) {
    try {
      const results = await this.drizzle
        .select()
        .from(odooAuditLogs)
        .where(eq(odooAuditLogs.operationId, operationId))
        .limit(1);

      // result is always defined, return null if empty
      return results[0] ?? null;
    } catch (err) {
      this.logger.error({ error: err, operationId }, "Failed to get operation");
      return null;
    }
  }

  /**
   * Cleanup expired idempotency keys (should be run periodically)
   */
  async cleanupExpiredKeys(): Promise<number> {
    try {
      const now = new Date();
      const result = await this.drizzle
        .delete(odooIdempotencyKeys)
        .where(lt(odooIdempotencyKeys.expiresAt, now))
        .returning();

      const deletedCount = result.length;

      this.logger.info({ deletedCount }, "Cleaned up expired idempotency keys");

      return deletedCount;
    } catch (err) {
      this.logger.error({ error: err }, "Failed to cleanup expired idempotency keys");
      return 0;
    }
  }
}
