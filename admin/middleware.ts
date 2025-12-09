import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

/**
 * Next.js middleware for authentication
 * Protects dashboard routes and passes user context to Server Components
 */
export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Skip auth check for login page, API routes, and static assets
  if (
    pathname.startsWith("/login") ||
    pathname.startsWith("/api") ||
    pathname.startsWith("/_next") ||
    pathname.includes(".")
  ) {
    return NextResponse.next();
  }

  try {
    // Get session from Better Auth
    const cookieHeader = request.headers.get("cookie");
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";

    const response = await fetch(`${apiUrl}/api/v1/get-session`, {
      headers: {
        cookie: cookieHeader || "",
      },
      credentials: "include",
    });

    if (!response.ok) {
      // Not authenticated - redirect to login
      console.log(`Auth check failed: ${response.status} ${response.statusText}`);
      return NextResponse.redirect(new URL("/login", request.url));
    }

    const text = await response.text();
    console.log("Session response text:", text);

    let data;
    try {
      data = text ? JSON.parse(text) : null;
    } catch (e) {
      console.log("Failed to parse session response:", e);
      return NextResponse.redirect(new URL("/login", request.url));
    }

    // Handle null or invalid response
    if (!data) {
      console.log("Session response is null or empty");
      return NextResponse.redirect(new URL("/login", request.url));
    }

    const session = data.session || data;

    if (!session?.user) {
      console.log("No user in session:", JSON.stringify(data));
      return NextResponse.redirect(new URL("/login", request.url));
    }

    const user = session.user;
    const sessionData = session.session || session;

    // Check if user has admin access (admin or org_admin role)
    const isAdmin = user.role === "admin";
    const isOrgAdmin = user.role === "org_admin";

    if (!isAdmin && !isOrgAdmin) {
      // User doesn't have admin privileges
      return NextResponse.redirect(new URL("/unauthorized", request.url));
    }

    // Pass user context to Server Components via headers
    const nextResponse = NextResponse.next();
    nextResponse.headers.set("x-user-id", user.id);
    nextResponse.headers.set("x-user-role", user.role);
    nextResponse.headers.set("x-user-email", user.email);
    nextResponse.headers.set("x-user-name", user.name || "");
    nextResponse.headers.set("x-org-id", sessionData.activeOrganizationId || "");

    return nextResponse;
  } catch (error) {
    console.error("Middleware error:", error);
    return NextResponse.redirect(new URL("/login", request.url));
  }
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - login (login page)
     */
    "/((?!api|_next/static|_next/image|favicon.ico|login).*)",
  ],
};
