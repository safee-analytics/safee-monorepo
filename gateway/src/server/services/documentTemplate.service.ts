import { eq, and, schema } from "@safee/database";
import type { DocumentType } from "@safee/database";
import type { ServerContext } from "../serverContext.js";

export class DocumentTemplateService {
  constructor(private readonly ctx: ServerContext) {}

  private get drizzle() {
    return this.ctx.drizzle;
  }

  private get logger() {
    return this.ctx.logger;
  }

  /**
   * Get the active template for a specific document type and organization
   */
  async getActiveTemplate(organizationId: string, documentType: DocumentType): Promise<string> {
    const template = await this.drizzle.query.documentTemplates.findFirst({
      where: and(
        eq(schema.documentTemplates.organizationId, organizationId),
        eq(schema.documentTemplates.documentType, documentType),
        eq(schema.documentTemplates.isActive, true),
      ),
    });

    // Return the template ID, or fall back to default based on document type
    if (template) {
      this.logger.info(
        { organizationId, documentType, templateId: template.templateId },
        "Using custom template for document",
      );
      return template.templateId;
    }

    // Default templates for each document type
    const defaults: Record<DocumentType, string> = {
      invoice: "account.report_invoice",
      bill: "account.report_invoice",
      quote: "sale.report_saleorder",
      purchase_order: "purchase.report_purchaseorder",
      delivery_note: "stock.report_deliveryslip",
      receipt: "account.report_payment_receipt",
      credit_note: "account.report_invoice",
      debit_note: "account.report_invoice",
      payslip: "hr_payroll.report_payslip",
      contract: "hr_contract.report_contract",
      payment_receipt: "account.report_payment_receipt",
      refund: "account.report_invoice",
    };

    const defaultTemplate = defaults[documentType] || "account.report_invoice";
    this.logger.info(
      { organizationId, documentType, templateId: defaultTemplate },
      "Using default template for document",
    );

    return defaultTemplate;
  }

  /**
   * Get all templates for an organization
   */
  async getTemplates(organizationId: string) {
    return this.drizzle.query.documentTemplates.findMany({
      where: eq(schema.documentTemplates.organizationId, organizationId),
      orderBy: (templates, { asc }) => [asc(templates.documentType), asc(templates.templateName)],
    });
  }

  /**
   * Get templates for a specific document type
   */
  async getTemplatesByType(organizationId: string, documentType: DocumentType) {
    return this.drizzle.query.documentTemplates.findMany({
      where: and(
        eq(schema.documentTemplates.organizationId, organizationId),
        eq(schema.documentTemplates.documentType, documentType),
      ),
      orderBy: (templates, { desc }) => [desc(templates.isActive), desc(templates.createdAt)],
    });
  }

  /**
   * Set a template as active (deactivates all others for the same document type)
   */
  async setActiveTemplate(organizationId: string, templateId: string) {
    const template = await this.drizzle.query.documentTemplates.findFirst({
      where: and(
        eq(schema.documentTemplates.id, templateId),
        eq(schema.documentTemplates.organizationId, organizationId),
      ),
    });

    if (!template) {
      this.logger.warn({ organizationId, templateId }, "Template not found");
      throw new Error("Template not found");
    }

    // Deactivate all templates for this document type
    await this.drizzle
      .update(schema.documentTemplates)
      .set({ isActive: false, updatedAt: new Date() })
      .where(
        and(
          eq(schema.documentTemplates.organizationId, organizationId),
          eq(schema.documentTemplates.documentType, template.documentType),
        ),
      );

    // Activate the selected template
    await this.drizzle
      .update(schema.documentTemplates)
      .set({ isActive: true, updatedAt: new Date() })
      .where(eq(schema.documentTemplates.id, templateId));

    this.logger.info(
      { organizationId, templateId, documentType: template.documentType },
      "Template activated successfully",
    );

    return template;
  }

  /**
   * Create a new template
   */
  async createTemplate(data: {
    organizationId: string;
    documentType: DocumentType;
    templateId: string;
    templateName: string;
    templateDescription?: string;
    isActive?: boolean;
    customizations?: Record<string, unknown>;
  }) {
    // If this is set as active, deactivate others
    if (data.isActive) {
      await this.drizzle
        .update(schema.documentTemplates)
        .set({ isActive: false, updatedAt: new Date() })
        .where(
          and(
            eq(schema.documentTemplates.organizationId, data.organizationId),
            eq(schema.documentTemplates.documentType, data.documentType),
          ),
        );
    }

    const [template] = await this.drizzle.insert(schema.documentTemplates).values(data).returning();

    this.logger.info(
      { organizationId: data.organizationId, templateId: template.id, documentType: data.documentType },
      "Template created successfully",
    );

    return template;
  }

  /**
   * Update a template
   */
  async updateTemplate(
    templateId: string,
    organizationId: string,
    data: {
      templateName?: string;
      templateDescription?: string;
      customizations?: Record<string, unknown>;
    },
  ) {
    const [template] = await this.drizzle
      .update(schema.documentTemplates)
      .set({ ...data, updatedAt: new Date() })
      .where(
        and(
          eq(schema.documentTemplates.id, templateId),
          eq(schema.documentTemplates.organizationId, organizationId),
        ),
      )
      .returning();

    // template is always defined after update (returning gives array with one element or empty array)
    this.logger.info({ organizationId, templateId }, "Template updated successfully");

    return template;
  }

  /**
   * Delete a template
   */
  async deleteTemplate(templateId: string, organizationId: string) {
    await this.drizzle
      .delete(schema.documentTemplates)
      .where(
        and(
          eq(schema.documentTemplates.id, templateId),
          eq(schema.documentTemplates.organizationId, organizationId),
        ),
      );

    this.logger.info({ organizationId, templateId }, "Template deleted successfully");
  }
}
