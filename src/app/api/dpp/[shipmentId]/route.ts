import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { shipments } from "@/db/schema";
import { eq } from "drizzle-orm";
import { computeGwp } from "@/lib/analytics/gwp";

function haversineKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export async function GET(req: NextRequest, { params }: { params: Promise<{ shipmentId: string }> }) {
  const { shipmentId } = await params;

  const shipment = await db.query.shipments.findFirst({
    where: eq(shipments.id, shipmentId),
    with: {
      originPort: true,
      destinationPort: true,
      waypoints: true,
    },
  });

  if (!shipment) {
    return NextResponse.json({ error: "Shipment not found" }, { status: 404 });
  }

  // Calculate distance from waypoints or port coordinates
  let distKm = 0;
  const wps = shipment.waypoints ?? [];
  if (wps.length >= 2) {
    for (let i = 1; i < wps.length; i++) {
      distKm += haversineKm(wps[i - 1].latitude, wps[i - 1].longitude, wps[i].latitude, wps[i].longitude);
    }
  } else if (shipment.originPort && shipment.destinationPort) {
    distKm = haversineKm(
      shipment.originPort.latitude, shipment.originPort.longitude,
      shipment.destinationPort.latitude, shipment.destinationPort.longitude,
    );
  } else {
    distKm = 5000; // fallback
  }

  const mode = shipment.vesselMmsi ? "sea_container" as const : "road_heavy_truck" as const;
  const gwp = computeGwp({ mode, distanceKm: distKm, weightKg: 20000 });

  const dpp = {
    passportId: `EU-DPP-${shipment.id}`,
    productName: shipment.name,
    sustainability: {
      carbonFootprint: {
        value: Math.round(gwp * 100) / 100,
        unit: "kg CO2e",
        methodology: "GLEC Framework v3.0",
        transportMode: mode === "sea_container" ? "Sea" : "Road",
        distanceKm: Math.round(distKm),
      },
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
