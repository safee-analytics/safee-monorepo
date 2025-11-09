import {
  Controller,
  Get,
  Post,
  Delete,
  Route,
  Tags,
  Security,
  NoSecurity,
  Query,
  Body,
  Path,
  SuccessResponse,
  OperationId,
  Request,
} from "tsoa";
import type { AuthenticatedRequest } from "../middleware/auth.js";
import { getOdooClientManager } from "../services/odoo/manager.service.js";
import {
  OdooSigningService,
  type CreateSignRequestDTO,
  type CreateSignTemplateDTO,
} from "../services/odoo/signing.service.js";

interface SignRequestResponse {
  id: number;
  reference: string;
  templateId?: number;
  templateName?: string;
  state: "sent" | "signed" | "canceled";
  createUid: number;
  creatorName: string;
  createDate: string;
  completedDocument: boolean;
  pendingSignatures: number;
  completedSignatures: number;
  subject: string;
  message: string;
}

interface SignRequestItemResponse {
  id: number;
  signRequestId: number;
  signRequestReference: string;
  partnerId: number;
  partnerName: string;
  roleId?: number;
  roleName?: string;
  signerEmail: string;
  state: "sent" | "completed" | "canceled";
  signingDate?: string;
  accessToken: string;
  createDate: string;
}

interface SignTemplateResponse {
  id: number;
  name: string;
  attachmentId: number;
  attachmentName: string;
  active: boolean;
  signItemCount: number;
  responsibleCount: number;
}

interface SigningStatsResponse {
  total: number;
  sent: number;
  signed: number;
  canceled: number;
  pendingSignatures: number;
}

interface SigningLinkResponse {
  requestItemId: number;
  signerEmail: string;
  signingLink: string;
}

interface SignedDocumentResponse {
  filename: string;
  content: string; // base64
  downloadUrl?: string;
}

@Route("sign")
@Tags("Signing (Electronic Signatures)")
export class SigningController extends Controller {
  @NoSecurity()
  private async getSigningService(request: AuthenticatedRequest): Promise<OdooSigningService> {
    const userId = request.betterAuthSession!.user.id;
    const organizationId = request.betterAuthSession!.session.activeOrganizationId!;
    const client = await getOdooClientManager().getClient(userId, organizationId);
    return new OdooSigningService(client);
  }

  // ==================== Sign Requests ====================

  @Get("requests")
  @Security("jwt")
  @OperationId("GetSignRequests")
  public async getSignRequests(
    @Request() request: AuthenticatedRequest,
    @Query() state?: "sent" | "signed" | "canceled",
    @Query() templateId?: number,
  ): Promise<SignRequestResponse[]> {
    const service = await this.getSigningService(request);

    const requests = await service.getSignRequests({
      state,
      templateId,
    });

    return requests.map((req) => ({
      id: req.id,
      reference: req.reference,
      templateId: req.template_id ? req.template_id[0] : undefined,
      templateName: req.template_id ? req.template_id[1] : undefined,
      state: req.state,
      createUid: req.create_uid[0],
      creatorName: req.create_uid[1],
      createDate: req.create_date,
      completedDocument: !!req.completed_document,
      pendingSignatures: req.nb_wait,
      completedSignatures: req.nb_closed,
      subject: req.subject,
      message: req.message,
    }));
  }

  @Get("requests/{requestId}")
  @Security("jwt")
  @OperationId("GetSignRequest")
  public async getSignRequest(
    @Request() request: AuthenticatedRequest,
    @Path() requestId: number,
  ): Promise<SignRequestResponse | null> {
    const service = await this.getSigningService(request);
    const req = await service.getSignRequest(requestId);

    if (!req) {
      this.setStatus(404);
      return null;
    }

    return {
      id: req.id,
      reference: req.reference,
      templateId: req.template_id ? req.template_id[0] : undefined,
      templateName: req.template_id ? req.template_id[1] : undefined,
      state: req.state,
      createUid: req.create_uid[0],
      creatorName: req.create_uid[1],
      createDate: req.create_date,
      completedDocument: !!req.completed_document,
      pendingSignatures: req.nb_wait,
      completedSignatures: req.nb_closed,
      subject: req.subject,
      message: req.message,
    };
  }

  @Post("requests")
  @Security("jwt")
  @SuccessResponse("201", "Sign request created successfully")
  @OperationId("CreateSignRequest")
  public async createSignRequest(
    @Request() request: AuthenticatedRequest,
    @Body() dto: CreateSignRequestDTO,
  ): Promise<{ id: number; reference: string }> {
    const service = await this.getSigningService(request);
    const requestId = await service.createSignRequest(dto);

    const createdRequest = await service.getSignRequest(requestId);

    this.setStatus(201);
    return {
      id: requestId,
      reference: createdRequest?.reference || `Sign Request ${requestId}`,
    };
  }

  @Post("requests/{requestId}/send")
  @Security("jwt")
  @OperationId("SendSignRequest")
  public async sendSignRequest(
    @Request() request: AuthenticatedRequest,
    @Path() requestId: number,
  ): Promise<{ success: boolean; message: string }> {
    const service = await this.getSigningService(request);
    await service.sendSignRequest(requestId);

    return {
      success: true,
      message: "Signature request sent to all signers",
    };
  }

  @Post("requests/{requestId}/cancel")
  @Security("jwt")
  @OperationId("CancelSignRequest")
  public async cancelSignRequest(
    @Request() request: AuthenticatedRequest,
    @Path() requestId: number,
  ): Promise<{ success: boolean; message: string }> {
    const service = await this.getSigningService(request);
    await service.cancelSignRequest(requestId);

    return {
      success: true,
      message: "Signature request canceled",
    };
  }

  @Get("requests/{requestId}/signers")
  @Security("jwt")
  @OperationId("GetSignRequestSigners")
  public async getSignRequestSigners(
    @Request() request: AuthenticatedRequest,
    @Path() requestId: number,
  ): Promise<SignRequestItemResponse[]> {
    const service = await this.getSigningService(request);
    const items = await service.getSignRequestItems(requestId);

    return items.map((item) => ({
      id: item.id,
      signRequestId: item.sign_request_id[0],
      signRequestReference: item.sign_request_id[1],
      partnerId: item.partner_id[0],
      partnerName: item.partner_id[1],
      roleId: item.role_id ? item.role_id[0] : undefined,
      roleName: item.role_id ? item.role_id[1] : undefined,
      signerEmail: item.signer_email,
      state: item.state,
      signingDate: item.signing_date || undefined,
      accessToken: item.access_token,
      createDate: item.create_date,
    }));
  }

  @Get("requests/{requestId}/signers/{itemId}/link")
  @Security("jwt")
  @OperationId("GetSigningLink")
  public async getSigningLink(
    @Request() request: AuthenticatedRequest,
    @Path() requestId: number,
    @Path() itemId: number,
  ): Promise<SigningLinkResponse> {
    const service = await this.getSigningService(request);
    const link = await service.getSigningLink(itemId);

    // Get item details for email
    const items = await service.getSignRequestItems(requestId);
    const item = items.find((i) => i.id === itemId);

    return {
      requestItemId: itemId,
      signerEmail: item?.signer_email || "unknown",
      signingLink: link,
    };
  }

  @Get("requests/{requestId}/download")
  @Security("jwt")
  @OperationId("DownloadSignedDocument")
  public async downloadSignedDocument(
    @Request() request: AuthenticatedRequest,
    @Path() requestId: number,
  ): Promise<SignedDocumentResponse | null> {
    const service = await this.getSigningService(request);
    const doc = await service.downloadSignedDocument(requestId);

    if (!doc) {
      this.setStatus(404);
      return null;
    }

    return {
      filename: doc.filename,
      content: doc.content,
    };
  }

  // ==================== Templates ====================

  @Get("templates")
  @Security("jwt")
  @OperationId("GetSignTemplates")
  public async getSignTemplates(
    @Request() request: AuthenticatedRequest,
    @Query() active?: boolean,
  ): Promise<SignTemplateResponse[]> {
    const service = await this.getSigningService(request);

    const templates = await service.getSignTemplates({
      active,
    });

    return templates.map((template) => ({
      id: template.id,
      name: template.name,
      attachmentId: template.attachment_id[0],
      attachmentName: template.attachment_id[1],
      active: template.active,
      signItemCount: template.sign_item_ids.length,
      responsibleCount: template.responsible_count,
    }));
  }

  @Get("templates/{templateId}")
  @Security("jwt")
  @OperationId("GetSignTemplate")
  public async getSignTemplate(
    @Request() request: AuthenticatedRequest,
    @Path() templateId: number,
  ): Promise<SignTemplateResponse | null> {
    const service = await this.getSigningService(request);
    const template = await service.getSignTemplate(templateId);

    if (!template) {
      this.setStatus(404);
      return null;
    }

    return {
      id: template.id,
      name: template.name,
      attachmentId: template.attachment_id[0],
      attachmentName: template.attachment_id[1],
      active: template.active,
      signItemCount: template.sign_item_ids.length,
      responsibleCount: template.responsible_count,
    };
  }

  @Post("templates")
  @Security("jwt")
  @SuccessResponse("201", "Sign template created successfully")
  @OperationId("CreateSignTemplate")
  public async createSignTemplate(
    @Request() request: AuthenticatedRequest,
    @Body() dto: CreateSignTemplateDTO,
  ): Promise<{ id: number; name: string }> {
    const service = await this.getSigningService(request);
    const templateId = await service.createSignTemplate(dto);

    this.setStatus(201);
    return {
      id: templateId,
      name: dto.name,
    };
  }

  @Delete("templates/{templateId}")
  @Security("jwt")
  @OperationId("DeleteSignTemplate")
  public async deleteSignTemplate(
    @Request() request: AuthenticatedRequest,
    @Path() templateId: number,
  ): Promise<{ success: boolean; message: string }> {
    const service = await this.getSigningService(request);
    await service.deleteSignTemplate(templateId);

    return {
      success: true,
      message: "Template deleted successfully",
    };
  }

  // ==================== Utilities ====================

  @Get("types")
  @Security("jwt")
  @OperationId("GetSignatureTypes")
  public async getSignatureTypes(
    @Request() request: AuthenticatedRequest,
  ): Promise<Array<{ id: number; name: string }>> {
    const service = await this.getSigningService(request);
    return service.getSignatureTypes();
  }

  @Get("stats")
  @Security("jwt")
  @OperationId("GetSignatureStats")
  public async getSignatureStats(@Request() request: AuthenticatedRequest): Promise<SigningStatsResponse> {
    const service = await this.getSigningService(request);
    return service.getSignatureStats();
  }
}
