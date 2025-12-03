import { Controller, Get, Path, Post, Request, Route, Security, Tags } from "tsoa";
import type { AuthenticatedRequest } from "../middleware/auth.js";
import { getServerContext } from "../serverContext.js";

// Types
interface Integration {
  id: string;
  name: string;
  description: string;
  logo: string;
  connected: boolean;
  category: "accounting" | "communication" | "storage" | "productivity";
  configUrl?: string;
}

@Route("integrations")
@Tags("Integrations")
export class IntegrationsController extends Controller {
  @Get("/")
  @Security("jwt")
  public async listIntegrations(@Request() _req: AuthenticatedRequest): Promise<Integration[]> {
    // Return mock integrations
    return [
      {
        id: "odoo",
        name: "Odoo ERP",
        description: "Connect to Odoo for accounting and business management",
        logo: "/integrations/odoo.svg",
        connected: false,
        category: "accounting",
      },
      {
        id: "slack",
        name: "Slack",
        description: "Send notifications to Slack channels",
        logo: "/integrations/slack.svg",
        connected: false,
        category: "communication",
      },
    ];
  }

  @Post("/{integrationId}/connect")
  @Security("jwt")
  public async connectIntegration(
    @Request() _req: AuthenticatedRequest,
    @Path() integrationId: string,
  ): Promise<{ success: boolean }> {
    // TODO: Implement actual integration connection
    const { logger } = getServerContext();
    logger.debug({ integrationId }, "Connecting integration");
    return { success: true };
  }

  @Post("/{integrationId}/disconnect")
  @Security("jwt")
  public async disconnectIntegration(
    @Request() _req: AuthenticatedRequest,
    @Path() integrationId: string,
  ): Promise<{ success: boolean }> {
    // TODO: Implement actual integration disconnection
    const { logger } = getServerContext();
    logger.debug({ integrationId }, "Disconnecting integration");
    return { success: true };
  }
}
