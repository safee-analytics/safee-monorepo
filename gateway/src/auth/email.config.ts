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
  generatePasswordResetEmailHTML,
  generatePasswordResetEmailText,
  generateChangeEmailConfirmationHTML,
  generateChangeEmailConfirmationText,
  generateDeleteAccountVerificationHTML,
  generateDeleteAccountVerificationText,
  generateEmailVerificationHTML,
  generateEmailVerificationText,
} from "@safee/database/email-templates";
import type { Logger } from "pino";

export function createEmailConfig(emailService: EmailService | undefined, logger: Logger) {
  const emailFrom = {
    email: process.env.EMAIL_FROM_ADDRESS || "noreply@safee.local",
    name: process.env.EMAIL_FROM_NAME || "Safee Analytics",
  };

  const emailReplyTo = {
    email: process.env.EMAIL_REPLY_TO || process.env.EMAIL_FROM_ADDRESS || "support@safee.local",
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

        const subject =
          type === "sign-in"
            ? "Sign In Verification Code"
            : type === "email-verification"
              ? "Email Verification Code"
              : "Password Reset Code";

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

        const frontendUrl = process.env.FRONTEND_URL || "http://app.localhost:8080";
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

    passwordReset: {
      async sendPasswordResetEmail({
        email,
        name,
        resetUrl,
      }: {
        email: string;
        name: string;
        resetUrl: string;
      }) {
        if (!emailService) {
          logger.warn({ email }, "Email service not configured, skipping password reset email");
          return;
        }

        await emailService.sendEmail({
          to: [{ email, name }],
          from: emailFrom,
          replyTo: emailReplyTo,
          subject: "Reset Your Password - Safee Analytics",
          html: generatePasswordResetEmailHTML({
            userName: name,
            resetUrl,
            expiresIn: "1 hour",
          }),
          text: generatePasswordResetEmailText({
            userName: name,
            resetUrl,
            expiresIn: "1 hour",
          }),
        });

        logger.info({ email }, "Password reset email sent successfully");
      },
    },

    changeEmail: {
      async sendChangeEmailConfirmation({
        currentEmail,
        newEmail,
        name,
        confirmationUrl,
      }: {
        currentEmail: string;
        newEmail: string;
        name: string;
        confirmationUrl: string;
      }) {
        if (!emailService) {
          logger.warn(
            { currentEmail, newEmail },
            "Email service not configured, skipping change email confirmation",
          );
          return;
        }

        // Send to the NEW email address for verification
        await emailService.sendEmail({
          to: [{ email: newEmail, name }],
          from: emailFrom,
          replyTo: emailReplyTo,
          subject: "Confirm Your New Email Address - Safee Analytics",
          html: generateChangeEmailConfirmationHTML({
            userName: name,
            currentEmail,
            newEmail,
            confirmationUrl,
            expiresIn: "1 hour",
          }),
          text: generateChangeEmailConfirmationText({
            userName: name,
            currentEmail,
            newEmail,
            confirmationUrl,
            expiresIn: "1 hour",
          }),
        });

        logger.info({ currentEmail, newEmail }, "Change email confirmation sent successfully");
      },
    },

    deleteAccount: {
      async sendDeleteAccountVerification({
        email,
        name,
        verificationUrl,
      }: {
        email: string;
        name: string;
        verificationUrl: string;
      }) {
        if (!emailService) {
          logger.warn({ email }, "Email service not configured, skipping delete account verification");
          return;
        }

        await emailService.sendEmail({
          to: [{ email, name }],
          from: emailFrom,
          replyTo: emailReplyTo,
          subject: "⚠️ Verify Account Deletion - Safee Analytics",
          html: generateDeleteAccountVerificationHTML({
            userName: name,
            userEmail: email,
            verificationUrl,
            expiresIn: "24 hours",
          }),
          text: generateDeleteAccountVerificationText({
            userName: name,
            userEmail: email,
            verificationUrl,
            expiresIn: "24 hours",
          }),
        });

        logger.info({ email }, "Delete account verification email sent successfully");
      },
    },

    emailVerification: {
      async sendEmailVerification({
        email,
        name,
        verificationUrl,
      }: {
        email: string;
        name: string;
        verificationUrl: string;
      }) {
        if (!emailService) {
          logger.warn({ email }, "Email service not configured, skipping email verification");
          return;
        }

        await emailService.sendEmail({
          to: [{ email, name }],
          from: emailFrom,
          replyTo: emailReplyTo,
          subject: "Verify Your Email - Safee Analytics",
          html: generateEmailVerificationHTML({
            userName: name,
            verificationUrl,
            expiresIn: "24 hours",
          }),
          text: generateEmailVerificationText({
            userName: name,
            verificationUrl,
            expiresIn: "24 hours",
          }),
        });

        logger.info({ email }, "Email verification sent successfully");
      },
    },
  };
}
