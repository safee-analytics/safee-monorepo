import { Controller, Get, Post, Put, Delete, Route, Tags, Security, Request, Path, Body, Query } from "tsoa";
import type { AuthenticatedRequest } from "../middleware/auth.js";
import { getServerContext } from "../serverContext.js";
import { DocumentTemplateService } from "../services/documentTemplate.service.js";
import { getOdooClientManager } from "../services/odoo/manager.service.js";
import { OdooAccountingService } from "../services/odoo/accounting.service.js";
import { BadRequest, NotFound } from "../errors.js";

export type DocumentType =
  | "invoice"
  | "bill"
  | "quote"
  | "purchase_order"
  | "delivery_note"
  | "receipt"
  | "credit_note"
  | "debit_note"
  | "payslip"
  | "contract"
  | "payment_receipt"
  | "refund";

interface DocumentTemplateResponse {
  id: string;
  organizationId: string;
  documentType: DocumentType;
  templateId: string;
  templateName: string;
  templateDescription: string | null;
  isActive: boolean;
  customizations: Record<string, unknown> | null;
  createdAt: Date;
  updatedAt: Date;
}

interface CreateDocumentTemplateRequest {
  documentType: DocumentType;
  templateId: string;
  templateName: string;
  templateDescription?: string;
  isActive?: boolean;
  customizations?: Record<string, unknown>;
}

interface UpdateTemplateRequest {
  templateName?: string;
  templateDescription?: string;
  customizations?: Record<string, unknown>;
}

interface OdooReportTemplate {
  id: number;
  name: string;
  report_name: string;
  model: string;
  report_type: string;
}

interface CreateCustomTemplateRequest {
  documentType: DocumentType;
  templateName: string;
  templateDescription?: string;
  qwebXml: string;
  model: string;
  isActive?: boolean;
  customizations?: Record<string, unknown>;
}

@Route("settings/document-templates")
@Tags("Settings")
export class DocumentTemplateController extends Controller {
  private getService(request: AuthenticatedRequest): DocumentTemplateService {
    const ctx = getServerContext();
    return new DocumentTemplateService(ctx);
  }

  private getOrganizationId(request: AuthenticatedRequest): string {
    const organizationId = request.betterAuthSession?.session.activeOrganizationId;
    if (!organizationId) {
      throw new BadRequest("No active organization selected");
    }
    return organizationId;
  }

  private async getAccountingService(request: AuthenticatedRequest): Promise<OdooAccountingService> {
    const userId = request.betterAuthSession?.user.id;
    const organizationId = this.getOrganizationId(request);

    if (!userId) {
      throw new BadRequest("User not authenticated");
    }

    const client = await getOdooClientManager().getClient(userId, organizationId);
    return new OdooAccountingService(client);
  }

  /**
   * Get all document templates for the organization
   */
  @Get("/")
  @Security("jwt")
  public async getTemplates(@Request() request: AuthenticatedRequest): Promise<DocumentTemplateResponse[]> {
    const service = this.getService(request);
    const organizationId = this.getOrganizationId(request);

    return service.getTemplates(organizationId);
  }

  /**
   * Get templates for a specific document type
   */
  @Get("/by-type")
  @Security("jwt")
  public async getTemplatesByType(
    @Request() request: AuthenticatedRequest,
    @Query() documentType: DocumentType,
  ): Promise<DocumentTemplateResponse[]> {
    const service = this.getService(request);
    const organizationId = this.getOrganizationId(request);

    return service.getTemplatesByType(organizationId, documentType);
  }

  /**
   * Get the active template for a document type
   */
  @Get("/active")
  @Security("jwt")
  public async getActiveTemplate(
    @Request() request: AuthenticatedRequest,
    @Query() documentType: DocumentType,
  ): Promise<{ templateId: string }> {
    const service = this.getService(request);
    const organizationId = this.getOrganizationId(request);

    const templateId = await service.getActiveTemplate(organizationId, documentType);
    return { templateId };
  }

  /**
   * Get available report templates from Odoo
   */
  @Get("/odoo-templates")
  @Security("jwt")
  public async getOdooTemplates(
    @Request() request: AuthenticatedRequest,
    @Query() model?: string,
  ): Promise<OdooReportTemplate[]> {
    const accountingService = await this.getAccountingService(request);
    return accountingService.getAvailableReportTemplates(model);
  }

  /**
   * Create a new document template
   */
  @Post("/")
  @Security("jwt")
  public async createTemplate(
    @Request() request: AuthenticatedRequest,
    @Body() body: CreateDocumentTemplateRequest,
  ): Promise<DocumentTemplateResponse> {
    const service = this.getService(request);
    const organizationId = this.getOrganizationId(request);

    const template = await service.createTemplate({
      organizationId,
      ...body,
    });

    this.setStatus(201);
    return template;
  }

  /**
   * Update a document template
   */
  @Put("/{templateId}")
  @Security("jwt")
  public async updateTemplate(
    @Request() request: AuthenticatedRequest,
    @Path() templateId: string,
    @Body() body: UpdateTemplateRequest,
  ): Promise<DocumentTemplateResponse> {
    const service = this.getService(request);
    const organizationId = this.getOrganizationId(request);

    const template = await service.updateTemplate(templateId, organizationId, body);

    if (!template) {
      throw new NotFound("Template not found");
    }

    return template;
  }

  /**
   * Set a template as active for its document type
   */
  @Post("/{templateId}/activate")
  @Security("jwt")
  public async activateTemplate(
    @Request() request: AuthenticatedRequest,
    @Path() templateId: string,
  ): Promise<DocumentTemplateResponse> {
    const service = this.getService(request);
    const organizationId = this.getOrganizationId(request);

    return service.setActiveTemplate(organizationId, templateId);
  }

  /**
   * Delete a document template
   */
  @Delete("/{templateId}")
  @Security("jwt")
  public async deleteTemplate(
    @Request() request: AuthenticatedRequest,
    @Path() templateId: string,
  ): Promise<{ success: boolean }> {
    const service = this.getService(request);
    const organizationId = this.getOrganizationId(request);

    await service.deleteTemplate(templateId, organizationId);
    return { success: true };
  }

  /**
   * Create a custom QWeb template in Odoo and register it
   */
  @Post("/custom")
  @Security("jwt")
  public async createCustomTemplate(
    @Request() request: AuthenticatedRequest,
    @Body() body: CreateCustomTemplateRequest,
  ): Promise<DocumentTemplateResponse> {
    const accountingService = await this.getAccountingService(request);
    const service = this.getService(request);
    const organizationId = this.getOrganizationId(request);

    // Create the custom template in Odoo
    const odooClient = (accountingService as any).client;

    // Step 1: Create the QWeb view (ir.ui.view)
    const viewXmlId = `custom_template_${organizationId}_${Date.now()}`;
    const viewId = await odooClient.create("ir.ui.view", {
      name: body.templateName,
      type: "qweb",
      mode: "primary",
      key: viewXmlId,
      arch: body.qwebXml,
    });

    // Step 2: Create the report action (ir.actions.report)
    const reportXmlId = `report_${viewXmlId}`;
    const reportId = await odooClient.create("ir.actions.report", {
      name: body.templateName,
      model: body.model,
      report_type: "qweb-pdf",
      report_name: reportXmlId,
      print_report_name: `'${body.templateName} - %s' % (object.name)`,
      binding_model_id: false,
      binding_type: "report",
    });

    // Step 3: Save the template reference in our database
    const template = await service.createTemplate({
      organizationId,
      documentType: body.documentType,
      templateId: reportXmlId,
      templateName: body.templateName,
      templateDescription: body.templateDescription,
      isActive: body.isActive,
      customizations: {
        ...body.customizations,
        odooViewId: viewId,
        odooReportId: reportId,
        isCustomTemplate: true,
      },
    });

    this.setStatus(201);
    return template;
  }
}
