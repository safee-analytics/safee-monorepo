import {
  Controller,
  Get,
  Post,
  Put,
  Route,
  Tags,
  Security,
  Request,
  Path,
  Query,
  Body,
  OperationId,
  SuccessResponse,
} from "tsoa";
import type { AuthenticatedRequest } from "../middleware/auth.js";
import { getOdooClientManager } from "../services/odoo/manager.service.js";
import { OdooCRMService } from "../services/odoo/crm.service.js";
import { BadRequest, NotFound } from "../errors.js";
import type {
  LeadResponse,
  StageResponse,
  ContactResponse,
  ActivityResponse,
  TeamResponse,
  LostReasonResponse,
  CreateLeadRequest,
  UpdateLeadRequest,
  CreateContactRequest,
  UpdateContactRequest,
  CreateActivityRequest,
} from "./crmController.types.js";
import {
  mapLead,
  mapStage,
  mapContact,
  mapActivity,
  mapTeam,
  mapLostReason,
} from "./crmController.mappers.js";

@Route("crm")
@Tags("CRM")
export class CRMController extends Controller {
  @Security("jwt")
  private async getCRMService(request: AuthenticatedRequest): Promise<OdooCRMService> {
    const userId = request.betterAuthSession?.user.id;
    const organizationId = request.betterAuthSession?.session.activeOrganizationId;

    if (!userId) {
      throw new BadRequest("User not authenticated");
    }

    if (!organizationId) {
      throw new BadRequest("No active organization selected");
    }

    const odooClientManager = getOdooClientManager();
    const client = await odooClientManager.getClient(userId, organizationId);

    return new OdooCRMService(client);
  }

  @Get("/leads")
  @Security("jwt")
  @OperationId("GetCRMLeads")
  public async getLeads(
    @Request() request: AuthenticatedRequest,
    @Query() type?: "lead" | "opportunity",
    @Query() stageId?: number,
    @Query() teamId?: number,
    @Query() userId?: number,
    @Query() partnerId?: number,
    @Query() active?: boolean,
  ): Promise<LeadResponse[]> {
    const crmService = await this.getCRMService(request);
    const leads = await crmService.getLeads({
      type,
      stageId,
      teamId,
      userId,
      partnerId,
      active,
    });
    return leads.map(mapLead);
  }

  @Get("/leads/{leadId}")
  @Security("jwt")
  @OperationId("GetCRMLead")
  public async getLead(
    @Request() request: AuthenticatedRequest,
    @Path() leadId: number,
  ): Promise<LeadResponse> {
    const crmService = await this.getCRMService(request);
    const lead = await crmService.getLead(leadId);

    if (!lead) {
      throw new NotFound(`Lead with ID ${leadId} not found`);
    }

    return mapLead(lead);
  }

  @Post("/leads")
  @Security("jwt")
  @SuccessResponse("201", "Lead created successfully")
  @OperationId("CreateCRMLead")
  public async createLead(
    @Request() request: AuthenticatedRequest,
    @Body() body: CreateLeadRequest,
  ): Promise<{ id: number }> {
    const crmService = await this.getCRMService(request);
    const leadId = await crmService.createLead(body);

    this.setStatus(201);
    return { id: leadId };
  }

  @Put("/leads/{leadId}")
  @Security("jwt")
  @OperationId("UpdateCRMLead")
  public async updateLead(
    @Request() request: AuthenticatedRequest,
    @Path() leadId: number,
    @Body() body: UpdateLeadRequest,
  ): Promise<{ success: boolean }> {
    const crmService = await this.getCRMService(request);
    await crmService.updateLead(leadId, body);
    return { success: true };
  }

  @Post("/leads/{leadId}/convert")
  @Security("jwt")
  @OperationId("ConvertCRMLead")
  public async convertLead(
    @Request() request: AuthenticatedRequest,
    @Path() leadId: number,
    @Body() body: { partnerId?: number },
  ): Promise<{ success: boolean }> {
    const crmService = await this.getCRMService(request);
    await crmService.convertLeadToOpportunity(leadId, body.partnerId);
    return { success: true };
  }

  @Post("/leads/{leadId}/win")
  @Security("jwt")
  @OperationId("WinCRMLead")
  public async winLead(
    @Request() request: AuthenticatedRequest,
    @Path() leadId: number,
  ): Promise<{ success: boolean }> {
    const crmService = await this.getCRMService(request);
    await crmService.markLeadAsWon(leadId);
    return { success: true };
  }

  @Post("/leads/{leadId}/lose")
  @Security("jwt")
  @OperationId("LoseCRMLead")
  public async loseLead(
    @Request() request: AuthenticatedRequest,
    @Path() leadId: number,
    @Body() body: { lostReasonId?: number },
  ): Promise<{ success: boolean }> {
    const crmService = await this.getCRMService(request);
    await crmService.markLeadAsLost(leadId, body.lostReasonId);
    return { success: true };
  }

  @Get("/stages")
  @Security("jwt")
  @OperationId("GetCRMStages")
  public async getStages(
    @Request() request: AuthenticatedRequest,
    @Query() teamId?: number,
    @Query() isWon?: boolean,
  ): Promise<StageResponse[]> {
    const crmService = await this.getCRMService(request);
    const stages = await crmService.getStages({ teamId, isWon });
    return stages.map(mapStage);
  }

  @Get("/stages/{stageId}")
  @Security("jwt")
  @OperationId("GetCRMStage")
  public async getStage(
    @Request() request: AuthenticatedRequest,
    @Path() stageId: number,
  ): Promise<StageResponse> {
    const crmService = await this.getCRMService(request);
    const stage = await crmService.getStage(stageId);

    if (!stage) {
      throw new NotFound(`Stage with ID ${stageId} not found`);
    }

    return mapStage(stage);
  }

  @Get("/contacts")
  @Security("jwt")
  @OperationId("GetCRMContacts")
  public async getContacts(
    @Request() request: AuthenticatedRequest,
    @Query() isCustomer?: boolean,
    @Query() isSupplier?: boolean,
    @Query() isCompany?: boolean,
  ): Promise<ContactResponse[]> {
    const crmService = await this.getCRMService(request);
    const contacts = await crmService.getContacts({
      isCustomer,
      isSupplier,
      isCompany,
    });
    return contacts.map(mapContact);
  }

  @Get("/contacts/{contactId}")
  @Security("jwt")
  @OperationId("GetCRMContact")
  public async getContact(
    @Request() request: AuthenticatedRequest,
    @Path() contactId: number,
  ): Promise<ContactResponse> {
    const crmService = await this.getCRMService(request);
    const contact = await crmService.getContact(contactId);

    if (!contact) {
      throw new NotFound(`Contact with ID ${contactId} not found`);
    }

    return mapContact(contact);
  }

  @Post("/contacts")
  @Security("jwt")
  @SuccessResponse("201", "Contact created successfully")
  @OperationId("CreateCRMContact")
  public async createContact(
    @Request() request: AuthenticatedRequest,
    @Body() body: CreateContactRequest,
  ): Promise<{ id: number }> {
    const crmService = await this.getCRMService(request);
    const contactId = await crmService.createContact(body);

    this.setStatus(201);
    return { id: contactId };
  }

  @Put("/contacts/{contactId}")
  @Security("jwt")
  @OperationId("UpdateCRMContact")
  public async updateContact(
    @Request() request: AuthenticatedRequest,
    @Path() contactId: number,
    @Body() body: UpdateContactRequest,
  ): Promise<{ success: boolean }> {
    const crmService = await this.getCRMService(request);
    await crmService.updateContact(contactId, body);
    return { success: true };
  }

  @Get("/activities")
  @Security("jwt")
  @OperationId("GetCRMActivities")
  public async getActivities(
    @Request() request: AuthenticatedRequest,
    @Query() leadId?: number,
    @Query() userId?: number,
    @Query() state?: string,
  ): Promise<ActivityResponse[]> {
    const crmService = await this.getCRMService(request);
    const activities = await crmService.getActivities({
      leadId,
      userId,
      state,
    });
    return activities.map(mapActivity);
  }

  @Get("/activities/{activityId}")
  @Security("jwt")
  @OperationId("GetCRMActivity")
  public async getActivity(
    @Request() request: AuthenticatedRequest,
    @Path() activityId: number,
  ): Promise<ActivityResponse> {
    const crmService = await this.getCRMService(request);
    const activity = await crmService.getActivity(activityId);

    if (!activity) {
      throw new NotFound(`Activity with ID ${activityId} not found`);
    }

    return mapActivity(activity);
  }

  @Post("/activities")
  @Security("jwt")
  @SuccessResponse("201", "Activity created successfully")
  @OperationId("CreateCRMActivity")
  public async createActivity(
    @Request() request: AuthenticatedRequest,
    @Body() body: CreateActivityRequest,
  ): Promise<{ id: number }> {
    const crmService = await this.getCRMService(request);
    const activityId = await crmService.createActivity(body);

    this.setStatus(201);
    return { id: activityId };
  }

  @Post("/activities/{activityId}/done")
  @Security("jwt")
  @OperationId("MarkCRMActivityDone")
  public async markActivityDone(
    @Request() request: AuthenticatedRequest,
    @Path() activityId: number,
  ): Promise<{ success: boolean }> {
    const crmService = await this.getCRMService(request);
    await crmService.markActivityDone(activityId);
    return { success: true };
  }

  @Get("/teams")
  @Security("jwt")
  @OperationId("GetCRMTeams")
  public async getTeams(
    @Request() request: AuthenticatedRequest,
    @Query() active?: boolean,
  ): Promise<TeamResponse[]> {
    const crmService = await this.getCRMService(request);
    const teams = await crmService.getTeams({ active });
    return teams.map(mapTeam);
  }

  @Get("/teams/{teamId}")
  @Security("jwt")
  @OperationId("GetCRMTeam")
  public async getTeam(
    @Request() request: AuthenticatedRequest,
    @Path() teamId: number,
  ): Promise<TeamResponse> {
    const crmService = await this.getCRMService(request);
    const team = await crmService.getTeam(teamId);

    if (!team) {
      throw new NotFound(`Team with ID ${teamId} not found`);
    }

    return mapTeam(team);
  }

  @Get("/lost-reasons")
  @Security("jwt")
  @OperationId("GetCRMLostReasons")
  public async getLostReasons(
    @Request() request: AuthenticatedRequest,
    @Query() active?: boolean,
  ): Promise<LostReasonResponse[]> {
    const crmService = await this.getCRMService(request);
    const reasons = await crmService.getLostReasons({ active });
    return reasons.map(mapLostReason);
  }

  @Get("/lost-reasons/{reasonId}")
  @Security("jwt")
  @OperationId("GetCRMLostReason")
  public async getLostReason(
    @Request() request: AuthenticatedRequest,
    @Path() reasonId: number,
  ): Promise<LostReasonResponse> {
    const crmService = await this.getCRMService(request);
    const reason = await crmService.getLostReason(reasonId);

    if (!reason) {
      throw new NotFound(`Lost reason with ID ${reasonId} not found`);
    }

    return mapLostReason(reason);
  }
}
