import type { DrizzleClient } from "@safee/database";
import { schema, connect } from "@safee/database";
import { eq, and } from "drizzle-orm";
import crypto from "crypto";
import { encryptionService } from "../encryption.js";
import { env } from "../../../env.js";
import { BadGateway, NotFound } from "../../errors.js";
import { Logger } from "pino";
import { getServerContext } from "../../serverContext.js";

export interface OdooUserProvisionResult {
  odooUid: number;
  odooLogin: string;
  odooPassword: string; // API key (more stable than password)
}

export interface OdooUserCredentials {
  databaseName: string;
  odooUid: number;
  odooPassword: string; // API key for authentication
}

/**
 * Service to provision and manage Odoo users for Safee users
 * Creates individual Odoo users for each Safee user to enable:
 * - User-level audit trails in Odoo
 * - Per-user permissions and access control
 * - Accurate sales attribution and performance tracking
 *
 * Authentication Strategy:
 * - Password: Set in Odoo for web UI access (users click "View in Odoo")
 * - API Key: Generated and stored for RPC operations (no session expiry)
 * - API keys are stored encrypted in odooPassword field
 * - Passwords are set in Odoo but not stored in Safee DB (user resets via Odoo if needed)
 */
export class OdooUserProvisioningService {
  constructor(
    private readonly drizzle: DrizzleClient,
  ) {}

  private get logger(): Logger {
    return getServerContext().logger;
  }

  /**
   * Authenticate with Odoo and get session + UID
   * Returns uid, sessionId, and cookies from Set-Cookie headers
   */
  private async authenticate(
    databaseName: string,
    login: string,
    password: string,
  ): Promise<{ uid: number; sessionId: string; cookies: string[] }> {
    const response = await fetch(`${env.ODOO_URL}/web/session/authenticate`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        jsonrpc: "2.0",
        method: "call",
        params: {
          db: databaseName,
          login,
          password,
        },
        id: null,
      }),
    });

    if (!response.ok) {
      throw new BadGateway(`Odoo authentication failed: ${response.status}`);
    }

    const data = await response.json();

    if (data.error) {
      throw new BadGateway(`Odoo authentication error: ${JSON.stringify(data.error)}`);
    }

    const result = data.result as { uid: number; session_id: string };

    if (!result.uid) {
      throw new BadGateway("Failed to authenticate with Odoo");
    }

    // Capture all cookies from the authentication response
    const setCookieHeaders = response.headers.getSetCookie?.() || [];
    const cookies = setCookieHeaders.length > 0
      ? setCookieHeaders.map((cookie) => cookie.split(";")[0])
      : [];

    this.logger.debug({ cookieCount: cookies.length }, "Captured cookies from Odoo user provisioning auth");

    return { uid: result.uid, sessionId: result.session_id, cookies };
  }

  private isSessionExpiredError(error: unknown): boolean {
    if (!(error instanceof Error)) return false;

    const errorStr = error.message.toLowerCase();
    return (
      errorStr.includes("session expired") ||
      errorStr.includes("sessionexpiredexception") ||
      errorStr.includes("session_expired")
    );
  }

  /**
   * Call Odoo model method via JSON-RPC with auto-retry on session expiry
   */
  private async callOdooExecuteKw<T = unknown>(
    sessionId: string,
    cookies: string[],
    model: string,
    method: string,
    args: unknown[],
    kwargs: Record<string, unknown> = {},
    adminCredentials?: { databaseName: string; adminLogin: string; adminPassword: string },
    retryCount = 0,
  ): Promise<T> {
    try {
      // Build cookie header from all stored cookies
      const cookieHeader = cookies.length > 0
        ? cookies.join("; ")
        : `session_id=${sessionId}`;

      const response = await fetch(`${env.ODOO_URL}/web/dataset/call_kw`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Cookie: cookieHeader,
        },
        body: JSON.stringify({
          jsonrpc: "2.0",
          method: "call",
          params: {
            model,
            method,
            args,
            kwargs,
          },
          id: null,
        }),
      });

      if (!response.ok) {
        throw new BadGateway(`Odoo ${method} failed: ${response.status}`);
      }

      const data = await response.json();

      if (data.error) {
        throw new BadGateway(`Odoo ${method} error: ${JSON.stringify(data.error)}`);
      }

      return data.result as T;
    } catch (error) {
      // Retry on session expiry if we have admin credentials
      if (this.isSessionExpiredError(error) && adminCredentials && retryCount === 0) {
        this.logger.info({ model, method }, "Odoo session expired in user provisioning, re-authenticating");

        // Re-authenticate and retry
        const { sessionId: newSessionId, cookies: newCookies } = await this.authenticate(
          adminCredentials.databaseName,
          adminCredentials.adminLogin,
          adminCredentials.adminPassword,
        );

        return this.callOdooExecuteKw<T>(newSessionId, newCookies, model, method, args, kwargs, adminCredentials, retryCount + 1);
      }

      throw error;
    }
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
    sessionId: string,
    cookies: string[],
    groupXmlIds: string[],
    adminCredentials: { databaseName: string; adminLogin: string; adminPassword: string },
  ): Promise<number[]> {
    const groupIds: number[] = [];

    for (const xmlId of groupXmlIds) {
      try {
        const [module, name] = xmlId.split(".");
        const result = await this.callOdooExecuteKw<Array<{ res_id: number }>>(
          sessionId,
          cookies,
          "ir.model.data",
          "search_read",
          [
            [
              ["name", "=", name],
              ["module", "=", module],
            ],
          ],
          { fields: ["res_id"], limit: 1 },
          adminCredentials,
        );

        if (result && result.length > 0) {
          groupIds.push(result[0].res_id);
        }
      } catch (error) {
        this.logger.warn({ xmlId, error }, "Failed to find group, skipping");
      }
    }

    return groupIds;
  }

  /**
   * Determine default groups based on user role in Safee
   * Maps Safee roles to Odoo access groups
   *
   * Note: base.group_user and base.group_portal are mutually exclusive
   * - base.group_user = Internal User (full access)
   * - base.group_portal = Portal User (limited external access)
   * Safee users need internal user access, not portal
   *
   * All Safee users get access to core platform modules:
   * - Hisabiq (Accounting) - account.group_account_invoice
   * - Nisbah (CRM) - sales_team.group_sale_salesman
   * - Kanz (HR) - hr.group_hr_user (for employees to see their own data)
   */
  private getDefaultGroupsForUser(safeeRole?: string): string[] {
    // Base groups for ALL Safee users (core platform access)
    const baseGroups = [
      "base.group_user", // Internal User - required for all Safee users
      "account.group_account_invoice", // Hisabiq (Accounting/Invoicing)
      "sales_team.group_sale_salesman", // Nisbah (CRM)
      "hr.group_hr_user", // Kanz (HR - employee self-service)
    ];

    // Additional role-specific groups for elevated permissions
    const roleGroups: Record<string, string[]> = {
      admin: [
        "account.group_account_manager", // Full accounting admin
        "sales_team.group_sale_manager", // CRM manager
        "hr.group_hr_manager", // HR manager
        "sign.group_sign_manager", // Signing manager
      ],
      accountant: [
        "account.group_account_manager", // Full accounting access
        "account.group_account_user", // Accounting features
      ],
      manager: [
        "sales_team.group_sale_manager", // CRM manager
        "hr.group_hr_manager", // HR manager
      ],
      salesperson: [
        // Inherits base groups only (CRM salesman from baseGroups)
      ],
      user: [
        // Inherits base groups only (invoicing, CRM, HR employee access)
      ],
    };

    const additionalGroups = roleGroups[safeeRole || "user"] || roleGroups.user || [];
    return [...baseGroups, ...additionalGroups];
  }

  /**
   * Create or get existing Odoo user via JSON-RPC with proper access groups
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
    const { sessionId, cookies } = await this.authenticate(databaseName, adminLogin, adminPassword);

    const adminCredentials = { databaseName, adminLogin, adminPassword };

    // First check if user already exists in Odoo
    const existingUsers = await this.callOdooExecuteKw<Array<{ id: number }>>(
      sessionId,
      cookies,
      "res.users",
      "search_read",
      [[["login", "=", userEmail]]],
      { fields: ["id"], limit: 1 },
      adminCredentials,
    );

    let userId: number;

    if (existingUsers.length > 0) {
      userId = existingUsers[0].id;
      this.logger.info({ userId, userEmail }, "User already exists in Odoo, will update groups");
    } else {
      this.logger.info({ userEmail }, "User does not exist in Odoo, creating new user");

      // Create user WITHOUT groups first (will add them after)
      userId = await this.callOdooExecuteKw<number>(
        sessionId,
        cookies,
        "res.users",
        "create",
        [
          {
            name: userName,
            login: userEmail,
            email: userEmail,
          },
        ],
        {},
        adminCredentials,
      );

      this.logger.info({ userId }, "User created successfully");
    }

    // Get group XML IDs based on user role
    const groupXmlIds = this.getDefaultGroupsForUser(safeeRole);

    // Resolve XML IDs to internal IDs
    const groupIds = await this.getGroupIds(sessionId, cookies, groupXmlIds, adminCredentials);

    // Assign groups (works for both new and existing users)
    if (groupIds.length > 0) {
      this.logger.info(
        { userId, userEmail, safeeRole, groupCount: groupIds.length },
        "Assigning groups to Odoo user",
      );

      await this.callOdooExecuteKw<boolean>(
        sessionId,
        cookies,
        "res.users",
        "write",
        [[userId], { group_ids: [[6, 0, groupIds]] }],
        {},
        adminCredentials,
      );

      this.logger.info({ userId }, "Groups assigned successfully");
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
    const { sessionId, cookies } = await this.authenticate(databaseName, adminLogin, adminPassword);

    const adminCredentials = { databaseName, adminLogin, adminPassword };
    await this.callOdooExecuteKw<boolean>(
      sessionId,
      cookies,
      "res.users",
      "write",
      [[userId], { password: newPassword }],
      {},
      adminCredentials,
    );
  }

  /**
   * Generate API key for Odoo user using custom HTTP endpoint
   * API keys are more stable than passwords and don't require session management
   *
   * Uses custom api_key_service addon endpoint to bypass RPC access restrictions
   */
  private async generateApiKey(
    databaseName: string,
    adminLogin: string,
    adminPassword: string,
    targetUserLogin: string,
    keyName: string,
  ): Promise<string> {
    this.logger.info({ targetUserLogin, keyName }, "Generating API key for Odoo user via HTTP endpoint");

    try {
      // Call custom Odoo endpoint to generate API key
      const response = await fetch(`${env.ODOO_URL}/api/generate_key`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          jsonrpc: "2.0",
          method: "call",
          params: {
            db: databaseName,
            admin_login: adminLogin,
            admin_password: adminPassword,
            target_user_login: targetUserLogin,
            name: keyName,
            scope: "rpc",
          },
        }),
      });

      if (!response.ok) {
        throw new BadGateway(`HTTP ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();

      // Check for JSON-RPC error
      if (result.error) {
        throw new BadGateway(`Odoo error: ${result.error.message || JSON.stringify(result.error)}`);
      }

      // Extract result from JSON-RPC response
      const data = result.result;

      if (!data.ok) {
        throw new BadGateway(`Failed to generate API key: ${data.error || "Unknown error"}`);
      }

      if (!data.token) {
        throw new BadGateway("API key token not returned from endpoint");
      }

      this.logger.info(
        { targetUserLogin, keyName, apiKeyId: data.id },
        "API key generated successfully via HTTP endpoint",
      );

      return data.token;
    } catch (error) {
      this.logger.error({ targetUserLogin, keyName, error }, "Failed to generate API key via HTTP endpoint");
      throw new BadGateway(
        `Failed to generate API key: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
    }
  }

  /**
   * Check if Odoo user already exists for a Safee user
   */
  async userExists(userId: string, organizationId: string): Promise<boolean> {
    const odooDb = await this.drizzle.query.odooDatabases.findFirst({
      where: eq(schema.odooDatabases.organizationId, organizationId),
    });

    if (!odooDb) {
      return false;
    }

    const odooUser = await this.drizzle.query.odooUsers.findFirst({
      where: and(eq(schema.odooUsers.userId, userId), eq(schema.odooUsers.odooDatabaseId, odooDb.id)),
    });

    return !!odooUser;
  }

  /**
   * Provision Odoo user for a Safee user
   */
  async provisionUser(
    userId: string,
    organizationId: string,
    safeeRole?: string,
  ): Promise<OdooUserProvisionResult> {
    // Get Safee user details
    const user = await this.drizzle.query.users.findFirst({
      where: eq(schema.users.id, userId),
    });

    if (!user) {
      throw new NotFound("User not found");
    }

    // Check if user already has Odoo account
    const existingOdooUser = await this.drizzle.query.odooUsers.findFirst({
      where: and(eq(schema.odooUsers.userId, userId)),
    });

    if (existingOdooUser) {
      this.logger.info({ userId }, "Odoo user already exists");
      return {
        odooUid: existingOdooUser.odooUid,
        odooLogin: existingOdooUser.odooLogin,
        odooPassword: encryptionService.decrypt(existingOdooUser.odooPassword),
      };
    }

    // Get admin credentials
    const { databaseName, adminLogin, adminPassword } = await this.getAdminCredentials(organizationId);

    // Determine role - use provided role or user's role field
    const role = safeeRole || user.role || "user";

    this.logger.info({ userId, role }, "Provisioning Odoo user with role");

    // Create user name from firstName and lastName
    const userName = user.name || user.email;

    // Create user in Odoo
    const odooUid = await this.createOdooUser(
      databaseName,
      adminLogin,
      adminPassword,
      user.email,
      userName,
      role,
    );

    // Set password for web UI login
    const odooWebPassword = this.generateSecurePassword();
    await this.setOdooUserPassword(databaseName, adminLogin, adminPassword, odooUid, odooWebPassword);

    this.logger.info({ userId, odooUid }, "Password set for web UI access");

    // Generate API key for RPC operations (no session expiry)
    // Uses custom HTTP endpoint with admin credentials
    const keyName = `safee-${userName}-${Date.now()}`;
    const apiKey = await this.generateApiKey(databaseName, adminLogin, adminPassword, user.email, keyName);

    // Get database ID
    const odooDb = await this.drizzle.query.odooDatabases.findFirst({
      where: eq(schema.odooDatabases.organizationId, organizationId),
    });

    if (!odooDb) {
      throw new NotFound("Odoo database not found");
    }

    // Store mapping with both API key and web password
    await this.drizzle.insert(schema.odooUsers).values({
      userId,
      odooDatabaseId: odooDb.id,
      odooUid,
      odooLogin: user.email,
      odooPassword: encryptionService.encrypt(apiKey), // Encrypted API key for RPC
      odooWebPassword: encryptionService.encrypt(odooWebPassword), // Encrypted password for web UI
      lastSyncedAt: new Date(),
    });

    this.logger.info({ userId, odooUid, databaseName, keyName }, "Odoo user provisioned successfully with API key and web password");

    return {
      odooUid,
      odooLogin: user.email,
      odooPassword: apiKey, // Return API key for immediate use
    };
  }

  /**
   * Get Odoo credentials for a Safee user
   * Returns API key for authentication (stored in odooPassword field)
   */
  async getUserCredentials(userId: string, organizationId: string): Promise<OdooUserCredentials | null> {
    // Get Odoo database
    const odooDb = await this.drizzle.query.odooDatabases.findFirst({
      where: eq(schema.odooDatabases.organizationId, organizationId),
    });

    if (!odooDb) {
      return null;
    }

    // Get Odoo user mapping
    const odooUser = await this.drizzle.query.odooUsers.findFirst({
      where: and(eq(schema.odooUsers.userId, userId), eq(schema.odooUsers.odooDatabaseId, odooDb.id)),
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
   * Get Odoo web password for a user (for dev access)
   */
  async getOdooWebPassword(userId: string, organizationId: string): Promise<{
    login: string;
    password: string;
    webUrl: string;
  } | null> {
    // Get Odoo database
    const odooDb = await this.drizzle.query.odooDatabases.findFirst({
      where: eq(schema.odooDatabases.organizationId, organizationId),
    });

    if (!odooDb) {
      return null;
    }

    // Get Odoo user mapping
    const odooUser = await this.drizzle.query.odooUsers.findFirst({
      where: and(eq(schema.odooUsers.userId, userId), eq(schema.odooUsers.odooDatabaseId, odooDb.id)),
    });

    if (!odooUser || !odooUser.odooWebPassword) {
      return null;
    }

    return {
      login: odooUser.odooLogin,
      password: encryptionService.decrypt(odooUser.odooWebPassword),
      webUrl: `${env.ODOO_URL}/web/login?db=${odooDb.databaseName}`,
    };
  }

  /**
   * Get Odoo web UI login URL for a user
   * Returns URL that user can click to access their Odoo dashboard
   */
  async getOdooWebUrl(userId: string, organizationId: string): Promise<string> {
    const credentials = await this.getUserCredentials(userId, organizationId);

    if (!credentials) {
      throw new NotFound("Odoo user not found");
    }

    // Return Odoo login page with pre-filled database
    return `${env.ODOO_URL}/web/login?db=${credentials.databaseName}`;
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

    const { sessionId, cookies } = await this.authenticate(databaseName, adminLogin, adminPassword);

    // Deactivate in Odoo
    const adminCredentials = { databaseName, adminLogin, adminPassword };
    await this.callOdooExecuteKw<boolean>(
      sessionId,
      cookies,
      "res.users",
      "write",
      [[odooUser.odooUid], { active: false }],
      {},
      adminCredentials,
    );

    // Update status in database
    await this.drizzle
      .update(schema.odooUsers)
      .set({ isActive: false, updatedAt: new Date() })
      .where(eq(schema.odooUsers.id, odooUser.id));

    this.logger.info({ userId, odooUid: odooUser.odooUid }, "Odoo user deactivated");
  }
}

const { drizzle } = connect("odoo-user-provisioning");
export const odooUserProvisioningService = new OdooUserProvisioningService(drizzle);
