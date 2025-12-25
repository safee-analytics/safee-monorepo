import { NextRequest, NextResponse } from "next/server";
import { schema, eq } from "@safee/database";
import { getDbClient } from "@/lib/db";
import { queueManager } from "@safee/jobs/queues";

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

    if (!odooDb.isActive) {
      return NextResponse.json({ error: "Odoo database is not active" }, { status: 400 });
    }

    // Queue sync job using QueueManager
    const { bullmqJobId, pgJobId } = await queueManager.addJob(
      "odoo-sync",
      {
        organizationId,
        syncType: "full",
      },
      {
        organizationId,
        priority: "normal",
      },
    );

    return NextResponse.json({
      success: true,
      message: "Odoo sync job queued successfully",
      jobId: pgJobId,
      bullmqJobId,
    });
  } catch (error) {
    console.error("Error syncing Odoo:", error);
    return NextResponse.json({ error: "Failed to sync Odoo database" }, { status: 500 });
  }
}
