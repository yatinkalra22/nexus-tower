import { requireUser } from "@/lib/auth";
import { KPICard } from "@/components/dashboard/kpi-card";
import { ExceptionFeed } from "@/components/dashboard/exception-feed";
import { LiveMap } from "@/components/map/live-map";
import { db } from "@/db";
import { shipments, exceptions, eventsAudit } from "@/db/schema";
import { count, eq, ne, desc } from "drizzle-orm";
import { Ship, AlertTriangle, CheckCircle, Leaf, ArrowRight } from "lucide-react";
import { computeGwp } from "@/lib/analytics/gwp";
import { GetStartedBanner } from "@/components/dashboard/get-started";
import Link from "next/link";

export const dynamic = "force-dynamic";

const statusDot = (s: string | null) => {
  if (s === "delayed") return "bg-red-400";
  if (s === "arrived") return "bg-emerald-400";
  if (s === "in_transit") return "bg-sky-400";
  return "bg-amber-400";
};

export default async function DashboardPage() {
  const user = await requireUser();

  let activeCount = 0;
  let openExceptionsCount = 0;
  let onTimePercent = "N/A";
  let co2eLabel = "0 kg";
  let dataUnavailable = false;
  let recentShipments: Array<{ id: string; name: string; status: string | null; originPortId: string | null; destinationPortId: string | null }> = [];
  let recentActions: Array<{ id: number; tool: string | null; outcome: string | null; timestamp: Date | null }> = [];
  let vesselMmsis: string[] = [];

  try {
    const [activeResult] = await db.select({ value: count() }).from(shipments).where(ne(shipments.status, "arrived"));
    const [exceptionResult] = await db.select({ value: count() }).from(exceptions).where(eq(exceptions.status, "open"));

    activeCount = activeResult?.value ?? 0;
    openExceptionsCount = exceptionResult?.value ?? 0;

    const [totalResult] = await db.select({ value: count() }).from(shipments);
    const [delayedResult] = await db.select({ value: count() }).from(shipments).where(eq(shipments.status, "delayed"));
    const total = totalResult?.value ?? 0;
    const delayed = delayedResult?.value ?? 0;
    if (total > 0) {
      onTimePercent = `${((total - delayed) / total * 100).toFixed(1)}%`;
    }

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
    vesselMmsis = activeShipments.filter(s => s.vesselMmsi).map(s => s.vesselMmsi as string);

    recentShipments = await db.query.shipments.findMany({
      columns: { id: true, name: true, status: true, originPortId: true, destinationPortId: true },
      orderBy: [desc(shipments.createdAt)],
      limit: 5,
    });

    recentActions = await db.select({
      id: eventsAudit.id,
      tool: eventsAudit.tool,
      outcome: eventsAudit.outcome,
      timestamp: eventsAudit.timestamp,
    }).from(eventsAudit).orderBy(desc(eventsAudit.timestamp)).limit(5);

  } catch (error) {
    dataUnavailable = true;
    console.error("Dashboard data load failed:", error);
  }

  return (
    <div className="flex flex-col gap-5 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Command Center</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {user.firstName || user.username || "Operator"} &middot; All systems nominal
          </p>
        </div>
        <Link
          href="/dashboard/agent"
          className="hidden md:flex items-center gap-2 rounded-lg border border-primary/20 bg-primary/5 px-3 py-1.5 text-xs font-medium text-primary hover:bg-primary/10 transition-colors"
        >
          Ask Agent
          <ArrowRight className="size-3" />
        </Link>
      </div>

      {dataUnavailable && (
        <div className="rounded-lg border border-amber-500/20 bg-amber-500/5 px-4 py-3 text-sm text-amber-400">
          Live data temporarily unavailable. Shell is operational.
        </div>
      )}

      {/* Get Started Banner — dismissible, stored in localStorage */}
      {activeCount === 0 && recentShipments.length === 0 && !dataUnavailable && (
        <GetStartedBanner />
      )}

      {/* KPI Strip */}
      <div className="grid gap-3 grid-cols-2 lg:grid-cols-4">
        <KPICard
          title="Active"
          value={activeCount}
          icon={Ship}
          description="In transit"
          accentColor="bg-gradient-to-r from-transparent via-sky-400/40 to-transparent"
        />
        <KPICard
          title="Exceptions"
          value={openExceptionsCount}
          icon={AlertTriangle}
          className={openExceptionsCount > 0 ? "border-amber-500/20" : ""}
          description="Requiring attention"
          accentColor="bg-gradient-to-r from-transparent via-amber-400/40 to-transparent"
        />
        <KPICard
          title="On-Time"
          value={onTimePercent}
          icon={CheckCircle}
          description="Delivery rate"
          accentColor="bg-gradient-to-r from-transparent via-emerald-400/40 to-transparent"
        />
        <KPICard
          title="CO2e"
          value={co2eLabel}
          icon={Leaf}
          description="GLEC WTW estimate"
          accentColor="bg-gradient-to-r from-transparent via-emerald-400/40 to-transparent"
        />
      </div>

      {/* Main Grid: Map + Exception Feed */}
      <div className="grid gap-4 lg:grid-cols-5">
        <div className="lg:col-span-3">
          <div className="flex items-center justify-between px-1 pb-2">
            <span className="text-[11px] font-medium tracking-widest uppercase text-muted-foreground">Fleet Overview</span>
            <Link href="/dashboard/map" className="text-[11px] text-primary hover:underline">Full Map</Link>
          </div>
          <LiveMap mmsis={vesselMmsis} height="340px" />
        </div>
        <div className="lg:col-span-2 rounded-xl border border-border/50 bg-card p-4">
          <ExceptionFeed />
        </div>
      </div>

      {/* Bottom Grid: Recent Shipments + Agent Activity */}
      <div className="grid gap-4 lg:grid-cols-2">
        {/* Recent Shipments */}
        <div className="rounded-xl border border-border/50 bg-card p-4">
          <div className="flex items-center justify-between mb-3">
            <span className="text-[11px] font-medium tracking-widest uppercase text-muted-foreground">Recent Shipments</span>
            <Link href="/dashboard/shipments" className="text-[11px] text-primary hover:underline">View All</Link>
          </div>
          {recentShipments.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground/40 text-sm">No shipments yet</div>
          ) : (
            <div className="flex flex-col gap-1">
              {recentShipments.map((s) => (
                <Link
                  key={s.id}
                  href={`/dashboard/shipments/${s.id}`}
                  className="group flex items-center justify-between py-2 px-2 rounded-lg hover:bg-white/[0.03] transition-colors"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className={`size-1.5 rounded-full shrink-0 ${statusDot(s.status)}`} />
                    <div className="min-w-0">
                      <span className="text-sm font-medium truncate block">{s.name || s.id}</span>
                      <span className="text-[11px] font-mono text-muted-foreground/60">
                        {s.originPortId || "—"} → {s.destinationPortId || "—"}
                      </span>
                    </div>
                  </div>
                  <span className="text-[10px] font-mono text-muted-foreground/40 shrink-0 ml-2">{s.id}</span>
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Agent Activity */}
        <div className="rounded-xl border border-border/50 bg-card p-4">
          <div className="flex items-center justify-between mb-3">
            <span className="text-[11px] font-medium tracking-widest uppercase text-muted-foreground">Agent Activity</span>
            <Link href="/dashboard/audit" className="text-[11px] text-primary hover:underline">Audit Log</Link>
          </div>
          {recentActions.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground/40 text-sm">No agent actions yet</div>
          ) : (
            <div className="flex flex-col gap-1">
              {recentActions.map((a) => (
                <div
                  key={a.id}
                  className="flex items-center justify-between py-2 px-2 rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    <div className={`size-1.5 rounded-full shrink-0 ${a.outcome === "approved" ? "bg-emerald-400" : a.outcome === "rejected" ? "bg-red-400" : "bg-sky-400"}`} />
                    <div>
                      <span className="text-sm font-mono">{a.tool || "—"}</span>
                      <span className="text-[11px] text-muted-foreground/60 ml-2 capitalize">{a.outcome}</span>
                    </div>
                  </div>
                  {a.timestamp && (
                    <span className="text-[10px] font-mono text-muted-foreground/40">
                      {new Date(a.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                    </span>
                  )}
                </div>
              ))}
            </div>
          )}
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
