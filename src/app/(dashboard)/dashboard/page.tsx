import { requireUser } from "@/lib/auth";
import { KPICard } from "@/components/dashboard/kpi-card";
import { ExceptionFeed } from "@/components/dashboard/exception-feed";
import { db } from "@/db";
import { shipments, exceptions } from "@/db/schema";
import { count, eq, ne } from "drizzle-orm";
import { Ship, AlertTriangle, CheckCircle, Leaf } from "lucide-react";
import { computeGwp } from "@/lib/analytics/gwp";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const user = await requireUser();

  let activeCount = 0;
  let openExceptionsCount = 0;
  let onTimePercent = "N/A";
  let co2eLabel = "0 kg";
  let dataUnavailable = false;

  try {
    const [activeResult] = await db.select({ value: count() }).from(shipments).where(ne(shipments.status, "arrived"));
    const [exceptionResult] = await db.select({ value: count() }).from(exceptions).where(eq(exceptions.status, "open"));

    activeCount = activeResult?.value ?? 0;
    openExceptionsCount = exceptionResult?.value ?? 0;

    // On-Time % from real data
    const [totalResult] = await db.select({ value: count() }).from(shipments);
    const [delayedResult] = await db.select({ value: count() }).from(shipments).where(eq(shipments.status, "delayed"));
    const total = totalResult?.value ?? 0;
    const delayed = delayedResult?.value ?? 0;
    if (total > 0) {
      onTimePercent = `${((total - delayed) / total * 100).toFixed(1)}%`;
    }

    // CO2e from active shipments with waypoint-estimated distance
    const activeShipments = await db.query.shipments.findMany({
      where: ne(shipments.status, "arrived"),
      with: { waypoints: true },
    });

    let totalCo2e = 0;
    for (const s of activeShipments) {
      let distKm = 0;
      const wps = s.waypoints ?? [];
      for (let i = 1; i < wps.length; i++) {
        distKm += haversineKm(wps[i - 1].latitude, wps[i - 1].longitude, wps[i].latitude, wps[i].longitude);
      }
      if (distKm < 100) distKm = 5000;
      totalCo2e += computeGwp({ mode: s.vesselMmsi ? "sea_container" : "road_heavy_truck", distanceKm: distKm, weightKg: 20000 });
    }
    co2eLabel = `${Math.round(totalCo2e).toLocaleString()} kg`;
  } catch (error) {
    dataUnavailable = true;
    console.error("Dashboard data load failed:", error);
  }

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="text-3xl font-bold">Global Command Center</h1>
        <p className="text-muted-foreground">
          Operator: {user.firstName || user.username || "Operator"} | System optimal.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <KPICard
          title="Active Shipments"
          value={activeCount}
          icon={Ship}
          description="Live in transit"
        />
        <KPICard
          title="Open Exceptions"
          value={openExceptionsCount}
          icon={AlertTriangle}
          className={openExceptionsCount > 0 ? "border-orange-500/50" : ""}
          description="Requiring attention"
        />
        <KPICard
          title="On-Time %"
          value={onTimePercent}
          icon={CheckCircle}
          description="Based on shipment statuses"
        />
        <KPICard
          title="CO₂e Active"
          value={co2eLabel}
          icon={Leaf}
          description="GLEC WTW factor"
        />
      </div>

      {dataUnavailable && (
        <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-600">
          Live dashboard data is temporarily unavailable. The operator shell is still available while the data layer recovers.
        </div>
      )}

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <div className="md:col-span-1 lg:col-span-1 border rounded-xl p-6 bg-card shadow-sm">
          <ExceptionFeed />
        </div>

        <div className="md:col-span-1 lg:col-span-2 border rounded-xl p-6 bg-card shadow-sm flex flex-col gap-4">
          <h3 className="font-semibold">Strategic Insights</h3>
          <div className="flex-1 flex items-center justify-center border border-dashed rounded-lg text-muted-foreground text-sm">
            Predictive analytics will populate here as AIS data accumulates.
          </div>
        </div>
      </div>
    </div>
  );
}

function haversineKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}
