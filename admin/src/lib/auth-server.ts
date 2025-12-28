import { headers } from "next/headers";
import { redirect } from "next/navigation";

const GATEWAY_URL = process.env.NEXT_PUBLIC_GATEWAY_URL ?? "http://localhost:3000";

export async function getSession() {
  const headersList = await headers();
  const cookieHeader = headersList.get("cookie");

  if (!cookieHeader) {
    return null;
  }

  try {
    const response = await fetch(`${GATEWAY_URL}/api/v1/get-session`, {
      headers: {
        cookie: cookieHeader,
      },
      cache: "no-store",
    });

    if (!response.ok) {
      return null;
    }

    const data = await response.json();
    return data.session ? data : null;
  } catch (error) {
    console.error("Failed to get session:", error);
    return null;
  }
}

export async function requireAuth() {
  const session = await getSession();

  if (!session) {
    redirect("/login");
  }

  return session;
}
