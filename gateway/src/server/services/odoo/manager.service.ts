import type { Logger } from "pino";
import type { DrizzleClient } from "@safee/database";
import { schema } from "@safee/database";
import { eq, and } from "drizzle-orm";
import { createOdooClient, type OdooClient, type OdooConnectionConfig } from "./client.service.js";
import { OdooDatabaseNotFound, OperationFailed } from "../../errors.js";
import { encryptionService } from "../encryption.js";
import { odooUserProvisioningService } from "./user-provisioning.service.js";

export class OdooClientManager {
  private clients: Map<string, { client: OdooClient; expiresAt: Date }> = new Map();
  private readonly cacheTTL: number = 60 * 60 * 1000; // 60 minutes
  private logger: Logger;
  private drizzle: DrizzleClient;

  constructor(drizzle: DrizzleClient, logger: Logger) {
    this.drizzle = drizzle;
    this.logger = logger;

    setInterval(() => this.cleanupExpiredClients(), 5 * 60 * 1000);
  }

  /**
   * Get Odoo client for a specific user
   * @param userId - Safee user ID
   * @param organizationId - Organization ID
   * @returns Authenticated Odoo client with user's credentials
   */
  async getClient(userId: string, organizationId: string): Promise<OdooClient> {
    const cacheKey = `${userId}:${organizationId}`;
    const cached = this.clients.get(cacheKey);
    if (cached && cached.expiresAt > new Date()) {
      this.logger.debug({ userId, organizationId }, "Using cached Odoo client");
      return cached.client;
    }

    this.logger.info({ userId, organizationId }, "Creating new Odoo client for user");
    const client = await this.createClient(userId, organizationId);

    this.clients.set(cacheKey, {
      client,
      expiresAt: new Date(Date.now() + this.cacheTTL),
    });

    return client;
  }

  /**
   * Create Odoo client with user-specific credentials
   * Auto-provisions user in Odoo if they don't exist yet
   */
  private async createClient(userId: string, organizationId: string): Promise<OdooClient> {
    // Get or create Odoo user
    let userCredentials = await odooUserProvisioningService.getUserCredentials(userId, organizationId);

    if (!userCredentials) {
      // User doesn't have Odoo account yet - provision it
      this.logger.info({ userId, organizationId }, "Auto-provisioning Odoo user");
      await odooUserProvisioningService.provisionUser(userId, organizationId);
      userCredentials = await odooUserProvisioningService.getUserCredentials(userId, organizationId);

      if (!userCredentials) {
        throw new OperationFailed("Failed to provision Odoo user");
      }
    }

    const odooUrl = process.env.ODOO_URL || "http://localhost:8069";
    const odooPort = parseInt(process.env.ODOO_PORT || "8069", 10);

    const config: OdooConnectionConfig = {
      url: odooUrl,
      port: odooPort,
      database: userCredentials.databaseName,
      username: `${userCredentials.odooUid}`, // Odoo can authenticate with UID directly
      password: userCredentials.odooPassword,
    };

    const client = createOdooClient(config, this.logger);

    await client.authenticate();

    return client;
  }

  /**
   * Invalidate client cache for a specific user
   */
  invalidateClient(userId: string, organizationId: string): void {
    const cacheKey = `${userId}:${organizationId}`;
    this.clients.delete(cacheKey);
    this.logger.info({ userId, organizationId }, "Invalidated Odoo client cache");
  }

  /**
   * Invalidate all clients for an organization (e.g., when org is deleted)
   */
  invalidateOrganization(organizationId: string): void {
    let count = 0;
    for (const [key] of this.clients.entries()) {
      if (key.endsWith(`:${organizationId}`)) {
        this.clients.delete(key);
        count++;
      }
    }
    this.logger.info({ organizationId, count }, "Invalidated all Odoo clients for organization");
  }

  private cleanupExpiredClients(): void {
    const now = new Date();
    let cleanedCount = 0;

    for (const [organizationId, cached] of this.clients.entries()) {
      if (cached.expiresAt <= now) {
        this.clients.delete(organizationId);
        cleanedCount++;
      }
    }

    if (cleanedCount > 0) {
      this.logger.debug({ cleanedCount }, "Cleaned up expired Odoo clients");
    }
  }

  getCacheStats(): { total: number; active: number; expired: number } {
    const now = new Date();
    let active = 0;
    let expired = 0;

    for (const cached of this.clients.values()) {
      if (cached.expiresAt > now) {
        active++;
      } else {
        expired++;
      }
    }

    return {
      total: this.clients.size,
      active,
      expired,
    };
  }
}

let odooClientManager: OdooClientManager | null = null;

export function initOdooClientManager(drizzle: DrizzleClient, logger: Logger): OdooClientManager {
  if (!odooClientManager) {
    odooClientManager = new OdooClientManager(drizzle, logger);
    logger.info("Odoo client manager initialized");
  }
  return odooClientManager;
}

export function getOdooClientManager(): OdooClientManager {
  if (!odooClientManager) {
    throw new OperationFailed("Odoo client manager not initialized. Call initOdooClientManager first");
  }
  return odooClientManager;
}
