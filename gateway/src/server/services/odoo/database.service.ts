import type { DrizzleClient } from "@safee/database";
import { schema, connect } from "@safee/database";
import { eq } from "drizzle-orm";
import crypto from "crypto";
import { odooClient } from "./client.js";
import { createOdooClient, type OdooConnectionConfig } from "./client.service.js";
import { encryptionService } from "../encryption.js";
import { env } from "../../../env.js";
import {
  OrganizationNotFound,
  OdooDatabaseAlreadyExists,
  OdooDatabaseNotFound,
  OperationFailed,
} from "../../errors.js";
import { Logger } from "pino";
import { getServerContext } from "../../serverContext.js";

export interface OdooProvisionResult {
  databaseName: string;
  adminLogin: string;
  adminPassword: string;
  odooUrl: string;
}

export class OdooDatabaseService {
  constructor(private readonly drizzle: DrizzleClient) {}

  private get logger(): Logger {
    return getServerContext().logger;
  }

  private generateSecurePassword(): string {
    return crypto.randomBytes(32).toString("base64url");
  }

  private generateDatabaseName(orgSlug: string, orgId: string): string {
    const sanitized = orgSlug.toLowerCase().replace(/[^a-z0-9]/g, "_");
    const shortId = orgId.replace(/-/g, "").substring(0, 8);
    return `odoo_${sanitized}_${shortId}`;
  }

  /**
   * Install required Odoo modules for Safee platform
   * - account: Accounting (Hisabiq)
   * - crm: Customer Relationship Management (Nisbah)
   * - hr: Human Resources (Kanz)
   * - hr_payroll: Payroll (Kanz)
   */
  async installRequiredModules(
    databaseName: string,
    adminLogin: string,
    adminPassword: string,
  ): Promise<void> {
    this.logger.info({ databaseName }, "Installing required Odoo modules");

    const odooUrl = env.ODOO_URL;
    const odooPort = env.ODOO_PORT;

    const config: OdooConnectionConfig = {
      url: odooUrl,
      port: odooPort,
      database: databaseName,
      username: adminLogin,
      password: adminPassword,
    };

    const client = createOdooClient(config, this.logger);
    await client.authenticate();

    // Modules to install for Safee platform
    const modulesToInstall = [
      { name: "account", description: "Accounting (Hisabiq)" },
      { name: "sale", description: "Sales (Nisbah)" },
      { name: "crm", description: "CRM (Nisbah)" },
      { name: "hr", description: "Human Resources (Kanz)" },
      { name: "hr_payroll", description: "Payroll (Kanz)" },
      { name: "sign", description: "Electronic Signatures" },
      { name: "website", description: "Website Builder" },
      { name: "portal", description: "Customer Portal" },
      { name: "api_key_service", description: "API Key Service (Safee Custom)" },
    ];

    for (const module of modulesToInstall) {
      try {
        this.logger.info({ module: module.name, description: module.description }, "Installing Odoo module");

        // Search for the module by technical name
        const moduleRecords = await client.execute<Array<{ id: number; state: string }>>(
          "ir.module.module",
          "search_read",
          [[["name", "=", module.name]]],
          { fields: ["id", "state"], limit: 1 },
        );

        if (moduleRecords.length === 0) {
          this.logger.warn({ module: module.name }, "Module not found in Odoo, skipping");
          continue;
        }

        const moduleRecord = moduleRecords[0];
        const moduleId = moduleRecord.id;
        const currentState = moduleRecord.state;

        // Skip if already installed
        if (currentState === "installed") {
          this.logger.info({ module: module.name }, "Module already installed, skipping");
          continue;
        }

        // Install the module using button_immediate_install
        this.logger.info({ module: module.name, moduleId }, "Triggering module installation");
        await client.execute<boolean>("ir.module.module", "button_immediate_install", [[moduleId]], {});

        this.logger.info({ module: module.name }, "Module installed successfully");
      } catch (error) {
        this.logger.error({ module: module.name, error }, "Failed to install module");
        throw new OperationFailed(`Failed to install Odoo module: ${module.name}`);
      }
    }

    this.logger.info(
      { databaseName, moduleCount: modulesToInstall.length },
      "All required modules installed",
    );
  }

  async provisionDatabase(organizationId: string): Promise<OdooProvisionResult> {
    this.logger.info(
      { organizationId, orgIdType: typeof organizationId },
      "Starting Odoo database provisioning",
    );

    this.logger.debug(
      {
        organizationId,
        searchingInTable: "identity.organizations",
        usingField: "id",
        query: "eq(schema.organizations.id, organizationId)",
      },
      "Executing organization query",
    );

    const org = await this.drizzle.query.organizations.findFirst({
      where: eq(schema.organizations.id, organizationId),
    });

    this.logger.info(
      {
        organizationId,
        found: !!org,
        orgId: org?.id,
        orgName: org?.name,
        orgSlug: org?.slug,
      },
      "Organization query result",
    );

    if (!org) {
      this.logger.error({ organizationId }, "Organization not found");
      throw new OrganizationNotFound();
    }

    const existingDb = await this.drizzle.query.odooDatabases.findFirst({
      where: eq(schema.odooDatabases.organizationId, organizationId),
    });

    if (existingDb) {
      this.logger.warn(
        { organizationId, databaseName: existingDb.databaseName },
        "Odoo database already exists",
      );
      throw new OdooDatabaseAlreadyExists(organizationId);
    }

    const databaseName = this.generateDatabaseName(org.slug, org.id);

    const exists = await odooClient.databaseExists(databaseName);
    if (exists) {
      this.logger.error({ databaseName }, "Odoo database name already in use");
      throw new OdooDatabaseAlreadyExists(organizationId);
    }

    const adminLogin = `admin_${org.slug}`;
    const adminPassword = this.generateSecurePassword();

    this.logger.info({ databaseName, adminLogin }, "Creating Odoo database");

    await odooClient.createDatabase({
      masterPassword: env.ODOO_ADMIN_PASSWORD,
      name: databaseName,
      adminLogin,
      adminPassword,
      lang: org.defaultLocale === "ar" ? "ar_001" : "en_US",
      countryCode: "SA",
    });

    const encryptedPassword = encryptionService.encrypt(adminPassword);

    await this.drizzle.insert(schema.odooDatabases).values({
      organizationId,
      databaseName,
      adminLogin,
      adminPassword: encryptedPassword,
      odooUrl: env.ODOO_URL,
    });

    // Install required modules for Safee platform
    try {
      await this.installRequiredModules(databaseName, adminLogin, adminPassword);
    } catch (error) {
      this.logger.error({ organizationId, databaseName, error }, "Failed to install required modules");
      // Don't throw - database is provisioned, modules can be installed manually if needed
      // But log the error for visibility
    }

    this.logger.info({ organizationId, databaseName }, "Odoo database provisioned successfully");

    return {
      databaseName,
      adminLogin,
      adminPassword,
      odooUrl: env.ODOO_URL,
    };
  }

  async getDatabaseInfo(organizationId: string): Promise<{
    databaseName: string;
    exists: boolean;
  }> {
    const org = await this.drizzle.query.organizations.findFirst({
      where: eq(schema.organizations.id, organizationId),
    });

    if (!org) {
      throw new OrganizationNotFound();
    }

    const databaseName = this.generateDatabaseName(org.slug, org.id);
    const exists = await odooClient.databaseExists(databaseName);

    return {
      databaseName,
      exists,
    };
  }

  async deleteDatabase(organizationId: string): Promise<void> {
    const org = await this.drizzle.query.organizations.findFirst({
      where: eq(schema.organizations.id, organizationId),
    });

    if (!org) {
      throw new OrganizationNotFound();
    }

    const databaseName = this.generateDatabaseName(org.slug, org.id);

    await odooClient.dropDatabase(env.ODOO_ADMIN_PASSWORD, databaseName);

    await this.drizzle
      .delete(schema.odooDatabases)
      .where(eq(schema.odooDatabases.organizationId, organizationId));
  }

  async listAllDatabases(): Promise<string[]> {
    return odooClient.listDatabases();
  }

  async getAuthUrl(organizationId: string): Promise<string> {
    const info = await this.getDatabaseInfo(organizationId);

    if (!info.exists) {
      throw new OdooDatabaseNotFound(organizationId);
    }

    return `${env.ODOO_URL}/web/login?db=${info.databaseName}`;
  }

  getProxyHeaders(organizationId: string): Record<string, string> {
    return {
      "X-Odoo-Organization-Id": organizationId,
    };
  }

  async getCredentials(organizationId: string): Promise<{
    databaseName: string;
    adminLogin: string;
    adminPassword: string;
    odooUrl: string;
  } | null> {
    const dbRecord = await this.drizzle.query.odooDatabases.findFirst({
      where: eq(schema.odooDatabases.organizationId, organizationId),
    });

    if (!dbRecord) {
      return null;
    }

    const adminPassword = encryptionService.decrypt(dbRecord.adminPassword);

    return {
      databaseName: dbRecord.databaseName,
      adminLogin: dbRecord.adminLogin,
      adminPassword,
      odooUrl: dbRecord.odooUrl,
    };
  }

  /**
   * Install modules for an organization's Odoo database
   */
  async installModulesForOrganization(organizationId: string): Promise<void> {
    const credentials = await this.getCredentials(organizationId);

    if (!credentials) {
      throw new OdooDatabaseNotFound(organizationId);
    }

    await this.installRequiredModules(
      credentials.databaseName,
      credentials.adminLogin,
      credentials.adminPassword,
    );
  }
}

const { drizzle } = connect("odoo-service");
export const odooDatabaseService = new OdooDatabaseService(drizzle);
