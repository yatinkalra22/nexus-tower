import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { shipments } from "@/db/schema";
import { eq, ne } from "drizzle-orm";
import { enrichShipment } from "@/server/enrich/recompute-exceptions";
import { detectAnomalies } from "@/server/analytics/anomaly";
import { env } from "@/env";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  if (authHeader !== `Bearer ${env.CRON_SECRET}`) {
    return new Response("Unauthorized", { status: 401 });
  }

  try {
    const activeShipments = await db.query.shipments.findMany({
      where: ne(shipments.status, "arrived"),
    });

    const results = [];
    const trackedMmsis = new Set<string>();

    for (const shipment of activeShipments) {
      await enrichShipment(shipment.id);
      results.push(shipment.id);
      if (shipment.vesselMmsi) {
        trackedMmsis.add(shipment.vesselMmsi);
      }
    }

    // Run anomaly detection for all tracked vessels
    for (const mmsi of trackedMmsis) {
      await detectAnomalies(mmsi);
    }

    return NextResponse.json({ ok: true, processed: results });
  } catch (error) {
    console.error("Cron Enrich Failed:", error);
    return NextResponse.json({ ok: false, error: "Internal error" }, { status: 500 });
  }
}
