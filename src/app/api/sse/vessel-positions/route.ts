import { NextRequest } from "next/server";
import { db } from "@/db";
import { vesselPositions } from "@/db/schema";
import { desc, inArray } from "drizzle-orm";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const mmsis = searchParams.get("mmsis")?.split(",") || [];

  if (mmsis.length === 0) {
    return new Response("MMSIs required", { status: 400 });
  }

  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      const sendUpdate = async () => {
        try {
          // Get the latest position for each requested MMSI
          // This is a bit simplified; in production, we'd use a more efficient query
          const latestPositions = await db
            .select()
            .from(vesselPositions)
            .where(inArray(vesselPositions.mmsi, mmsis))
            .orderBy(desc(vesselPositions.timestamp))
            .limit(mmsis.length * 2); // Get some extra to be sure

          // Group by MMSI and pick the latest for each
          const latestMap = new Map();
          for (const pos of latestPositions) {
            if (!latestMap.has(pos.mmsi)) {
              latestMap.set(pos.mmsi, pos);
            }
          }

          const data = JSON.stringify(Array.from(latestMap.values()));
          controller.enqueue(encoder.encode(`data: ${data}\n\n`));
        } catch (error) {
          console.error("SSE Update Error:", error);
        }
      };

      // Initial send
      await sendUpdate();

      const interval = setInterval(sendUpdate, 2000);

      req.signal.addEventListener("abort", () => {
        clearInterval(interval);
        controller.close();
      });
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
}
