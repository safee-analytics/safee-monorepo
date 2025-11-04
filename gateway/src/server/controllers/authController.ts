import { Controller, Post, Get, Route, Tags, Body, SuccessResponse, Response } from "tsoa";

/**
 * Authentication endpoints powered by Better Auth
 *
 * Note: These endpoints are handled by Better Auth middleware.
 * This controller exists only for API documentation purposes.
 */
@Route("api/auth")
@Tags("Authentication")
export class AuthController extends Controller {
  /**
   * Sign up with email and password
   */
  @Post("sign-up/email")
  @SuccessResponse("201", "User created successfully")
  @Response("400", "Invalid input")
  public async signUpEmail(
    @Body()
    body: {
      /** User's email address */
      email: string;
      /** Password (min 8 characters) */
      password: string;
      /** User's first name */
      name?: string;
    }
  ): Promise<{
    user: {
      id: string;
      email: string;
      name?: string;
      emailVerified: boolean;
    };
    session: {
      id: string;
      expiresAt: string;
    };
  }> {
    // This is handled by Better Auth middleware
    throw new Error("This endpoint is handled by Better Auth");
  }

  /**
   * Sign in with email and password
   */
  @Post("sign-in/email")
  @SuccessResponse("200", "Login successful")
  @Response("401", "Invalid credentials")
  public async signInEmail(
    @Body()
    body: {
      /** User's email address */
      email: string;
      /** User's password */
      password: string;
    }
  ): Promise<{
    user: {
      id: string;
      email: string;
      name?: string;
      emailVerified: boolean;
    };
    session: {
      id: string;
      expiresAt: string;
    };
  }> {
    // This is handled by Better Auth middleware
    throw new Error("This endpoint is handled by Better Auth");
  }

  /**
   * Sign out (logout)
   */
  @Post("sign-out")
  @SuccessResponse("200", "Logout successful")
  public async signOut(): Promise<{ success: boolean }> {
    // This is handled by Better Auth middleware
    throw new Error("This endpoint is handled by Better Auth");
  }

  /**
   * Get current session
   */
  @Get("session")
  @SuccessResponse("200", "Session retrieved")
  @Response("401", "Not authenticated")
  public async getSession(): Promise<{
    user: {
      id: string;
      email: string;
      name?: string;
      emailVerified: boolean;
    };
    session: {
      id: string;
      expiresAt: string;
    };
  } | null> {
    // This is handled by Better Auth middleware
    throw new Error("This endpoint is handled by Better Auth");
  }

  /**
   * OAuth callback - Google
   *
   * This endpoint handles the OAuth callback from Google.
   * Redirect users to this URL after Google authentication.
   */
  @Get("callback/google")
  @SuccessResponse("302", "Redirect to application")
  public async googleCallback(): Promise<void> {
    // This is handled by Better Auth middleware
    throw new Error("This endpoint is handled by Better Auth");
  }

  /**
   * Initiate Google OAuth flow
   */
  @Get("google")
  @SuccessResponse("302", "Redirect to Google")
  public async googleLogin(): Promise<void> {
    // This is handled by Better Auth middleware
    throw new Error("This endpoint is handled by Better Auth");
  }
}
