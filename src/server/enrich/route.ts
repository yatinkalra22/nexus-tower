import { db } from "@/db";
import { ports } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function getPort(id: string) {
  return db.query.ports.findFirst({
    where: eq(ports.id, id),
  });
}

/**
 * Calculates great-circle waypoints between two points.
 * For a hackathon, we generate 5 intermediate points.
 */
export function calculateSeaWaypoints(
  start: { lat: number; lon: number },
  end: { lat: number; lon: number },
  steps = 5
) {
  const waypoints = [];
  for (let i = 0; i <= steps; i++) {
    const fraction = i / steps;
    const lat = start.lat + (end.lat - start.lat) * fraction;
    const lon = start.lon + (end.lon - start.lon) * fraction;
    waypoints.push({ lat, lon });
  }
  return waypoints;
}

export async function getOsrmRoute(
  start: { lat: number; lon: number },
  end: { lat: number; lon: number }
) {
  const url = `https://router.project-osrm.org/route/v1/driving/${start.lon},${start.lat};${end.lon},${end.lat}?overview=full&geometries=geojson`;
  const res = await fetch(url);
  if (!res.ok) throw new Error("OSRM request failed");
  const data = await res.json();
  
  return {
    distance: data.routes[0].distance, // meters
    duration: data.routes[0].duration, // seconds
    geometry: data.routes[0].geometry.coordinates.map(([lon, lat]: [number, number]) => ({ lat, lon })),
  };
}
