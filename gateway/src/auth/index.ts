import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import {
  connect,
  schema,
  EmailService,
  ResendEmailProvider,
  autoCreateFreeSubscription,
} from "@safee/database";
import { randomUUID } from "node:crypto";
import { createSessionHooks } from "./session.hooks.js";
import { createPluginsConfig } from "./plugins.config.js";
import { createEmailConfig } from "./email.config.js";
import { sessionConfig } from "./schema.config.js";
import { pino } from "pino";

const logger = pino({ name: "auth" });
const emailFromAddress = process.env.EMAIL_FROM_ADDRESS ?? "noreply@safee.dev";
const emailFromName = process.env.EMAIL_FROM_NAME ?? "Safee Analytics";
const betterAuthUrl = process.env.BETTER_AUTH_URL ?? "http://app.localhost:8080/api/v1";
const cookieDomain = process.env.COOKIE_DOMAIN ?? "localhost";
const googleClientId = process.env.GOOGLE_CLIENT_ID ?? "";
const googleClientSecret = process.env.GOOGLE_CLIENT_SECRET ?? "";
const corsOrigin = process.env.CORS_ORIGIN ?? "http://app.localhost:8080";
const frontendUrl = process.env.FRONTEND_URL ?? "http://app.localhost:8080";
const landingUrl = process.env.LANDING_URL ?? "http://localhost:8080";
const requireEmailVerification = process.env.REQUIRE_EMAIL_VERIFICATION === "true";

const { drizzle } = connect("better-auth");

let emailService: EmailService | undefined;
if (process.env.RESEND_API_KEY) {
  const resendProvider = new ResendEmailProvider({
    apiKey: process.env.RESEND_API_KEY,
    senderAddress: emailFromAddress,
    senderName: emailFromName,
  });
  emailService = new EmailService({ drizzle, logger, emailProvider: resendProvider });
}

export const auth = betterAuth({
  appName: "Safee Analytics",
  baseURL: betterAuthUrl,
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
          verificationUrl: url,
        });
      },
    },
  },

  session: {
    modelName: "session",
    expiresIn: sessionConfig.expiresIn,
    updateAge: sessionConfig.updateAge,
    cookieCache: sessionConfig.cookieCache,
    cookieOptions: {
      sameSite: "lax",
      domain: cookieDomain,
      path: "/",
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
    },
  },

  emailAndPassword: {
    enabled: true,
    requireEmailVerification,
    minPasswordLength: 8,
    maxPasswordLength: 128,
    autoSignIn: true,
    sendVerificationEmail: async ({
      user,
      url,
    }: {
      user: { id: string; email: string; name: string };
      url: string;
    }) => {
      if (!emailService) {
        logger.warn({ userId: user.id }, "Email service not configured");
        return;
      }

      const emailConfig = createEmailConfig(emailService, logger);
      await emailConfig.emailVerification.sendEmailVerification({
        email: user.email,
        name: user.name,
        verificationUrl: url,
      });
    },
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
    emailVerificationTokenExpiresIn: 86400, // 24 hours
    resetPasswordTokenExpiresIn: 3600, // 1 hour
  },

  socialProviders: {
    google: {
      clientId: googleClientId,
      clientSecret: googleClientSecret,
      redirectURI: `${betterAuthUrl}/callback/google`,
      enabled: !!process.env.GOOGLE_CLIENT_ID,
    },
  },

  plugins: createPluginsConfig(emailService, logger),

  databaseHooks: {
    ...createSessionHooks(drizzle),
    user: {
      create: {
        after: async (user) => {
          try {
            await autoCreateFreeSubscription({ drizzle, logger }, user.id);
            logger.info({ userId: user.id }, "Free subscription created for new user");
          } catch (err) {
            logger.error({ error: err, userId: user.id }, "Failed to create free subscription for new user");
          }

          if (emailService && user.email) {
            try {
              const emailConfig = createEmailConfig(emailService, logger);
              await emailConfig.welcomeEmail.sendWelcomeEmail({
                email: user.email,
                name: user.name,
              });
              logger.info({ userId: user.id, email: user.email }, "Welcome email sent to new user");
            } catch (err) {
              logger.error({ error: err, userId: user.id }, "Failed to send welcome email");
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
    corsOrigin,
    frontendUrl,
    landingUrl,
    process.env.ADMIN_URL ?? "http://localhost:3003",
    "http://localhost:3000",
    "http://localhost:3003",
    "http://localhost:8080",
    "http://app.localhost:8080",
    "http://api.localhost:8080",
    "http://admin.localhost:8080",
    "https://safee.dev",
    "https://app.safee.dev",
    "https://admin.safee.dev",
  ],
});

export type Auth = typeof auth;
export type Session = typeof auth.$Infer.Session;
export type AuthUser = Session["user"];
