import createClient, { type Middleware } from "openapi-fetch";
import type { paths } from "./types";

const BASE_URL = `${process.env.NEXT_PUBLIC_API_URL || "http://app.localhost:8080"}/api/v1`;

const errorMiddleware: Middleware = {
  async onResponse({ response }) {
    if (!response.ok) {
      const body = await response
        .clone()
        .json()
        .catch(() => ({}));

      if (response.status === 401) {
        console.error("Unauthorized: Session expired or invalid");

        if (typeof window !== "undefined") {
          window.location.href = "/login";
        }
      } else if (response.status === 403) {
        console.error("Forbidden - insufficient permissions:", body);
      } else if (response.status >= 500) {
        console.error("Server error:", body);
      }
    }

    return response;
  },
};

const loggingMiddleware: Middleware = {
  async onRequest({ request }) {
    if (process.env.NODE_ENV === "development") {
      console.warn(`[API] ${request.method} ${request.url}`);
    }
    return request;
  },
  async onResponse({ response }) {
    if (process.env.NODE_ENV === "development") {
      console.warn(`[API] ${response.status} ${response.url}`);
    }
    return response;
  },
};

export const apiClient = createClient<paths>({
  baseUrl: BASE_URL,
  credentials: "include",
});

apiClient.use(loggingMiddleware);
apiClient.use(errorMiddleware);

export type ApiClient = typeof apiClient;

export function handleApiError(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }
  if (typeof error === "object" && error !== null && "message" in error) {
    return String(error.message);
  }
  return "An unexpected error occurred";
}

export async function getCurrentUser() {
  return apiClient.GET("/users/me");
}

export async function updateUserProfile(body: { name?: string; preferredLocale?: "en" | "ar" }) {
  return apiClient.PUT("/users/me", { body });
}

export async function updateUserLocale(locale: "en" | "ar") {
  return apiClient.PUT("/users/me/locale", {
    body: { locale },
  });
}
