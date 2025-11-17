import { createAuthClient } from "better-auth/react";
import type { Auth } from "@safee/gateway/auth";

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

/**
 * Better Auth client with type safety from the gateway auth instance.
 * This ensures the frontend always matches the backend's auth configuration.
 */
export const authClient = createAuthClient<Auth>({
  baseURL: `${baseURL}/api/v1`,
  fetchOptions: {
    credentials: "include", // Always include cookies in cross-origin requests
  },
});

// Re-export types inferred from the gateway auth instance
export type Session = typeof authClient.$Infer.Session;

export type AuthError = {
  message: string;
  code?: string;
};
