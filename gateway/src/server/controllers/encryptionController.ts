import { Controller, Get, Post, Delete, Route, Tags, Security, Request, Body, Path } from "tsoa";
import type { AuthenticatedRequest } from "../middleware/auth.js";
import { ClientEncryptionService } from "../services/clientEncryption.service.js";
import { getServerContext } from "../serverContext.js";
import { schema, eq } from "@safee/database";

interface SetupEncryptionRequest {
  wrappedOrgKey: string;
  salt: string;
  iv: string;
}

interface GrantAuditorAccessRequest {
  auditorUserId: string;
  wrappedOrgKey: string;
  expiresAt?: string; // ISO date string
}

@Route("api/v1/encryption")
@Tags("Encryption")
export class EncryptionController extends Controller {
  /**
   * Get organization encryption status and key data (if enabled)
   */
  @Get("/status")
  @Security("jwt")
  public async getEncryptionStatus(@Request() request: AuthenticatedRequest): Promise<{
    enabled: boolean;
    keyData?: {
      id: string;
      salt: string;
      iv: string;
      keyVersion: number;
      derivationParams: {
        iterations: number;
        hash: string;
        keyLength: number;
      };
      wrappedOrgKey: string;
    };
  }> {
    const session = request.betterAuthSession!;
    const orgId = session.session.activeOrganizationId;

    if (!orgId) {
      throw new Error("No active organization");
    }

    const context = getServerContext();
    const service = new ClientEncryptionService(context.drizzle);

    const keyData = await service.getOrgEncryptionKey(orgId);

    if (!keyData) {
      return { enabled: false };
    }

    return {
      enabled: true,
      keyData: {
        id: keyData.id,
        salt: keyData.salt,
        iv: keyData.iv,
        keyVersion: keyData.keyVersion,
        derivationParams: keyData.derivationParams,
        wrappedOrgKey: keyData.wrappedOrgKey,
      },
    };
  }

  /**
   * Enable encryption for organization (admin only)
   */
  @Post("/setup")
  @Security("jwt")
  public async setupEncryption(
    @Request() request: AuthenticatedRequest,
    @Body() body: SetupEncryptionRequest,
  ): Promise<{ success: boolean; keyId: string }> {
    const session = request.betterAuthSession!;
    const orgId = session.session.activeOrganizationId;
    const userId = session.user.id;

    if (!orgId) {
      throw new Error("No active organization");
    }

    const context = getServerContext();
    const service = new ClientEncryptionService(context.drizzle);

    // Check if already enabled
    const existing = await service.getOrgEncryptionKey(orgId);
    if (existing) {
      throw new Error("Encryption already enabled");
    }

    // Create encryption key
    const key = await service.createOrgEncryptionKey({
      organizationId: orgId,
      wrappedOrgKey: body.wrappedOrgKey,
      salt: body.salt,
      iv: body.iv,
    });

    // Update organization
    await context.drizzle
      .update(schema.organizations)
      .set({
        encryptionEnabled: true,
        encryptionEnabledAt: new Date(),
        encryptionEnabledBy: userId,
      })
      .where(eq(schema.organizations.id, orgId));

    return { success: true, keyId: key.id };
  }

  /**
   * Grant auditor access to encrypted files (admin only)
   */
  @Post("/auditor-access")
  @Security("jwt")
  public async grantAuditorAccess(
    @Request() request: AuthenticatedRequest,
    @Body() body: GrantAuditorAccessRequest,
  ): Promise<{ success: boolean; accessId: string }> {
    const session = request.betterAuthSession!;
    const orgId = session.session.activeOrganizationId;
    const userId = session.user.id;

    if (!orgId) {
      throw new Error("No active organization");
    }

    const context = getServerContext();
    const service = new ClientEncryptionService(context.drizzle);

    const keyData = await service.getOrgEncryptionKey(orgId);
    if (!keyData) {
      throw new Error("Encryption not enabled");
    }

    const access = await service.grantAuditorAccess({
      organizationId: orgId,
      auditorUserId: body.auditorUserId,
      grantedByUserId: userId,
      encryptionKeyId: keyData.id,
      wrappedOrgKey: body.wrappedOrgKey,
      expiresAt: body.expiresAt ? new Date(body.expiresAt) : undefined,
    });

    return { success: true, accessId: access.id };
  }

  /**
   * Get auditor access for current user in current org
   */
  @Get("/auditor-access")
  @Security("jwt")
  public async getMyAuditorAccess(@Request() request: AuthenticatedRequest): Promise<{
    hasAccess: boolean;
    wrappedOrgKey?: string;
    expiresAt?: string;
  }> {
    const session = request.betterAuthSession!;
    const orgId = session.session.activeOrganizationId;
    const userId = session.user.id;

    if (!orgId) {
      throw new Error("No active organization");
    }

    const context = getServerContext();
    const service = new ClientEncryptionService(context.drizzle);

    const access = await service.getAuditorAccess(orgId, userId);

    if (!access) {
      return { hasAccess: false };
    }

    return {
      hasAccess: true,
      wrappedOrgKey: access.wrappedOrgKey,
      expiresAt: access.expiresAt?.toISOString(),
    };
  }

  /**
   * Revoke auditor access (admin only)
   */
  @Delete("/auditor-access/{accessId}")
  @Security("jwt")
  public async revokeAuditorAccess(
    @Request() request: AuthenticatedRequest,
    @Path() accessId: string,
  ): Promise<{ success: boolean }> {
    const session = request.betterAuthSession!;
    const userId = session.user.id;

    const context = getServerContext();
    const service = new ClientEncryptionService(context.drizzle);

    await service.revokeAuditorAccess(accessId, userId);

    return { success: true };
  }
}
