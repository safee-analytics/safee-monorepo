import { Request as ExRequest } from "express";
import jwt from "jsonwebtoken";

export interface AuthenticatedRequest extends ExRequest {
  user?: {
    id: string;
    email: string;
    role: string;
    organizationId: string;
  };
}

export function expressAuthentication(
  request: ExRequest,
  securityName: string,
  _scopes?: string[],
): Promise<unknown> {
  if (securityName === "jwt") {
    const token = request.headers.authorization?.replace("Bearer ", "");

    if (!token) {
      return Promise.reject(new Error("No token provided"));
    }

    return new Promise((resolve, reject) => {
      if (!process.env.JWT_SECRET) {
        reject(new Error("JWT_SECRET not configured"));
        return;
      }

      jwt.verify(token, process.env.JWT_SECRET as string, (err: unknown, decoded: unknown) => {
        if (err) {
          reject(err);
        } else {
          // Attach user to request
          (request as AuthenticatedRequest).user = decoded as AuthenticatedRequest["user"];
          resolve(decoded);
        }
      });
    });
  }

  return Promise.reject(new Error("Unknown security name"));
}
