import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { shipments } from "@/db/schema";
import { eq } from "drizzle-orm";
import { computeGwp } from "@/lib/analytics/gwp";

export async function GET(req: NextRequest, { params }: { params: Promise<{ shipmentId: string }> }) {
  const { shipmentId } = await params;
  
  const shipment = await db.query.shipments.findFirst({
    where: eq(shipments.id, shipmentId),
    with: {
      originPort: true,
      destinationPort: true,
    },
  });

  if (!shipment) {
    return NextResponse.json({ error: "Shipment not found" }, { status: 404 });
  }

  // Calculate GWP (Simplified assumptions for the DPP demo)
  const gwp = computeGwp({
    mode: "sea_container",
    distanceKm: 12000, // Placeholder distance
    weightKg: 20000,  // Placeholder weight
  });

  const dpp = {
    passportId: `EU-DPP-${shipment.id}`,
    productName: shipment.name,
    manufacturer: "NexusTower Demo Corp",
    sustainability: {
      carbonFootprint: {
        value: gwp,
        unit: "kg CO2e",
        methodology: "GLEC Framework v3.0",
      },
      transportMode: "Sea",
    },
    traceability: {
      origin: shipment.originPort?.name || "Unknown",
      destination: shipment.destinationPort?.name || "Unknown",
      currentStatus: shipment.status,
    },
    compliance: {
      euRegistry: "Active",
      lastUpdated: shipment.updatedAt,
    }
  };

  return NextResponse.json(dpp);
}
