import { db } from "@/db";
import { shipments, routeWaypoints, exceptions } from "@/db/schema";
import { eq } from "drizzle-orm";
import { getPort, calculateSeaWaypoints, getOsrmRoute } from "./route";
import { getWeatherForPoint } from "./weather";
import { getGdeltEvents } from "./gdelt";

export async function enrichShipment(shipmentId: string) {
  const shipment = await db.query.shipments.findFirst({
    where: eq(shipments.id, shipmentId),
  });

  if (!shipment || !shipment.originPortId || !shipment.destinationPortId) return;

  const origin = await getPort(shipment.originPortId);
  const dest = await getPort(shipment.destinationPortId);

  if (!origin || !dest) return;

  // 1. Generate Waypoints
  let waypoints = [];
  if (shipment.vesselMmsi) {
    // Sea route
    waypoints = calculateSeaWaypoints(
      { lat: origin.latitude, lon: origin.longitude },
      { lat: dest.latitude, lon: dest.longitude }
    );
  } else {
    // Road route (simplified OSRM call)
    try {
      const route = await getOsrmRoute(
        { lat: origin.latitude, lon: origin.longitude },
        { lat: dest.latitude, lon: dest.longitude }
      );
      waypoints = route.geometry.slice(0, 10); // Take first 10 for performance
    } catch {
      waypoints = calculateSeaWaypoints(
        { lat: origin.latitude, lon: origin.longitude },
        { lat: dest.latitude, lon: dest.longitude }
      );
    }
  }

  // 2. Clear old waypoints
  await db.delete(routeWaypoints).where(eq(routeWaypoints.shipmentId, shipmentId));

  // 3. Fetch Weather & Events for key points (Origin, Mid, Dest)
  for (const [i, point] of waypoints.entries()) {
    const isSample = i === 0 || i === Math.floor(waypoints.length / 2) || i === waypoints.length - 1;
    let weatherData = null;
    
    if (isSample) {
      weatherData = await getWeatherForPoint(point.lat, point.lon);
    }

    await db.insert(routeWaypoints).values({
      shipmentId,
      sequence: i,
      latitude: point.lat,
      longitude: point.lon,
      weatherCondition: weatherData?.condition,
      weatherTemp: weatherData?.temp,
    });

    // 4. Check for exceptions (Weather)
    if (weatherData && weatherData.code > 60) {
      await db.insert(exceptions).values({
        id: `WX-${shipmentId}-${i}`,
        shipmentId,
        type: "weather",
        severity: "medium",
        description: `Severe weather (${weatherData.condition}) detected at waypoint ${i}`,
      }).onConflictDoNothing();
    }
  }

  // 5. Geopolitical Check (GDELT)
  const events = await getGdeltEvents(dest.latitude, dest.longitude);
  if (events.length > 0) {
    await db.insert(exceptions).values({
      id: `GP-${shipmentId}-${dest.id}`,
      shipmentId,
      type: "geopolitical",
      severity: "high",
      description: `Potential disruption reported near ${dest.name}: ${events[0].title}`,
    }).onConflictDoNothing();
  }
}
