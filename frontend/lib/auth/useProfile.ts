"use client";

import { useCallback, useState } from "react";
import { getCurrentUser, updateUserProfile, updateUserLocale } from "@/lib/api/client";
import { useOrgStore } from "@/stores/useOrgStore";

export function useProfile() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { setLocale } = useOrgStore();

  /**
   * Fetch current user profile from API
   */
  const fetchProfile = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      const { data, error: apiError } = await getCurrentUser();

      if (apiError) {
        setError("Failed to fetch profile");
        return null;
      }

      // Update locale in store if it exists in profile
      if (data?.preferredLocale) {
        setLocale(data.preferredLocale);
      }

      return data;
    } catch (err) {
      console.error("Failed to fetch profile:", err);
      setError(err instanceof Error ? err.message : "Failed to fetch profile");
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [setLocale]);

  /**
   * Update user profile (name, locale)
   */
  const updateProfile = useCallback(
    async (updates: { name?: string; preferredLocale?: "en" | "ar" }) => {
      try {
        setIsLoading(true);
        setError(null);

        const { data, error: apiError } = await updateUserProfile(updates);

        if (apiError) {
          setError("Failed to update profile");
          return { success: false, error: "Failed to update profile" };
        }

        // Update locale in store if changed
        if (updates.preferredLocale) {
          setLocale(updates.preferredLocale);
        }

        return { success: true, data };
      } catch (err) {
        console.error("Failed to update profile:", err);
        const errorMessage = err instanceof Error ? err.message : "Failed to update profile";
        setError(errorMessage);
        return { success: false, error: errorMessage };
      } finally {
        setIsLoading(false);
      }
    },
    [setLocale]
  );

  /**
   * Update user locale preference
   */
  const changeLocale = useCallback(
    async (locale: "en" | "ar") => {
      try {
        setIsLoading(true);
        setError(null);

        const { data, error: apiError } = await updateUserLocale(locale);

        if (apiError) {
          setError("Failed to update locale");
          return { success: false, error: "Failed to update locale" };
        }

        // Update locale in store
        setLocale(locale);

        return { success: true, data };
      } catch (err) {
        console.error("Failed to update locale:", err);
        const errorMessage = err instanceof Error ? err.message : "Failed to update locale";
        setError(errorMessage);
        return { success: false, error: errorMessage };
      } finally {
        setIsLoading(false);
      }
    },
    [setLocale]
  );

  return {
    fetchProfile,
    updateProfile,
    changeLocale,
    isLoading,
    error,
  };
}
