import { createAuthClient } from "better-auth/react";
import { organizationClient } from "better-auth/client/plugins";

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
  plugins: [organizationClient()],
  fetchOptions: {
    credentials: "include", // Always include cookies in cross-origin requests
  },
});

export type Session = {
  user: {
    id: string;
    email: string;
    name: string;
    emailVerified: boolean;
    image?: string;
    createdAt: Date;
    updatedAt: Date;
  };
  session: {
    id: string;
    userId: string;
    expiresAt: Date;
    ipAddress?: string;
    userAgent?: string;
  };
};

export type AuthError = {
  message: string;
  code?: string;
};
