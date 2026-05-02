import { db } from "@/db";
import { shipments } from "@/db/schema";
import { ne, isNotNull, and } from "drizzle-orm";
import { LiveMap } from "@/components/map/live-map";

export const dynamic = "force-dynamic";

export default async function GlobalMapPage() {
  const activeShipments = await db.query.shipments.findMany({
    where: and(ne(shipments.status, "arrived"), isNotNull(shipments.vesselMmsi)),
  });

  const mmsis = activeShipments.map(s => s.vesselMmsi as string);

  return (
    <div className="flex flex-col gap-4 h-full animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Global Fleet Map</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Real-time vessel positions via AIS</p>
        </div>
        <div className="text-[11px] font-medium tracking-widest uppercase text-muted-foreground">
          Tracking <span className="font-mono text-foreground">{mmsis.length}</span> active vessels
        </div>
      </div>

      <div className="flex-1 min-h-[600px] rounded-xl border border-border/50 overflow-hidden">
        <LiveMap mmsis={mmsis} height="100%" />
      </div>
    </div>
  );
}
