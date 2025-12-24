import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { authClient } from "@/lib/auth-client";

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Allow access to login page and public assets
  if (
    pathname.startsWith("/login") ||
    pathname.startsWith("/unauthorized") ||
    pathname.startsWith("/_next") ||
    pathname.startsWith("/api") ||
    pathname.startsWith("/__nextjs") ||
    pathname.includes(".")
  ) {
    return NextResponse.next();
  }

  // Get session using Better Auth client
  try {
    const session = await authClient.getSession({
      fetchOptions: {
        headers: {
          cookie: request.headers.get("cookie") ?? "",
        },
      },
    });

    if (!session?.data?.user) {
      // No valid session, redirect to login
      const loginUrl = new URL("/login", request.url);
      return NextResponse.redirect(loginUrl);
    }

    // User is authenticated, allow access
    return NextResponse.next();
  } catch (error) {
    console.error("Auth proxy error:", error);
    // On error, redirect to login to be safe
    const loginUrl = new URL("/login", request.url);
    return NextResponse.redirect(loginUrl);
  }
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public files (public folder)
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
