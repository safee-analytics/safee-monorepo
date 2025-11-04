import type { DrizzleClient } from "@safee/database";
import { schema, connect } from "@safee/database";
import { eq, and } from "drizzle-orm";
import crypto from "crypto";
import xmlrpc from "xmlrpc";
import { encryptionService } from "../encryption.js";
import { env } from "../../../env.js";
import { BadGateway, NotFound } from "../../errors.js";
import { Logger } from "pino";

export interface OdooUserProvisionResult {
  odooUid: number;
  odooLogin: string;
  odooPassword: string;
}

export interface OdooUserCredentials {
  databaseName: string;
  odooUid: number;
  odooPassword: string;
}

/**
 * Service to provision and manage Odoo users for Safee users
 * Creates individual Odoo users for each Safee user to enable:
 * - User-level audit trails in Odoo
 * - Per-user permissions and access control
 * - Accurate sales attribution and performance tracking
 */
export class OdooUserProvisioningService {
  constructor(
    private readonly drizzle: DrizzleClient,
    private readonly logger?: Logger,
  ) {}

  private createXmlRpcClient(host: string, port: number, path: string, secure = false): xmlrpc.Client {
    const options = { host, port, path };
    return secure ? xmlrpc.createSecureClient(options) : xmlrpc.createClient(options);
  }

  private async callOdooMethod(
    path: string,
    method: string,
    args: unknown[],
  ): Promise<unknown> {
    const url = new URL(env.ODOO_URL);
    const client = this.createXmlRpcClient(
      url.hostname,
      url.port ? parseInt(url.port) : 8069,
      path,
      url.protocol === "https:",
    );

    return new Promise((resolve, reject) => {
      client.methodCall(method, args, (error, value) => {
        if (error) {
          reject(new BadGateway(`Odoo ${method} error: ${error}`));
        } else {
          resolve(value);
        }
      });
    });
  }

  /**
   * Authenticate and get UID for a user
   */
  private async authenticate(
    databaseName: string,
    login: string,
    password: string,
  ): Promise<number> {
    const uid = await this.callOdooMethod("/xmlrpc/2/common", "authenticate", [
      databaseName,
      login,
      password,
      {},
    ]);

    if (!uid || typeof uid !== "number") {
      throw new BadGateway("Failed to authenticate with Odoo");
    }

    return uid;
  }

  /**
   * Get admin credentials for a database
   */
  private async getAdminCredentials(organizationId: string): Promise<{
    databaseName: string;
    adminLogin: string;
    adminPassword: string;
  }> {
    const odooDb = await this.drizzle.query.odooDatabases.findFirst({
      where: eq(schema.odooDatabases.organizationId, organizationId),
    });

    if (!odooDb) {
      throw new NotFound("Odoo database not found for organization");
    }

    return {
      databaseName: odooDb.databaseName,
      adminLogin: odooDb.adminLogin,
      adminPassword: encryptionService.decrypt(odooDb.adminPassword),
    };
  }

  private generateSecurePassword(): string {
    return crypto.randomBytes(32).toString("base64url");
  }

  /**
   * Get Odoo internal group IDs by XML ID
   */
  private async getGroupIds(
    databaseName: string,
    adminUid: number,
    adminPassword: string,
    groupXmlIds: string[],
  ): Promise<number[]> {
    const groupIds: number[] = [];

    for (const xmlId of groupXmlIds) {
      try {
        const result = (await this.callOdooMethod("/xmlrpc/2/object", "execute_kw", [
          databaseName,
          adminUid,
          adminPassword,
          "ir.model.data",
          "search_read",
          [[["name", "=", xmlId.split(".")[1]], ["module", "=", xmlId.split(".")[0]]]],
          { fields: ["res_id"], limit: 1 },
        ])) as Array<{ res_id: number }>;

        if (result && result.length > 0) {
          groupIds.push(result[0].res_id);
        }
      } catch (error) {
        this.logger?.warn({ xmlId }, "Failed to find group, skipping");
      }
    }

    return groupIds;
  }

  /**
   * Determine default groups based on user role in Safee
   * Maps Safee roles to Odoo access groups
   */
  private getDefaultGroupsForUser(safeeRole?: string): string[] {
    // Base groups everyone gets
    const baseGroups = [
      "base.group_user", // Internal User
      "base.group_portal", // Portal access
    ];

    // Role-specific groups
    const roleGroups: Record<string, string[]> = {
      admin: [
        "sales_team.group_sale_manager",
        "crm.group_sale_manager",
        "account.group_account_user",
        "project.group_project_manager",
        "hr.group_hr_manager",
      ],
      accountant: [
        "account.group_account_user",
        "account.group_account_invoice",
        "sales_team.group_sale_salesman_all_leads",
      ],
      salesperson: [
        "sales_team.group_sale_salesman",
        "crm.group_sale_salesman",
        "project.group_project_user",
      ],
      manager: [
        "sales_team.group_sale_manager",
        "crm.group_sale_manager",
        "project.group_project_manager",
        "hr.group_hr_user",
      ],
      user: [
        "sales_team.group_sale_salesman",
        "crm.group_sale_salesman",
        "project.group_project_user",
      ],
    };

    const groups = roleGroups[safeeRole || "user"] || roleGroups.user;
    return [...baseGroups, ...groups];
  }

  /**
   * Create Odoo user via XML-RPC with proper access groups
   */
  private async createOdooUser(
    databaseName: string,
    adminLogin: string,
    adminPassword: string,
    userEmail: string,
    userName: string,
    safeeRole?: string,
  ): Promise<number> {
    // Authenticate as admin
    const adminUid = await this.authenticate(databaseName, adminLogin, adminPassword);

    // Get group XML IDs based on user role
    const groupXmlIds = this.getDefaultGroupsForUser(safeeRole);

    // Resolve XML IDs to internal IDs
    const groupIds = await this.getGroupIds(databaseName, adminUid, adminPassword, groupXmlIds);

    this.logger?.info(
      { userEmail, safeeRole, groupCount: groupIds.length },
      "Creating Odoo user with groups",
    );

    // Create user via execute_kw
    const userId = (await this.callOdooMethod("/xmlrpc/2/object", "execute_kw", [
      databaseName,
      adminUid,
      adminPassword,
      "res.users",
      "create",
      [
        {
          name: userName,
          login: userEmail,
          email: userEmail,
          groups_id: [[6, 0, groupIds]], // Assign groups
        },
      ],
    ])) as number;

    if (!userId) {
      throw new BadGateway("Failed to create Odoo user");
    }

    return userId;
  }

  /**
   * Set password for Odoo user
   */
  private async setOdooUserPassword(
    databaseName: string,
    adminLogin: string,
    adminPassword: string,
    userId: number,
    newPassword: string,
  ): Promise<void> {
    const adminUid = await this.authenticate(databaseName, adminLogin, adminPassword);

    await this.callOdooMethod("/xmlrpc/2/object", "execute_kw", [
      databaseName,
      adminUid,
      adminPassword,
      "res.users",
      "write",
      [[userId], { password: newPassword }],
    ]);
  }

  /**
   * Provision Odoo user for a Safee user
   */
  async provisionUser(
    userId: string,
    organizationId: string,
    safeeRole?: string,
  ): Promise<OdooUserProvisionResult> {
    // Get Safee user details with roles
    const user = await this.drizzle.query.users.findFirst({
      where: eq(schema.users.id, userId),
      with: {
        userRoles: {
          with: {
            role: true,
          },
        },
      },
    });

    if (!user) {
      throw new NotFound("User not found");
    }

    // Check if user already has Odoo account
    const existingOdooUser = await this.drizzle.query.odooUsers.findFirst({
      where: and(
        eq(schema.odooUsers.userId, userId),
      ),
    });

    if (existingOdooUser) {
      this.logger?.info({ userId }, "Odoo user already exists");
      return {
        odooUid: existingOdooUser.odooUid,
        odooLogin: existingOdooUser.odooLogin,
        odooPassword: encryptionService.decrypt(existingOdooUser.odooPassword),
      };
    }

    // Get admin credentials
    const { databaseName, adminLogin, adminPassword } = await this.getAdminCredentials(organizationId);

    // Generate password for Odoo user
    const odooPassword = this.generateSecurePassword();

    // Determine role - use provided role or first role from user's roles
    const role = safeeRole || user.userRoles?.[0]?.role?.name?.toLowerCase() || "user";

    this.logger?.info({ userId, role }, "Provisioning Odoo user with role");

    // Create user name from firstName and lastName
    const userName = [user.firstName, user.lastName].filter(Boolean).join(" ") || user.email;

    // Create user in Odoo
    const odooUid = await this.createOdooUser(
      databaseName,
      adminLogin,
      adminPassword,
      user.email,
      userName,
      role,
    );

    // Set password
    await this.setOdooUserPassword(databaseName, adminLogin, adminPassword, odooUid, odooPassword);

    // Get database ID
    const odooDb = await this.drizzle.query.odooDatabases.findFirst({
      where: eq(schema.odooDatabases.organizationId, organizationId),
    });

    if (!odooDb) {
      throw new NotFound("Odoo database not found");
    }

    // Store mapping
    await this.drizzle.insert(schema.odooUsers).values({
      userId,
      odooDatabaseId: odooDb.id,
      odooUid,
      odooLogin: user.email,
      odooPassword: encryptionService.encrypt(odooPassword),
      lastSyncedAt: new Date(),
    });

    this.logger?.info(
      { userId, odooUid, databaseName },
      "Odoo user provisioned successfully",
    );

    return {
      odooUid,
      odooLogin: user.email,
      odooPassword,
    };
  }

  /**
   * Get Odoo credentials for a Safee user
   */
  async getUserCredentials(
    userId: string,
    organizationId: string,
  ): Promise<OdooUserCredentials | null> {
    // Get Odoo database
    const odooDb = await this.drizzle.query.odooDatabases.findFirst({
      where: eq(schema.odooDatabases.organizationId, organizationId),
    });

    if (!odooDb) {
      return null;
    }

    // Get Odoo user mapping
    const odooUser = await this.drizzle.query.odooUsers.findFirst({
      where: and(
        eq(schema.odooUsers.userId, userId),
        eq(schema.odooUsers.odooDatabaseId, odooDb.id),
      ),
    });

    if (!odooUser) {
      return null;
    }

    return {
      databaseName: odooDb.databaseName,
      odooUid: odooUser.odooUid,
      odooPassword: encryptionService.decrypt(odooUser.odooPassword),
    };
  }

  /**
   * Deactivate Odoo user when Safee user is removed from org
   */
  async deactivateUser(userId: string, organizationId: string): Promise<void> {
    const { databaseName, adminLogin, adminPassword } = await this.getAdminCredentials(organizationId);

    const odooUser = await this.drizzle.query.odooUsers.findFirst({
      where: eq(schema.odooUsers.userId, userId),
    });

    if (!odooUser) {
      return;
    }

    const adminUid = await this.authenticate(databaseName, adminLogin, adminPassword);

    // Deactivate in Odoo
    await this.callOdooMethod("/xmlrpc/2/object", "execute_kw", [
      databaseName,
      adminUid,
      adminPassword,
      "res.users",
      "write",
      [[odooUser.odooUid], { active: false }],
    ]);

    // Update status in database
    await this.drizzle
      .update(schema.odooUsers)
      .set({ isActive: false, updatedAt: new Date() })
      .where(eq(schema.odooUsers.id, odooUser.id));

    this.logger?.info({ userId, odooUid: odooUser.odooUid }, "Odoo user deactivated");
  }
}

const { drizzle } = connect("odoo-user-provisioning");
export const odooUserProvisioningService = new OdooUserProvisioningService(drizzle);
