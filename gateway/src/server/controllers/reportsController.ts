import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Route,
  Tags,
  Security,
  Body,
  Path,
  Request,
  SuccessResponse,
  OperationId,
  Query,
} from "tsoa";
import type { AuthenticatedRequest } from "../middleware/auth.js";
import type {
  AuditReportResponse,
  CreateAuditReportRequest,
  UpdateAuditReportRequest,
  AuditReportTemplateResponse,
  CreateAuditReportTemplateRequest,
  GenerateReportRequest,
} from "../dtos/reports.js";
import {
  getAuditReportsByCase,
  getAuditReportById,
  createAuditReport,
  updateAuditReport,
  deleteAuditReport,
  getAuditReportTemplates,
  getAuditReportTemplateById,
  createAuditReportTemplate,
  updateAuditReportTemplate,
} from "@safee/database";
import { generateReport as generateReportOp } from "../operations/reports/generateReport.js";

@Route("reports")
@Tags("Reports")
export class ReportsController extends Controller {
  @Get("/case/{caseId}")
  @Security("jwt")
  public async listReportsByCase(
    @Request() req: AuthenticatedRequest,
    @Path() caseId: string,
  ): Promise<AuditReportResponse[]> {
    const deps = { drizzle: req.drizzle, logger: req.logger };

    const reports = await getAuditReportsByCase(deps, caseId);

    return reports.map((r) => ({
      id: r.id,
      caseId: r.caseId,
      templateId: r.templateId ?? undefined,
      title: r.title,
      status: r.status,
      generatedData: r.generatedData,
      settings: r.settings,
      filePath: r.filePath ?? undefined,
      generatedAt: r.generatedAt ?? undefined,
      generatedBy: r.generatedBy,
      createdAt: r.createdAt,
      updatedAt: r.updatedAt,
    }));
  }

  @Get("/{reportId}")
  @Security("jwt")
  public async getReport(
    @Request() req: AuthenticatedRequest,
    @Path() reportId: string,
  ): Promise<AuditReportResponse> {
    const deps = { drizzle: req.drizzle, logger: req.logger };

    const report = await getAuditReportById(deps, reportId);
    if (!report) {
      this.setStatus(404);
      throw new Error("Report not found");
    }

    return {
      id: report.id,
      caseId: report.caseId,
      templateId: report.templateId ?? undefined,
      title: report.title,
      status: report.status,
      generatedData: report.generatedData,
      settings: report.settings,
      filePath: report.filePath ?? undefined,
      generatedAt: report.generatedAt ?? undefined,
      generatedBy: report.generatedBy,
      createdAt: report.createdAt,
      updatedAt: report.updatedAt,
    };
  }

  @Post("/generate")
  @Security("jwt")
  @SuccessResponse("201", "Report generation started")
  public async generateReport(
    @Request() req: AuthenticatedRequest,
    @Body() request: GenerateReportRequest,
  ): Promise<AuditReportResponse> {
    const userId = req.betterAuthSession?.user.id || "";

    this.setStatus(201);

    return await generateReportOp(req.drizzle, userId, request);
  }

  @Put("/{reportId}")
  @Security("jwt")
  public async updateReport(
    @Request() req: AuthenticatedRequest,
    @Path() reportId: string,
    @Body() request: UpdateAuditReportRequest,
  ): Promise<AuditReportResponse> {
    const deps = { drizzle: req.drizzle, logger: req.logger };

    const updatedReport = await updateAuditReport(deps, reportId, request);

    return {
      id: updatedReport.id,
      caseId: updatedReport.caseId,
      templateId: updatedReport.templateId ?? undefined,
      title: updatedReport.title,
      status: updatedReport.status,
      generatedData: updatedReport.generatedData,
      settings: updatedReport.settings,
      filePath: updatedReport.filePath ?? undefined,
      generatedAt: updatedReport.generatedAt ?? undefined,
      generatedBy: updatedReport.generatedBy,
      createdAt: updatedReport.createdAt,
      updatedAt: updatedReport.updatedAt,
    };
  }

  @Delete("/{reportId}")
  @Security("jwt")
  public async deleteReport(
    @Request() req: AuthenticatedRequest,
    @Path() reportId: string,
  ): Promise<{ success: boolean }> {
    const deps = { drizzle: req.drizzle, logger: req.logger };

    await deleteAuditReport(deps, reportId);

    return { success: true };
  }

  @Get("/templates")
  @Security("jwt")
  public async listTemplates(@Request() req: AuthenticatedRequest): Promise<AuditReportTemplateResponse[]> {
    const organizationId = req.betterAuthSession?.session.activeOrganizationId || "";
    const deps = { drizzle: req.drizzle, logger: req.logger };

    const templates = await getAuditReportTemplates(deps, organizationId);

    return templates.map((t) => ({
      id: t.id,
      name: t.name,
      auditType: t.auditType ?? undefined,
      description: t.description ?? undefined,
      templateStructure: t.templateStructure,
      isDefault: t.isDefault,
      isActive: t.isActive,
      organizationId: t.organizationId ?? undefined,
      createdAt: t.createdAt,
      updatedAt: t.updatedAt,
    }));
  }

  @Post("/templates")
  @Security("jwt")
  @SuccessResponse("201", "Template created successfully")
  @OperationId("CreateReportTemplate")
  public async createTemplate(
    @Request() req: AuthenticatedRequest,
    @Body() request: CreateAuditReportTemplateRequest,
  ): Promise<AuditReportTemplateResponse> {
    const organizationId = req.betterAuthSession?.session.activeOrganizationId || "";
    const deps = { drizzle: req.drizzle, logger: req.logger };

    this.setStatus(201);

    const template = await createAuditReportTemplate(deps, {
      ...request,
      organizationId,
    });

    return {
      id: template.id,
      name: template.name,
      auditType: template.auditType ?? undefined,
      description: template.description ?? undefined,
      templateStructure: template.templateStructure,
      isDefault: template.isDefault,
      isActive: template.isActive,
      organizationId: template.organizationId ?? undefined,
      createdAt: template.createdAt,
      updatedAt: template.updatedAt,
    };
  }

  @Get("/templates/{templateId}")
  @Security("jwt")
  public async getTemplate(
    @Request() req: AuthenticatedRequest,
    @Path() templateId: string,
  ): Promise<AuditReportTemplateResponse> {
    const deps = { drizzle: req.drizzle, logger: req.logger };

    const template = await getAuditReportTemplateById(deps, templateId);
    if (!template) {
      this.setStatus(404);
      throw new Error("Template not found");
    }

    return {
      id: template.id,
      name: template.name,
      auditType: template.auditType ?? undefined,
      description: template.description ?? undefined,
      templateStructure: template.templateStructure,
      isDefault: template.isDefault,
      isActive: template.isActive,
      organizationId: template.organizationId ?? undefined,
      createdAt: template.createdAt,
      updatedAt: template.updatedAt,
    };
  }
}
