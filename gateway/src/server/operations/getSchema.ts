import type { DrizzleClient } from "@safee/database";
import { ConnectorManager } from "../services/connectors/connector.manager.js";
import { DataProxyService } from "../services/connectors/data-proxy.service.js";
import type { SchemaResponse } from "../dtos/connector.js";

export async function getSchema(
  drizzle: DrizzleClient,
  organizationId: string,
  connectorId: string,
): Promise<SchemaResponse> {
  const connectorManager = new ConnectorManager(drizzle);
  const dataProxyService = new DataProxyService(connectorManager);

  const schema = await dataProxyService.getSchema(organizationId, connectorId);

  return {
    tables: schema.tables.map((t) => ({
      schema: t.schema,
      name: t.name,
      type: t.type as "table" | "view",
    })),
  };
}
