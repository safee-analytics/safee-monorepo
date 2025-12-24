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

    await drizzle.delete(schema.users).where(eq(schema.users.id, id));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting user:", error);
    return NextResponse.json(
      { error: "Failed to delete user" },
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

    const [updatedUser] = await drizzle
      .update(schema.users)
      .set({
        ...body,
        updatedAt: new Date(),
      })
      .where(eq(schema.users.id, id))
      .returning();

    return NextResponse.json(updatedUser);
  } catch (error) {
    console.error("Error updating user:", error);
    return NextResponse.json(
      { error: "Failed to update user" },
      { status: 500 }
    );
  }
}
