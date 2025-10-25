import type { DrizzleClient } from "@safee/database";
import { schema, connect } from "@safee/database";
import { eq } from "drizzle-orm";
import crypto from "crypto";
import { odooClient } from "./client.js";
import { encryptionService } from "../encryption.js";
import { env } from "../../../env.js";
import { OrganizationNotFound, OdooDatabaseAlreadyExists, OdooDatabaseNotFound } from "../../errors.js";

export interface OdooProvisionResult {
  databaseName: string;
  adminLogin: string;
  adminPassword: string;
  odooUrl: string;
}

export class OdooDatabaseService {
  constructor(private readonly drizzle: DrizzleClient) {}

  private generateSecurePassword(): string {
    return crypto.randomBytes(32).toString("base64url");
  }

  private generateDatabaseName(orgSlug: string): string {
    const sanitized = orgSlug.toLowerCase().replace(/[^a-z0-9]/g, "_");
    return `odoo_${sanitized}`;
  }

  async provisionDatabase(organizationId: string): Promise<OdooProvisionResult> {
    const org = await this.drizzle.query.organizations.findFirst({
      where: eq(schema.organizations.id, organizationId),
    });

    if (!org) {
      throw new OrganizationNotFound();
    }

    const existingDb = await this.drizzle.query.odooDatabases.findFirst({
      where: eq(schema.odooDatabases.organizationId, organizationId),
    });

    if (existingDb) {
      throw new OdooDatabaseAlreadyExists(organizationId);
    }

    const databaseName = this.generateDatabaseName(org.slug);

    const exists = await odooClient.databaseExists(databaseName);
    if (exists) {
      throw new OdooDatabaseAlreadyExists(organizationId);
    }

    // Generate unique admin login based on organization slug for better security
    const adminLogin = `admin_${org.slug}`;
    const adminPassword = this.generateSecurePassword();

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

    const databaseName = this.generateDatabaseName(org.slug);
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

    const databaseName = this.generateDatabaseName(org.slug);

    await odooClient.dropDatabase(env.ODOO_ADMIN_PASSWORD, databaseName);

    await this.drizzle
      .delete(schema.odooDatabases)
      .where(eq(schema.odooDatabases.organizationId, organizationId));
  }

  async listAllDatabases(): Promise<string[]> {
    // Odoo's dbfilter configuration (^odoo_.*$) automatically filters the list
    // to only show databases matching the pattern
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
    // Return headers that can be used to identify which Odoo database to use
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
}

const { drizzle } = connect("odoo-service");
export const odooDatabaseService = new OdooDatabaseService(drizzle);
