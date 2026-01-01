import { schema, eq, and, odoo } from "@safee/database";
import { ServiceAlreadyEnabled, ServiceNotFound } from "../errors.js";
import {
  env,
  ODOO_URL,
  ODOO_PORT,
  ODOO_ADMIN_PASSWORD,
  ODOO_WEBHOOK_URL,
  ODOO_WEBHOOK_SECRET,
  ODOO_WEBHOOKS_ENABLED,
  JWT_SECRET,
} from "../../env.js";
import type { ServerContext } from "../serverContext.js";

export interface EnableServiceForOrganizationParams {
  organizationId: string;
  serviceId: string;
}

export interface EnableServiceForUserParams {
  userId: string;
  serviceId: string;
}

export class ServiceManagementService {
  private odooDatabaseService: odoo.OdooDatabaseService;
  private odooModuleService: odoo.OdooModuleService;

  constructor(private readonly ctx: ServerContext) {
    this.odooDatabaseService = new odoo.OdooDatabaseService({
      logger: ctx.logger,
      drizzle: ctx.drizzle,
      redis: ctx.redis,
      odooClient: new odoo.OdooClient(ODOO_URL),
      encryptionService: new odoo.EncryptionService(JWT_SECRET),
      odooConfig: {
        url: ODOO_URL,
        port: ODOO_PORT,
        adminPassword: ODOO_ADMIN_PASSWORD,
        webhook:
          ODOO_WEBHOOK_URL && ODOO_WEBHOOK_SECRET
            ? {
                url: ODOO_WEBHOOK_URL,
                masterSecret: ODOO_WEBHOOK_SECRET,
                enabled: ODOO_WEBHOOKS_ENABLED,
              }
            : undefined,
      },
    });
    this.odooModuleService = new odoo.OdooModuleService({
      logger: ctx.logger,
      drizzle: ctx.drizzle,
    });
  }

  private get logger() {
    return this.ctx.logger;
  }

  private get drizzle() {
    return this.ctx.drizzle;
  }

  async enableServiceForOrganization(params: EnableServiceForOrganizationParams): Promise<void> {
    const { organizationId, serviceId } = params;

    const service = await this.drizzle.query.services.findFirst({
      where: eq(schema.services.id, serviceId),
    });

    if (!service) {
      throw new ServiceNotFound(serviceId);
    }

    const existing = await this.drizzle.query.organizationServices.findFirst({
      where: and(
        eq(schema.organizationServices.organizationId, organizationId),
        eq(schema.organizationServices.serviceId, serviceId),
      ),
    });

    if (existing?.isEnabled) {
      throw new ServiceAlreadyEnabled();
    }

    if (existing) {
      await this.drizzle
        .update(schema.organizationServices)
        .set({
          isEnabled: true,
          enabledAt: new Date(),
          disabledAt: null,
          updatedAt: new Date(),
        })
        .where(
          and(
            eq(schema.organizationServices.organizationId, organizationId),
            eq(schema.organizationServices.serviceId, serviceId),
          ),
        );
    } else {
      await this.drizzle.insert(schema.organizationServices).values({
        organizationId,
        serviceId,
        isEnabled: true,
        enabledAt: new Date(),
      });
    }

    try {
      const dbInfo = await this.odooDatabaseService.getDatabaseInfo(organizationId);
      if (dbInfo.exists) {
        const credentials = await this.odooDatabaseService.getCredentials(organizationId);
        if (credentials) {
          const odooUrl = new URL(env.ODOO_URL);
          let odooPort: number;
          if (odooUrl.port) {
            odooPort = parseInt(odooUrl.port, 10);
          } else if (odooUrl.protocol === "https:") {
            odooPort = 443;
          } else {
            odooPort = 80;
          }

          await this.odooModuleService.installModules({
            config: {
              url: credentials.odooUrl,
              port: odooPort,
              database: credentials.databaseName,
              username: credentials.adminLogin,
              password: credentials.adminPassword,
            },
            modules: [service.name],
          });
        }
      }
    } catch (err) {
      this.logger.error({ err, organizationId, serviceId }, "Failed to install Odoo module");
    }
  }

  async disableServiceForOrganization(params: EnableServiceForOrganizationParams): Promise<void> {
    const { organizationId, serviceId } = params;

    await this.drizzle
      .update(schema.organizationServices)
      .set({
        isEnabled: false,
        disabledAt: new Date(),
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(schema.organizationServices.organizationId, organizationId),
          eq(schema.organizationServices.serviceId, serviceId),
        ),
      );
  }

  async enableServiceForUser(params: EnableServiceForUserParams): Promise<void> {
    const { userId, serviceId } = params;

    const existing = await this.drizzle.query.userServices.findFirst({
      where: and(eq(schema.userServices.userId, userId), eq(schema.userServices.serviceId, serviceId)),
    });

    if (existing) {
      await this.drizzle
        .update(schema.userServices)
        .set({
          isEnabled: true,
          enabledAt: new Date(),
          disabledAt: null,
          updatedAt: new Date(),
        })
        .where(and(eq(schema.userServices.userId, userId), eq(schema.userServices.serviceId, serviceId)));
    } else {
      await this.drizzle.insert(schema.userServices).values({
        userId,
        serviceId,
        isEnabled: true,
        enabledAt: new Date(),
      });
    }
  }

  async disableServiceForUser(params: EnableServiceForUserParams): Promise<void> {
    const { userId, serviceId } = params;

    await this.drizzle
      .update(schema.userServices)
      .set({
        isEnabled: false,
        disabledAt: new Date(),
        updatedAt: new Date(),
      })
      .where(and(eq(schema.userServices.userId, userId), eq(schema.userServices.serviceId, serviceId)));
  }

  async getOrganizationServices(organizationId: string) {
    return this.drizzle.query.organizationServices.findMany({
      where: and(
        eq(schema.organizationServices.organizationId, organizationId),
        eq(schema.organizationServices.isEnabled, true),
      ),
      with: {
        service: true,
      },
    });
  }

  async getUserServices(userId: string) {
    return this.drizzle.query.userServices.findMany({
      where: and(eq(schema.userServices.userId, userId), eq(schema.userServices.isEnabled, true)),
      with: {
        service: true,
      },
    });
  }

  async getAllServices() {
    return this.drizzle.query.services.findMany({
      where: eq(schema.services.isActive, true),
    });
  }
}
