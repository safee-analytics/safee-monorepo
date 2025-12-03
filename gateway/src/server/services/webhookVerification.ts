import crypto from "crypto";
import type { Request } from "express";

export interface WebhookConfig {
  secret: string;
}

/**
 * Verify webhook signature from Odoo
 *
 * Odoo should send a signature in the X-Odoo-Signature header
 * computed as: HMAC-SHA256(webhook_secret, request_body)
 */
export class WebhookVerification {
  private secret: string;

  constructor(config: WebhookConfig) {
    this.secret = config.secret;
  }

  /**
   * Verify the webhook signature
   */
  public verify(request: Request, body: string): boolean {
    const signature = request.headers["x-odoo-signature"] as string;

    if (!signature) {
      return false;
    }

    const expectedSignature = this.computeSignature(body);
    return this.secureCompare(signature, expectedSignature);
  }

  /**
   * Compute HMAC-SHA256 signature
   */
  private computeSignature(body: string): string {
    return crypto.createHmac("sha256", this.secret).update(body).digest("hex");
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
    const secret = process.env.ODOO_WEBHOOK_SECRET;

    if (!secret) {
      throw new Error("ODOO_WEBHOOK_SECRET environment variable is required");
    }

    webhookVerification = new WebhookVerification({ secret });
  }

  return webhookVerification;
}
