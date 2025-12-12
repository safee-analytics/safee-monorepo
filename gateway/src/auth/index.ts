import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { connect, schema, EmailService, ResendEmailProvider } from "@safee/database";
import { randomUUID } from "crypto";
import { createSessionHooks } from "./session.hooks.js";
import { createPluginsConfig } from "./plugins.config.js";
import { createEmailConfig } from "./email.config.js";
import { sessionConfig } from "./schema.config.js";
import pino from "pino";

const logger = pino({ name: "auth" });

const { drizzle } = connect("better-auth");

let emailService: EmailService | undefined;
if (process.env.RESEND_API_KEY) {
  const resendProvider = new ResendEmailProvider({
    apiKey: process.env.RESEND_API_KEY,
    senderAddress: process.env.EMAIL_FROM_ADDRESS || "noreply@safee.dev",
    senderName: process.env.EMAIL_FROM_NAME || "Safee Analytics",
  });
  emailService = new EmailService({ drizzle, logger, emailProvider: resendProvider });
}

export const auth = betterAuth({
  appName: "Safee Analytics",
  baseURL: process.env.BETTER_AUTH_URL || "http://app.localhost:8080/api/v1",
  // experimental: { joins: true },

  database: drizzleAdapter(drizzle, {
    provider: "pg",
    usePlural: true,
    schema: {
      ...schema,
      accounts: schema.oauthAccounts,
    },
  }),

  user: {
    modelName: "user",
    changeEmail: {
      enabled: true,
      sendChangeEmailConfirmation: async ({
        user,
        newEmail,
        url,
      }: {
        user: { id: string; email: string; name: string };
        newEmail: string;
        url: string;
        token: string;
      }) => {
        if (!emailService) {
          logger.warn({ userId: user.id, newEmail }, "Email service not configured");
          return;
        }

        const emailConfig = createEmailConfig(emailService, logger);
        await emailConfig.changeEmail.sendChangeEmailConfirmation({
          currentEmail: user.email,
          newEmail,
          name: user.name,
          confirmationUrl: url,
        });
      },
    },
    deleteUser: {
      enabled: true,
      sendDeleteAccountVerification: async ({
        user,
        url,
      }: {
        user: { id: string; email: string; name: string };
        url: string;
        token: string;
      }) => {
        if (!emailService) {
          logger.warn({ userId: user.id }, "Email service not configured");
          return;
        }

        const emailConfig = createEmailConfig(emailService, logger);
        await emailConfig.deleteAccount.sendDeleteAccountVerification({
          email: user.email,
          name: user.name,
          verificationUrl: url, // URL already includes the token
        });
      },
    },
  },

  // Session configuration
  session: {
    modelName: "session",
    expiresIn: sessionConfig.expiresIn,
    updateAge: sessionConfig.updateAge,
    cookieCache: sessionConfig.cookieCache,
    cookieOptions: {
      sameSite: "lax",
      domain: process.env.COOKIE_DOMAIN || "app.localhost",
      path: "/",
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
    },
  },

  // Email and password configuration
  emailAndPassword: {
    enabled: true,
    requireEmailVerification: false, // TODO: Enable in production
    minPasswordLength: 8,
    maxPasswordLength: 128,
    autoSignIn: true,
    sendResetPassword: async ({ user, url }) => {
      if (!emailService) {
        logger.warn({ userId: user.id }, "Email service not configured");
        return;
      }

      const emailConfig = createEmailConfig(emailService, logger);
      await emailConfig.passwordReset.sendPasswordResetEmail({
        email: user.email,
        name: user.name,
        resetUrl: url,
      });
    },
    resetPasswordTokenExpiresIn: 3600,
  },

  socialProviders: {
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID || "",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || "",
      redirectURI: `${process.env.BETTER_AUTH_URL}/callback/google`,
      enabled: !!process.env.GOOGLE_CLIENT_ID,
    },
  },

  plugins: createPluginsConfig(emailService, logger),

  databaseHooks: {
    ...createSessionHooks(drizzle),
    user: {
      create: {
        after: async (user) => {
          // Send welcome email to new users
          if (emailService && user.email) {
            try {
              const emailConfig = createEmailConfig(emailService, logger);
              await emailConfig.welcomeEmail.sendWelcomeEmail({
                email: user.email,
                name: user.name,
              });
              logger.info({ userId: user.id, email: user.email }, "Welcome email sent to new user");
            } catch (error) {
              logger.error({ error, userId: user.id }, "Failed to send welcome email");
            }
          }
        },
      },
    },
  },
  advanced: {
    useSecureCookies: process.env.NODE_ENV === "production",
    cookiePrefix: "safee-auth",
    crossSubDomainCookies: {
      enabled: true,
    },
    database: {
      generateId: () => randomUUID(),
    },
  },
  trustedOrigins: [
    process.env.CORS_ORIGIN || "http://app.localhost:8080",
    process.env.FRONTEND_URL || "http://app.localhost:8080",
    process.env.LANDING_URL || "http://localhost:8080",
    "http://localhost:3000",
    "http://localhost:8080",
    "http://app.localhost:8080",
    "https://safee.dev",
    "https://app.safee.dev",
  ],
});

// Export types for client inference
export type Auth = typeof auth;
export type Session = typeof auth extends { $Infer: { Session: infer S } } ? S : never;
export type AuthUser = Session extends { user: infer U } ? U : never;
