import type { Logger } from "pino";
import type { DrizzleClient } from "@safee/database";
import { schema } from "@safee/database";
import { eq } from "drizzle-orm";
import { createOdooClient, type OdooClient, type OdooConnectionConfig } from "./client.service.js";
import { OdooDatabaseNotFound, OperationFailed } from "../../errors.js";
import { encryptionService } from "../encryption.js";

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

  async getClient(organizationId: string): Promise<OdooClient> {
    const cached = this.clients.get(organizationId);
    if (cached && cached.expiresAt > new Date()) {
      this.logger.debug({ organizationId }, "Using cached Odoo client");
      return cached.client;
    }

    this.logger.info({ organizationId }, "Creating new Odoo client");
    const client = await this.createClient(organizationId);

    this.clients.set(organizationId, {
      client,
      expiresAt: new Date(Date.now() + this.cacheTTL),
    });

    return client;
  }

  private async createClient(organizationId: string): Promise<OdooClient> {
    const dbRecord = await this.drizzle.query.odooDatabases.findFirst({
      where: eq(schema.odooDatabases.organizationId, organizationId),
    });

    if (!dbRecord) {
      throw new OdooDatabaseNotFound(organizationId);
    }

    const adminPassword = encryptionService.decrypt(dbRecord.adminPassword);

    const odooUrl = process.env.ODOO_URL || "http://localhost:8069";
    const odooPort = parseInt(process.env.ODOO_PORT || "8069", 10);

    const config: OdooConnectionConfig = {
      url: odooUrl,
      port: odooPort,
      database: dbRecord.databaseName,
      username: dbRecord.adminLogin,
      password: adminPassword,
    };

    const client = createOdooClient(config, this.logger);

    await client.authenticate();

    return client;
  }

  invalidateClient(organizationId: string): void {
    this.clients.delete(organizationId);
    this.logger.info({ organizationId }, "Invalidated Odoo client cache");
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
