import { Controller, Get, Route, Tags, NoSecurity } from "tsoa";
import { odoo } from "@safee/database";
import { ODOO_URL } from "../../env.js";

interface HealthCheck {
  status: "ok" | "error";
  timestamp: string;
  uptime: number;
  version: string;
}

interface OdooHealthCheck {
  status: "ok" | "error";
  timestamp: string;
  odooUrl: string;
  accessible: boolean;
  databaseCount?: number;
  error?: string;
}

@Route("health")
@Tags("Health")
export class HealthController extends Controller {
  @Get("/")
  @NoSecurity()
  public async getHealth(): Promise<HealthCheck> {
    return {
      status: "ok",
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      version: process.env.npm_package_version ?? "1.0.0",
    };
  }

  @Get("/odoo")
  @NoSecurity()
  public async getOdooHealth(): Promise<OdooHealthCheck> {
    const timestamp = new Date().toISOString();

    try {
      const client = new odoo.OdooClient(ODOO_URL);
      const databases = await client.listDatabases();

      return {
        status: "ok",
        timestamp,
        odooUrl: ODOO_URL,
        accessible: true,
        databaseCount: databases.length,
      };
    } catch (error) {
      return {
        status: "error",
        timestamp,
        odooUrl: ODOO_URL,
        accessible: false,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }
}
