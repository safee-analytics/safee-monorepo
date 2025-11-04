import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { getServerContext } from "./server/serverContext.js";

export const auth = betterAuth({
  database: drizzleAdapter(() => getServerContext().drizzle, {
    provider: "pg",
    schema: {
      // Map Better Auth expected names to our schema
      user: "identity.users",
      session: "identity.sessions",
      account: "identity.oauth_accounts",
      verification: "identity.verifications",
    },
  }),
  emailAndPassword: {
    enabled: true,
    requireEmailVerification: false, // TODO: Enable in production
    minPasswordLength: 8,
    maxPasswordLength: 128,
  },
  session: {
    expiresIn: 60 * 60 * 24 * 7, // 7 days
    updateAge: 60 * 60 * 24, // Update session every 24 hours
    cookieCache: {
      enabled: true,
      maxAge: 5 * 60, // 5 minutes
    },
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
  },
  trustedOrigins: [
    process.env.CORS_ORIGIN || "http://localhost:3001",
    process.env.FRONTEND_URL || "http://localhost:3001",
  ],
});

export type Session = typeof auth.$Infer.Session;
export type AuthUser = typeof auth.$Infer.Session.user;
