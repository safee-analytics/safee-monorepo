import { createAuthClient } from "better-auth/react";
import {
  organizationClient,
  adminClient,
  twoFactorClient,
  phoneNumberClient,
  inferAdditionalFields,
  usernameClient,
  magicLinkClient,
  emailOTPClient,
  genericOAuthClient,
  apiKeyClient,
  lastLoginMethodClient,
} from "better-auth/client/plugins";

const getBaseURL = () => {
  if (process.env.NEXT_PUBLIC_API_URL) {
    return process.env.NEXT_PUBLIC_API_URL;
  }

  if (typeof window !== "undefined") {
    return window.location.origin;
  }

  return "http://localhost:3000";
};

const baseURL = getBaseURL();

export const authClient = createAuthClient({
  baseURL: `${baseURL}/api/v1`,
  fetchOptions: {
    credentials: "include",
  },
  plugins: [
    organizationClient({
      dynamicAccessControl: {
        enabled: true,
      },
      teams: {
        enabled: true,
      },
    }),
    adminClient(),
    usernameClient(),
    twoFactorClient(),
    phoneNumberClient(),
    magicLinkClient(),
    emailOTPClient(),
    genericOAuthClient(),
    apiKeyClient(),
    lastLoginMethodClient(),
  ],
});

export type Session = typeof authClient.$Infer.Session;
export type User = typeof authClient.$Infer.Session.user;

export type AuthError = {
  message: string;
  code?: string;
};
