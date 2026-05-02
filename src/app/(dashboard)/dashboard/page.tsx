import { requireUser } from "@/lib/auth";
import { KPICard } from "@/components/dashboard/kpi-card";
import { ExceptionFeed } from "@/components/dashboard/exception-feed";
import { db } from "@/db";
import { shipments, exceptions } from "@/db/schema";
import { count, eq, ne } from "drizzle-orm";
import { Ship, AlertTriangle, CheckCircle, Leaf } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const user = await requireUser();

  const [activeCount] = await db.select({ value: count() }).from(shipments).where(ne(shipments.status, "arrived"));
  const [openExceptionsCount] = await db.select({ value: count() }).from(exceptions).where(eq(exceptions.status, "open"));

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
          value={activeCount?.value ?? 0} 
          icon={Ship}
          description="Live in transit"
        />
        <KPICard 
          title="Open Exceptions" 
          value={openExceptionsCount?.value ?? 0} 
          icon={AlertTriangle}
          className={openExceptionsCount?.value > 0 ? "border-orange-500/50" : ""}
          description="Requiring attention"
        />
        <KPICard 
          title="On-Time %" 
          value="94.2%" 
          icon={CheckCircle}
          trend={{ value: 2.1, label: "from last week", isPositive: true }}
        />
        <KPICard 
          title="CO₂e Today" 
          value="1,240 kg" 
          icon={Leaf}
          description="GLEC WTW factor"
        />
      </div>

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
