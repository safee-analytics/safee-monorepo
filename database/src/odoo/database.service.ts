import { schema, eq, type DrizzleClient } from "../drizzle.js";
import type { RedisClient } from "../index.js";
import crypto from "node:crypto";
import { type OdooClient, OdooLanguage, OdooDemo } from "./client.js";
import { type OdooConnectionConfig } from "./client.service.js";
import { type EncryptionService } from "../encryption.js";
import { OrganizationNotFound, OdooDatabaseAlreadyExists, OdooDatabaseNotFound } from "../errors.js";
import { OdooModuleService } from "./module.service.js";
import type { Logger } from "pino";

export interface OdooProvisionResult {
  databaseName: string;
  adminLogin: string;
  adminPassword: string;
  odooUrl: string;
}

export interface OdooConfig {
  url: string;
  port?: number;
  adminPassword: string;
}

export interface OdooDatabaseServiceDependencies {
  logger: Logger;
  drizzle: DrizzleClient;
  redis: RedisClient;
  odooClient: OdooClient;
  encryptionService: EncryptionService;
  odooConfig: OdooConfig;
}

export class OdooDatabaseService {
  private odooModuleService: OdooModuleService;
  private readonly deps: OdooDatabaseServiceDependencies;

  constructor(deps: OdooDatabaseServiceDependencies) {
    this.deps = deps;
    this.odooModuleService = new OdooModuleService({
      logger: deps.logger,
      drizzle: deps.drizzle,
    });
  }

  private get logger() {
    return this.deps.logger;
  }

  private get drizzle() {
    return this.deps.drizzle;
  }

  private get odooClient() {
    return this.deps.odooClient;
  }

  private get encryptionService() {
    return this.deps.encryptionService;
  }

  private get odooConfig() {
    return this.deps.odooConfig;
  }

  private generateSecurePassword(): string {
    return crypto.randomBytes(32).toString("base64url");
  }

  private async retryWithBackoff<T>(
    fn: () => Promise<T>,
    maxRetries = 5,
    initialDelay = 1000,
    context = "operation",
  ): Promise<T> {
    let lastError: Error | undefined;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        return await fn();
      } catch (err) {
        lastError = err as Error;

        if (attempt === maxRetries) {
          break;
        }

        const delay = initialDelay * Math.pow(2, attempt - 1);
        this.logger.warn(
          { attempt, maxRetries, delay, error: lastError.message },
          `${context} failed, retrying...`,
        );

        await new Promise((resolve) => setTimeout(resolve, delay));
      }
    }

    throw new Error(lastError?.message ?? `${context} failed after ${maxRetries} retries`);
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
   * - api_key_service: Custom API key generator (Safee)
   */
  async installRequiredModules(
    databaseName: string,
    adminLogin: string,
    adminPassword: string,
    organizationId?: string,
  ): Promise<void> {
    this.logger.info(
      { databaseName, organizationId },
      "Installing required Odoo modules with resilient client",
    );

    const config: OdooConnectionConfig = {
      url: this.odooConfig.url,
      port: this.odooConfig.port ?? 8069,
      database: databaseName,
      username: adminLogin,
      password: adminPassword,
    };

    const modulesToInstall = [
      // Core
      "base",
      "web",

      // Accounting
      "account",

      // CRM & Sales
      "crm",
      "sale",
      "sale_crm", // Opportunity to Quotation

      // HR - Core
      "hr",
      "hr_holidays",
      "hr_attendance",
      "hr_expense",
      "hr_recruitment",
      "hr_timesheet",
      "hr_presence",

      // HR - Extended
      "hr_recruitment_skills",
      "hr_work_entry",
      "hr_hourly_cost",

      // Project Management
      "project",
      "project_timesheet_holidays",

      // Automation & Workflows
      "base_automation",

      // Communication
      "mail_group",

      // Rating/Feedback
      "rating",

      // Address & Validation
      "base_address_extended",
      "base_vat",
      "google_address_autocomplete",

      // Portal
      "portal",
      // "website", // Disabled: has broken dependencies (website_blog) in current Odoo version

      // ========================================
      // Custom Modules from /custom_addons
      // ========================================

      // Safee Custom Modules
      "api_key_service",
      "safee_webhooks",

      // Server Tools
      "auditlog",
      "auto_backup",
      "base_name_search_improved",
      "base_technical_user",
      "database_cleanup",
      "module_auto_update",
      "scheduler_error_mailer",

      // Queue/Background Jobs
      "queue_job",
      "queue_job_cron",

      // Document Management
      "dms",
      "dms_auto_classification",
      "dms_field",

      // Reporting
      "report_xlsx",
      "report_csv",
      "report_qr",
      "report_xml",
      "report_py3o",
      "report_qweb_parameter",
      "report_qweb_encrypt",
      "report_qweb_pdf_watermark",
      "bi_sql_editor",
      "sql_export",
      "sql_export_excel",

      // Mail/Communication
      "mail_tracking",
      "mail_tracking_mass_mailing",
      "mail_debrand",
      "mail_optional_autofollow",
      "mail_activity_board",

      // Partner/Contact
      "partner_firstname",
      "partner_second_lastname",
      "partner_statement",
      "partner_multi_relation",
      "partner_identification",
      "partner_company_group",
      "partner_external_map",

      // Contract
      "contract",
      "contract_sale",
      "contract_payment_mode",
      "contract_variable_quantity",

      // Account - OCA Extensions
      "account_asset_management",
      "account_asset_number",
      "account_financial_report",
      "account_fiscal_year",
      "account_fiscal_year_auto_create",
      "account_global_discount",
      "account_invoice_refund_link",
      "account_invoice_section_sale_order",
      "account_invoice_supplier_ref_unique",
      "account_invoice_triple_discount",
      "account_move_line_purchase_info",
      "account_move_line_sale_info",
      "account_move_template",
      "account_netting",
      "account_spread_cost_revenue",
      "account_tax_balance",

      // Analytics
      "analytic_base_department",

      // Sale - OCA Extensions
      "sale_automatic_workflow",
      "sale_exception",
      "sale_global_discount",
      "sale_order_invoicing_grouping_criteria",
      "sale_order_type",
      "sale_product_set",
      "sale_quotation_number",
      "sale_stock_picking_invoicing",
      "sale_tier_validation",

      // Project - OCA Extensions
      "project_department",
      "project_hr",
      "project_key",
      "project_task_code",
      "project_task_parent_completion_blocking",
      "project_template",
      "project_timeline",

      // HR - OCA Extensions
      "hr_contract_reference",
      "hr_course",
      "hr_department_code",
      "hr_employee_age",
      "hr_employee_calendar_planning",
      "hr_employee_firstname",
      "hr_employee_id",
      "hr_employee_medical_examination",
      "hr_employee_relative",
      "hr_employee_service",
      "hr_expense_analytic_tag",
      "hr_timesheet_analytic_tag",
      "hr_timesheet_sheet",

      // Helpdesk
      "helpdesk_mgmt",
      "helpdesk_mgmt_rating",
      "helpdesk_mgmt_sla",
      "helpdesk_mgmt_timesheet",

      // MIS Builder (Financial Reports)
      "mis_builder",

      // Web UI Improvements
      "web_responsive",
      "web_m2x_options",
      "web_notify",
      "web_timeline",
      "web_environment_ribbon",
      "web_dialog_size",

      // API/Integration - REST Framework
      "component", // Required for base_rest
      "component_event",
      "extendable", // Required for component
      "pydantic", // Pydantic utility addon
      "base_rest", // REST API framework
      "base_rest_pydantic", // Pydantic integration for REST
      "base_rest_auth_api_key", // API key auth for REST
      "rest_log", // REST API call logging
      "endpoint_route_handler", // Route handling
      "fastapi", // FastAPI integration
      "fastapi_auth_api_key", // API key auth for FastAPI

      // Security & Auth
      "auth_api_key",
      "password_security",
      "base_user_show_email",

      // Debranding
      "disable_odoo_online",
      "portal_odoo_debranding",
    ];

    await this.odooModuleService.installModules({
      config,
      modules: modulesToInstall,
      organizationId,
    });

    this.logger.info(
      { databaseName, moduleCount: modulesToInstall.length, organizationId },
      "✅ All required modules installed with resilient client",
    );
  }

  async provisionDatabase(
    organizationId: string,
    options?: {
      lang?: OdooLanguage;
      demo?: OdooDemo;
      countryCode?: string;
      phone?: string;
      timeoutMs?: number;
    },
  ): Promise<OdooProvisionResult> {
    this.logger.info(
      { organizationId, orgIdType: typeof organizationId },
      "Starting Odoo database provisioning (fast creation + background module install)",
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

    const exists = await this.odooClient.databaseExists(databaseName);
    if (exists) {
      this.logger.error({ databaseName }, "Odoo database name already in use");
      throw new OdooDatabaseAlreadyExists(organizationId);
    }

    const adminLogin = `admin_${org.slug}`;
    const adminPassword = this.generateSecurePassword();

    this.logger.info(
      { databaseName, adminLogin, companyName: org.name },
      "Creating fresh Odoo database (fast - 2-3 minutes)",
    );

    // Create placeholder record with 'provisioning' status
    await this.drizzle.insert(schema.odooDatabases).values({
      organizationId,
      databaseName,
      adminLogin,
      adminPassword: this.encryptionService.encrypt(adminPassword),
      odooUrl: this.odooConfig.url,
      provisioningStatus: "provisioning",
      provisioningStartedAt: new Date(),
    });

    let dbCreated = false;

    try {
      // Create fresh database with base modules only (Odoo installs base modules automatically)
      await this.odooClient.createDatabase({
        masterPassword: this.odooConfig.adminPassword,
        name: databaseName,
        adminLogin,
        adminPassword,
        lang: options?.lang ?? (org.defaultLocale === "ar" ? OdooLanguage.Arabic : OdooLanguage.English),
        demo: options?.demo ?? OdooDemo.Disabled,
        countryCode: options?.countryCode ?? "SA",
        phone: options?.phone ?? "",
        timeoutMs: options?.timeoutMs,
      });

      dbCreated = true;

      this.logger.info(
        { databaseName, organizationId },
        "Database created successfully, waiting for initialization to complete...",
      );

      // Wait longer for database to be fully initialized with base modules
      // Odoo automatically installs: base, web, and basic country-specific modules
      await new Promise((resolve) => setTimeout(resolve, 10000));

      // Verify authentication works with new credentials
      const auth = await this.retryWithBackoff(
        () => this.odooClient.authenticate(databaseName, adminLogin, adminPassword),
        10,
        3000,
        "Database authentication after creation",
      );

      this.logger.info(
        { databaseName, uid: auth.uid },
        "Authentication successful, updating company information",
      );

      // Update company name using external API (execute_kw endpoint)
      await this.retryWithBackoff(
        () =>
          this.odooClient.writeExternal(databaseName, auth.uid, adminPassword, "res.company", [1], {
            name: org.name,
          }),
        5,
        2000,
        "Update company name",
      );

      // Update partner (company) name using external API
      await this.retryWithBackoff(
        () =>
          this.odooClient.writeExternal(databaseName, auth.uid, adminPassword, "res.partner", [1], {
            name: org.name,
          }),
        5,
        2000,
        "Update partner name",
      );

      this.logger.info(
        { databaseName, companyName: org.name },
        "✅ Company information updated successfully",
      );

      // Update status to 'active'
      await this.drizzle
        .update(schema.odooDatabases)
        .set({
          provisioningStatus: "active",
          provisioningCompletedAt: new Date(),
          provisioningError: null,
        })
        .where(eq(schema.odooDatabases.organizationId, organizationId));

      this.logger.info(
        { organizationId, databaseName, provisioningTime: "~2 minutes (database created with base modules)" },
        "✅ Odoo database created successfully - all modules will install in background job",
      );

      // Note: ALL modules (essential + extended) will be installed via background job
      // queued in the controller after this method returns

      return {
        databaseName,
        adminLogin,
        adminPassword,
        odooUrl: this.odooConfig.url,
      };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : String(err);

      this.logger.error(
        { organizationId, databaseName, error: err, dbCreated },
        "❌ Failed to provision Odoo database, rolling back",
      );

      // Update status to 'failed' with error message
      await this.drizzle
        .update(schema.odooDatabases)
        .set({
          provisioningStatus: "failed",
          provisioningError: errorMessage,
        })
        .where(eq(schema.odooDatabases.organizationId, organizationId));

      // Rollback: Delete the Odoo database if it was created
      if (dbCreated) {
        try {
          this.logger.info({ databaseName }, "Rolling back: Deleting Odoo database");
          await this.odooClient.dropDatabase(this.odooConfig.adminPassword, databaseName);
          this.logger.info({ databaseName }, "Rollback successful: Odoo database deleted");
        } catch (rollbackErr) {
          this.logger.error(
            { databaseName, error: rollbackErr },
            "❌ Rollback failed: Could not delete Odoo database",
          );
        }
      }

      throw err;
    }
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
    const exists = await this.odooClient.databaseExists(databaseName);

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

    // Get the database record before deletion (for potential rollback)
    const dbRecord = await this.drizzle.query.odooDatabases.findFirst({
      where: eq(schema.odooDatabases.organizationId, organizationId),
    });

    if (!dbRecord) {
      this.logger.warn({ organizationId }, "No Odoo database record found, nothing to delete");
      return;
    }

    let odooDbDeleted = false;

    try {
      // Delete Odoo database first
      await this.odooClient.dropDatabase(this.odooConfig.adminPassword, databaseName);
      odooDbDeleted = true;

      // Only delete database record after Odoo database is deleted
      await this.drizzle
        .delete(schema.odooDatabases)
        .where(eq(schema.odooDatabases.organizationId, organizationId));

      this.logger.info({ organizationId, databaseName }, "✅ Odoo database deleted successfully");
    } catch (err) {
      this.logger.error(
        { organizationId, databaseName, error: err, odooDbDeleted },
        "❌ Failed to delete Odoo database",
      );

      // Note: We cannot easily rollback Odoo database deletion (would need to restore from backup)
      // If Odoo deletion succeeded but DB record deletion failed, log it clearly
      if (odooDbDeleted) {
        this.logger.error(
          { organizationId, databaseName },
          "⚠️  CRITICAL: Odoo database was deleted but DB record deletion failed - manual cleanup required",
        );
      }

      throw err;
    }
  }

  async listAllDatabases(): Promise<string[]> {
    return this.odooClient.listDatabases();
  }

  async getAuthUrl(organizationId: string): Promise<string> {
    const info = await this.getDatabaseInfo(organizationId);

    if (!info.exists) {
      throw new OdooDatabaseNotFound(organizationId);
    }

    return `${this.odooConfig.url}/web/login?db=${info.databaseName}`;
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

    const adminPassword = this.encryptionService.decrypt(dbRecord.adminPassword);

    return {
      databaseName: dbRecord.databaseName,
      adminLogin: dbRecord.adminLogin,
      adminPassword,
      odooUrl: dbRecord.odooUrl,
    };
  }

  /**
   * Install essential modules during sync provisioning (5-7 minutes)
   * Includes: Core business, Custom Safee modules, REST API framework, Auth
   */
  private async installEssentialModules(
    databaseName: string,
    adminLogin: string,
    adminPassword: string,
    organizationId: string,
  ): Promise<void> {
    this.logger.info(
      { databaseName, organizationId },
      "Installing essential modules (core + safee + API framework)",
    );

    const config: OdooConnectionConfig = {
      url: this.odooConfig.url,
      port: this.odooConfig.port ?? 8069,
      database: databaseName,
      username: adminLogin,
      password: adminPassword,
    };

    const essentialModules = [
      // Core business modules
      "account",
      "crm",
      "sale",
      "sale_crm",

      // HR Core
      "hr",
      "hr_holidays",
      "hr_attendance",
      "hr_expense",
      "hr_recruitment",
      "hr_timesheet",
      "hr_presence",
      "hr_recruitment_skills",
      "hr_work_entry",
      "hr_hourly_cost",

      // Project Management
      "project",
      "project_timesheet_holidays",

      // Automation & Workflows
      "base_automation",

      // Communication
      "mail_group",
      "rating",

      // Address & Validation
      "base_address_extended",
      "base_vat",

      // Portal
      "portal",

      // ========================================
      // CRITICAL: Custom Safee Modules
      // ========================================
      "api_key_service",
      "safee_webhooks",

      // Security & Auth
      "auth_api_key",
    ];

    await this.odooModuleService.installModules({
      config,
      modules: essentialModules,
      organizationId,
    });

    this.logger.info(
      { databaseName, moduleCount: essentialModules.length, organizationId },
      "✅ Essential modules installed successfully",
    );
  }

  /**
   * Install extended OCA modules in background (10-15 minutes)
   * Includes: OCA extensions, document management, advanced reporting, etc.
   */
  private async installExtendedModules(
    databaseName: string,
    adminLogin: string,
    adminPassword: string,
    organizationId: string,
  ): Promise<void> {
    this.logger.info({ databaseName, organizationId }, "Installing extended OCA modules (background job)");

    const config: OdooConnectionConfig = {
      url: this.odooConfig.url,
      port: this.odooConfig.port ?? 8069,
      database: databaseName,
      username: adminLogin,
      password: adminPassword,
    };

    const extendedModules = [
      // API/Integration - REST Framework (background install)
      "component", // Required for base_rest
      "component_event",
      "extendable", // Required for component
      "pydantic", // Pydantic utility addon
      "base_rest", // REST API framework
      "base_rest_pydantic", // Pydantic integration for REST
      "base_rest_auth_api_key", // API key auth for REST
      "rest_log", // REST API call logging
      "endpoint_route_handler", // Route handling
      "fastapi", // FastAPI integration
      "fastapi_auth_api_key", // API key auth for FastAPI

      // Server Tools
      "auditlog",
      "auto_backup",
      "base_name_search_improved",
      "base_technical_user",
      "database_cleanup",
      "module_auto_update",
      "scheduler_error_mailer",

      // Queue/Background Jobs
      "queue_job",
      "queue_job_cron",

      // Document Management
      "dms",
      "dms_auto_classification",
      "dms_field",

      // Reporting
      "report_xlsx",
      "report_csv",
      "report_qr",
      "report_xml",
      "report_py3o",
      "report_qweb_parameter",
      "report_qweb_encrypt",
      "report_qweb_pdf_watermark",
      "bi_sql_editor",
      "sql_export",
      "sql_export_excel",

      // Mail/Communication
      "mail_tracking",
      "mail_tracking_mass_mailing",
      "mail_debrand",
      "mail_optional_autofollow",
      "mail_activity_board",

      // Partner/Contact
      "partner_firstname",
      "partner_second_lastname",
      "partner_statement",
      "partner_multi_relation",
      "partner_identification",
      "partner_company_group",
      "partner_external_map",

      // Contract
      "contract",
      "contract_sale",
      "contract_payment_mode",
      "contract_variable_quantity",

      // Account - OCA Extensions
      "account_asset_management",
      "account_asset_number",
      "account_financial_report",
      "account_fiscal_year",
      "account_fiscal_year_auto_create",
      "account_global_discount",
      "account_invoice_refund_link",
      "account_invoice_section_sale_order",
      "account_invoice_supplier_ref_unique",
      "account_invoice_triple_discount",
      "account_move_line_purchase_info",
      "account_move_line_sale_info",
      "account_move_template",
      "account_netting",
      "account_spread_cost_revenue",
      "account_tax_balance",

      // Analytics
      "analytic_base_department",

      // Sale - OCA Extensions
      "sale_automatic_workflow",
      "sale_exception",
      "sale_global_discount",
      "sale_order_invoicing_grouping_criteria",
      "sale_order_type",
      "sale_product_set",
      "sale_quotation_number",
      "sale_stock_picking_invoicing",
      "sale_tier_validation",

      // Project - OCA Extensions
      "project_department",
      "project_hr",
      "project_key",
      "project_task_code",
      "project_task_parent_completion_blocking",
      "project_task_stage_allow_timesheet",
      "project_role",
      "project_template",
      "project_timeline",

      // HR - OCA Extensions
      "hr_contract_reference",
      "hr_course",
      "hr_department_code",
      "hr_employee_age",
      "hr_employee_calendar_planning",
      "hr_employee_firstname",
      "hr_employee_id",
      "hr_employee_medical_examination",
      "hr_employee_relative",
      "hr_employee_service",
      "hr_expense_analytic_tag",
      "hr_timesheet_analytic_tag",
      "hr_timesheet_sheet",

      // Helpdesk
      "helpdesk_mgmt",
      "helpdesk_mgmt_rating",
      "helpdesk_mgmt_sla",
      "helpdesk_mgmt_timesheet",

      // MIS Builder (Financial Reports)
      "mis_builder",

      // Web UI Improvements
      "web_responsive",
      "web_m2x_options",
      "web_notify",
      "web_timeline",
      "web_environment_ribbon",
      "web_dialog_size",

      // Security
      "password_security",
      "base_user_show_email",

      // Debranding
      "disable_odoo_online",
      "portal_odoo_debranding",
    ];

    await this.odooModuleService.installModules({
      config,
      modules: extendedModules,
      organizationId,
    });

    this.logger.info(
      { databaseName, moduleCount: extendedModules.length, organizationId },
      "✅ Extended modules installed successfully",
    );
  }

  /**
   * Background job entry point: Install ALL modules (essential + extended)
   * Called after initial provisioning completes
   */
  async installModulesForOrganization(organizationId: string): Promise<void> {
    const credentials = await this.getCredentials(organizationId);

    if (!credentials) {
      throw new OdooDatabaseNotFound(organizationId);
    }

    // Install essential modules first (core business + safee + API framework)
    this.logger.info(
      { organizationId, databaseName: credentials.databaseName },
      "Installing essential modules in background job",
    );
    await this.installEssentialModules(
      credentials.databaseName,
      credentials.adminLogin,
      credentials.adminPassword,
      organizationId,
    );

    // Then install extended OCA modules
    this.logger.info(
      { organizationId, databaseName: credentials.databaseName },
      "Installing extended OCA modules in background job",
    );
    await this.installExtendedModules(
      credentials.databaseName,
      credentials.adminLogin,
      credentials.adminPassword,
      organizationId,
    );

    this.logger.info(
      { organizationId, databaseName: credentials.databaseName },
      "✅ All modules (essential + extended) installed successfully",
    );
  }
}
