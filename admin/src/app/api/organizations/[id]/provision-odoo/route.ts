import { NextRequest, NextResponse } from "next/server";
import { schema, eq } from "@safee/database";
import { getDbClient } from "@/lib/db";

const GATEWAY_URL = process.env.NEXT_PUBLIC_GATEWAY_URL ?? "http://localhost:3000";

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: organizationId } = await params;
    const drizzle = getDbClient();

    // Check if organization exists
    const [org] = await drizzle
      .select()
      .from(schema.organizations)
      .where(eq(schema.organizations.id, organizationId))
      .limit(1);

    if (!org) {
      return NextResponse.json({ error: "Organization not found" }, { status: 404 });
    }

    // Check if Odoo database already exists
    const [existingDb] = await drizzle
      .select()
      .from(schema.odooDatabases)
      .where(eq(schema.odooDatabases.organizationId, organizationId))
      .limit(1);

    if (existingDb) {
      return NextResponse.json(
        { error: "Odoo database already exists for this organization" },
        { status: 400 },
      );
    }

    // Get the first user of this organization to use their session for provisioning
    const [member] = await drizzle
      .select({
        userId: schema.members.userId,
      })
      .from(schema.members)
      .where(eq(schema.members.organizationId, organizationId))
      .limit(1);

    if (!member) {
      return NextResponse.json({ error: "No members found in organization" }, { status: 400 });
    }

    // Create a session for this user with the organization
    const [session] = await drizzle
      .insert(schema.sessions)
      .values({
        id: crypto.randomUUID(),
        userId: member.userId,
        expiresAt: new Date(Date.now() + 1000 * 60 * 60), // 1 hour
        token: crypto.randomUUID(),
        activeOrganizationId: organizationId,
      })
      .returning();

    // Call gateway provision endpoint
    console.log("Calling gateway provision endpoint:", {
      url: `${GATEWAY_URL}/api/v1/odoo/provision`,
      organizationId,
      sessionToken: session.token.substring(0, 8) + "...",
    });

    const response = await fetch(`${GATEWAY_URL}/api/v1/odoo/provision`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Cookie: `safee-auth.session_token=${session.token}`,
      },
      body: JSON.stringify({
        lang: "en_US",
        demo: "false",
      }),
    });

    console.log("Gateway response status:", response.status);

    // Clean up temporary session
    await drizzle.delete(schema.sessions).where(eq(schema.sessions.id, session.id));

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Gateway provision failed:", {
        status: response.status,
        error: errorText,
      });

      let error;
      try {
        error = JSON.parse(errorText);
      } catch {
        error = { message: errorText };
      }

      return NextResponse.json(
        { error: error.message || "Failed to provision Odoo database" },
        { status: response.status },
      );
    }

    const result = await response.json();
    console.log("Gateway provision result:", result);
    return NextResponse.json(result);
  } catch (error) {
    console.error("Error provisioning Odoo:", error);
    return NextResponse.json({ error: "Failed to provision Odoo database" }, { status: 500 });
  }
}
