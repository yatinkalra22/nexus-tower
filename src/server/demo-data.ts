"use server";

import { db } from "@/db";
import { shipments, ports, carriers, vessels } from "@/db/schema";
import { revalidatePath } from "next/cache";

const DEMO_PORTS = [
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

const DEMO_CARRIERS = [
  { id: "MSK", name: "Maersk Line", type: "sea" },
  { id: "CMA", name: "CMA CGM", type: "sea" },
  { id: "EVG", name: "Evergreen Marine", type: "sea" },
  { id: "HPL", name: "Hapag-Lloyd", type: "sea" },
  { id: "CSL", name: "COSCO Shipping", type: "sea" },
];

// Real active vessel MMSIs (large container ships)
const DEMO_VESSELS = [
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
  const offsetDays = Math.floor(Math.random() * 30) - 5; // -5 to +25 days
  return new Date(now + offsetDays * 86400000);
}

export async function generateDemoData() {
  // Seed reference tables (upsert to avoid conflicts)
  for (const port of DEMO_PORTS) {
    await db.insert(ports).values(port).onConflictDoNothing();
  }
  for (const carrier of DEMO_CARRIERS) {
    await db.insert(carriers).values(carrier).onConflictDoNothing();
  }
  for (const vessel of DEMO_VESSELS) {
    await db.insert(vessels).values(vessel).onConflictDoNothing();
  }

  // Generate 6 randomized shipments
  const usedNames = new Set<string>();
  const generated: string[] = [];

  for (let i = 0; i < 6; i++) {
    let name = randomPick(SHIPMENT_NAMES);
    while (usedNames.has(name)) name = randomPick(SHIPMENT_NAMES);
    usedNames.add(name);

    const status = STATUSES[i];
    const origin = randomPick(DEMO_PORTS);
    let dest = randomPick(DEMO_PORTS);
    while (dest.id === origin.id) dest = randomPick(DEMO_PORTS);

    const vessel = randomPick(DEMO_VESSELS);
    const carrier = randomPick(DEMO_CARRIERS);
    const id = randomId();

    await db.insert(shipments).values({
      id,
      name,
      status,
      originPortId: origin.id,
      destinationPortId: dest.id,
      carrierId: carrier.id,
      vesselMmsi: status === "cancelled" ? undefined : vessel.mmsi,
      eta: status === "arrived" ? new Date(Date.now() - 86400000) : randomEta(),
    }).onConflictDoNothing();

    generated.push(id);
  }

  revalidatePath("/dashboard");
  revalidatePath("/dashboard/shipments");

  return { count: generated.length, ids: generated };
}
