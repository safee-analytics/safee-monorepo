/**
 * Better Auth client factory for creating auth clients across apps
 * Supports both React and vanilla JavaScript clients
 */

import { createAuthClient } from "better-auth/react";
import {
  organizationClient,
  adminClient,
  twoFactorClient,
  phoneNumberClient,
  usernameClient,
  magicLinkClient,
  emailOTPClient,
  genericOAuthClient,
  apiKeyClient,
  lastLoginMethodClient,
} from "better-auth/client/plugins";

export interface SafeeAuthClientOptions {
  baseURL: string;
  fetchOptions?: RequestInit;
}

/**
 * Create a Better Auth client for React applications
 * @param options - Configuration options
 * @returns Configured Better Auth client
 */
export function createSafeeAuthClient(options: SafeeAuthClientOptions): ReturnType<typeof createAuthClient> {
  const { baseURL, fetchOptions = {} } = options;

  return createAuthClient({
    experimental: {
      joins: true,
    },
    baseURL: `${baseURL}/api/v1`,
    fetchOptions: {
      credentials: "include",
      ...fetchOptions,
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
}

/**
 * Get the base URL for the API based on environment
 */
export function getAuthBaseURL(): string {
  // Client-side: use NEXT_PUBLIC_API_URL or window.location.origin
  if (typeof window !== "undefined") {
    return process.env.NEXT_PUBLIC_API_URL || window.location.origin;
  }

  // Server-side: use NEXT_PUBLIC_API_URL or fallback
  return process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";
}
