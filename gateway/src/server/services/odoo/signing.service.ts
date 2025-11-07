/**
 * Odoo Signing Service
 *
 * High-level wrapper for Odoo electronic signature operations.
 * Provides type-safe methods for managing:
 * - Document Signing Requests
 * - Signature Templates
 * - Signed Documents
 * - Signature Items (fields to sign)
 */

import type { OdooClient } from "./client.service.js";

export interface OdooSignRequest {
  id: number;
  reference: string;
  template_id: [number, string] | false;
  state: "sent" | "signed" | "canceled";
  create_uid: [number, string];
  create_date: string;
  completed_document: string | false;
  nb_wait: number;
  nb_closed: number;
  request_item_ids: number[];
  message_ids: number[];
  attachment_id: [number, string] | false;
  favorited_ids: number[];
  subject: string;
  message: string;
}

export interface OdooSignRequestItem {
  id: number;
  sign_request_id: [number, string];
  partner_id: [number, string];
  role_id: [number, string] | false;
  signer_email: string;
  state: "sent" | "completed" | "canceled";
  signing_date: string | false;
  access_token: string;
  create_date: string;
}

export interface OdooSignTemplate {
  id: number;
  name: string;
  attachment_id: [number, string];
  active: boolean;
  favorited_ids: number[];
  sign_item_ids: number[];
  responsible_count: number;
  authorized_ids: number[];
  tag_ids: number[];
}

export interface OdooSignItem {
  id: number;
  template_id: [number, string];
  type_id: [number, string];
  required: boolean;
  responsible_id: [number, string];
  page: number;
  posX: number;
  posY: number;
  width: number;
  height: number;
  name: string;
  placeholder: string;
  option_ids: number[];
}

export interface CreateSignRequestDTO {
  templateId?: number;
  attachmentId?: number;
  fileName?: string;
  fileContent?: string; // base64 encoded
  subject?: string;
  message?: string;
  signers: Array<{
    partnerId?: number;
    email: string;
    name: string;
    role?: string;
  }>;
  reference?: string;
  sendSignLink?: boolean;
}

export interface CreateSignTemplateDTO {
  name: string;
  attachmentId?: number;
  fileName?: string;
  fileContent?: string; // base64 encoded
  signItems?: Array<{
    type: "signature" | "initial" | "text" | "checkbox" | "selection";
    responsibleName: string;
    page: number;
    posX: number;
    posY: number;
    width: number;
    height: number;
    required?: boolean;
    name?: string;
    placeholder?: string;
  }>;
}

export class OdooSigningService {
  constructor(private readonly client: OdooClient) {}

  // ==================== Sign Requests ====================

  /**
   * Get all signature requests with filters
   */
  async getSignRequests(filters?: {
    state?: "sent" | "signed" | "canceled";
    templateId?: number;
    createdBy?: number;
  }): Promise<OdooSignRequest[]> {
    const domain: Array<[string, string, unknown]> = [];

    if (filters?.state) {
      domain.push(["state", "=", filters.state]);
    }
    if (filters?.templateId) {
      domain.push(["template_id", "=", filters.templateId]);
    }
    if (filters?.createdBy) {
      domain.push(["create_uid", "=", filters.createdBy]);
    }

    return this.client.searchRead<OdooSignRequest>(
      "sign.request",
      domain,
      [
        "reference",
        "template_id",
        "state",
        "create_uid",
        "create_date",
        "completed_document",
        "nb_wait",
        "nb_closed",
        "request_item_ids",
        "attachment_id",
        "subject",
        "message",
      ],
      { order: "create_date desc" },
    );
  }

  /**
   * Get a single signature request by ID
   */
  async getSignRequest(requestId: number): Promise<OdooSignRequest | null> {
    const requests = await this.client.read<OdooSignRequest>(
      "sign.request",
      [requestId],
      [
        "reference",
        "template_id",
        "state",
        "create_uid",
        "create_date",
        "completed_document",
        "nb_wait",
        "nb_closed",
        "request_item_ids",
        "attachment_id",
        "subject",
        "message",
        "favorited_ids",
        "message_ids",
      ],
    );
    return requests[0] || null;
  }

  /**
   * Create a signature request from template or file
   */
  async createSignRequest(dto: CreateSignRequestDTO): Promise<number> {
    let attachmentId = dto.attachmentId;

    // If file content provided, create attachment first
    if (dto.fileContent && dto.fileName) {
      attachmentId = await this.createAttachment(dto.fileName, dto.fileContent);
    }

    if (!attachmentId && !dto.templateId) {
      throw new Error("Either templateId, attachmentId, or fileContent must be provided");
    }

    // Create sign request
    const requestData: Record<string, unknown> = {
      reference: dto.reference || `Sign Request ${Date.now()}`,
      subject: dto.subject || "Please sign this document",
      message: dto.message || "",
    };

    if (dto.templateId) {
      requestData.template_id = dto.templateId;
    } else if (attachmentId) {
      requestData.attachment_id = attachmentId;
    }

    const requestId = await this.client.create("sign.request", requestData);

    // Add signers (request items)
    for (const signer of dto.signers) {
      await this.addSignerToRequest(requestId, signer);
    }

    // Send signature request if requested
    if (dto.sendSignLink !== false) {
      await this.sendSignRequest(requestId);
    }

    return requestId;
  }

  /**
   * Add a signer to a signature request
   */
  async addSignerToRequest(
    requestId: number,
    signer: {
      partnerId?: number;
      email: string;
      name: string;
      role?: string;
    },
  ): Promise<number> {
    const itemData: Record<string, unknown> = {
      sign_request_id: requestId,
      signer_email: signer.email,
    };

    if (signer.partnerId) {
      itemData.partner_id = signer.partnerId;
    }

    if (signer.role) {
      // Find role by name
      const roles = await this.client.searchRead(
        "sign.item.role",
        [["name", "=", signer.role]],
        ["id"],
        { limit: 1 },
      );
      if (roles.length > 0) {
        itemData.role_id = roles[0].id;
      }
    }

    return await this.client.create("sign.request.item", itemData);
  }

  /**
   * Send signature request to all signers
   */
  async sendSignRequest(requestId: number): Promise<void> {
    await this.client.executeKw("sign.request", "action_sent", [[requestId]]);
  }

  /**
   * Cancel a signature request
   */
  async cancelSignRequest(requestId: number): Promise<void> {
    await this.client.executeKw("sign.request", "action_canceled", [[requestId]]);
  }

  /**
   * Get signature request items (signers)
   */
  async getSignRequestItems(requestId: number): Promise<OdooSignRequestItem[]> {
    return this.client.searchRead<OdooSignRequestItem>(
      "sign.request.item",
      [["sign_request_id", "=", requestId]],
      [
        "sign_request_id",
        "partner_id",
        "role_id",
        "signer_email",
        "state",
        "signing_date",
        "access_token",
        "create_date",
      ],
      { order: "create_date" },
    );
  }

  /**
   * Get signing link for a signer
   */
  async getSigningLink(requestItemId: number): Promise<string> {
    const items = await this.client.read<OdooSignRequestItem>(
      "sign.request.item",
      [requestItemId],
      ["access_token"],
    );

    if (!items[0]?.access_token) {
      throw new Error("Access token not found for sign request item");
    }

    // Return signing URL (you'll need to configure ODOO_URL)
    const odooUrl = process.env.ODOO_URL || "http://localhost:8069";
    return `${odooUrl}/sign/document/${items[0].access_token}`;
  }

  /**
   * Download signed document
   */
  async downloadSignedDocument(requestId: number): Promise<{
    filename: string;
    content: string; // base64
  } | null> {
    const request = await this.getSignRequest(requestId);

    if (!request || request.state !== "signed" || !request.completed_document || !request.attachment_id) {
      return null;
    }

    // Get the completed document attachment
    const attachments = await this.client.read<{ name: string; datas: string }>(
      "ir.attachment",
      [request.attachment_id[0]],
      ["name", "datas"],
    );

    if (!attachments[0]) {
      return null;
    }

    return {
      filename: attachments[0].name,
      content: attachments[0].datas, // base64 encoded
    };
  }

  // ==================== Templates ====================

  /**
   * Get all signature templates
   */
  async getSignTemplates(filters?: {
    active?: boolean;
    createdBy?: number;
  }): Promise<OdooSignTemplate[]> {
    const domain: Array<[string, string, unknown]> = [];

    if (filters?.active !== undefined) {
      domain.push(["active", "=", filters.active]);
    }
    if (filters?.createdBy) {
      domain.push(["create_uid", "=", filters.createdBy]);
    }

    return this.client.searchRead<OdooSignTemplate>(
      "sign.template",
      domain,
      [
        "name",
        "attachment_id",
        "active",
        "sign_item_ids",
        "responsible_count",
        "authorized_ids",
        "tag_ids",
        "favorited_ids",
      ],
      { order: "name" },
    );
  }

  /**
   * Get a single template by ID
   */
  async getSignTemplate(templateId: number): Promise<OdooSignTemplate | null> {
    const templates = await this.client.read<OdooSignTemplate>(
      "sign.template",
      [templateId],
      [
        "name",
        "attachment_id",
        "active",
        "sign_item_ids",
        "responsible_count",
        "authorized_ids",
        "tag_ids",
        "favorited_ids",
      ],
    );
    return templates[0] || null;
  }

  /**
   * Create a signature template
   */
  async createSignTemplate(dto: CreateSignTemplateDTO): Promise<number> {
    let attachmentId = dto.attachmentId;

    // If file content provided, create attachment first
    if (dto.fileContent && dto.fileName) {
      attachmentId = await this.createAttachment(dto.fileName, dto.fileContent);
    }

    if (!attachmentId) {
      throw new Error("Either attachmentId or fileContent must be provided");
    }

    const templateData: Record<string, unknown> = {
      name: dto.name,
      attachment_id: attachmentId,
      active: true,
    };

    const templateId = await this.client.create("sign.template", templateData);

    // Add sign items if provided
    if (dto.signItems && dto.signItems.length > 0) {
      for (const item of dto.signItems) {
        await this.addSignItemToTemplate(templateId, item);
      }
    }

    return templateId;
  }

  /**
   * Add a signature field to a template
   */
  async addSignItemToTemplate(
    templateId: number,
    item: {
      type: string;
      responsibleName: string;
      page: number;
      posX: number;
      posY: number;
      width: number;
      height: number;
      required?: boolean;
      name?: string;
      placeholder?: string;
    },
  ): Promise<number> {
    // Find or create responsible (role)
    let roleId: number;
    const roles = await this.client.searchRead<{ id: number }>(
      "sign.item.role",
      [["name", "=", item.responsibleName]],
      ["id"],
      { limit: 1 },
    );

    if (roles.length > 0) {
      roleId = roles[0].id;
    } else {
      roleId = await this.client.create("sign.item.role", {
        name: item.responsibleName,
      });
    }

    // Find sign item type
    const types = await this.client.searchRead<{ id: number }>(
      "sign.item.type",
      [["name", "=", item.type]],
      ["id"],
      { limit: 1 },
    );

    if (types.length === 0) {
      throw new Error(`Sign item type '${item.type}' not found`);
    }

    const itemData: Record<string, unknown> = {
      template_id: templateId,
      type_id: types[0].id,
      responsible_id: roleId,
      page: item.page,
      posX: item.posX,
      posY: item.posY,
      width: item.width,
      height: item.height,
      required: item.required !== false,
      name: item.name || "",
      placeholder: item.placeholder || "",
    };

    return await this.client.create("sign.item", itemData);
  }

  /**
   * Delete a template
   */
  async deleteSignTemplate(templateId: number): Promise<void> {
    await this.client.unlink("sign.template", [templateId]);
  }

  // ==================== Utilities ====================

  /**
   * Create an attachment from base64 content
   */
  private async createAttachment(fileName: string, base64Content: string): Promise<number> {
    return await this.client.create("ir.attachment", {
      name: fileName,
      datas: base64Content,
      res_model: "sign.request",
      type: "binary",
    });
  }

  /**
   * Get available signature types
   */
  async getSignatureTypes(): Promise<Array<{ id: number; name: string }>> {
    return this.client.searchRead(
      "sign.item.type",
      [],
      ["name"],
      { order: "name" },
    );
  }

  /**
   * Get signature statistics
   */
  async getSignatureStats(): Promise<{
    total: number;
    sent: number;
    signed: number;
    canceled: number;
    pendingSignatures: number;
  }> {
    const allRequests = await this.client.searchRead<OdooSignRequest>(
      "sign.request",
      [],
      ["state", "nb_wait", "nb_closed"],
    );

    const stats = {
      total: allRequests.length,
      sent: 0,
      signed: 0,
      canceled: 0,
      pendingSignatures: 0,
    };

    for (const request of allRequests) {
      if (request.state === "sent") stats.sent++;
      if (request.state === "signed") stats.signed++;
      if (request.state === "canceled") stats.canceled++;
      stats.pendingSignatures += request.nb_wait || 0;
    }

    return stats;
  }
}
