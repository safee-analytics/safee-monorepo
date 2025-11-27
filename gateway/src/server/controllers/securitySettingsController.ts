import { Body, Controller, Get, Put, Request, Route, Security, Tags } from "tsoa";
import type { AuthenticatedRequest } from "../middleware/auth.js";

// Types
interface SecuritySettings {
  twoFactorEnabled: boolean;
  sessionTimeout: string;
  passwordExpiry: string;
  requirePasswordChange: boolean;
  allowMultipleSessions: boolean;
  ipWhitelisting: boolean;
  loginNotifications: boolean;
}

@Route("security")
@Tags("Security")
export class SecuritySettingsController extends Controller {
  @Get("/settings")
  @Security("jwt")
  public async getSecuritySettings(@Request() req: AuthenticatedRequest): Promise<SecuritySettings> {
    // TODO: Implement actual database query
    return {
      twoFactorEnabled: false,
      sessionTimeout: "30m",
      passwordExpiry: "90d",
      requirePasswordChange: false,
      allowMultipleSessions: true,
      ipWhitelisting: false,
      loginNotifications: true,
    };
  }
}
