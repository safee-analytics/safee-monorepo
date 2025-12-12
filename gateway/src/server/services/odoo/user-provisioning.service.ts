import type { DrizzleClient } from "@safee/database";
import { schema, eq, and } from "@safee/database";
import crypto from "node:crypto";
import { encryptionService } from "../encryption.js";
import { env } from "../../../env.js";
import { BadGateway, NotFound } from "../../errors.js";
import { Logger } from "pino";
import { getServerContext } from "../../serverContext.js";

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

export class OdooUserProvisioningService {
  constructor(private readonly drizzle: DrizzleClient) {}

  private get logger(): Logger {
    return getServerContext().logger;
  }

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

    const getSetCookieFn = response.headers.getSetCookie;
    const setCookieHeaders = getSetCookieFn();
    const cookies = setCookieHeaders.map((cookie) => cookie.split(";")[0]);

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
      const cookieHeader = cookies.length > 0 ? cookies.join("; ") : `session_id=${sessionId}`;

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
    } catch (err) {
      if (this.isSessionExpiredError(err) && adminCredentials && retryCount === 0) {
        this.logger.info({ model, method }, "Odoo session expired in user provisioning, re-authenticating");

        const { sessionId: newSessionId, cookies: newCookies } = await this.authenticate(
          adminCredentials.databaseName,
          adminCredentials.adminLogin,
          adminCredentials.adminPassword,
        );

        return this.callOdooExecuteKw<T>(
          newSessionId,
          newCookies,
          model,
          method,
          args,
          kwargs,
          adminCredentials,
          retryCount + 1,
        );
      }

      throw err;
    }
  }

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
        const result = await this.callOdooExecuteKw<{ res_id: number }[]>(
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

        // result is always defined, check if it has elements
        if (result.length > 0) {
          groupIds.push(result[0].res_id);
        }
      } catch (err) {
        this.logger.warn({ xmlId, error: err }, "Failed to find group, skipping");
      }
    }

    return groupIds;
  }

  private getDefaultGroupsForUser(safeeRole?: string): string[] {
    const baseGroups = [
      // === Core System ===
      "base.group_user", // Internal User - required for all Safee users
      "base.group_partner_manager", // Contact creation and management

      // === Hisabiq (Accounting & Finance) ===
      "account.group_account_invoice", // Invoicing and billing
      "account.group_account_user", // Journal entries, reports, financial statements
      "account.group_account_readonly", // Read-only access to accounting features

      // === Nisbah (CRM & Sales) ===
      "sales_team.group_sale_salesman", // Sales and quotations
      "sales_team.group_sale_salesman_all_leads", // Access to all leads/opportunities
      "sale.group_delivery_invoice_address", // Delivery and invoice addresses

      // === Kanz (HR & Payroll) ===
      "hr.group_hr_user", // HR employee data access
      "hr_payroll.group_hr_payroll_user", // Payroll user access
      "hr_attendance.group_hr_attendance_user", // Attendance tracking
      "hr_expense.group_hr_expense_user", // Expense management
      "hr_holidays.group_hr_holidays_user", // Leave/time-off management

      // === Additional Business Features ===
      "project.group_project_user", // Project management
      "purchase.group_purchase_user", // Purchase orders and vendor management
      "stock.group_stock_user", // Inventory and warehouse management
      "fleet.group_fleet_user", // Fleet/vehicle management (if applicable)
    ];

    // Additional role-specific groups for elevated permissions
    const roleGroups: Record<string, string[]> = {
      admin: [
        // Full administrative access
        "base.group_system", // Settings and system configuration
        "account.group_account_manager", // Full accounting admin
        "sales_team.group_sale_manager", // Full CRM/Sales admin
        "hr.group_hr_manager", // Full HR admin
        "hr_payroll.group_hr_payroll_manager", // Full payroll admin
        "project.group_project_manager", // Project management admin
        "purchase.group_purchase_manager", // Purchase management admin
        "stock.group_stock_manager", // Inventory management admin
      ],
      accountant: [
        "account.group_account_manager", // Full accounting access
        "account.group_account_user", // All accounting features
        "analytic.group_analytic_accounting", // Analytic accounting
      ],
      manager: [
        "sales_team.group_sale_manager", // CRM/Sales manager
        "hr.group_hr_manager", // HR manager
        "hr_payroll.group_hr_payroll_manager", // Payroll manager
        "project.group_project_manager", // Project manager
      ],
      salesperson: [
        // Inherits base groups (full sales access from baseGroups)
      ],
      user: [
        // Inherits base groups (comprehensive access to all modules)
      ],
    };

    const roleKey = safeeRole ?? "user";
    const additionalGroups = roleGroups[roleKey] ?? roleGroups.user;
    return [...baseGroups, ...additionalGroups];
  }

  private async createOdooUser(
    databaseName: string,
    adminLogin: string,
    adminPassword: string,
    userEmail: string,
    userName: string,
    safeeRole?: string,
  ): Promise<number> {
    const { sessionId, cookies } = await this.authenticate(databaseName, adminLogin, adminPassword);

    const adminCredentials = { databaseName, adminLogin, adminPassword };

    const existingUsers = await this.callOdooExecuteKw<{ id: number }[]>(
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

      try {
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
      } catch (err) {
        // Handle race condition: if user was created by another concurrent request
        if (err instanceof Error && err.message.includes("duplicate key value violates unique constraint")) {
          this.logger.warn(
            { userEmail },
            "User creation race condition detected, re-checking for existing user",
          );

          const recheckUsers = await this.callOdooExecuteKw<{ id: number }[]>(
            sessionId,
            cookies,
            "res.users",
            "search_read",
            [[["login", "=", userEmail]]],
            { fields: ["id"], limit: 1 },
            adminCredentials,
          );

          if (recheckUsers.length > 0) {
            userId = recheckUsers[0].id;
            this.logger.info({ userId, userEmail }, "Found user created by concurrent request");
          } else {
            throw err;
          }
        } else {
          throw err;
        }
      }
    }

    const groupXmlIds = this.getDefaultGroupsForUser(safeeRole);

    const groupIds = await this.getGroupIds(sessionId, cookies, groupXmlIds, adminCredentials);

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

  private async generateApiKey(
    databaseName: string,
    adminLogin: string,
    adminPassword: string,
    targetUserLogin: string,
    keyName: string,
  ): Promise<string> {
    this.logger.info({ targetUserLogin, keyName }, "Generating API key for Odoo user via HTTP endpoint");

    try {
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

      if (result.error) {
        throw new BadGateway(`Odoo error: ${result.error.message ?? JSON.stringify(result.error)}`);
      }

      const data = result.result;

      if (!data.ok) {
        throw new BadGateway(`Failed to generate API key: ${data.error ?? "Unknown error"}`);
      }

      if (!data.token) {
        throw new BadGateway("API key token not returned from endpoint");
      }

      this.logger.info(
        { targetUserLogin, keyName, apiKeyId: data.id },
        "API key generated successfully via HTTP endpoint",
      );

      return data.token;
    } catch (err) {
      this.logger.error(
        { targetUserLogin, keyName, error: err },
        "Failed to generate API key via HTTP endpoint",
      );
      throw new BadGateway(
        `Failed to generate API key: ${err instanceof Error ? err.message : "Unknown error"}`,
      );
    }
  }

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

    const existingOdooUser = await this.drizzle.query.odooUsers.findFirst({
      where: and(eq(schema.odooUsers.userId, userId)),
    });

    if (existingOdooUser) {
      this.logger.info({ userId }, "Odoo user already exists");

      if (!existingOdooUser.apiKey) {
        this.logger.info({ userId }, "Existing user has no API key, attempting to generate one");

        try {
          const { databaseName, adminLogin, adminPassword } = await this.getAdminCredentials(organizationId);

          const keyName = `safee-${existingOdooUser.odooLogin}-${Date.now()}`;
          const apiKey = await this.generateApiKey(
            databaseName,
            adminLogin,
            adminPassword,
            existingOdooUser.odooLogin,
            keyName,
          );

          await this.drizzle
            .update(schema.odooUsers)
            .set({
              apiKey: encryptionService.encrypt(apiKey),
              lastSyncedAt: new Date(),
            })
            .where(eq(schema.odooUsers.id, existingOdooUser.id));

          this.logger.info({ userId, keyName }, "✅ API key generated and stored for existing user");

          return {
            odooUid: existingOdooUser.odooUid,
            odooLogin: existingOdooUser.odooLogin,
            odooPassword: apiKey,
          };
        } catch (err) {
          this.logger.warn(
            { userId, error: err instanceof Error ? err.message : "Unknown error" },
            "⚠️  Failed to generate API key for existing user, will use password",
          );
        }
      }

      const authCredential = existingOdooUser.apiKey
        ? encryptionService.decrypt(existingOdooUser.apiKey)
        : encryptionService.decrypt(existingOdooUser.password);

      return {
        odooUid: existingOdooUser.odooUid,
        odooLogin: existingOdooUser.odooLogin,
        odooPassword: authCredential,
      };
    }

    const { databaseName, adminLogin, adminPassword } = await this.getAdminCredentials(organizationId);

    const role = safeeRole ?? user.role ?? "user";

    this.logger.info({ userId, role }, "Provisioning Odoo user with role");

    const userName = user.name ?? user.email;

    const odooUid = await this.createOdooUser(
      databaseName,
      adminLogin,
      adminPassword,
      user.email,
      userName,
      role,
    );

    const password = this.generateSecurePassword();

    try {
      await this.setOdooUserPassword(databaseName, adminLogin, adminPassword, odooUid, password);
      this.logger.info({ userId, odooUid }, "Password set successfully");
    } catch (err) {
      this.logger.error(
        { userId, odooUid, error: err instanceof Error ? err.message : "Unknown error" },
        "Failed to set Odoo password",
      );
      throw err;
    }

    let apiKey: string | null = null;
    let authCredential = password; // Default to password

    try {
      const keyName = `safee-${userName}-${Date.now()}`;
      apiKey = await this.generateApiKey(databaseName, adminLogin, adminPassword, user.email, keyName);
      authCredential = apiKey; // Prefer API key
      this.logger.info({ userId, odooUid, keyName }, "✅ API key generated successfully (preferred)");
    } catch (err) {
      this.logger.warn(
        { userId, odooUid, error: err instanceof Error ? err.message : "Unknown error" },
        "⚠️  Failed to generate API key, will use password authentication",
      );
    }

    const odooDb = await this.drizzle.query.odooDatabases.findFirst({
      where: eq(schema.odooDatabases.organizationId, organizationId),
    });

    if (!odooDb) {
      throw new NotFound("Odoo database not found");
    }

    await this.drizzle.insert(schema.odooUsers).values({
      userId,
      odooDatabaseId: odooDb.id,
      odooUid,
      odooLogin: user.email,
      apiKey: apiKey ? encryptionService.encrypt(apiKey) : null,
      password: encryptionService.encrypt(password),
      lastSyncedAt: new Date(),
    });

    this.logger.info(
      {
        userId,
        odooUid,
        databaseName,
        hasApiKey: !!apiKey,
      },
      "✅ Odoo user provisioned successfully",
    );

    return {
      odooUid,
      odooLogin: user.email,
      odooPassword: authCredential,
    };
  }

  async getUserCredentials(userId: string, organizationId: string): Promise<OdooUserCredentials | null> {
    const odooDb = await this.drizzle.query.odooDatabases.findFirst({
      where: eq(schema.odooDatabases.organizationId, organizationId),
    });

    if (!odooDb) {
      return null;
    }

    const odooUser = await this.drizzle.query.odooUsers.findFirst({
      where: and(eq(schema.odooUsers.userId, userId), eq(schema.odooUsers.odooDatabaseId, odooDb.id)),
    });

    if (!odooUser) {
      return null;
    }

    if (!odooUser.apiKey) {
      this.logger.info(
        { userId },
        "User credentials requested but no API key exists, attempting to generate one",
      );

      try {
        const { databaseName, adminLogin, adminPassword } = await this.getAdminCredentials(organizationId);

        const keyName = `safee-${odooUser.odooLogin}-${Date.now()}`;
        const apiKey = await this.generateApiKey(
          databaseName,
          adminLogin,
          adminPassword,
          odooUser.odooLogin,
          keyName,
        );

        await this.drizzle
          .update(schema.odooUsers)
          .set({
            apiKey: encryptionService.encrypt(apiKey),
            lastSyncedAt: new Date(),
          })
          .where(eq(schema.odooUsers.id, odooUser.id));

        this.logger.info({ userId, keyName }, "✅ API key generated and stored for user");

        return {
          databaseName: odooDb.databaseName,
          odooUid: odooUser.odooUid,
          odooPassword: apiKey,
        };
      } catch (err) {
        this.logger.warn(
          { userId, error: err instanceof Error ? err.message : "Unknown error" },
          "⚠️  Failed to generate API key, will use password",
        );
      }
    }

    const authCredential = odooUser.apiKey
      ? encryptionService.decrypt(odooUser.apiKey)
      : encryptionService.decrypt(odooUser.password);

    return {
      databaseName: odooDb.databaseName,
      odooUid: odooUser.odooUid,
      odooPassword: authCredential,
    };
  }

  async getOdooWebPassword(
    userId: string,
    organizationId: string,
  ): Promise<{
    login: string;
    password: string;
    webUrl: string;
  } | null> {
    const odooDb = await this.drizzle.query.odooDatabases.findFirst({
      where: eq(schema.odooDatabases.organizationId, organizationId),
    });

    if (!odooDb) {
      return null;
    }

    const odooUser = await this.drizzle.query.odooUsers.findFirst({
      where: and(eq(schema.odooUsers.userId, userId), eq(schema.odooUsers.odooDatabaseId, odooDb.id)),
    });

    if (!odooUser) {
      return null;
    }

    return {
      login: odooUser.odooLogin,
      password: encryptionService.decrypt(odooUser.password),
      webUrl: `${env.ODOO_URL}/web/login?db=${odooDb.databaseName}`,
    };
  }

  async getOdooWebUrl(userId: string, organizationId: string): Promise<string> {
    const credentials = await this.getUserCredentials(userId, organizationId);

    if (!credentials) {
      throw new NotFound("Odoo user not found");
    }

    return `${env.ODOO_URL}/web/login?db=${credentials.databaseName}`;
  }

  async deactivateUser(userId: string, organizationId: string): Promise<void> {
    const { databaseName, adminLogin, adminPassword } = await this.getAdminCredentials(organizationId);

    const odooUser = await this.drizzle.query.odooUsers.findFirst({
      where: eq(schema.odooUsers.userId, userId),
    });

    if (!odooUser) {
      return;
    }

    const { sessionId, cookies } = await this.authenticate(databaseName, adminLogin, adminPassword);

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

    await this.drizzle
      .update(schema.odooUsers)
      .set({ isActive: false, updatedAt: new Date() })
      .where(eq(schema.odooUsers.id, odooUser.id));

    this.logger.info({ userId, odooUid: odooUser.odooUid }, "Odoo user deactivated");
  }
}
