import { WebSocket } from "ws";
import { createClient } from "@libsql/client";
import { drizzle } from "drizzle-orm/libsql";
import * as dotenv from "dotenv";
import * as path from "path";

// Load env vars from .env.local
dotenv.config({ path: path.resolve(process.cwd(), ".env.local") });

const TURSO_DATABASE_URL = process.env.TURSO_DATABASE_URL!;
const TURSO_AUTH_TOKEN = process.env.TURSO_AUTH_TOKEN!;
const AISSTREAM_API_KEY = process.env.AISSTREAM_API_KEY!;

if (!TURSO_DATABASE_URL || !AISSTREAM_API_KEY) {
  console.error("Missing required environment variables for ingestor");
  process.exit(1);
}

const client = createClient({
  url: TURSO_DATABASE_URL,
  authToken: TURSO_AUTH_TOKEN,
});

// AIS Stream WebSocket URL
const AIS_WS_URL = "wss://stream.aisstream.io/v0/stream";

async function getTrackedMmsis(): Promise<string[]> {
  const result = await client.execute("SELECT mmsi FROM vessels");
  return result.rows.map((r) => r.mmsi as string);
}

function connect() {
  const ws = new WebSocket(AIS_WS_URL);

  ws.on("open", async () => {
    console.log("Connected to aisstream.io");
    const mmsis = await getTrackedMmsis();
    
    if (mmsis.length === 0) {
      console.log("No vessels to track. Waiting...");
      // In a real app, we might want to poll for new MMSIs or use a trigger
    }

    const subscriptionMessage = {
      APIKey: AISSTREAM_API_KEY,
      BoundingBoxes: [[[-90, -180], [90, 180]]], // Global for our specific MMSIs
      FiltersShipMMSI: mmsis,
      FilterMessageTypes: ["PositionReport"],
    };

    ws.send(JSON.stringify(subscriptionMessage));
    console.log(`Subscribed to ${mmsis.length} MMSIs`);
  });

  ws.on("message", async (data) => {
    try {
      const message = JSON.parse(data.toString());
      if (message.MessageType === "PositionReport") {
        const report = message.Message.PositionReport;
        const mmsi = message.MetaData.MMSI.toString();
        const latitude = report.Latitude;
        const longitude = report.Longitude;
        const speed = report.Sog;
        const heading = report.Cog;
        const timestampSec = Math.floor(Date.now() / 1000);

        console.log(`[${mmsi}] Lat: ${latitude}, Lon: ${longitude}, Speed: ${speed}`);

        await client.execute({
          sql: "INSERT INTO vessel_positions (mmsi, latitude, longitude, speed, heading, timestamp) VALUES (?, ?, ?, ?, ?, ?)",
          args: [mmsi, latitude, longitude, speed, heading, timestampSec],
        });
      }
    } catch (err) {
      console.error("Error processing message:", err);
    }
  });

  ws.on("error", (err) => {
    console.error("WebSocket error:", err);
  });

  ws.on("close", () => {
    console.log("WebSocket closed. Reconnecting in 5s...");
    setTimeout(connect, 5000);
  });
}

connect();
