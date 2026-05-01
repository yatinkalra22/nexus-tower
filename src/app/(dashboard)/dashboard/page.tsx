import { requireUser } from "@/lib/auth";

export default async function DashboardPage() {
  const user = await requireUser();

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-3xl font-bold">Command Center</h1>
      <p className="text-muted-foreground">
        Welcome back, {user.firstName || user.username || "Operator"}.
      </p>
      
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {/* Placeholder for KPI cards to be added in F7 */}
        <div className="rounded-xl border bg-card p-6 text-card-foreground shadow">
          <div className="text-sm font-medium text-muted-foreground">Active Shipments</div>
          <div className="mt-2 text-2xl font-bold">--</div>
        </div>
        <div className="rounded-xl border bg-card p-6 text-card-foreground shadow">
          <div className="text-sm font-medium text-muted-foreground">Open Exceptions</div>
          <div className="mt-2 text-2xl font-bold text-red-500">--</div>
        </div>
        <div className="rounded-xl border bg-card p-6 text-card-foreground shadow">
          <div className="text-sm font-medium text-muted-foreground">On-Time %</div>
          <div className="mt-2 text-2xl font-bold">--</div>
        </div>
        <div className="rounded-xl border bg-card p-6 text-card-foreground shadow">
          <div className="text-sm font-medium text-muted-foreground">CO₂e Today</div>
          <div className="mt-2 text-2xl font-bold">--</div>
        </div>
      </div>
    </div>
  );
}
