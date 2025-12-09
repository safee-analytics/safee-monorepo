/**
 * Better Auth client for admin dashboard
 * Used in Client Components for authentication
 */

import { createSafeeAuthClient } from "@safee/auth/client";

// Create and export the auth client
// Use NEXT_PUBLIC_API_URL from environment, fallback to app.localhost:8080
export const authClient = createSafeeAuthClient({
  baseURL: process.env.NEXT_PUBLIC_API_URL || "http://app.localhost:8080",
});

export type Session = typeof authClient.$Infer.Session;
export type User = typeof authClient.$Infer.Session.user;
