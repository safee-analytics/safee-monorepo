/**
 * Email Configuration for Better Auth
 * Handles all email-related functionality for authentication
 */

import type { EmailService } from "@safee/database";
import {
  generateOTPEmailHTML,
  generateOTPEmailText,
  generateMagicLinkEmailHTML,
  generateMagicLinkEmailText,
  generateWelcomeEmailHTML,
  generateWelcomeEmailText,
  generateInvitationEmailHTML,
  generateInvitationEmailText,
} from "@safee/database/email-templates";
import type { Logger } from "pino";

export function createEmailConfig(emailService: EmailService | undefined, logger: Logger) {
  const emailFrom = {
    email: process.env.EMAIL_FROM_ADDRESS ?? "noreply@safee.local",
    name: process.env.EMAIL_FROM_NAME ?? "Safee Analytics",
  };

  const emailReplyTo = {
    email: process.env.EMAIL_REPLY_TO ?? process.env.EMAIL_FROM_ADDRESS ?? "support@safee.local",
    name: "Safee Support",
  };

  return {
    magicLink: {
      sendMagicLink: async ({ email, url }: { email: string; url: string }) => {
        if (!emailService) {
          logger.warn({ email }, "Email service not configured, skipping magic link email");
          return;
        }

        await emailService.sendEmail({
          to: [{ email }],
          from: emailFrom,
          replyTo: emailReplyTo,
          subject: "Sign In to Safee Analytics",
          html: generateMagicLinkEmailHTML(url),
          text: generateMagicLinkEmailText(url),
        });

        logger.info({ email }, "Magic link email sent successfully");
      },
    },

    emailOTP: {
      async sendVerificationOTP({
        email,
        otp,
        type,
      }: {
        email: string;
        otp: string;
        type: "sign-in" | "email-verification" | "forget-password";
      }) {
        if (!emailService) {
          logger.warn({ email, type }, "Email service not configured, skipping OTP email");
          return;
        }

        const subjectMap: Record<typeof type, string> = {
          "sign-in": "Sign In Verification Code",
          "email-verification": "Email Verification Code",
          "forget-password": "Password Reset Code",
        };
        const subject = subjectMap[type];

        await emailService.sendEmail({
          to: [{ email }],
          from: emailFrom,
          replyTo: emailReplyTo,
          subject,
          html: generateOTPEmailHTML(otp, type),
          text: generateOTPEmailText(otp, type),
        });

        logger.info({ email, type }, "OTP email sent successfully");
      },
    },

    welcomeEmail: {
      async sendWelcomeEmail({ email, name }: { email: string; name: string }) {
        if (!emailService) {
          logger.warn({ email }, "Email service not configured, skipping welcome email");
          return;
        }

        await emailService.sendEmail({
          to: [{ email, name }],
          from: emailFrom,
          replyTo: emailReplyTo,
          subject: "Welcome to Safee Analytics 👋",
          html: generateWelcomeEmailHTML({
            userName: name,
            userEmail: email,
            isFirstOrganization: true,
          }),
          text: generateWelcomeEmailText({
            userName: name,
            userEmail: email,
            isFirstOrganization: true,
          }),
        });

        logger.info({ email }, "Welcome email sent successfully");
      },
    },

    invitationEmail: {
      async sendInvitationEmail(data: {
        id: string;
        email: string;
        role: string;
        organization: { id: string; name: string };
        inviter: { user: { name: string } };
      }) {
        if (!emailService) {
          logger.warn(
            { email: data.email, organizationId: data.organization.id },
            "Email service not configured, skipping invitation email",
          );
          return;
        }

        const frontendUrl = process.env.FRONTEND_URL ?? "http://app.localhost:8080";
        const invitationUrl = `${frontendUrl}/accept-invitation/${data.id}`;

        await emailService.sendEmail({
          to: [{ email: data.email }],
          from: emailFrom,
          replyTo: emailReplyTo,
          subject: `You've been invited to join ${data.organization.name} on Safee Analytics`,
          html: generateInvitationEmailHTML({
            inviterName: data.inviter.user.name,
            organizationName: data.organization.name,
            invitationUrl,
            role: data.role,
          }),
          text: generateInvitationEmailText({
            inviterName: data.inviter.user.name,
            organizationName: data.organization.name,
            invitationUrl,
            role: data.role,
          }),
        });

        logger.info(
          { email: data.email, organizationId: data.organization.id, role: data.role },
          "Invitation email sent successfully",
        );
      },
    },
  };
}
