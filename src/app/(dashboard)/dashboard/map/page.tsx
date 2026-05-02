import { db } from "@/db";
import { shipments } from "@/db/schema";
import { ne, isNotNull, and } from "drizzle-orm";
import { LiveMap } from "@/components/map/live-map";

import type { Metadata } from "next";

export const metadata: Metadata = { title: "Fleet Map | NexusTower" };
export const dynamic = "force-dynamic";

export default async function GlobalMapPage() {
  const activeShipments = await db.query.shipments.findMany({
    where: and(ne(shipments.status, "arrived"), isNotNull(shipments.vesselMmsi)),
  });

  const mmsis = activeShipments.map(s => s.vesselMmsi as string);

  return (
    <div className="flex flex-1 flex-col gap-4 animate-fade-in">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Global Fleet Map</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Real-time vessel positions via AIS</p>
        </div>
        <div className="text-[11px] font-medium tracking-widest uppercase text-muted-foreground">
          Tracking <span className="font-mono text-foreground">{mmsis.length}</span> active vessels
        </div>
      </div>

      <div className="relative flex-1">
        <LiveMap mmsis={mmsis} height="calc(100vh - 180px)" />
        {mmsis.length === 0 && (
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-10 rounded-lg border border-border/50 bg-background/90 backdrop-blur px-3 py-2 text-xs text-muted-foreground">
            No vessels tracked yet. Attach MMSI numbers to shipments to see them here.
          </div>
        )}
      </div>
    </div>
  );
}
