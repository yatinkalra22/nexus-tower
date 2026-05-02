import { db } from "@/db";
import { exceptions, shipments, vesselPositions } from "@/db/schema";
import { eq, desc, ne, and, count } from "drizzle-orm";
import { AlertTriangle, Activity, Anchor, TrendingDown } from "lucide-react";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function RiskPage() {
  const openExceptions = await db.query.exceptions.findMany({
    where: eq(exceptions.status, "open"),
    orderBy: [desc(exceptions.createdAt)],
    limit: 20,
    with: { shipment: true },
  });

  const [criticalCount] = await db.select({ value: count() }).from(exceptions).where(and(eq(exceptions.status, "open"), eq(exceptions.severity, "critical")));
  const [highCount] = await db.select({ value: count() }).from(exceptions).where(and(eq(exceptions.status, "open"), eq(exceptions.severity, "high")));
  const [totalOpenCount] = await db.select({ value: count() }).from(exceptions).where(eq(exceptions.status, "open"));

  const atRiskShipments = await db.query.shipments.findMany({
    where: eq(shipments.status, "delayed"),
    limit: 10,
    with: {
      exceptions: true,
    },
  });

  const severityBorder: Record<string, string> = {
    critical: "border-l-red-400",
    high: "border-l-amber-400",
    medium: "border-l-yellow-400",
    low: "border-l-sky-400",
  };

  const severityDot: Record<string, string> = {
    critical: "bg-red-400",
    high: "bg-amber-400",
    medium: "bg-yellow-400",
    low: "bg-sky-400",
  };

  return (
    <div className="flex flex-col gap-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Risk Monitor</h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          Anomaly detection and exception tracking across the fleet
        </p>
      </div>

      {/* Risk Summary Strip */}
      <div className="grid gap-3 grid-cols-2 lg:grid-cols-4">
        <div className="rounded-xl border border-border/50 bg-card p-4">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-medium tracking-widest uppercase text-muted-foreground">Total Open</span>
            <AlertTriangle className="size-3.5 text-muted-foreground/60" />
          </div>
          <div className="mt-2 font-mono text-2xl font-bold tracking-tight">{totalOpenCount?.value ?? 0}</div>
          <p className="mt-1 text-[11px] text-muted-foreground">Active exceptions</p>
        </div>
        <div className="rounded-xl border border-red-500/20 bg-card p-4">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-medium tracking-widest uppercase text-red-400">Critical</span>
            <div className="size-1.5 rounded-full bg-red-400 animate-pulse" />
          </div>
          <div className="mt-2 font-mono text-2xl font-bold tracking-tight text-red-400">{criticalCount?.value ?? 0}</div>
          <p className="mt-1 text-[11px] text-muted-foreground">Immediate action needed</p>
        </div>
        <div className="rounded-xl border border-amber-500/20 bg-card p-4">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-medium tracking-widest uppercase text-amber-400">High</span>
            <Activity className="size-3.5 text-amber-400/60" />
          </div>
          <div className="mt-2 font-mono text-2xl font-bold tracking-tight text-amber-400">{highCount?.value ?? 0}</div>
          <p className="mt-1 text-[11px] text-muted-foreground">Elevated risk level</p>
        </div>
        <div className="rounded-xl border border-border/50 bg-card p-4">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-medium tracking-widest uppercase text-muted-foreground">At-Risk</span>
            <TrendingDown className="size-3.5 text-muted-foreground/60" />
          </div>
          <div className="mt-2 font-mono text-2xl font-bold tracking-tight">{atRiskShipments.length}</div>
          <p className="mt-1 text-[11px] text-muted-foreground">Delayed shipments</p>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-5">
        {/* Exception List */}
        <div className="lg:col-span-3 rounded-xl border border-border/50 bg-card p-4">
          <div className="flex items-center justify-between mb-4">
            <span className="text-[11px] font-medium tracking-widest uppercase text-muted-foreground">Open Exceptions</span>
            <span className="font-mono text-[11px] text-muted-foreground">{openExceptions.length} showing</span>
          </div>
          {openExceptions.length === 0 ? (
            <div className="text-center py-16 text-muted-foreground/40 text-sm leading-relaxed">
              All clear — no exceptions detected.<br />
              Disruptions from weather, AIS anomalies, and geopolitical events will appear here.
            </div>
          ) : (
            <div className="flex flex-col gap-1">
              {openExceptions.map((ex) => (
                <Link
                  key={ex.id}
                  href={`/dashboard/shipments/${ex.shipmentId}`}
                  className={`group flex flex-col gap-1.5 border-l-2 rounded-r-lg py-2.5 px-3 transition-all duration-150 hover:bg-white/[0.03] ${severityBorder[ex.severity]}`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <div className={`size-1.5 rounded-full ${severityDot[ex.severity]}`} />
                      <span className="text-[10px] font-medium tracking-wider uppercase text-muted-foreground">
                        {ex.severity}
                      </span>
                      <span className="text-[10px] font-mono text-muted-foreground/40">
                        {ex.type}
                      </span>
                    </div>
                    {ex.createdAt && (
                      <span className="font-mono text-[10px] text-muted-foreground/40">
                        {new Date(ex.createdAt).toLocaleString([], { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
                      </span>
                    )}
                  </div>
                  <p className="text-sm leading-tight group-hover:text-foreground transition-colors">
                    {ex.description}
                  </p>
                  <span className="text-[10px] font-mono text-muted-foreground/50">
                    {ex.shipmentId}
                    {ex.shipment && ex.shipment.name ? ` — ${ex.shipment.name}` : ""}
                  </span>
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* At-Risk Shipments */}
        <div className="lg:col-span-2 rounded-xl border border-border/50 bg-card p-4">
          <div className="flex items-center justify-between mb-4">
            <span className="text-[11px] font-medium tracking-widest uppercase text-muted-foreground">Delayed Shipments</span>
            <Link href="/dashboard/shipments" className="text-[11px] text-primary hover:underline">View All</Link>
          </div>
          {atRiskShipments.length === 0 ? (
            <div className="text-center py-16 text-muted-foreground/40 text-sm leading-relaxed">
              No delayed shipments.<br />
              Delays are flagged automatically when AIS data shows speed anomalies.
            </div>
          ) : (
            <div className="flex flex-col gap-1">
              {atRiskShipments.map((s) => (
                <Link
                  key={s.id}
                  href={`/dashboard/shipments/${s.id}`}
                  className="group flex items-center justify-between py-2.5 px-2 rounded-lg hover:bg-white/[0.03] transition-colors"
                >
                  <div className="min-w-0">
                    <span className="text-sm font-medium truncate block group-hover:text-foreground transition-colors">
                      {s.name}
                    </span>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-[10px] font-mono text-muted-foreground/50">{s.id}</span>
                      {s.exceptions && s.exceptions.filter(e => e.status === "open").length > 0 && (
                        <span className="text-[10px] font-mono text-red-400">
                          {s.exceptions.filter(e => e.status === "open").length} exception{s.exceptions.filter(e => e.status === "open").length !== 1 ? "s" : ""}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0 ml-2">
                    <div className="size-1.5 rounded-full bg-red-400" />
                    <span className="text-[11px] text-red-400 capitalize">delayed</span>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
