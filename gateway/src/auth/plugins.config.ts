/**
 * Better Auth Plugins Configuration
 * Configures all authentication plugins for Safee Analytics
 */

import {
  organization,
  openAPI,
  admin,
  username,
  lastLoginMethod,
  phoneNumber,
  twoFactor,
  magicLink,
  emailOTP,
  genericOAuth,
  apiKey,
} from "better-auth/plugins";
import type { EmailService } from "@safee/database";
import type { Logger } from "pino";
import { organizationHooks } from "./organization.hooks.js";
import { ac } from "./accessControl.js";
import { createEmailConfig } from "./email.config.js";

export function createPluginsConfig(emailService: EmailService | undefined, logger: Logger) {
  const emailConfig = createEmailConfig(emailService, logger);

  return [
    openAPI(),
    admin(),
    username(),
    twoFactor(),
    phoneNumber({
      sendOTP: ({ phoneNumber: _phoneNumber, code: _code }, _request) => {
        // TODO: Implement SMS OTP sending
        logger.info({ phoneNumber: _phoneNumber }, "SMS OTP would be sent here");
      },
    }),
    magicLink(emailConfig.magicLink),
    emailOTP(emailConfig.emailOTP),
    apiKey(),
    genericOAuth({
      config: [
        {
          providerId: "provider-id",
          clientId: "test-client-id",
          clientSecret: "test-client-secret",
          discoveryUrl: "https://auth.example.com/.well-known/openid-configuration",
          // Add more providers as needed
        },
      ],
    }),
    lastLoginMethod({
      storeInDatabase: true,
    }),
    organization({
      organizationHooks,
      teams: {
        enabled: true,
        maximumTeams: 100,
        allowRemovingAllTeams: false,
      },
      dynamicAccessControl: {
        enabled: true,
        ac,
        maximumRolesPerOrganization: async () => {
          // TODO: Make this plan-based in the future
          return 50;
        },
      },
      sendInvitationEmail: (data) => emailConfig.invitationEmail.sendInvitationEmail(data),
    }),
  ];
}
