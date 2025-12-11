import { Route, Tags, Post, Body, Request, Controller, NoSecurity } from "tsoa";
import { recordEmailBounce, connect } from "@safee/database";
import { logger } from "../utils/logger.js";
import type { Request as ExpressRequest } from "express";
import crypto from "node:crypto";

const { drizzle } = connect("gateway-email-webhooks");

interface ResendWebhookPayload {
  type: string;
  created_at: string;
  data: {
    email_id?: string;
    from?: string;
    to?: string[];
    subject?: string;
    created_at?: string;
    // Bounce specific
    bounce_type?: "hard" | "soft";
    bounce_subtype?: string;
    // Complaint specific
    complaint_type?: string;
  };
}

@Route("webhooks/email")
@Tags("Email Webhooks")
export class EmailWebhookController extends Controller {
  /**
   * Verify webhook signature from Resend
   */
  // eslint-disable-next-line safee/tsoa-security
  private verifyWebhookSignature(request: ExpressRequest, payload: ResendWebhookPayload): boolean {
    const signature = request.headers["svix-signature"] as string;
    const timestamp = request.headers["svix-timestamp"] as string;
    const webhookId = request.headers["svix-id"] as string;

    if (!signature || !timestamp || !webhookId) {
      logger.warn("Missing webhook signature headers");
      return false;
    }

    const webhookSecret = process.env.RESEND_WEBHOOK_SECRET;
    if (!webhookSecret) {
      logger.warn("RESEND_WEBHOOK_SECRET not configured");
      return true; // Allow in development
    }

    try {
      // Resend uses Svix for webhook signatures
      const signedContent = `${webhookId}.${timestamp}.${JSON.stringify(payload)}`;
      const expectedSignature = crypto
        .createHmac("sha256", webhookSecret.split("_")[1] || webhookSecret)
        .update(signedContent)
        .digest("base64");

      // Extract signature from header (format: "v1,signature1 v1,signature2")
      const signatures = signature.split(" ").map((sig) => sig.split(",")[1]);

      return signatures.some((sig) =>
        crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(expectedSignature)),
      );
    } catch (err) {
      logger.error({ error: err }, "Error verifying webhook signature");
      return false;
    }
  }

  /**
   * Handle Resend webhook events
   * @summary Receive email bounce and delivery notifications from Resend
   */
  @NoSecurity()
  @Post("/resend")
  public async handleResendWebhook(
    @Request() request: ExpressRequest,
    @Body() payload: ResendWebhookPayload,
  ): Promise<{ success: boolean }> {
    logger.info({ type: payload.type }, "Received Resend webhook");

    // Verify signature
    if (!this.verifyWebhookSignature(request, payload)) {
      this.setStatus(401);
      return { success: false };
    }

    const { type, data } = payload;
    const email = data.to?.[0];

    if (!email) {
      logger.warn({ type, data }, "No email address in webhook payload");
      return { success: true };
    }

    try {
      switch (type) {
        case "email.bounced":
          await recordEmailBounce(
            { drizzle, logger },
            {
              email,
              bounceType: data.bounce_type === "hard" ? "hard" : "soft",
              reason: data.bounce_subtype,
              messageId: data.email_id,
            },
          );
          logger.info({ email, bounceType: data.bounce_type }, "Email bounce recorded");
          break;

        case "email.complained":
          await recordEmailBounce(
            { drizzle, logger },
            {
              email,
              bounceType: "complaint",
              reason: data.complaint_type,
              messageId: data.email_id,
            },
          );
          logger.info({ email }, "Email complaint recorded");
          break;

        case "email.delivered":
          logger.info({ email, messageId: data.email_id }, "Email delivered successfully");
          break;

        case "email.opened":
          logger.info({ email, messageId: data.email_id }, "Email opened");
          break;

        case "email.clicked":
          logger.info({ email, messageId: data.email_id }, "Email link clicked");
          break;

        default:
          logger.info({ type }, "Unhandled webhook event type");
      }

      return { success: true };
    } catch (err) {
      logger.error({ error: err, type, email }, "Error processing email webhook");
      this.setStatus(500);
      return { success: false };
    }
  }
}
