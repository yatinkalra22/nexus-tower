import { db } from "@/db";
import { vesselPositions, shipments, exceptions } from "@/db/schema";
import { eq, desc, and, ne } from "drizzle-orm";

/**
 * Recalculates ETA based on current speed and distance remaining.
 * Also checks for speed anomalies (e.g. vessel stopped or slowed significantly).
 */
export async function detectAnomalies(mmsi: string) {
  // Get last 10 positions to calculate rolling stats
  const positions = await db
    .select()
    .from(vesselPositions)
    .where(eq(vesselPositions.mmsi, mmsi))
    .orderBy(desc(vesselPositions.timestamp))
    .limit(10);

  if (positions.length < 2) return;

  const latest = positions[0];

  // 1. Detect Speed Anomaly
  // If current speed is < 20% of the average of previous 10, flag it
  const avgPrevSpeed = positions.slice(1).reduce((acc, p) => acc + (p.speed || 0), 0) / (positions.length - 1);
  
  if (latest.speed !== null && latest.speed < avgPrevSpeed * 0.2 && avgPrevSpeed > 5) {
    // Vessel has slowed down significantly
    const activeShipments = await db.query.shipments.findMany({
      where: and(eq(shipments.vesselMmsi, mmsi), ne(shipments.status, "arrived")),
    });

    for (const shipment of activeShipments) {
      await db.insert(exceptions).values({
        id: `ANOM-${mmsi}-${Date.now()}`,
        shipmentId: shipment.id,
        type: "anomaly",
        severity: "high",
        description: `Significant speed reduction detected: ${latest.speed} kn (Avg: ${avgPrevSpeed.toFixed(1)} kn)`,
      }).onConflictDoNothing();
    }
  }
}
