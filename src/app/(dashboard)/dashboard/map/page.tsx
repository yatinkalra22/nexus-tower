import { db } from "@/db";
import { shipments } from "@/db/schema";
import { ne, isNotNull, and } from "drizzle-orm";
import { LiveMap } from "@/components/map/live-map";

export default async function GlobalMapPage() {
  const activeShipments = await db.query.shipments.findMany({
    where: and(ne(shipments.status, "arrived"), isNotNull(shipments.vesselMmsi)),
  });

  const mmsis = activeShipments.map(s => s.vesselMmsi as string);

  return (
    <div className="flex flex-col gap-4 h-full">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Global Fleet Map</h1>
        <div className="text-sm text-muted-foreground">
          Tracking {mmsis.length} active vessels
        </div>
      </div>
      
      <div className="flex-1 min-h-[600px] border rounded-xl overflow-hidden shadow-lg">
        <LiveMap mmsis={mmsis} height="100%" />
      </div>
    </div>
  );
}
