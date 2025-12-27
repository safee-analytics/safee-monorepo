import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const GATEWAY_URL = process.env.NEXT_PUBLIC_GATEWAY_URL ?? "http://localhost:3000";

export default async function proxy(request: NextRequest) {
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

  // Get the session token from cookies
  const sessionToken = request.cookies.get("safee-auth.session_token")?.value;

  // eslint-disable-next-line no-console
  console.log("[Proxy] Path:", pathname);
  // eslint-disable-next-line no-console
  console.log("[Proxy] Session token present:", !!sessionToken);
  // eslint-disable-next-line no-console
  console.log(
    "[Proxy] All cookies:",
    request.cookies.getAll().map((c) => c.name),
  );

  if (!sessionToken) {
    // No session token, redirect to login
    // eslint-disable-next-line no-console
    console.log("[Proxy] No session token, redirecting to login");
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("from", pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Validate the session by calling the gateway
  try {
    const response = await fetch(`${GATEWAY_URL}/api/v1/get-session`, {
      headers: {
        cookie: `safee-auth.session_token=${sessionToken}`,
      },
      cache: "no-store",
    });

    if (!response.ok) {
      // Invalid session, redirect to login
      const loginUrl = new URL("/login", request.url);
      loginUrl.searchParams.set("from", pathname);
      return NextResponse.redirect(loginUrl);
    }

    const session = await response.json();

    if (!session?.user) {
      // No user in session, redirect to login
      const loginUrl = new URL("/login", request.url);
      loginUrl.searchParams.set("from", pathname);
      return NextResponse.redirect(loginUrl);
    }

    // Optional: Check if user has admin role
    // Uncomment to restrict to admin users only:
    // if (session.user.role !== "admin" && session.user.role !== "super_admin") {
    //   return NextResponse.redirect(new URL("/unauthorized", request.url));
    // }

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
