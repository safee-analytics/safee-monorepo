import { Request as ExRequest } from "express";
export interface AuthenticatedRequest extends ExRequest {
  user?: {
    id: string;
    email: string;
    role: string;
    organizationId: string;
  };
}
export declare function expressAuthentication(
  request: ExRequest,
  securityName: string,
  _scopes?: string[],
): Promise<unknown>;
