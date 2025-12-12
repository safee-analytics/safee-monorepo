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
} from "tsoa";
import type { AuthenticatedRequest } from "../middleware/auth.js";
import type {
  AuditPlanResponse,
  CreateAuditPlanRequest,
  UpdateAuditPlanRequest,
  AuditPlanTemplateResponse,
  CreateAuditPlanTemplateRequest,
  CreatePlanFromTemplateRequest,
} from "../dtos/auditPlanning.js";
import {
  getAuditPlansByOrganization,
  getAuditPlanById,
  getAuditPlanTemplates,
  getAuditPlanTemplateById,
  createAuditPlanTemplate,
} from "@safee/database";
import { createAuditPlan as createAuditPlanOp } from "../operations/auditPlanning/createAuditPlan.js";
import { updateAuditPlan as updateAuditPlanOp } from "../operations/auditPlanning/updateAuditPlan.js";
import { deleteAuditPlan as deleteAuditPlanOp } from "../operations/auditPlanning/deleteAuditPlan.js";
import { convertPlanToCase as convertPlanToCaseOp } from "../operations/auditPlanning/convertPlanToCase.js";
import { createPlanFromTemplate as createPlanFromTemplateOp } from "../operations/auditPlanning/createPlanFromTemplate.js";

@Route("audit-plans")
@Tags("Audit Planning")
export class AuditPlanningController extends Controller {
  @Get("/")
  @Security("jwt")
  public async listPlans(@Request() req: AuthenticatedRequest): Promise<AuditPlanResponse[]> {
    const organizationId = req.betterAuthSession?.session.activeOrganizationId ?? "";
    const deps = { drizzle: req.drizzle, logger: req.logger };

    const plans = await getAuditPlansByOrganization(deps, organizationId);

    return plans.map((p) => ({
      id: p.id,
      caseId: p.caseId ,
      planType: p.planType,
      title: p.title,
      clientName: p.clientName ,
      auditType: p.auditType ,
      auditYear: p.auditYear ,
      startDate: p.startDate ,
      targetCompletion: p.targetCompletion ,
      objectives: p.objectives,
      businessUnits: p.businessUnits,
      financialAreas: p.financialAreas,
      teamMembers: p.teamMembers,
      phaseBreakdown: p.phaseBreakdown,
      totalBudget: p.totalBudget ,
      totalHours: p.totalHours ,
      materialityThreshold: p.materialityThreshold ,
      riskAssessment: p.riskAssessment,
      status: p.status,
      organizationId: p.organizationId,
      createdBy: p.createdBy,
      createdAt: p.createdAt,
      updatedAt: p.updatedAt,
    }));
  }

  @Get("/{planId}")
  @Security("jwt")
  public async getPlan(
    @Request() req: AuthenticatedRequest,
    @Path() planId: string,
  ): Promise<AuditPlanResponse> {
    const deps = { drizzle: req.drizzle, logger: req.logger };

    const plan = await getAuditPlanById(deps, planId);
    if (!plan) {
      this.setStatus(404);
      throw new Error("Audit plan not found");
    }

    return {
      id: plan.id,
      caseId: plan.caseId ,
      planType: plan.planType,
      title: plan.title,
      clientName: plan.clientName ,
      auditType: plan.auditType ,
      auditYear: plan.auditYear ,
      startDate: plan.startDate ,
      targetCompletion: plan.targetCompletion ,
      objectives: plan.objectives,
      businessUnits: plan.businessUnits,
      financialAreas: plan.financialAreas,
      teamMembers: plan.teamMembers,
      phaseBreakdown: plan.phaseBreakdown,
      totalBudget: plan.totalBudget ,
      totalHours: plan.totalHours ,
      materialityThreshold: plan.materialityThreshold ,
      riskAssessment: plan.riskAssessment,
      status: plan.status,
      organizationId: plan.organizationId,
      createdBy: plan.createdBy,
      createdAt: plan.createdAt,
      updatedAt: plan.updatedAt,
    };
  }

  @Post("/")
  @Security("jwt")
  @SuccessResponse("201", "Audit plan created successfully")
  public async createPlan(
    @Request() req: AuthenticatedRequest,
    @Body() request: CreateAuditPlanRequest,
  ): Promise<AuditPlanResponse> {
    const organizationId = req.betterAuthSession?.session.activeOrganizationId ?? "";
    const userId = req.betterAuthSession?.user.id ?? "";

    this.setStatus(201);

    return await createAuditPlanOp(req.drizzle, organizationId, userId, request);
  }

  @Put("/{planId}")
  @Security("jwt")
  public async updatePlan(
    @Request() req: AuthenticatedRequest,
    @Path() planId: string,
    @Body() request: UpdateAuditPlanRequest,
  ): Promise<AuditPlanResponse> {
    const organizationId = req.betterAuthSession?.session.activeOrganizationId ?? "";

    return await updateAuditPlanOp(req.drizzle, organizationId, planId, request);
  }

  @Delete("/{planId}")
  @Security("jwt")
  public async deletePlan(
    @Request() req: AuthenticatedRequest,
    @Path() planId: string,
  ): Promise<{ success: boolean }> {
    const organizationId = req.betterAuthSession?.session.activeOrganizationId ?? "";

    return await deleteAuditPlanOp(req.drizzle, organizationId, planId);
  }

  @Post("/{planId}/convert-to-case")
  @Security("jwt")
  @SuccessResponse("201", "Plan converted to case successfully")
  public async convertToCase(
    @Request() req: AuthenticatedRequest,
    @Path() planId: string,
  ): Promise<{ caseId: string; message: string }> {
    const organizationId = req.betterAuthSession?.session.activeOrganizationId ?? "";
    const userId = req.betterAuthSession?.user.id ?? "";

    this.setStatus(201);

    return await convertPlanToCaseOp(req.drizzle, organizationId, userId, planId);
  }

  @Get("/templates")
  @Security("jwt")
  @OperationId("ListAuditPlanTemplates")
  public async listTemplates(@Request() req: AuthenticatedRequest): Promise<AuditPlanTemplateResponse[]> {
    const organizationId = req.betterAuthSession?.session.activeOrganizationId ?? "";
    const deps = { drizzle: req.drizzle, logger: req.logger };

    const templates = await getAuditPlanTemplates(deps, organizationId);

    return templates.map((t) => ({
      id: t.id,
      name: t.name,
      auditType: t.auditType ,
      description: t.description ,
      defaultObjectives: t.defaultObjectives,
      defaultScope: t.defaultScope,
      defaultPhases: t.defaultPhases,
      defaultBusinessUnits: t.defaultBusinessUnits,
      defaultFinancialAreas: t.defaultFinancialAreas,
      estimatedDuration: t.estimatedDuration ,
      estimatedHours: t.estimatedHours ,
      estimatedBudget: t.estimatedBudget ,
      isDefault: t.isDefault,
      isActive: t.isActive,
      organizationId: t.organizationId ,
      createdAt: t.createdAt,
      updatedAt: t.updatedAt,
    }));
  }

  @Post("/templates")
  @Security("jwt")
  @SuccessResponse("201", "Template created successfully")
  @OperationId("CreateAuditPlanTemplate")
  public async createTemplate(
    @Request() req: AuthenticatedRequest,
    @Body() request: CreateAuditPlanTemplateRequest,
  ): Promise<AuditPlanTemplateResponse> {
    const organizationId = req.betterAuthSession?.session.activeOrganizationId ?? "";
    const deps = { drizzle: req.drizzle, logger: req.logger };

    this.setStatus(201);

    const template = await createAuditPlanTemplate(deps, {
      ...request,
      organizationId,
    });

    return {
      id: template.id,
      name: template.name,
      auditType: template.auditType ,
      description: template.description ,
      defaultObjectives: template.defaultObjectives,
      defaultScope: template.defaultScope,
      defaultPhases: template.defaultPhases,
      defaultBusinessUnits: template.defaultBusinessUnits,
      defaultFinancialAreas: template.defaultFinancialAreas,
      estimatedDuration: template.estimatedDuration ,
      estimatedHours: template.estimatedHours ,
      estimatedBudget: template.estimatedBudget ,
      isDefault: template.isDefault,
      isActive: template.isActive,
      organizationId: template.organizationId ,
      createdAt: template.createdAt,
      updatedAt: template.updatedAt,
    };
  }

  @Get("/templates/{templateId}")
  @Security("jwt")
  @OperationId("GetAuditPlanTemplate")
  public async getTemplate(
    @Request() req: AuthenticatedRequest,
    @Path() templateId: string,
  ): Promise<AuditPlanTemplateResponse> {
    const deps = { drizzle: req.drizzle, logger: req.logger };

    const template = await getAuditPlanTemplateById(deps, templateId);
    if (!template) {
      this.setStatus(404);
      throw new Error("Template not found");
    }

    return {
      id: template.id,
      name: template.name,
      auditType: template.auditType ,
      description: template.description ,
      defaultObjectives: template.defaultObjectives,
      defaultScope: template.defaultScope,
      defaultPhases: template.defaultPhases,
      defaultBusinessUnits: template.defaultBusinessUnits,
      defaultFinancialAreas: template.defaultFinancialAreas,
      estimatedDuration: template.estimatedDuration ,
      estimatedHours: template.estimatedHours ,
      estimatedBudget: template.estimatedBudget ,
      isDefault: template.isDefault,
      isActive: template.isActive,
      organizationId: template.organizationId ,
      createdAt: template.createdAt,
      updatedAt: template.updatedAt,
    };
  }

  @Post("/from-template")
  @Security("jwt")
  @SuccessResponse("201", "Plan created from template successfully")
  public async createFromTemplate(
    @Request() req: AuthenticatedRequest,
    @Body() request: CreatePlanFromTemplateRequest,
  ): Promise<AuditPlanResponse> {
    const organizationId = req.betterAuthSession?.session.activeOrganizationId ?? "";
    const userId = req.betterAuthSession?.user.id ?? "";

    this.setStatus(201);

    return await createPlanFromTemplateOp(req.drizzle, organizationId, userId, request);
  }
}
