import type { DrizzleClient } from "@safee/database";
import { schema, eq, and } from "@safee/database";
import crypto from "node:crypto";
import { z } from "zod";
import type { EncryptionService } from "../encryption.js";
import { NotFound, OperationFailed } from "./errors.js";
import type { Logger } from "pino";
import { odooAuthResponseSchema, odooApiKeyResultSchema } from "./schemas.js";

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

export interface OdooUserProvisioningServiceDependencies {
  drizzle: DrizzleClient;
  logger: Logger;
  encryptionService: EncryptionService;
  odooUrl: string;
}

function odooApiResponseSchema<T extends z.ZodType>(resultSchema: T) {
  return z.object({
    error: z
      .union([
        z.object({
          code: z.number().optional(),
          message: z.string().optional(),
          data: z.unknown().optional(),
        }),
        z.string(),
      ])
      .optional(),
    result: resultSchema.optional(),
  });
}

export class OdooUserProvisioningService {
  private readonly drizzle: DrizzleClient;
  private readonly logger: Logger;
  private readonly encryptionService: EncryptionService;
  private readonly odooUrl: string;

  constructor(deps: OdooUserProvisioningServiceDependencies) {
    this.drizzle = deps.drizzle;
    this.logger = deps.logger;
    this.encryptionService = deps.encryptionService;
    this.odooUrl = deps.odooUrl;
  }

  private async authenticate(
    databaseName: string,
    login: string,
    password: string,
  ): Promise<{ uid: number; sessionId: string; cookies: string[] }> {
    const response = await fetch(`${this.odooUrl}/web/session/authenticate`, {
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
      throw new OperationFailed(`Odoo authentication failed: ${response.status}`);
    }

    const rawData: unknown = await response.json();
    const parseResult = odooAuthResponseSchema.safeParse(rawData);

    if (!parseResult.success) {
      throw new OperationFailed(`Invalid Odoo authentication response: ${parseResult.error.message}`);
    }

    const data = parseResult.data;

    if (data.error) {
      throw new OperationFailed(`Odoo authentication error: ${JSON.stringify(data.error)}`);
    }

    if (!data.result?.uid) {
      throw new OperationFailed("Failed to authenticate with Odoo");
    }

    const getSetCookie = response.headers.getSetCookie.bind(response.headers);
    const setCookieHeaders = getSetCookie();
    const cookies = setCookieHeaders.map((cookie) => cookie.split(";")[0] ?? cookie);

    this.logger.debug({ cookieCount: cookies.length }, "Captured cookies from Odoo user provisioning auth");

    return { uid: data.result.uid, sessionId: data.result.session_id, cookies };
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

  private async callOdooExecuteKw<T>(
    sessionId: string,
    cookies: string[],
    model: string,
    method: string,
    args: unknown[],
    kwargs: Record<string, unknown> = {},
    resultSchema: z.ZodType<T> = z.unknown() as z.ZodType<T>,
    adminCredentials?: { databaseName: string; adminLogin: string; adminPassword: string },
    retryCount = 0,
  ): Promise<T> {
    try {
      const cookieHeader = cookies.length > 0 ? cookies.join("; ") : `session_id=${sessionId}`;

      const response = await fetch(`${this.odooUrl}/web/dataset/call_kw`, {
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
        throw new OperationFailed(`Odoo ${method} failed: ${response.status}`);
      }

      const rawData: unknown = await response.json();
      const responseSchema = odooApiResponseSchema(resultSchema);
      const parseResult = responseSchema.safeParse(rawData);

      if (!parseResult.success) {
        throw new OperationFailed(`Invalid Odoo ${method} response: ${parseResult.error.message}`);
      }

      const data = parseResult.data;

      if (data.error) {
        throw new OperationFailed(`Odoo ${method} error: ${JSON.stringify(data.error)}`);
      }

      if (data.result === undefined) {
        throw new OperationFailed(`Odoo ${method} returned no result`);
      }

      return data.result;
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
          resultSchema,
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
      adminPassword: this.encryptionService.decrypt(odooDb.adminPassword),
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

    const groupResultSchema = z.array(
      z.object({
        res_id: z.number(),
      }),
    );

    for (const xmlId of groupXmlIds) {
      try {
        const [module, name] = xmlId.split(".");
        const result = await this.callOdooExecuteKw(
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
          groupResultSchema,
          adminCredentials,
        );

        // result is always defined, check if it has elements
        if (result.length > 0 && result[0]) {
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

    const userResultSchema = z.array(
      z.object({
        id: z.number(),
      }),
    );

    const existingUsers = await this.callOdooExecuteKw(
      sessionId,
      cookies,
      "res.users",
      "search_read",
      [[["login", "=", userEmail]]],
      { fields: ["id"], limit: 1 },
      userResultSchema,
      adminCredentials,
    );

    let userId: number;

    if (existingUsers.length > 0 && existingUsers[0]) {
      userId = existingUsers[0].id;
      this.logger.info({ userId, userEmail }, "User already exists in Odoo, will update groups");
    } else {
      this.logger.info({ userEmail }, "User does not exist in Odoo, creating new user");

      try {
        userId = await this.callOdooExecuteKw(
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
          z.number(),
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

          const recheckUsers = await this.callOdooExecuteKw(
            sessionId,
            cookies,
            "res.users",
            "search_read",
            [[["login", "=", userEmail]]],
            { fields: ["id"], limit: 1 },
            userResultSchema,
            adminCredentials,
          );

          if (recheckUsers.length > 0 && recheckUsers[0]) {
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

      await this.callOdooExecuteKw(
        sessionId,
        cookies,
        "res.users",
        "write",
        [[userId], { group_ids: [[6, 0, groupIds]] }],
        {},
        z.boolean(),
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
    await this.callOdooExecuteKw(
      sessionId,
      cookies,
      "res.users",
      "write",
      [[userId], { password: newPassword }],
      {},
      z.boolean(),
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
      const response = await fetch(`${this.odooUrl}/api/generate_key`, {
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
        throw new OperationFailed(`HTTP ${response.status}: ${response.statusText}`);
      }

      const rawData: unknown = await response.json();
      const responseSchema = odooApiResponseSchema(odooApiKeyResultSchema);
      const parseResult = responseSchema.safeParse(rawData);

      if (!parseResult.success) {
        throw new OperationFailed(`Invalid Odoo API key response: ${parseResult.error.message}`);
      }

      const result = parseResult.data;

      if (result.error) {
        const errorMessage =
          typeof result.error === "object" && "message" in result.error
            ? String(result.error.message)
            : JSON.stringify(result.error);
        throw new OperationFailed(`Odoo error: ${errorMessage}`);
      }

      if (!result.result) {
        throw new OperationFailed("API key generation returned no result");
      }

      const data = result.result;

      if (!data.ok) {
        throw new OperationFailed(`Failed to generate API key: ${data.error ?? "Unknown error"}`);
      }

      if (!data.token) {
        throw new OperationFailed("API key token not returned from endpoint");
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
      throw new OperationFailed(
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
              apiKey: this.encryptionService.encrypt(apiKey),
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
        ? this.encryptionService.decrypt(existingOdooUser.apiKey)
        : this.encryptionService.decrypt(existingOdooUser.password);

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

    let odooUid: number | null = null;
    let odooUserCreated = false;

    try {
      odooUid = await this.createOdooUser(
        databaseName,
        adminLogin,
        adminPassword,
        user.email,
        userName,
        role,
      );
      odooUserCreated = true;

      const password = this.generateSecurePassword();

      await this.setOdooUserPassword(databaseName, adminLogin, adminPassword, odooUid, password);
      this.logger.info({ userId, odooUid }, "Password set successfully");

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

      // Only insert database record if everything succeeded
      await this.drizzle.insert(schema.odooUsers).values({
        userId,
        odooDatabaseId: odooDb.id,
        odooUid,
        odooLogin: user.email,
        apiKey: apiKey ? this.encryptionService.encrypt(apiKey) : null,
        password: this.encryptionService.encrypt(password),
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
    } catch (err) {
      this.logger.error(
        { userId, odooUid, error: err, odooUserCreated },
        "❌ Failed to provision Odoo user, rolling back",
      );

      // Rollback: Deactivate the Odoo user if it was created
      if (odooUserCreated && odooUid) {
        try {
          this.logger.info({ userId, odooUid }, "Rolling back: Deactivating Odoo user");

          const { sessionId, cookies } = await this.authenticate(databaseName, adminLogin, adminPassword);
          const adminCredentials = { databaseName, adminLogin, adminPassword };

          await this.callOdooExecuteKw(
            sessionId,
            cookies,
            "res.users",
            "write",
            [[odooUid], { active: false }],
            {},
            z.boolean(),
            adminCredentials,
          );

          this.logger.info({ userId, odooUid }, "Rollback successful: Odoo user deactivated");
        } catch (rollbackErr) {
          this.logger.error(
            { userId, odooUid, error: rollbackErr },
            "❌ Rollback failed: Could not deactivate Odoo user",
          );
        }
      }

      throw err;
    }
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
            apiKey: this.encryptionService.encrypt(apiKey),
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
      ? this.encryptionService.decrypt(odooUser.apiKey)
      : this.encryptionService.decrypt(odooUser.password);

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
      password: this.encryptionService.decrypt(odooUser.password),
      webUrl: `${this.odooUrl}/web/login?db=${odooDb.databaseName}`,
    };
  }

  async getOdooWebUrl(userId: string, organizationId: string): Promise<string> {
    const credentials = await this.getUserCredentials(userId, organizationId);

    if (!credentials) {
      throw new NotFound("Odoo user not found");
    }

    return `${this.odooUrl}/web/login?db=${credentials.databaseName}`;
  }

  async deactivateUser(userId: string, organizationId: string): Promise<void> {
    const { databaseName, adminLogin, adminPassword } = await this.getAdminCredentials(organizationId);

    const odooUser = await this.drizzle.query.odooUsers.findFirst({
      where: eq(schema.odooUsers.userId, userId),
    });

    if (!odooUser) {
      this.logger.warn({ userId }, "No Odoo user found to deactivate");
      return;
    }

    if (!odooUser.isActive) {
      this.logger.info({ userId }, "Odoo user already inactive");
      return;
    }

    let odooDeactivated = false;

    try {
      const { sessionId, cookies } = await this.authenticate(databaseName, adminLogin, adminPassword);

      const adminCredentials = { databaseName, adminLogin, adminPassword };
      await this.callOdooExecuteKw(
        sessionId,
        cookies,
        "res.users",
        "write",
        [[odooUser.odooUid], { active: false }],
        {},
        z.boolean(),
        adminCredentials,
      );

      odooDeactivated = true;

      // Only update database record after Odoo deactivation succeeds
      await this.drizzle
        .update(schema.odooUsers)
        .set({ isActive: false, updatedAt: new Date() })
        .where(eq(schema.odooUsers.id, odooUser.id));

      this.logger.info({ userId, odooUid: odooUser.odooUid }, "✅ Odoo user deactivated successfully");
    } catch (err) {
      this.logger.error(
        { userId, odooUid: odooUser.odooUid, error: err, odooDeactivated },
        "❌ Failed to deactivate Odoo user",
      );

      // Rollback: Reactivate Odoo user if DB update failed
      if (odooDeactivated) {
        try {
          this.logger.info({ userId, odooUid: odooUser.odooUid }, "Rolling back: Reactivating Odoo user");

          const { sessionId, cookies } = await this.authenticate(databaseName, adminLogin, adminPassword);
          const adminCredentials = { databaseName, adminLogin, adminPassword };

          await this.callOdooExecuteKw(
            sessionId,
            cookies,
            "res.users",
            "write",
            [[odooUser.odooUid], { active: true }],
            {},
            z.boolean(),
            adminCredentials,
          );

          this.logger.info(
            { userId, odooUid: odooUser.odooUid },
            "Rollback successful: Odoo user reactivated",
          );
        } catch (rollbackErr) {
          this.logger.error(
            { userId, odooUid: odooUser.odooUid, error: rollbackErr },
            "❌ Rollback failed: Could not reactivate Odoo user - manual cleanup required",
          );
        }
      }

      throw err;
    }
  }
}
