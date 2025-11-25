import { schema } from "@safee/database";
import { eq, and } from "drizzle-orm";
import { OdooModuleService } from "./odoo/module.service.js";
import { OdooDatabaseService } from "./odoo/database.service.js";
import { ServiceNotFound, ServiceAlreadyEnabled } from "../errors.js";
import { env } from "../../env.js";
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
  private odooDatabaseService: OdooDatabaseService;
  private odooModuleService: OdooModuleService;

  constructor(private readonly ctx: ServerContext) {
    this.odooDatabaseService = new OdooDatabaseService(ctx);
    this.odooModuleService = new OdooModuleService(ctx);
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

    if (existing && existing.isEnabled) {
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
          const odooPort = odooUrl.port ? parseInt(odooUrl.port) : odooUrl.protocol === "https:" ? 443 : 80;

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
