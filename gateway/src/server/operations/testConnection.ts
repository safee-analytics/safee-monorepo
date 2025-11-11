import type { DrizzleClient } from "@safee/database";
import { ConnectorManager } from "../services/connectors/connector.manager.js";

export async function testConnection(
  drizzle: DrizzleClient,
  connectorId: string,
  organizationId: string,
): Promise<{
  status: string;
  message: string;
  latency?: number;
  metadata?: Record<string, unknown>;
  error?: string;
}> {
  const connectorManager = new ConnectorManager(drizzle);

  return await connectorManager.testConnection(connectorId, organizationId);
}
