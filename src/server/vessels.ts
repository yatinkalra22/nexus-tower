"use server";

import { db } from "@/db";
import { shipments, vessels } from "@/db/schema";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";

export async function attachVesselToShipment(shipmentId: string, mmsi: string) {
  // First ensure the vessel exists in our tracked list
  // In a real scenario, we might fetch vessel details from an API here
  // For now, we'll just ensure it's in the vessels table so the ingestor picks it up
  await db.insert(vessels).values({
    mmsi,
    name: `Vessel ${mmsi}`, // Placeholder name
  }).onConflictDoNothing();

  await db.update(shipments)
    .set({ vesselMmsi: mmsi, updatedAt: new Date() })
    .where(eq(shipments.id, shipmentId));

  revalidatePath(`/dashboard/shipments/${shipmentId}`);
}

export async function getTrackedMmsis() {
  const result = await db.select({ mmsi: vessels.mmsi }).from(vessels);
  return result.map(r => r.mmsi);
}
