import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { organization, openAPI } from "better-auth/plugins";
import { createAuthMiddleware, APIError } from "better-auth/api";
import { DrizzleClient, schema, createOrganization } from "@safee/database";
import { randomUUID } from "crypto";
import { logger } from "./server/utils/logger.js";
import { odooDatabaseService } from "./server/services/odoo/database.service.js";
import { odooUserProvisioningService } from "./server/services/odoo/user-provisioning.service.js";

let authInstance: ReturnType<typeof betterAuth> | null = null;

export function initAuth(drizzle: DrizzleClient) {
  if (authInstance) return authInstance;

  authInstance = betterAuth({
    baseURL: process.env.BETTER_AUTH_URL || "http://localhost:8080/api/v1/auth",
    database: drizzleAdapter(drizzle, {
      provider: "pg",
      usePlural: true,
      schema: {
        ...schema,
        accounts: schema.oauthAccounts,
      },
    }),
    plugins: [openAPI(), admin()],
    user: {
      additionalFields: {
        organizationId: {
          type: "string",
          required: false,
        },
      },
    },
    hooks: {
      before: createAuthMiddleware(async (ctx) => {
        if (ctx.path !== "/sign-up/email") {
          return;
        }

        logger.info({ body: ctx.body }, "Signup request received");

        const { organizationName } = ctx.body as { organizationName?: string };

        if (!organizationName) {
          throw new APIError("BAD_REQUEST", {
            message: "Organization name is required for signup",
          });
        }

        const org = await createOrganization({ drizzle, logger }, { name: organizationName });

        logger.info({ orgId: org.id, orgName: org.name }, "Organization created during signup");

        return {
          context: {
            ...ctx,
            body: {
              ...ctx.body,
              organizationId: org.id,
            },
          },
        };
      }),
      after: createAuthMiddleware(async (ctx) => {
        if (!ctx.path.startsWith("/sign-up")) {
          return;
        }

        const newSession = ctx.context.newSession;
        if (!newSession) {
          return;
        }

        const userId = newSession.user.id;
        const organizationId = newSession.user.organizationId;

        logger.info({ userId, organizationId }, "User signup completed, provisioning Odoo");

        setImmediate(async () => {
          try {
            logger.info({ organizationId }, "Provisioning Odoo database");
            await odooDatabaseService.provisionDatabase(organizationId);
            logger.info({ organizationId }, "Odoo database provisioned");

            logger.info({ userId, organizationId }, "Provisioning Odoo user");
            await odooUserProvisioningService.provisionUser(userId, organizationId);
            logger.info({ userId }, "Odoo user provisioned");
          } catch (error) {
            logger.error({ error, userId, organizationId }, "Failed to provision Odoo resources");
          }
        });
      }),
    },
    session: {
      expiresIn: 60 * 60 * 24 * 7,
      updateAge: 60 * 60 * 24,
      cookieCache: {
        enabled: true,
        maxAge: 5 * 60, // 5 minutes
      },
    },
    emailAndPassword: {
      enabled: true,
      requireEmailVerification: false, // TODO: Enable in production
      minPasswordLength: 8,
      maxPasswordLength: 128,
    },
    socialProviders: {
      google: {
        clientId: process.env.GOOGLE_CLIENT_ID || "",
        clientSecret: process.env.GOOGLE_CLIENT_SECRET || "",
        enabled: !!process.env.GOOGLE_CLIENT_ID,
      },
      // Add more OAuth providers as needed:
      // github: {
      //   clientId: process.env.GITHUB_CLIENT_ID || "",
      //   clientSecret: process.env.GITHUB_CLIENT_SECRET || "",
      //   enabled: !!process.env.GITHUB_CLIENT_ID,
      // },
    },
    advanced: {
      useSecureCookies: process.env.NODE_ENV === "production",
      cookiePrefix: "safee-auth",
      crossSubDomainCookies: {
        enabled: process.env.NODE_ENV === "production",
        domain: process.env.COOKIE_DOMAIN,
      },
      database: {
        generateId: () => randomUUID(), // Generate proper UUIDs for PostgreSQL
      },
    },
    trustedOrigins: [
      process.env.CORS_ORIGIN || "http://localhost:3001",
      process.env.FRONTEND_URL || "http://localhost:3001",
      "http://localhost:8080", // Caddy proxy URL
    ],
  });

  return authInstance;
}

export function getAuth() {
  if (!authInstance) {
    throw new Error("Auth not initialized. Call initAuth(drizzle) first.");
  }
  return authInstance;
}

export type Session = ReturnType<typeof getAuth> extends { $Infer: { Session: infer S } } ? S : never;
export type AuthUser = Session extends { user: infer U } ? U : never;
