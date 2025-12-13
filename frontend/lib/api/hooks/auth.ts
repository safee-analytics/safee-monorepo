/**
 * Comprehensive Better Auth Hooks
 *
 * This file provides React hooks for ALL Better Auth endpoints including:
 * - Core authentication (sign up, sign in, sign out, password management)
 * - Session management (list, revoke)
 * - User management (update, delete, change email/password)
 * - Email verification
 */

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { authClient } from "@/lib/auth/client";

// ============================================================================
// Query Keys
// ============================================================================

export const authQueryKeys = {
  session: ["auth", "session"] as const,
  sessions: ["auth", "sessions"] as const,
  user: ["auth", "user"] as const,
} as const;

// ============================================================================
// Core Authentication Hooks
// ============================================================================

/**
 * Get current session (includes user and session data)
 * Uses Better Auth's built-in hook with React Query integration
 */
export function useSession() {
  return authClient.useSession();
}

/**
 * Sign up with email and password
 */
export function useSignUp() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: { email: string; password: string; name?: string; username?: string }) => {
      const { data: result, error } = await authClient.signUp.email({
        email: data.email,
        password: data.password,
        name: data.name || "",
      });
      if (error) throw new Error(error.message);
      return result;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: authQueryKeys.session });
    },
  });
}

/**
 * Sign in with email and password
 */
export function useSignIn() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: { email: string; password: string }) => {
      const { data: result, error } = await authClient.signIn.email({
        email: data.email,
        password: data.password,
      });
      if (error) throw new Error(error.message);
      return result;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: authQueryKeys.session });
    },
  });
}

/**
 * Sign out current user
 */
export function useSignOut() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      const { data, error } = await authClient.signOut();
      if (error) throw new Error(error.message);
      return data;
    },
    onSuccess: () => {
      queryClient.clear(); // Clear all queries on sign out
    },
  });
}

/**
 * Sign in with Google OAuth
 */
export function useSignInWithGoogle() {
  return useMutation({
    mutationFn: async (options?: { callbackURL?: string }) => {
      // Use absolute URL to ensure redirect goes to frontend domain, not API domain
      const frontendUrl = typeof window !== "undefined" ? window.location.origin : "";
      const absoluteCallbackURL = options?.callbackURL ? `${frontendUrl}${options.callbackURL}` : frontendUrl;

      const { data, error } = await authClient.signIn.social({
        provider: "google",
        callbackURL: absoluteCallbackURL,
      });
      if (error) throw new Error(error.message);
      return data;
    },
  });
}

/**
 * Sign in with username and password
 */
export function useSignInWithUsername() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: { username: string; password: string }) => {
      const { data: result, error } = await authClient.signIn.username({
        username: data.username,
        password: data.password,
      });
      if (error) throw new Error(error.message);
      return result;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: authQueryKeys.session });
    },
  });
}

/**
 * Check if username is available
 */
export function useCheckUsernameAvailability() {
  return useMutation({
    mutationFn: async (username: string) => {
      const { data, error } = await authClient.isUsernameAvailable({
        username,
      });
      if (error) throw new Error(error.message);
      return data;
    },
  });
}

// ============================================================================
// Password Management Hooks
// ============================================================================

/**
 * Request password reset (sends email)
 */
export function useForgetPassword() {
  return useMutation({
    mutationFn: async (data: { email: string }) => {
      const { data: result, error } = await authClient.forgetPassword.emailOtp({
        email: data.email,
      });
      if (error) throw new Error(error.message);
      return result;
    },
  });
}

// Alias for common typo
export const useForgotPassword = useForgetPassword;

/**
 * Reset password with token
 */
export function useResetPassword() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: { token: string; password: string }) => {
      const { data: result, error } = await authClient.resetPassword({
        newPassword: data.password,
      });
      if (error) throw new Error(error.message);
      return result;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: authQueryKeys.session });
    },
  });
}

/**
 * Change password (requires current password)
 */
export function useChangePassword() {
  return useMutation({
    mutationFn: async (data: {
      currentPassword: string;
      newPassword: string;
      revokeOtherSessions?: boolean;
    }) => {
      const { data: result, error } = await authClient.changePassword({
        currentPassword: data.currentPassword,
        newPassword: data.newPassword,
        revokeOtherSessions: data.revokeOtherSessions,
      });
      if (error) throw new Error(error.message);
      return result;
    },
  });
}

// ============================================================================
// Email Management Hooks
// ============================================================================

/**
 * Send email verification
 */
export function useSendVerificationEmail() {
  return useMutation({
    mutationFn: async (data: { email: string; callbackURL?: string }) => {
      const { data: result, error } = await authClient.sendVerificationEmail({
        email: data.email,
        callbackURL: data.callbackURL || "/verify-email",
      });
      if (error) throw new Error(error.message);
      return result;
    },
  });
}

/**
 * Verify email with token
 */
export function useVerifyEmail() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (token: string) => {
      const { data, error } = await authClient.verifyEmail({
        query: { token },
      });
      if (error) throw new Error(error.message);
      return data;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: authQueryKeys.session });
    },
  });
}

/**
 * Change email address
 */
export function useChangeEmail() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (newEmail: string) => {
      const { data, error } = await authClient.changeEmail({
        newEmail,
      });
      if (error) throw new Error(error.message);
      return data;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: authQueryKeys.session });
    },
  });
}

// ============================================================================
// User Management Hooks
// ============================================================================

/**
 * Update current user profile
 */
export function useUpdateUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: { name?: string; image?: string }) => {
      const { data: result, error } = await authClient.updateUser(data);
      if (error) throw new Error(error.message);
      return result;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: authQueryKeys.session });
    },
  });
}

/**
 * Update username (from username plugin)
 */
export function useUpdateUsername() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (username: string) => {
      const { data, error } = await authClient.updateUser({
        username,
      });
      if (error) throw new Error(error.message);
      return data;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: authQueryKeys.session });
    },
  });
}

/**
 * Delete current user account (requires password)
 */
export function useDeleteUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (password: string) => {
      const { data, error } = await authClient.deleteUser({
        password,
      });
      if (error) throw new Error(error.message);
      return data;
    },
    onSuccess: () => {
      queryClient.clear();
    },
  });
}

// ============================================================================
// Session Management Hooks
// ============================================================================

/**
 * List all active sessions for current user
 */
export function useListSessions() {
  return useQuery({
    queryKey: authQueryKeys.sessions,
    queryFn: async () => {
      const { data, error } = await authClient.listSessions();
      if (error) throw new Error(error.message);
      return data;
    },
  });
}

/**
 * Revoke a specific session
 */
export function useRevokeSession() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (sessionToken: string) => {
      const { data, error } = await authClient.revokeSession({
        token: sessionToken,
      });
      if (error) throw new Error(error.message);
      return data;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: authQueryKeys.sessions });
    },
  });
}

/**
 * Revoke all other sessions (keep current one)
 */
export function useRevokeOtherSessions() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      const { data, error } = await authClient.revokeOtherSessions();
      if (error) throw new Error(error.message);
      return data;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: authQueryKeys.sessions });
    },
  });
}

/**
 * Revoke all sessions including current (signs out everywhere)
 */
export function useRevokeAllSessions() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      const { data, error } = await authClient.revokeSessions();
      if (error) throw new Error(error.message);
      return data;
    },
    onSuccess: () => {
      queryClient.clear();
    },
  });
}

// ============================================================================
// Social Account Linking
// ============================================================================

/**
 * Link a social account (Google, GitHub, etc.) to current user
 */
export function useLinkSocialAccount() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: { provider: "google" | "github" | "facebook"; callbackURL?: string }) => {
      // Use absolute URL to ensure redirect goes to frontend domain, not API domain
      const frontendUrl = typeof window !== "undefined" ? window.location.origin : "";
      const absoluteCallbackURL = data.callbackURL
        ? `${frontendUrl}${data.callbackURL}`
        : `${frontendUrl}/settings/account`;

      const { data: result, error } = await authClient.linkSocial({
        provider: data.provider,
        callbackURL: absoluteCallbackURL,
      });
      if (error) throw new Error(error.message);
      return result;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: authQueryKeys.user });
    },
  });
}

/**
 * List all linked social accounts
 */
export function useListLinkedAccounts() {
  return useQuery({
    queryKey: [...authQueryKeys.user, "accounts"] as const,
    queryFn: async () => {
      const { data, error } = await authClient.listAccounts();
      if (error) throw new Error(error.message);
      return data;
    },
  });
}

/**
 * Unlink a social account
 */
export function useUnlinkSocialAccount() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: { accountId: string; providerId?: string }) => {
      const { data: result, error } = await authClient.unlinkAccount({
        accountId: data.accountId,
        providerId: data.providerId || "google", // default provider
      });
      if (error) throw new Error(error.message);
      return result;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: [...authQueryKeys.user, "accounts"] });
    },
  });
}

// ============================================================================
// Token Management
// ============================================================================

/**
 * Refresh access token
 * Note: better-auth refreshToken doesn't exist as a direct method, sessions are automatically refreshed
 */
export function useRefreshToken() {
  return useMutation({
    mutationFn: async () => {
      // Get current session which will trigger a refresh if needed
      const { data, error } = await authClient.getSession();
      if (error) throw new Error(error.message);
      return data;
    },
  });
}

/**
 * Get access token for API calls
 * Note: better-auth doesn't have getAccessToken, use getSession to get token from session
 */
export function useGetAccessToken() {
  return useMutation({
    mutationFn: async () => {
      const { data, error } = await authClient.getSession();
      if (error) throw new Error(error.message);
      return data;
    },
  });
}

// ============================================================================
// Two-Factor Authentication (2FA)
// ============================================================================

/**
 * Enable 2FA for the current user
 * Returns QR code and secret for authenticator app setup
 */
export function useEnable2FA() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (password: string) => {
      const { data, error } = await authClient.twoFactor.enable({ password });
      if (error) throw new Error(error.message);
      return data;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: authQueryKeys.user });
    },
  });
}

/**
 * Disable 2FA for the current user
 */
export function useDisable2FA() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (password: string) => {
      const { data, error } = await authClient.twoFactor.disable({ password });
      if (error) throw new Error(error.message);
      return data;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: authQueryKeys.user });
    },
  });
}

/**
 * Verify 2FA code during login or setup
 */
export function useVerify2FACode() {
  return useMutation({
    mutationFn: async (code: string) => {
      const { data, error } = await authClient.twoFactor.verifyTotp({ code });
      if (error) throw new Error(error.message);
      return data;
    },
  });
}

/**
 * Generate backup codes for 2FA recovery
 */
export function useGenerate2FABackupCodes() {
  return useMutation({
    mutationFn: async (password: string) => {
      const { data, error } = await authClient.twoFactor.generateBackupCodes({ password });
      if (error) throw new Error(error.message);
      return data;
    },
  });
}

/**
 * Get 2FA status for current user
 * Note: better-auth doesn't have a getStatus method, check session.user.twoFactorEnabled instead
 */
export function useGet2FAStatus() {
  const session = useSession();
  return useQuery({
    queryKey: [...authQueryKeys.user, "2fa-status"] as const,
    queryFn: () => Promise.resolve(session.data?.user.twoFactorEnabled ?? false),
    enabled: !!session.data,
  });
}

// ============================================================================
// Magic Link Authentication
// ============================================================================

/**
 * Send magic link to email for passwordless login
 */
export function useSendMagicLink() {
  return useMutation({
    mutationFn: async ({ email, callbackURL }: { email: string; callbackURL?: string }) => {
      const { data, error } = await authClient.signIn.magicLink({
        email,
        callbackURL: callbackURL || "/verify-magic-link",
      });
      if (error) throw new Error(error.message);
      return data;
    },
  });
}

/**
 * Verify magic link token
 */
export function useVerifyMagicLink() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (token: string) => {
      const { data, error } = await authClient.magicLink.verify({
        query: { token },
      });
      if (error) throw new Error(error.message);
      return data;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: authQueryKeys.session });
      void queryClient.invalidateQueries({ queryKey: authQueryKeys.user });
    },
  });
}

// ============================================================================
// Phone Authentication
// ============================================================================

/**
 * Send phone verification code via SMS
 */
export function useSendPhoneVerification() {
  return useMutation({
    mutationFn: async (phoneNumber: string) => {
      const { data, error } = await authClient.phoneNumber.sendOtp({
        phoneNumber,
      });
      if (error) throw new Error(error.message);
      return data;
    },
  });
}

/**
 * Verify phone number with code
 */
export function useVerifyPhoneNumber() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: { phoneNumber: string; code: string }) => {
      const { data: result, error } = await authClient.phoneNumber.verify({
        phoneNumber: data.phoneNumber,
        code: data.code,
      });
      if (error) throw new Error(error.message);
      return result;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: authQueryKeys.user });
    },
  });
}

/**
 * Sign in with phone number and password
 */
export function useSignInWithPhone() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: { phoneNumber: string; password: string }) => {
      const { data: result, error } = await authClient.signIn.phoneNumber({
        phoneNumber: data.phoneNumber,
        password: data.password,
      });
      if (error) throw new Error(error.message);
      return result;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: authQueryKeys.session });
      void queryClient.invalidateQueries({ queryKey: authQueryKeys.user });
    },
  });
}

/**
 * Update phone number in user profile
 */
export function useUpdatePhoneNumber() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: { phoneNumber: string; code: string }) => {
      const { data: result, error } = await authClient.phoneNumber.verify({
        phoneNumber: data.phoneNumber,
        code: data.code,
        updatePhoneNumber: true,
      });
      if (error) throw new Error(error.message);
      return result;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: authQueryKeys.user });
    },
  });
}
