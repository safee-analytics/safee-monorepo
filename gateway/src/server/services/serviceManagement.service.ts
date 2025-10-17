import type { DrizzleClient } from "@safee/database";
import { schema, connect } from "@safee/database";
import { eq, and } from "drizzle-orm";
import { odooModuleService } from "./odoo/module.service.js";
import { odooDatabaseService } from "./odoo/database.service.js";

export interface EnableServiceForOrganizationParams {
  organizationId: string;
  serviceId: string;
}

export interface EnableServiceForUserParams {
  userId: string;
  serviceId: string;
}

export class ServiceManagementService {
  constructor(private readonly drizzle: DrizzleClient) {}

  async enableServiceForOrganization(params: EnableServiceForOrganizationParams): Promise<void> {
    const { organizationId, serviceId } = params;

    const service = await this.drizzle.query.services.findFirst({
      where: eq(schema.services.id, serviceId),
    });

    if (!service) {
      throw new Error(`Service not found: ${serviceId}`);
    }

    const existing = await this.drizzle.query.organizationServices.findFirst({
      where: and(
        eq(schema.organizationServices.organizationId, organizationId),
        eq(schema.organizationServices.serviceId, serviceId),
      ),
    });

    if (existing && existing.isEnabled) {
      throw new Error(`Service already enabled for organization`);
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
      const dbInfo = await odooDatabaseService.getDatabaseInfo(organizationId);
      if (dbInfo.exists) {
        const credentials = await odooDatabaseService.getCredentials(organizationId);
        if (credentials) {
          const auth = await odooModuleService.authenticate(
            credentials.databaseName,
            credentials.adminLogin,
            credentials.adminPassword,
          );

          await odooModuleService.installModules({
            database: dbInfo.databaseName,
            modules: [service.name],
            uid: auth.uid,
            sessionId: auth.session_id,
          });
        }
      }
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error("Failed to install Odoo module:", err);
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

const { drizzle } = connect("service-management");
export const serviceManagementService = new ServiceManagementService(drizzle);
