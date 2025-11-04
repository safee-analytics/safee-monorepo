import { createAuthClient } from "better-auth/react";

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
  baseURL: `${baseURL}/api/v1/auth`,
  credentials: "include", // Important: Send cookies with requests
});

export const authApi = {
  async signUp(data: { email: string; password: string; name: string; organizationName: string }) {
    const apiBaseURL = getBaseURL();
    const response = await fetch(`${apiBaseURL}/api/v1/auth/sign-up/email`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.message || "Sign up failed");
    }

    return response.json();
  },

  async signIn(data: { email: string; password: string }) {
    const apiBaseURL = getBaseURL();
    const response = await fetch(`${apiBaseURL}/api/v1/auth/sign-in/email`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.message || "Sign in failed");
    }

    return response.json();
  },

  async signOut() {
    const apiBaseURL = getBaseURL();
    const response = await fetch(`${apiBaseURL}/api/v1/auth/sign-out`, {
      method: "POST",
      credentials: "include",
    });

    if (!response.ok) {
      throw new Error("Sign out failed");
    }

    return response.json();
  },

  async getSession() {
    const apiBaseURL = getBaseURL();
    const response = await fetch(`${apiBaseURL}/api/v1/auth/get-session`, {
      credentials: "include",
    });

    if (!response.ok) {
      return null;
    }

    const data = await response.json();
    return data.session || null;
  },

  signInWithGoogle() {
    const apiBaseURL = getBaseURL();
    window.location.href = `${apiBaseURL}/api/v1/auth/sign-in/social/google`;
  },

  signInWithGithub() {
    const apiBaseURL = getBaseURL();
    window.location.href = `${apiBaseURL}/api/v1/auth/sign-in/social/github`;
  },
};

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
