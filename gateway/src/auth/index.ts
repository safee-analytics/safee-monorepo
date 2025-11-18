import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { organization, openAPI, admin, username, lastLoginMethod } from "better-auth/plugins";
import { connect, schema } from "@safee/database";
import { randomUUID } from "crypto";
import { organizationHooks } from "./organization.hooks.js";
import { createSessionHooks } from "./session.hooks.js";

const { drizzle } = connect("better-auth");

export const auth = betterAuth({
  baseURL: process.env.BETTER_AUTH_URL || "http://app.localhost:8080/api/v1",
  database: drizzleAdapter(drizzle, {
    provider: "pg",
    usePlural: true,
    schema: {
      ...schema,
      accounts: schema.oauthAccounts,
    },
  }),
  plugins: [
    openAPI(),
    admin(),
    username(),
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
        maximumRolesPerOrganization: async () => {
          // TODO: Make this plan-based in the future
          return 50; // Default limit for all organizations
        },
      },
      schema: {
        organization: {
          fields: {
            name: "string",
            slug: "string",
            logo: "string",
            metadata: "string",
          },
        },
      },
    }),
  ],
  databaseHooks: createSessionHooks(drizzle),
  session: {
    expiresIn: 60 * 60 * 24 * 7,
    updateAge: 60 * 60 * 24,
    cookieCache: {
      enabled: true,
      maxAge: 5 * 60,
    },
    cookieOptions: {
      sameSite: "lax",
      domain: process.env.COOKIE_DOMAIN || "app.localhost",
      path: "/",
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
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
  },
  advanced: {
    useSecureCookies: process.env.NODE_ENV === "production",
    cookiePrefix: "safee-auth",
    crossSubDomainCookies: {
      enabled: false,
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

export type Auth = typeof auth;

export type Session = typeof auth extends { $Infer: { Session: infer S } } ? S : never;
export type AuthUser = Session extends { user: infer U } ? U : never;
