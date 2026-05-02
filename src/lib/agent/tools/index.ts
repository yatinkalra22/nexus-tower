import { tool } from "ai";
import { z } from "zod";
import { db } from "@/db";
import { shipments, vesselPositions, routeWaypoints, exceptions } from "@/db/schema";
import { eq, desc, and, ne } from "drizzle-orm";
import { getGdeltEvents } from "@/server/enrich/gdelt";
import { getWeatherForPoint } from "@/server/enrich/weather";

export const tools = {
  queryShipments: tool({
    description: "List active shipments with their current status and IDs. Set status to 'all' to include every shipment.",
    inputSchema: z.object({
      status: z.enum(["all", "pending", "in_transit", "arrived", "delayed", "cancelled"]).default("all"),
    }),
    execute: async ({ status }) => {
      const filterStatus = status === "all" ? undefined : status;
      const results = await db.query.shipments.findMany({
        where: filterStatus ? eq(shipments.status, filterStatus) : ne(shipments.status, "arrived"),
        limit: 10,
      });
      return results;
    },
  }),

  getShipment: tool({
    description: "Get detailed information about a specific shipment by its ID.",
    inputSchema: z.object({
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
    inputSchema: z.object({
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
    inputSchema: z.object({
      lat: z.number(),
      lon: z.number(),
    }),
    execute: async ({ lat, lon }) => {
      return await getWeatherForPoint(lat, lon);
    },
  }),

  scanGdeltDisruptions: tool({
    description: "Scan for real-time geopolitical disruptions or news near coordinates.",
    inputSchema: z.object({
      lat: z.number(),
      lon: z.number(),
    }),
    execute: async ({ lat, lon }) => {
      return await getGdeltEvents(lat, lon);
    },
  }),

  proposeReroute: tool({
    description: "Propose a reroute for a shipment to avoid a disruption. Returns a pending approval plan.",
    inputSchema: z.object({
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
    inputSchema: z.object({
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
    inputSchema: z.object({
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
    inputSchema: z.object({
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

  getTariffRate: tool({
    description: "Get the current tariff or duty rate for a specific HS code between an origin and destination.",
    inputSchema: z.object({
      hsCode: z.string(),
      origin: z.string(),
      destination: z.string(),
    }),
    execute: async ({ hsCode, origin, destination }) => {
      const { getTariffRate } = await import("@/server/tariffs/wits");
      const rate = await getTariffRate(hsCode, origin, destination);
      return {
        hsCode,
        origin,
        destination,
        ratePercent: rate,
        source: "WITS API / Local Benchmark",
      };
    },
  }),

  checkInventory: tool({
    description: "Check the inventory status for a specific SKU, including on-hand quantity, safety stock, and reorder points.",
    inputSchema: z.object({
      sku: z.string(),
    }),
    execute: async ({ sku }) => {
      const { db } = await import("@/db");
      const { inventoryItems } = await import("@/db/schema");
      const { eq } = await import("drizzle-orm");

      const item = await db.query.inventoryItems.findFirst({
        where: eq(inventoryItems.sku, sku),
      });

      if (!item) return { error: "SKU not found in inventory." };

      const isStockoutRisk = item.reorderPoint !== null && item.onHand <= item.reorderPoint;

      return {
        sku: item.sku,
        name: item.name,
        onHand: item.onHand,
        safetyStock: item.safetyStock,
        reorderPoint: item.reorderPoint,
        unit: item.unit,
        isStockoutRisk,
        statusMessage: isStockoutRisk ? "CRITICAL: Below or at reorder point." : "Healthy",
      };
    },
  }),
};
