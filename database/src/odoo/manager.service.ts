import type { Logger } from "pino";
import type { DrizzleClient } from "@safee/database";
import { schema, eq, and } from "@safee/database";
import { createOdooClient, type OdooClient, type OdooConnectionConfig } from "./client.service.js";
import { OperationFailed } from "./errors.js";
import { OdooUserProvisioningService, type OdooUserProvisioningServiceDependencies } from "./user-provisioning.service.js";

export interface OdooClientManagerConfig {
  url: string;
  port: number;
}

export interface OdooClientManagerDependencies {
  drizzle: DrizzleClient;
  logger: Logger;
  odooConfig: OdooClientManagerConfig;
  userProvisioningService: OdooUserProvisioningService;
}

export class OdooClientManager {
  private clients = new Map<string, { client: OdooClient; expiresAt: Date }>();
  private readonly cacheTTL: number = 60 * 60 * 1000; // 60 minutes
  private logger: Logger;
  private drizzle: DrizzleClient;
  private odooConfig: OdooClientManagerConfig;
  private creationPromises = new Map<string, Promise<OdooClient>>();
  private userProvisioningService: OdooUserProvisioningService;

  constructor(deps: OdooClientManagerDependencies) {
    this.drizzle = deps.drizzle;
    this.logger = deps.logger;
    this.odooConfig = deps.odooConfig;
    this.userProvisioningService = deps.userProvisioningService;

    setInterval(
      () => {
        this.cleanupExpiredClients();
      },
      5 * 60 * 1000,
    );
  }

  async getClient(userId: string, organizationId: string): Promise<OdooClient> {
    const cacheKey = `${userId}:${organizationId}`;

    const cached = this.clients.get(cacheKey);
    if (cached && cached.expiresAt > new Date()) {
      this.logger.debug({ userId, organizationId }, "Using cached Odoo client");
      return cached.client;
    }

    const existingCreation = this.creationPromises.get(cacheKey);
    if (existingCreation) {
      this.logger.debug({ userId, organizationId }, "Waiting for in-flight client creation");
      return existingCreation;
    }

    this.logger.info({ userId, organizationId }, "Creating new Odoo client for user");
    const creationPromise = this.createClient(userId, organizationId)
      .then((client) => {
        this.clients.set(cacheKey, {
          client,
          expiresAt: new Date(Date.now() + this.cacheTTL),
        });
        return client;
      })
      .finally(() => {
        this.creationPromises.delete(cacheKey);
      });

    this.creationPromises.set(cacheKey, creationPromise);

    return creationPromise;
  }

  private async createClient(userId: string, organizationId: string): Promise<OdooClient> {
    let userCredentials = await this.userProvisioningService.getUserCredentials(userId, organizationId);

    if (!userCredentials) {
      this.logger.info({ userId, organizationId }, "Auto-provisioning Odoo user");
      await this.userProvisioningService.provisionUser(userId, organizationId);
      userCredentials = await this.userProvisioningService.getUserCredentials(userId, organizationId);

      if (!userCredentials) {
        throw new OperationFailed("Failed to provision Odoo user");
      }
    }

    const user = await this.drizzle.query.odooUsers.findFirst({
      where: and(
        eq(schema.odooUsers.userId, userId),
        eq(
          schema.odooUsers.odooDatabaseId,
          (await this.drizzle.query.odooDatabases.findFirst({
            where: eq(schema.odooDatabases.organizationId, organizationId),
          }))!.id,
        ),
      ),
    });

    if (!user) {
      throw new OperationFailed("Odoo user record not found");
    }

    this.logger.info(
      {
        userId,
        odooLogin: user.odooLogin,
        odooDatabaseName: userCredentials.databaseName,
      },
      "Authenticating Odoo client with user credentials",
    );

    const config: OdooConnectionConfig = {
      url: this.odooConfig.url,
      port: this.odooConfig.port,
      database: userCredentials.databaseName,
      username: user.odooLogin, // Use login (email), not UID
      password: userCredentials.odooPassword,
    };

    const client = createOdooClient(config, this.logger);

    await client.authenticate();

    return client;
  }

  invalidateClient(userId: string, organizationId: string): void {
    const cacheKey = `${userId}:${organizationId}`;
    this.clients.delete(cacheKey);
    this.logger.info({ userId, organizationId }, "Invalidated Odoo client cache");
  }

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

export function initOdooClientManager(deps: OdooClientManagerDependencies): OdooClientManager {
  if (!odooClientManager) {
    odooClientManager = new OdooClientManager(deps);
    deps.logger.info("Odoo client manager initialized");
  }
  return odooClientManager;
}

export function getOdooClientManager(): OdooClientManager {
  if (!odooClientManager) {
    throw new OperationFailed("Odoo client manager not initialized. Call initOdooClientManager first");
  }
  return odooClientManager;
}
