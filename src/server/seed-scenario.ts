"use server";

import { db } from "@/db";
import { shipments, ports, carriers, vessels, vesselPositions, routeWaypoints, exceptions, eventsAudit, tariffRatesCache } from "@/db/schema";
import { revalidatePath } from "next/cache";
import { auth } from "@clerk/nextjs/server";

const SEED_PORTS = [
  { id: "SGSIN", name: "Singapore", country: "SG", latitude: 1.2644, longitude: 103.8200 },
  { id: "NLRTM", name: "Rotterdam", country: "NL", latitude: 51.9225, longitude: 4.4792 },
  { id: "CNSHA", name: "Shanghai", country: "CN", latitude: 31.2304, longitude: 121.4737 },
  { id: "USLAX", name: "Los Angeles", country: "US", latitude: 33.7405, longitude: -118.2653 },
  { id: "DEHAM", name: "Hamburg", country: "DE", latitude: 53.5511, longitude: 9.9937 },
  { id: "JPYOK", name: "Yokohama", country: "JP", latitude: 35.4437, longitude: 139.6380 },
  { id: "AEJEA", name: "Jebel Ali", country: "AE", latitude: 25.0077, longitude: 55.0681 },
  { id: "GBFXT", name: "Felixstowe", country: "GB", latitude: 51.9536, longitude: 1.3513 },
  { id: "KRPUS", name: "Busan", country: "KR", latitude: 35.1028, longitude: 129.0403 },
  { id: "BRSSZ", name: "Santos", country: "BR", latitude: -23.9608, longitude: -46.3336 },
];

const SEED_CARRIERS = [
  { id: "MSK", name: "Maersk Line", type: "sea" },
  { id: "CMA", name: "CMA CGM", type: "sea" },
  { id: "EVG", name: "Evergreen Marine", type: "sea" },
  { id: "HPL", name: "Hapag-Lloyd", type: "sea" },
  { id: "CSL", name: "COSCO Shipping", type: "sea" },
];

// Real active vessel MMSIs (large container ships)
const SEED_VESSELS = [
  { mmsi: "219018828", name: "MAERSK HALIFAX", type: "container", flag: "DK" },
  { mmsi: "477592400", name: "CMA CGM MARCO POLO", type: "container", flag: "HK" },
  { mmsi: "353136000", name: "EVER GIVEN", type: "container", flag: "PA" },
  { mmsi: "218424000", name: "HAMBURG EXPRESS", type: "container", flag: "DE" },
  { mmsi: "477171500", name: "COSCO SHIPPING TAURUS", type: "container", flag: "HK" },
  { mmsi: "636092773", name: "MSC ANNA", type: "container", flag: "LR" },
];

const SHIPMENT_NAMES = [
  "Electronics Batch — Shenzhen",
  "Auto Parts — Stuttgart",
  "Medical Supplies — Rotterdam",
  "Machinery Components — Osaka",
  "Consumer Goods — Dubai",
  "Agricultural Export — Santos",
  "Textiles — Dhaka Forwarding",
  "Chemicals — BASF Contract",
  "Frozen Seafood — Nordic",
  "Steel Coils — Pohang",
];

const STATUSES = ["in_transit", "in_transit", "delayed", "pending", "arrived", "cancelled"] as const;

function randomPick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function randomId(): string {
  return `SH-${Math.floor(1000 + Math.random() * 9000)}`;
}

function randomEta(): Date {
  const now = Date.now();
  const offsetDays = Math.floor(Math.random() * 30) - 5;
  return new Date(now + offsetDays * 86400000);
}

// Interpolate a position between two ports (simulate vessel in transit)
function interpolatePosition(
  origin: { latitude: number; longitude: number },
  dest: { latitude: number; longitude: number },
  progress: number // 0-1
) {
  return {
    latitude: origin.latitude + (dest.latitude - origin.latitude) * progress + (Math.random() - 0.5) * 2,
    longitude: origin.longitude + (dest.longitude - origin.longitude) * progress + (Math.random() - 0.5) * 2,
  };
}

// Generate waypoints along a route between two ports
function generateWaypoints(
  origin: { latitude: number; longitude: number },
  dest: { latitude: number; longitude: number },
  count: number
) {
  const waypoints = [];
  for (let i = 0; i <= count; i++) {
    const progress = i / count;
    const pos = interpolatePosition(origin, dest, progress);
    waypoints.push({
      latitude: Number(pos.latitude.toFixed(4)),
      longitude: Number(pos.longitude.toFixed(4)),
    });
  }
  return waypoints;
}

export async function seedScenario() {
  const { userId } = await auth();

  // Seed reference tables (upsert to avoid conflicts)
  for (const port of SEED_PORTS) {
    await db.insert(ports).values(port).onConflictDoNothing();
  }
  for (const carrier of SEED_CARRIERS) {
    await db.insert(carriers).values(carrier).onConflictDoNothing();
  }
  for (const vessel of SEED_VESSELS) {
    await db.insert(vessels).values(vessel).onConflictDoNothing();
  }

  // Generate 6 randomized shipments
  const usedNames = new Set<string>();
  const usedVessels = new Set<string>();
  const generated: string[] = [];

  for (let i = 0; i < 6; i++) {
    let name = randomPick(SHIPMENT_NAMES);
    while (usedNames.has(name)) name = randomPick(SHIPMENT_NAMES);
    usedNames.add(name);

    const status = STATUSES[i];
    const origin = randomPick(SEED_PORTS);
    let dest = randomPick(SEED_PORTS);
    while (dest.id === origin.id) dest = randomPick(SEED_PORTS);

    // Pick a unique vessel for each shipment
    let vessel = randomPick(SEED_VESSELS);
    while (usedVessels.has(vessel.mmsi) && usedVessels.size < SEED_VESSELS.length) {
      vessel = randomPick(SEED_VESSELS);
    }
    usedVessels.add(vessel.mmsi);

    const carrier = randomPick(SEED_CARRIERS);
    const id = randomId();
    const hasVessel = status !== "cancelled" && status !== "pending";

    await db.insert(shipments).values({
      id,
      name,
      status,
      originPortId: origin.id,
      destinationPortId: dest.id,
      carrierId: carrier.id,
      vesselMmsi: hasVessel ? vessel.mmsi : undefined,
      eta: status === "arrived" ? new Date(Date.now() - 86400000) : randomEta(),
    }).onConflictDoNothing();

    generated.push(id);

    // Seed vessel positions for in_transit and delayed shipments
    if (hasVessel && (status === "in_transit" || status === "delayed" || status === "arrived")) {
      const progress = status === "arrived" ? 0.95 : status === "delayed" ? 0.3 : 0.4 + Math.random() * 0.4;
      const pos = interpolatePosition(origin, dest, progress);
      const speed = status === "delayed" ? 2 + Math.random() * 3 : 12 + Math.random() * 6;
      const heading = Math.atan2(dest.longitude - origin.longitude, dest.latitude - origin.latitude) * (180 / Math.PI);

      await db.insert(vesselPositions).values({
        mmsi: vessel.mmsi,
        latitude: Number(pos.latitude.toFixed(4)),
        longitude: Number(pos.longitude.toFixed(4)),
        speed: Number(speed.toFixed(1)),
        heading: Number(((heading + 360) % 360).toFixed(1)),
        timestamp: new Date(),
      });
    }

    // Seed route waypoints
    if (status !== "cancelled") {
      const wps = generateWaypoints(origin, dest, 5);
      for (let seq = 0; seq < wps.length; seq++) {
        await db.insert(routeWaypoints).values({
          shipmentId: id,
          sequence: seq,
          latitude: wps[seq].latitude,
          longitude: wps[seq].longitude,
          estimatedTimestamp: new Date(Date.now() + seq * 3 * 86400000),
        });
      }
    }

    // Seed exceptions for delayed shipments
    if (status === "delayed") {
      const exceptionTypes = [
        { type: "weather", severity: "high" as const, description: `Severe storm warning on route ${origin.id} → ${dest.id}. Vessel speed reduced to < 5 knots.` },
        { type: "geopolitical", severity: "critical" as const, description: `Port congestion at ${dest.id} due to labor strike. Expected 48h delay.` },
        { type: "delay", severity: "medium" as const, description: `Vessel ${vessel.name} reporting mechanical issue. ETA pushed by 72 hours.` },
      ];
      const exc = randomPick(exceptionTypes);
      await db.insert(exceptions).values({
        id: `EXC-${Math.floor(1000 + Math.random() * 9000)}`,
        shipmentId: id,
        type: exc.type,
        severity: exc.severity,
        description: exc.description,
        status: "open",
      });
    }
  }

  // Seed sample audit events
  if (userId) {
    const auditActions = [
      { action: "execute_tool", tool: "queryShipments", outcome: "approved", payload: '{"status":"all"}' },
      { action: "execute_tool", tool: "getWeatherOnRoute", outcome: "approved", payload: '{"lat":1.26,"lon":103.82}' },
      { action: "execute_tool", tool: "scanGdeltDisruptions", outcome: "approved", payload: '{"lat":51.92,"lon":4.47}' },
    ];
    for (let j = 0; j < auditActions.length; j++) {
      const a = auditActions[j];
      await db.insert(eventsAudit).values({
        actorUserId: userId,
        action: a.action,
        tool: a.tool,
        outcome: a.outcome,
        payload: a.payload,
        timestamp: new Date(Date.now() - (auditActions.length - j) * 600000), // 10 min apart
      });
    }
  }

  // Seed common tariff trade lanes
  const tariffSeeds = [
    { hsCode: "851712", origin: "CN", destination: "US", rate: 2.5 },
    { hsCode: "870323", origin: "DE", destination: "US", rate: 2.5 },
    { hsCode: "300490", origin: "IN", destination: "GB", rate: 0.0 },
    { hsCode: "720839", origin: "KR", destination: "NL", rate: 0.0 },
    { hsCode: "610910", origin: "CN", destination: "DE", rate: 12.0 },
    { hsCode: "271019", origin: "AE", destination: "JP", rate: 0.0 },
  ];
  for (const t of tariffSeeds) {
    await db.insert(tariffRatesCache).values({
      hsCode: t.hsCode,
      origin: t.origin,
      destination: t.destination,
      rate: t.rate,
    }).onConflictDoNothing();
  }

  revalidatePath("/dashboard");
  revalidatePath("/dashboard/shipments");
  revalidatePath("/dashboard/risk");
  revalidatePath("/dashboard/tariffs");

  return { count: generated.length, ids: generated };
}
