import { sql, relations } from "drizzle-orm";
import { sqliteTable, text, integer, real, index, primaryKey, uniqueIndex } from "drizzle-orm/sqlite-core";

export const shipments = sqliteTable("shipments", {
  id: text("id").primaryKey(), // SH-XXXX
  name: text("name").notNull(),
  status: text("status", { enum: ["pending", "in_transit", "arrived", "delayed", "cancelled"] }).default("pending"),
  originPortId: text("origin_port_id").references(() => ports.id),
  destinationPortId: text("destination_port_id").references(() => ports.id),
  carrierId: text("carrier_id").references(() => carriers.id),
  vesselMmsi: text("vessel_mmsi").references(() => vessels.mmsi),
  eta: integer("eta", { mode: "timestamp" }),
  actualArrival: integer("actual_arrival", { mode: "timestamp" }),
  createdAt: integer("created_at", { mode: "timestamp" }).default(sql`(strftime('%s', 'now'))`),
  updatedAt: integer("updated_at", { mode: "timestamp" }).default(sql`(strftime('%s', 'now'))`),
});

export const shipmentsRelations = relations(shipments, ({ one, many }) => ({
  originPort: one(ports, {
    fields: [shipments.originPortId],
    references: [ports.id],
  }),
  destinationPort: one(ports, {
    fields: [shipments.destinationPortId],
    references: [ports.id],
  }),
  carrier: one(carriers, {
    fields: [shipments.carrierId],
    references: [carriers.id],
  }),
  vessel: one(vessels, {
    fields: [shipments.vesselMmsi],
    references: [vessels.mmsi],
  }),
  exceptions: many(exceptions),
  waypoints: many(routeWaypoints),
}));

export const carriers = sqliteTable("carriers", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  type: text("type").notNull(), // sea, road, air
});

export const ports = sqliteTable("ports", {
  id: text("id").primaryKey(), // UN/LOCODE
  name: text("name").notNull(),
  country: text("country").notNull(),
  latitude: real("latitude").notNull(),
  longitude: real("longitude").notNull(),
});

export const vessels = sqliteTable("vessels", {
  mmsi: text("mmsi").primaryKey(),
  name: text("name").notNull(),
  type: text("type"),
  flag: text("flag"),
});

export const vesselPositions = sqliteTable("vessel_positions", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  mmsi: text("mmsi").notNull().references(() => vessels.mmsi),
  latitude: real("latitude").notNull(),
  longitude: real("longitude").notNull(),
  speed: real("speed"),
  heading: real("heading"),
  timestamp: integer("timestamp", { mode: "timestamp" }).notNull(),
}, (table) => ({
  mmsiIdx: index("vessel_positions_mmsi_idx").on(table.mmsi),
  tsIdx: index("vessel_positions_ts_idx").on(table.timestamp),
}));

export const routeWaypoints = sqliteTable("route_waypoints", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  shipmentId: text("shipment_id").notNull().references(() => shipments.id),
  sequence: integer("sequence").notNull(),
  latitude: real("latitude").notNull(),
  longitude: real("longitude").notNull(),
  estimatedTimestamp: integer("estimated_timestamp", { mode: "timestamp" }),
  weatherCondition: text("weather_condition"),
  weatherTemp: real("weather_temp"),
}, (table) => ({
  shipmentIdx: index("route_waypoints_shipment_idx").on(table.shipmentId),
}));

export const exceptions = sqliteTable("exceptions", {
  id: text("id").primaryKey(),
  shipmentId: text("shipment_id").notNull().references(() => shipments.id),
  type: text("type").notNull(), // delay, weather, geopolitical, etc.
  severity: text("severity", { enum: ["low", "medium", "high", "critical"] }).notNull(),
  description: text("description").notNull(),
  status: text("status", { enum: ["open", "resolved", "dismissed"] }).default("open"),
  createdAt: integer("created_at", { mode: "timestamp" }).default(sql`(strftime('%s', 'now'))`),
}, (table) => ({
  shipmentIdx: index("exceptions_shipment_idx").on(table.shipmentId),
}));

export const eventsAudit = sqliteTable("events_audit", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  actorUserId: text("actor_user_id").notNull(),
  action: text("action").notNull(), // approve, reject, execute_tool
  tool: text("tool"),
  payload: text("payload"), // JSON
  outcome: text("outcome"),
  timestamp: integer("timestamp", { mode: "timestamp" }).default(sql`(strftime('%s', 'now'))`),
});

export const inventoryItems = sqliteTable("inventory_items", {
  sku: text("sku").primaryKey(),
  name: text("name").notNull(),
  onHand: integer("on_hand").notNull(),
  safetyStock: integer("safety_stock"),
  reorderPoint: integer("reorder_point"),
  unit: text("unit").default("pcs"),
});

export const tariffRatesCache = sqliteTable("tariff_rates_cache", {
  hsCode: text("hs_code").notNull(),
  origin: text("origin").notNull(),
  destination: text("destination").notNull(),
  rate: real("rate").notNull(),
  updatedAt: integer("updated_at", { mode: "timestamp" }).default(sql`(strftime('%s', 'now'))`),
}, (table) => ({
  pk: primaryKey({ columns: [table.hsCode, table.origin, table.destination] }),
}));

export const agentRuns = sqliteTable("agent_runs", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull(),
  prompt: text("prompt").notNull(),
  response: text("response"),
  steps: text("steps"), // JSON array of steps
  createdAt: integer("created_at", { mode: "timestamp" }).default(sql`(strftime('%s', 'now'))`),
});

export const agentTokenUsage = sqliteTable("agent_token_usage", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  userId: text("user_id").notNull(),
  date: text("date").notNull(), // YYYY-MM-DD
  inputTokens: integer("input_tokens").default(0),
  outputTokens: integer("output_tokens").default(0),
}, (table) => ({
  userDateUniq: uniqueIndex("agent_token_usage_user_date_uniq").on(table.userId, table.date),
}));

export const mcpTokens = sqliteTable("mcp_tokens", {
  token: text("token").primaryKey(),
  userId: text("user_id").notNull(),
  name: text("name").notNull(), // e.g. "Claude Desktop"
  createdAt: integer("created_at", { mode: "timestamp" }).default(sql`(strftime('%s', 'now'))`),
}, (table) => ({
  userIdIdx: index("mcp_tokens_user_id_idx").on(table.userId),
}));
