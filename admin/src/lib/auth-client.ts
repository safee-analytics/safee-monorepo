import { createAuthClient } from "better-auth/react";

export const authClient = createAuthClient({
  baseURL: `${process.env.NEXT_PUBLIC_GATEWAY_URL ?? "http://localhost:3000"}/api/v1`,
});

export const { signIn, signOut, useSession } = authClient;
