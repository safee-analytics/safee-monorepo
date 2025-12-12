import { Controller, Post, Route, Tags, Body, Request, NoSecurity } from "tsoa";
import type { AuthenticatedRequest } from "../middleware/auth.js";
import { getWebhookVerification } from "../services/webhookVerification.js";
import { getOdooClientManager } from "../services/odoo/manager.service.js";
import {
  OdooHRService,
  parseEmployeeType,
  parseGender,
  parseMaritalStatus,
} from "../services/odoo/hr.service.js";
import { OdooCRMService } from "../services/odoo/crm.service.js";
import { OdooAccountingService } from "../services/odoo/accounting.service.js";
import {
  syncEmployee,
  syncDepartment,
  syncContact,
  syncLead,
  syncInvoice,
  syncPayment,
  getEmployeeByOdooId,
  getDepartmentByOdooId,
  getContactByOdooId,
  getLeadByOdooId,
  getInvoiceByOdooId,
  getPaymentByOdooId,
  schema,
  eq,
  and,
} from "@safee/database";
import { Unauthorized, NotFound } from "../errors.js";
import { getServerContext } from "../serverContext.js";
import { createOdooClient } from "../services/odoo/client.service.js";
import { encryptionService } from "../services/encryption.js";

interface OdooWebhookPayload {
  event: "create" | "write" | "unlink"; // Odoo event types
  model: string; // e.g., "hr.employee", "hr.department"
  record_id: number; // Odoo record ID
  organization_id: string; // Your organization ID (passed from Odoo)
  user_id: string; // User ID who made the change in Odoo
  timestamp: string; // ISO timestamp
}

@Route("webhooks/odoo")
@Tags("Odoo Webhooks")
export class OdooWebhookController extends Controller {
  /**
   * Stringify JSON with sorted keys to match Odoo's json.dumps(sort_keys=True)
   */
  private stringifyWithSortedKeys(obj: unknown): string {
    return JSON.stringify(obj, Object.keys(obj as object).sort());
  }

  /**
   * Verify webhook signature
   */
  private verifyWebhook(request: AuthenticatedRequest, body: OdooWebhookPayload): void {
    const webhookVerification = getWebhookVerification();

    // Verify using the parsed body with sorted keys (matching Odoo's json.dumps(sort_keys=True))
    const isValid = webhookVerification.verify(request, this.stringifyWithSortedKeys(body));

    if (!isValid) {
      throw new Unauthorized("Invalid webhook signature");
    }
  }

  /**
   * Get Odoo client for webhook processing
   * Maps Odoo user ID to Safee user, then gets their client
   */
  private async getClientForWebhook(odooUserId: string, organizationId: string) {
    const { drizzle, logger } = getServerContext();

    // Get the organization's Odoo database
    const odooDb = await drizzle.query.odooDatabases.findFirst({
      where: eq(schema.odooDatabases.organizationId, organizationId),
    });

    if (!odooDb) {
      throw new NotFound("Odoo database not found for organization");
    }

    // Find the Safee user by their Odoo UID
    const odooUser = await drizzle.query.odooUsers.findFirst({
      where: and(
        eq(schema.odooUsers.odooUid, parseInt(odooUserId, 10)),
        eq(schema.odooUsers.odooDatabaseId, odooDb.id),
      ),
    });

    if (!odooUser) {
      logger.warn(
        { odooUserId, organizationId },
        "Safee user not found for Odoo user ID, using admin client",
      );
      // Fall back to admin client if user not found
      return createOdooClient(
        {
          url: process.env.ODOO_URL ?? "http://localhost:8069",
          port: parseInt(process.env.ODOO_PORT ?? "8069", 10),
          database: odooDb.databaseName,
          username: odooDb.adminLogin,
          password: encryptionService.decrypt(odooDb.adminPassword),
        },
        logger,
      );
    }

    // Get the Odoo client for this Safee user
    const odooClientManager = getOdooClientManager();
    return await odooClientManager.getClient(odooUser.userId, organizationId);
  }

  /**
   * Handle employee changes from Odoo
   */
  @Post("/employees")
  @NoSecurity()
  public async handleEmployeeWebhook(
    @Request() request: AuthenticatedRequest,
    @Body() payload: OdooWebhookPayload,
  ): Promise<{ success: boolean; message: string }> {
    this.verifyWebhook(request, payload);

    const { event, record_id, organization_id, user_id } = payload;
    const { drizzle, logger } = getServerContext();

    logger.info(
      {
        event,
        recordId: record_id,
        organizationId: organization_id,
      },
      "Received employee webhook from Odoo",
    );

    try {
      if (event === "unlink") {
        // Employee deleted in Odoo - deactivate in our DB
        const employee = await getEmployeeByOdooId({ drizzle, logger }, record_id, organization_id);

        if (employee) {
          await syncEmployee(
            { drizzle, logger },
            {
              ...employee,
              active: false,
              lastSyncedAt: new Date(),
            },
          );
        }

        return { success: true, message: "Employee deactivated" };
      }

      // For create/write events, fetch latest from Odoo
      const client = await this.getClientForWebhook(user_id, organization_id);
      const hrService = new OdooHRService(client);

      const odooEmployee = await hrService.getEmployee(record_id);

      if (!odooEmployee) {
        throw new NotFound(`Employee with Odoo ID ${record_id} not found`);
      }

      // Resolve department UUID
      let departmentUuid: string | undefined;
      if (odooEmployee.department_id?.[0]) {
        const department = await getDepartmentByOdooId(
          { drizzle, logger },
          odooEmployee.department_id[0],
          organization_id,
        );
        departmentUuid = department?.id;
      }

      // Resolve manager UUID
      let managerUuid: string | undefined;
      if (odooEmployee.parent_id?.[0]) {
        const manager = await getEmployeeByOdooId(
          { drizzle, logger },
          odooEmployee.parent_id[0],
          organization_id,
        );
        managerUuid = manager?.id;
      }

      // Helper to convert Odoo false to undefined
      function odooValue<T>(value: T | false): T | undefined {
        return value === false ? undefined : value;
      }

      // Mark request as coming from webhook to prevent sync loop
      request.headers["x-odoo-webhook"] = "true";

      // Sync to database
      await syncEmployee(
        { drizzle, logger },
        {
          organizationId: organization_id,
          userId: user_id,
          odooEmployeeId: odooEmployee.id,
          name: odooEmployee.name,
          email: odooValue(odooEmployee.work_email),
          phone: odooValue(odooEmployee.work_phone),
          mobile: odooValue(odooEmployee.mobile_phone),
          workEmail: odooValue(odooEmployee.work_email),
          workPhone: odooValue(odooEmployee.work_phone),
          jobTitle: odooValue(odooEmployee.job_title),
          departmentId: departmentUuid,
          managerId: managerUuid,
          employeeType: parseEmployeeType(odooEmployee.employee_type),
          gender: parseGender(odooEmployee.sex),
          maritalStatus: parseMaritalStatus(odooEmployee.marital),
          birthday: odooValue(odooEmployee.birthday),
          placeOfBirth: odooValue(odooEmployee.place_of_birth),
          identificationId: odooValue(odooEmployee.identification_id),
          passportId: odooValue(odooEmployee.passport_id),
          emergencyContact: odooValue(odooEmployee.emergency_contact),
          emergencyPhone: odooValue(odooEmployee.emergency_phone),
          active: odooEmployee.active ?? true,
          lastSyncedAt: new Date(),
        },
      );

      return {
        success: true,
        message: `Employee ${event === "create" ? "created" : "updated"}`,
      };
    } catch (err) {
      logger.error({ error: err, payload }, "Failed to process employee webhook");
      throw err;
    }
  }

  /**
   * Handle department changes from Odoo
   */
  @Post("/departments")
  @NoSecurity()
  public async handleDepartmentWebhook(
    @Request() request: AuthenticatedRequest,
    @Body() payload: OdooWebhookPayload,
  ): Promise<{ success: boolean; message: string }> {
    this.verifyWebhook(request, payload);

    const { event, record_id, organization_id, user_id } = payload;
    const { drizzle, logger } = getServerContext();

    logger.info(
      {
        event,
        recordId: record_id,
        organizationId: organization_id,
      },
      "Received department webhook from Odoo",
    );

    try {
      if (event === "unlink") {
        // Department deleted in Odoo - delete from our DB
        const department = await getDepartmentByOdooId({ drizzle, logger }, record_id, organization_id);

        if (department) {
          // Note: Implement deleteDepartment if needed
          // For now, just log it
          logger.warn({ departmentId: department.id }, "Department deletion not implemented");
        }

        return { success: true, message: "Department deletion acknowledged" };
      }

      // For create/write events, fetch latest from Odoo
      const client = await this.getClientForWebhook(user_id, organization_id);
      const hrService = new OdooHRService(client);

      const odooDepartment = await hrService.getDepartment(record_id);

      if (!odooDepartment) {
        throw new NotFound(`Department with Odoo ID ${record_id} not found`);
      }

      // Helper to convert Odoo false to undefined
      function odooValue<T>(value: T | false): T | undefined {
        return value === false ? undefined : value;
      }

      // Sync to database
      await syncDepartment(
        { drizzle, logger },
        {
          organizationId: organization_id,
          odooDepartmentId: odooDepartment.id,
          name: odooDepartment.complete_name ?? odooDepartment.name,
          code: odooDepartment.name,
          parentId: odooDepartment.parent_id?.[0]?.toString(),
          managerId: odooDepartment.manager_id?.[0]?.toString(),
          color: odooValue(odooDepartment.color),
          note: odooValue(odooDepartment.note),
          lastSyncedAt: new Date(),
        },
      );

      return {
        success: true,
        message: `Department ${event === "create" ? "created" : "updated"}`,
      };
    } catch (err) {
      logger.error({ error: err, payload }, "Failed to process department webhook");
      throw err;
    }
  }

  /**
   * Handle invoice changes from Odoo
   */
  @Post("/invoices")
  @NoSecurity()
  public async handleInvoiceWebhook(
    @Request() request: AuthenticatedRequest,
    @Body() payload: OdooWebhookPayload,
  ): Promise<{ success: boolean; message: string }> {
    this.verifyWebhook(request, payload);

    const { event, record_id, organization_id, user_id } = payload;
    const { drizzle, logger } = getServerContext();

    logger.info(
      {
        event,
        recordId: record_id,
        organizationId: organization_id,
      },
      "Received invoice webhook from Odoo",
    );

    try {
      if (event === "unlink") {
        // Invoice deleted in Odoo - deactivate/delete from our DB
        const invoice = await getInvoiceByOdooId({ drizzle, logger }, record_id, organization_id);

        if (invoice) {
          // For now, just log - could implement soft delete or hard delete based on requirements
          logger.warn({ invoiceId: invoice.id }, "Invoice deletion not fully implemented");
        }

        return { success: true, message: "Invoice deletion acknowledged" };
      }

      // For create/write events, fetch latest from Odoo
      const client = await this.getClientForWebhook(user_id, organization_id);
      const accountingService = new OdooAccountingService(client);

      const odooInvoice = await accountingService.getInvoice(record_id);

      if (!odooInvoice) {
        throw new NotFound(`Invoice with Odoo ID ${record_id} not found`);
      }

      // Helper to convert Odoo false to undefined
      function odooValue<T>(value: T | false): T | undefined {
        return value === false ? undefined : value;
      }

      // Helper to extract ID from many2one field
      function extractId(value: unknown): number | undefined {
        if (!value || value === false) return undefined;
        return Array.isArray(value) ? value[0] : (value as number);
      }

      // Helper to extract name from many2one field
      function extractName(value: unknown): string | undefined {
        if (!value || value === false) return undefined;
        return Array.isArray(value) ? value[1] : undefined;
      }

      // Sync to database
      await syncInvoice(
        { drizzle, logger },
        {
          organizationId: organization_id,
          odooInvoiceId: odooInvoice.id!,
          name: odooValue(odooInvoice.name),
          moveType: odooInvoice.move_type,
          partnerId: extractId(odooInvoice.partner_id),
          partnerName: extractName(odooInvoice.partner_id),
          invoiceDate: odooValue(odooInvoice.invoice_date),
          invoiceDateDue: odooValue(odooInvoice.invoice_date_due),
          paymentReference: odooValue(odooInvoice.payment_reference),
          invoiceOrigin: odooValue(odooInvoice.invoice_origin),
          currencyId: extractId(odooInvoice.currency_id),
          currencyName: extractName(odooInvoice.currency_id),
          amountUntaxed: odooInvoice.amount_untaxed?.toString(),
          amountTax: odooInvoice.amount_tax?.toString(),
          amountTotal: odooInvoice.amount_total?.toString(),
          amountResidual: odooInvoice.amount_residual?.toString(),
          state: odooValue(odooInvoice.state),
          paymentState: odooValue(odooInvoice.payment_state),
          journalId: extractId(odooInvoice.journal_id),
          journalName: extractName(odooInvoice.journal_id),
          companyId: extractId(odooInvoice.company_id),
          narration: odooValue(odooInvoice.narration),
          lastSyncedAt: new Date(),
        },
      );

      return {
        success: true,
        message: `Invoice ${event === "create" ? "created" : "updated"}`,
      };
    } catch (err) {
      logger.error({ error: err, payload }, "Failed to process invoice webhook");
      throw err;
    }
  }

  /**
   * Handle payment changes from Odoo
   */
  @Post("/payments")
  @NoSecurity()
  public async handlePaymentWebhook(
    @Request() request: AuthenticatedRequest,
    @Body() payload: OdooWebhookPayload,
  ): Promise<{ success: boolean; message: string }> {
    this.verifyWebhook(request, payload);

    const { event, record_id, organization_id, user_id } = payload;
    const { drizzle, logger } = getServerContext();

    logger.info(
      {
        event,
        recordId: record_id,
        organizationId: organization_id,
      },
      "Received payment webhook from Odoo",
    );

    try {
      if (event === "unlink") {
        // Payment deleted in Odoo - deactivate/delete from our DB
        const payment = await getPaymentByOdooId({ drizzle, logger }, record_id, organization_id);

        if (payment) {
          // For now, just log - could implement soft delete or hard delete based on requirements
          logger.warn({ paymentId: payment.id }, "Payment deletion not fully implemented");
        }

        return { success: true, message: "Payment deletion acknowledged" };
      }

      // For create/write events, fetch latest from Odoo
      const client = await this.getClientForWebhook(user_id, organization_id);

      // Read payment directly since there's no getPayment method
      const payments = await client.read<{
        id: number;
        payment_type: "inbound" | "outbound" | "transfer";
        partner_type: "customer" | "supplier";
        partner_id: number | [number, string] | false;
        amount: number;
        currency_id: number | [number, string] | false;
        date: string;
        ref: string | false;
        journal_id: number | [number, string] | false;
        payment_method_id: number | [number, string] | false;
        destination_account_id: number | [number, string] | false;
        state: "draft" | "posted" | "cancel" | false;
      }>(
        "account.payment",
        [record_id],
        [
          "payment_type",
          "partner_type",
          "partner_id",
          "amount",
          "currency_id",
          "date",
          "ref",
          "journal_id",
          "payment_method_id",
          "destination_account_id",
          "state",
        ],
      );

      // odooPayment is undefined if not found
      if (payments.length === 0) {
        throw new NotFound(`Payment with Odoo ID ${record_id} not found`);
      }

      const odooPayment = payments[0];

      // Helper to convert Odoo false to undefined
      function odooValue<T>(value: T | false): T | undefined {
        return value === false ? undefined : value;
      }

      // Helper to extract ID from many2one field
      function extractId(value: unknown): number | undefined {
        if (!value || value === false) return undefined;
        return Array.isArray(value) ? value[0] : (value as number);
      }

      // Helper to extract name from many2one field
      function extractName(value: unknown): string | undefined {
        if (!value || value === false) return undefined;
        return Array.isArray(value) ? value[1] : undefined;
      }

      // Sync to database
      await syncPayment(
        { drizzle, logger },
        {
          organizationId: organization_id,
          odooPaymentId: odooPayment.id,
          paymentType: odooPayment.payment_type,
          partnerType: odooPayment.partner_type,
          partnerId: extractId(odooPayment.partner_id),
          partnerName: extractName(odooPayment.partner_id),
          amount: odooPayment.amount.toString(),
          currencyId: extractId(odooPayment.currency_id),
          currencyName: extractName(odooPayment.currency_id),
          paymentDate: odooPayment.date,
          ref: odooValue(odooPayment.ref),
          journalId: extractId(odooPayment.journal_id),
          journalName: extractName(odooPayment.journal_id),
          paymentMethodId: extractId(odooPayment.payment_method_id),
          paymentMethodName: extractName(odooPayment.payment_method_id),
          destinationAccountId: extractId(odooPayment.destination_account_id),
          destinationAccountName: extractName(odooPayment.destination_account_id),
          state: odooValue(odooPayment.state),
          lastSyncedAt: new Date(),
        },
      );

      return {
        success: true,
        message: `Payment ${event === "create" ? "created" : "updated"}`,
      };
    } catch (err) {
      logger.error({ error: err, payload }, "Failed to process payment webhook");
      throw err;
    }
  }

  /**
   * Handle CRM lead changes from Odoo
   */
  @Post("/leads")
  @NoSecurity()
  public async handleLeadWebhook(
    @Request() request: AuthenticatedRequest,
    @Body() payload: OdooWebhookPayload,
  ): Promise<{ success: boolean; message: string }> {
    this.verifyWebhook(request, payload);

    const { event, record_id, organization_id, user_id } = payload;
    const { drizzle, logger } = getServerContext();

    logger.info(
      {
        event,
        recordId: record_id,
        organizationId: organization_id,
      },
      "Received CRM lead webhook from Odoo",
    );

    try {
      if (event === "unlink") {
        // Lead deleted in Odoo - deactivate in our DB
        const lead = await getLeadByOdooId({ drizzle, logger }, record_id, organization_id);

        if (lead) {
          await syncLead(
            { drizzle, logger },
            {
              ...lead,
              active: false,
              lastSyncedAt: new Date(),
            },
          );
        }

        return { success: true, message: "Lead deactivated" };
      }

      // For create/write events, fetch latest from Odoo
      const client = await this.getClientForWebhook(user_id, organization_id);
      const crmService = new OdooCRMService(client);

      const odooLead = await crmService.getLead(record_id);

      if (!odooLead) {
        throw new NotFound(`Lead with Odoo ID ${record_id} not found`);
      }

      // Helper to convert Odoo false to undefined
      function odooValue<T>(value: T | false): T | undefined {
        return value === false ? undefined : value;
      }

      // Sync to database
      await syncLead(
        { drizzle, logger },
        {
          organizationId: organization_id,
          odooLeadId: odooLead.id,
          name: odooLead.name,
          type: odooLead.type,
          contactName: odooValue(odooLead.contact_name),
          partnerName: odooValue(odooLead.partner_name),
          emailFrom: odooValue(odooLead.email_from),
          phone: odooValue(odooLead.phone),
          website: odooValue(odooLead.website),
          function: odooValue(odooLead.function),
          street: odooValue(odooLead.street),
          street2: odooValue(odooLead.street2),
          city: odooValue(odooLead.city),
          stateId: odooLead.state_id?.[0],
          countryId: odooLead.country_id?.[0],
          zip: odooValue(odooLead.zip),
          partnerId: odooLead.partner_id?.[0],
          commercialPartnerId: odooLead.commercial_partner_id?.[0],
          stageId: odooLead.stage_id?.[0],
          teamId: odooLead.team_id?.[0],
          userId: odooLead.user_id?.[0],
          companyId: odooLead.company_id?.[0],
          campaignId: odooLead.campaign_id?.[0],
          sourceId: odooLead.source_id?.[0],
          mediumId: odooLead.medium_id?.[0],
          langId: odooLead.lang_id?.[0],
          expectedRevenue: odooLead.expected_revenue?.toString(),
          proratedRevenue: odooLead.prorated_revenue?.toString(),
          recurringRevenue: odooLead.recurring_revenue?.toString(),
          recurringPlan: odooLead.recurring_plan?.[0],
          recurringRevenueMonthly: odooLead.recurring_revenue_monthly?.toString(),
          probability: odooLead.probability?.toString(),
          dateOpen: odooLead.date_open ? new Date(odooLead.date_open) : undefined,
          dateDeadline: odooLead.date_deadline ? new Date(odooLead.date_deadline) : undefined,
          dateClosed: odooLead.date_closed ? new Date(odooLead.date_closed) : undefined,
          dateConversion: odooLead.date_conversion ? new Date(odooLead.date_conversion) : undefined,
          dateLastStageUpdate: odooLead.date_last_stage_update
            ? new Date(odooLead.date_last_stage_update)
            : undefined,
          priority: odooValue(odooLead.priority),
          active: odooLead.active ?? true,
          description: odooValue(odooLead.description),
          referred: odooValue(odooLead.referred),
          tagIds: odooLead.tag_ids,
          lostReasonId: odooLead.lost_reason_id?.[0],
          color: odooValue(odooLead.color),
          lastSyncedAt: new Date(),
        },
      );

      return {
        success: true,
        message: `Lead ${event === "create" ? "created" : "updated"}`,
      };
    } catch (err) {
      logger.error({ error: err, payload }, "Failed to process lead webhook");
      throw err;
    }
  }

  /**
   * Handle leave/time-off changes from Odoo
   */
  @Post("/leaves")
  @NoSecurity()
  public async handleLeaveWebhook(
    @Request() request: AuthenticatedRequest,
    @Body() payload: OdooWebhookPayload,
  ): Promise<{ success: boolean; message: string }> {
    this.verifyWebhook(request, payload);

    const { event, record_id, organization_id } = payload;
    const { logger } = getServerContext();

    logger.info(
      {
        event,
        recordId: record_id,
        organizationId: organization_id,
      },
      "Received leave webhook from Odoo",
    );

    // TODO: Implement leave sync logic
    logger.info({ event, record_id }, "Leave webhook received - sync not yet implemented");

    return {
      success: true,
      message: "Leave webhook acknowledged (sync not yet implemented)",
    };
  }

  /**
   * Handle contact/partner changes from Odoo
   */
  @Post("/contacts")
  @NoSecurity()
  public async handleContactWebhook(
    @Request() request: AuthenticatedRequest,
    @Body() payload: OdooWebhookPayload,
  ): Promise<{ success: boolean; message: string }> {
    this.verifyWebhook(request, payload);

    const { event, record_id, organization_id, user_id } = payload;
    const { drizzle, logger } = getServerContext();

    logger.info(
      {
        event,
        recordId: record_id,
        organizationId: organization_id,
      },
      "Received contact webhook from Odoo",
    );

    try {
      if (event === "unlink") {
        // Contact deleted in Odoo - deactivate in our DB
        const contact = await getContactByOdooId({ drizzle, logger }, record_id, organization_id);

        if (contact) {
          await syncContact(
            { drizzle, logger },
            {
              ...contact,
              active: false,
              lastSyncedAt: new Date(),
            },
          );
        }

        return { success: true, message: "Contact deactivated" };
      }

      // For create/write events, fetch latest from Odoo
      const client = await this.getClientForWebhook(user_id, organization_id);
      const crmService = new OdooCRMService(client);

      const odooContact = await crmService.getContact(record_id);

      if (!odooContact) {
        throw new NotFound(`Contact with Odoo ID ${record_id} not found`);
      }

      // Sync to database
      await syncContact(
        { drizzle, logger },
        {
          organizationId: organization_id,
          odooPartnerId: odooContact.id,
          name: odooContact.name,
          isCompany: odooContact.is_company ?? false,
          companyType: odooContact.company_type ?? null,
          email: odooContact.email ?? null,
          phone: odooContact.phone ?? null,
          phoneMobileSearch: odooContact.phone_mobile_search ?? null,
          website: odooContact.website ?? null,
          function: odooContact.function ?? null,
          comment: odooContact.comment ?? null,
          street: odooContact.street ?? null,
          street2: odooContact.street2 ?? null,
          city: odooContact.city ?? null,
          stateId: odooContact.state_id?.[0] ?? null,
          countryId: odooContact.country_id?.[0] ?? null,
          zip: odooContact.zip ?? null,
          vat: odooContact.vat ?? null,
          industryId: odooContact.industry_id?.[0] ?? null,
          isCustomer: (odooContact.customer_rank ?? 0) > 0,
          isSupplier: (odooContact.supplier_rank ?? 0) > 0,
          active: odooContact.active ?? true,
          lastSyncedAt: new Date(),
        },
      );

      return {
        success: true,
        message: `Contact ${event === "create" ? "created" : "updated"}`,
      };
    } catch (err) {
      logger.error({ error: err, payload }, "Failed to process contact webhook");
      throw err;
    }
  }
}
