import { NextRequest, NextResponse } from "next/server";
import { schema, eq } from "@safee/database";
import { getDbClient } from "@/lib/db";

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const drizzle = getDbClient();

    // Delete organization (cascade will handle related records)
    await drizzle
      .delete(schema.organizations)
      .where(eq(schema.organizations.id, id));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting organization:", error);
    return NextResponse.json(
      { error: "Failed to delete organization" },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const drizzle = getDbClient();

    const [updatedOrg] = await drizzle
      .update(schema.organizations)
      .set({
        ...body,
        updatedAt: new Date(),
      })
      .where(eq(schema.organizations.id, id))
      .returning();

    return NextResponse.json(updatedOrg);
  } catch (error) {
    console.error("Error updating organization:", error);
    return NextResponse.json(
      { error: "Failed to update organization" },
      { status: 500 }
    );
  }
}
