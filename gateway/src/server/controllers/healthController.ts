import { Controller, Get, Route, Tags, NoSecurity } from "tsoa";

interface HealthCheck {
  status: "ok" | "error";
  timestamp: string;
  uptime: number;
  version: string;
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
      version: process.env.npm_package_version || "1.0.0",
    };
  }
}
