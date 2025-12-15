"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState, type ReactNode } from "react";

function hasStatus(error: unknown): error is { status: number } {
  return (
    typeof error === "object" &&
    error !== null &&
    "status" in error &&
    typeof (error as Record<string, unknown>).status === "number"
  );
}

function isNetworkError(error: unknown): boolean {
  return error instanceof TypeError && error.message.includes("fetch");
}

function isRetryableError(error: unknown, retryableStatuses: Set<number>): boolean {
  if (isNetworkError(error)) return true;
  if (hasStatus(error)) return retryableStatuses.has(error.status);
  return false;
}

function getRetryDelay(attemptIndex: number): number {
  const baseDelay = 1000; // 1 second
  const maxDelay = 30000; // 30 seconds

  const exponentialDelay = Math.min(baseDelay * 2 ** attemptIndex, maxDelay);
  const jitter = Math.random() * exponentialDelay * 0.25;

  return exponentialDelay + jitter;
}

function createRetryFn(options: { maxAttempts: number; retryableStatuses: number[] }) {
  const statusSet = new Set(options.retryableStatuses);

  return (failureCount: number, error: unknown) => {
    if (failureCount >= options.maxAttempts) return false;
    return isRetryableError(error, statusSet);
  };
}

export function QueryProvider({ children }: { children: ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            // Cache data for 5 minutes before considering it stale
            staleTime: 5 * 60 * 1000, // 5 minutes
            // Keep unused data in memory for 10 minutes
            gcTime: 10 * 60 * 1000, // 10 minutes (formerly cacheTime)
            // Disable refetch on window focus to reduce unnecessary requests
            refetchOnWindowFocus: false,
            // Disable refetch on reconnect for static data
            refetchOnReconnect: false,
            // Retry with exponential backoff for network/server errors
            retry: createRetryFn({
              maxAttempts: 3,
              retryableStatuses: [429, 500, 502, 503, 504],
            }),
            retryDelay: getRetryDelay,
          },
          mutations: {
            retry: (failureCount, error) => {
              if (failureCount >= 1) return false;
              if (hasStatus(error)) {
                return [503, 504].includes(error.status);
              }
              return isNetworkError(error);
            },
            retryDelay: getRetryDelay,
          },
        },
      }),
  );

  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
}
