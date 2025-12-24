import { NextRequest, NextResponse } from "next/server";
import { schema, eq } from "@safee/database";
import { getDbClient } from "@/lib/db";
import { odooSyncQueue } from "@safee/jobs/queues";

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: organizationId } = await params;
    const drizzle = getDbClient();

    // Check if Odoo database exists
    const [odooDb] = await drizzle
      .select()
      .from(schema.odooDatabases)
      .where(eq(schema.odooDatabases.organizationId, organizationId))
      .limit(1);

    if (!odooDb) {
      return NextResponse.json({ error: "No Odoo database found for this organization" }, { status: 404 });
    }

    if (odooDb.status !== "active") {
      return NextResponse.json({ error: "Odoo database is not active" }, { status: 400 });
    }

    // Queue sync job
    const syncJob = await odooSyncQueue.add(
      "full-sync",
      {
        organizationId,
      },
      {
        attempts: 3,
        backoff: {
          type: "exponential",
          delay: 5000,
        },
      },
    );

    return NextResponse.json({
      success: true,
      message: "Odoo sync job queued successfully",
      jobId: syncJob.id,
    });
  } catch (error) {
    console.error("Error syncing Odoo:", error);
    return NextResponse.json({ error: "Failed to sync Odoo database" }, { status: 500 });
  }
}
