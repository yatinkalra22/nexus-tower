"use server";

import { db } from "@/db";
import { ports, carriers } from "@/db/schema";
import Papa from "papaparse";

/**
 * Seeds a small set of major global ports and carriers.
 * Real production would fetch the full UN/LOCODE CSV (~100k rows).
 * For the hackathon, we seed the top 20 ports to ensure functionality.
 */
export async function seedMajorPorts() {
  const majorPorts = [
    { id: "CNSGH", name: "Shanghai", country: "China", latitude: 31.2222, longitude: 121.4581 },
    { id: "SGSIN", name: "Singapore", country: "Singapore", latitude: 1.2903, longitude: 103.852 },
    { id: "CNSZX", name: "Shenzhen", country: "China", latitude: 22.5431, longitude: 114.0579 },
    { id: "CNNBG", name: "Ningbo-Zhoushan", country: "China", latitude: 29.8683, longitude: 121.544 },
    { id: "KRBUS", name: "Busan", country: "South Korea", latitude: 35.1796, longitude: 129.0756 },
    { id: "HKHKG", name: "Hong Kong", country: "Hong Kong", latitude: 22.3193, longitude: 114.1694 },
    { id: "NLRTM", name: "Rotterdam", country: "Netherlands", latitude: 51.9225, longitude: 4.4792 },
    { id: "AEJEA", name: "Jebel Ali", country: "UAE", latitude: 25.0112, longitude: 55.0612 },
    { id: "USLAX", name: "Los Angeles", country: "USA", latitude: 33.7739, longitude: -118.2422 },
    { id: "USLGB", name: "Long Beach", country: "USA", latitude: 33.7701, longitude: -118.1937 },
    { id: "DEHAM", name: "Hamburg", country: "Germany", latitude: 53.5511, longitude: 9.9937 },
    { id: "BEANR", name: "Antwerp", country: "Belgium", latitude: 51.2194, longitude: 4.4025 },
    { id: "INBOM", name: "Mumbai (Nhava Sheva)", country: "India", latitude: 18.9503, longitude: 72.9515 },
  ];

  const majorCarriers = [
    { id: "MSK", name: "Maersk", type: "sea" },
    { id: "MSC", name: "MSC", type: "sea" },
    { id: "CMA", name: "CMA CGM", type: "sea" },
    { id: "HPL", name: "Hapag-Lloyd", type: "sea" },
    { id: "ONE", name: "ONE", type: "sea" },
    { id: "DHL", name: "DHL", type: "road" },
    { id: "FED", name: "FedEx", type: "air" },
  ];

  for (const port of majorPorts) {
    await db.insert(ports).values(port).onConflictDoNothing();
  }

  for (const carrier of majorCarriers) {
    await db.insert(carriers).values(carrier).onConflictDoNothing();
  }

  return { ports: majorPorts.length, carriers: majorCarriers.length };
}
