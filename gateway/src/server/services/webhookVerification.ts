import crypto from "node:crypto";
import type { Request } from "express";

export interface WebhookConfig {
  masterSecret: string;
}

export interface WebhookPayload {
  event: string;
  model: string;
  record_id: number;
  organization_id: string;
  user_id: string;
  timestamp: string;
}

/**
 * Verify webhook signature from Odoo
 *
 * Uses derived per-org secrets for security:
 * - Master secret stored in gateway (ODOO_WEBHOOK_SECRET)
 * - Per-org secret derived as: HMAC-SHA256(masterSecret, organizationId)
 * - Odoo signs webhook with derived secret
 * - Gateway derives same secret to verify
 */
export class WebhookVerification {
  private masterSecret: string;

  constructor(config: WebhookConfig) {
    this.masterSecret = config.masterSecret;
  }

  /**
   * Derive per-organization webhook secret from master secret
   * Must match the derivation in database.service.ts
   */
  public deriveOrgSecret(organizationId: string): string {
    return crypto.createHmac("sha256", this.masterSecret).update(organizationId).digest("hex");
  }

  /**
   * Verify the webhook signature using derived per-org secret
   */
  public verify(request: Request, body: string, organizationId: string): boolean {
    const signature = request.headers["x-odoo-signature"] as string;

    if (!signature) {
      return false;
    }

    // Derive the expected secret for this organization
    const orgSecret = this.deriveOrgSecret(organizationId);
    const expectedSignature = this.computeSignature(body, orgSecret);

    return this.secureCompare(signature, expectedSignature);
  }

  /**
   * Compute HMAC-SHA256 signature using provided secret
   */
  private computeSignature(body: string, secret: string): string {
    return crypto.createHmac("sha256", secret).update(body).digest("hex");
  }

  /**
   * Constant-time string comparison to prevent timing attacks
   */
  private secureCompare(a: string, b: string): boolean {
    if (a.length !== b.length) {
      return false;
    }

    return crypto.timingSafeEqual(Buffer.from(a), Buffer.from(b));
  }

  /**
   * Generate a webhook secret (for initial setup)
   */
  public static generateSecret(): string {
    return crypto.randomBytes(32).toString("hex");
  }
}

// Singleton instance
let webhookVerification: WebhookVerification | null = null;

export function getWebhookVerification(): WebhookVerification {
  if (!webhookVerification) {
    const masterSecret = process.env.ODOO_WEBHOOK_SECRET;

    if (!masterSecret) {
      throw new Error("ODOO_WEBHOOK_SECRET environment variable is required");
    }

    webhookVerification = new WebhookVerification({ masterSecret });
  }

  return webhookVerification;
}
