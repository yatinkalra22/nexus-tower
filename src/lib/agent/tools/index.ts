import { tool } from "ai";
import { z } from "zod";
import { db } from "@/db";
import { shipments, vesselPositions, routeWaypoints, exceptions } from "@/db/schema";
import { eq, desc, and, ne } from "drizzle-orm";
import { getGdeltEvents } from "@/server/enrich/gdelt";
import { getWeatherForPoint } from "@/server/enrich/weather";

export const tools = {
  queryShipments: tool({
    description: "List active shipments with their current status and IDs.",
    parameters: z.object({
      status: z.enum(["pending", "in_transit", "arrived", "delayed", "cancelled"]).optional(),
    }),
    execute: async ({ status }) => {
      const results = await db.query.shipments.findMany({
        where: status ? eq(shipments.status, status) : ne(shipments.status, "arrived"),
        limit: 10,
      });
      return results;
    },
  }),

  getShipment: tool({
    description: "Get detailed information about a specific shipment by its ID.",
    parameters: z.object({
      shipmentId: z.string(),
    }),
    execute: async ({ shipmentId }) => {
      const shipment = await db.query.shipments.findFirst({
        where: eq(shipments.id, shipmentId),
        with: {
          waypoints: true,
          exceptions: true,
        },
      });
      return shipment || { error: "Shipment not found" };
    },
  }),

  liveVesselPosition: tool({
    description: "Get the latest AIS position for a vessel by its MMSI.",
    parameters: z.object({
      mmsi: z.string(),
    }),
    execute: async ({ mmsi }) => {
      const pos = await db.query.vesselPositions.findFirst({
        where: eq(vesselPositions.mmsi, mmsi),
        orderBy: desc(vesselPositions.timestamp),
      });
      return pos || { error: "No position found for this vessel" };
    },
  }),

  getWeatherOnRoute: tool({
    description: "Get weather conditions for a specific point on a shipment's route.",
    parameters: z.object({
      lat: z.number(),
      lon: z.number(),
    }),
    execute: async ({ lat, lon }) => {
      return await getWeatherForPoint(lat, lon);
    },
  }),

  scanGdeltDisruptions: tool({
    description: "Scan for real-time geopolitical disruptions or news near coordinates.",
    parameters: z.object({
      lat: z.number(),
      lon: z.number(),
    }),
    execute: async ({ lat, lon }) => {
      return await getGdeltEvents(lat, lon);
    },
  }),

  proposeReroute: tool({
    description: "Propose a reroute for a shipment to avoid a disruption. Returns a pending approval plan.",
    parameters: z.object({
      shipmentId: z.string(),
      newDestinationPortId: z.string(),
      reason: z.string(),
    }),
    execute: async ({ shipmentId, newDestinationPortId, reason }) => {
      return {
        status: "pending_approval",
        action: "reroute",
        shipmentId,
        newDestinationPortId,
        reason,
        message: `Plan generated to reroute ${shipmentId} to ${newDestinationPortId} due to: ${reason}.`,
      };
    },
  }),

  rebookCarrier: tool({
    description: "Rebook a shipment with a different carrier. Requires approval.",
    parameters: z.object({
      shipmentId: z.string(),
      newCarrierId: z.string(),
      reason: z.string(),
    }),
    execute: async ({ shipmentId, newCarrierId, reason }) => {
      return {
        status: "pending_approval",
        action: "rebook",
        shipmentId,
        newCarrierId,
        reason,
        message: `Proposal: Change carrier for ${shipmentId} to ${newCarrierId} (${reason}).`,
      };
    },
  }),

  notifyClient: tool({
    description: "Send a notification to the client regarding a delay or change. Requires approval.",
    parameters: z.object({
      shipmentId: z.string(),
      message: z.string(),
    }),
    execute: async ({ shipmentId, message }) => {
      return {
        status: "pending_approval",
        action: "notify",
        shipmentId,
        message,
      };
    },
  }),

  computeGwp: tool({
    description: "Calculate Global Warming Potential (CO2e) for a shipment based on GLEC factors.",
    parameters: z.object({
      mode: z.enum(["sea_container", "road_heavy_truck", "air_freight", "rail_freight"]),
      distanceKm: z.number(),
      weightKg: z.number(),
    }),
    execute: async (args) => {
      const { computeGwp } = await import("@/lib/analytics/gwp");
      const gwp = computeGwp(args);
      return {
        gwpKg: gwp.toFixed(2),
        unit: "kg CO2e",
        methodology: "GLEC Framework v3.0",
      };
    },
  }),
};
