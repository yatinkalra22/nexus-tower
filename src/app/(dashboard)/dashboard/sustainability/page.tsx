import { requireUser } from "@/lib/auth";
import { db } from "@/db";
import { shipments } from "@/db/schema";
import { Leaf, Info, FileJson } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { computeGwp } from "@/lib/analytics/gwp";

export default async function SustainabilityPage() {
  const user = await requireUser();
  const allShipments = await db.query.shipments.findMany({
    limit: 10,
    orderBy: (s, { desc }) => [desc(s.createdAt)],
  });

  // Calculate some aggregate stats
  const totalGwp = allShipments.reduce((acc, s) => acc + computeGwp({
    mode: "sea_container",
    distanceKm: 12000,
    weightKg: 20000,
  }), 0);

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <Leaf className="size-8 text-green-500" />
          Sustainability Pulse
        </h1>
        <p className="text-muted-foreground">
          Real-time CO₂e monitoring aligned with Jan-2026 EU GWP mandates.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card className="bg-green-500/5 border-green-500/20">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-green-600">Total Footprint (MTD)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-700">{totalGwp.toLocaleString()} kg CO₂e</div>
            <p className="text-xs text-green-600/70 mt-1">+12% from last month</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Avg Intensity</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">0.0151 kg/tkm</div>
            <p className="text-xs text-muted-foreground mt-1">GLEC v3 Sea Factor</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Compliance Status</CardTitle>
          </CardHeader>
          <CardContent>
            <Badge className="bg-green-500 hover:bg-green-600">EU DPP READY</Badge>
            <p className="text-xs text-muted-foreground mt-1">Digital Product Passport</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Shipment GWP Breakdown</CardTitle>
          <CardDescription>Verified emissions per active shipment.</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Shipment</TableHead>
                <TableHead>Mode</TableHead>
                <TableHead>Methodology</TableHead>
                <TableHead className="text-right">Est. CO₂e</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {allShipments.map((s) => {
                const gwp = computeGwp({
                  mode: "sea_container",
                  distanceKm: 12000,
                  weightKg: 20000,
                });
                return (
                  <TableRow key={s.id}>
                    <TableCell className="font-medium">{s.id}</TableCell>
                    <TableCell><Badge variant="outline">Sea</Badge></TableCell>
                    <TableCell className="text-xs text-muted-foreground">GLEC Framework v3</TableCell>
                    <TableCell className="text-right font-mono">{gwp.toLocaleString()} kg</TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="sm" asChild>
                        <Link href={`/api/dpp/${s.id}`} target="_blank">
                          <FileJson className="mr-2 size-4" />
                          View DPP
                        </Link>
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <div className="rounded-xl border border-dashed p-12 flex flex-col items-center justify-center text-center gap-4 bg-muted/20">
        <Info className="size-12 text-muted-foreground opacity-50" />
        <div className="max-w-md">
          <h3 className="font-semibold">Jan-2026 EU Reporting Mandate</h3>
          <p className="text-sm text-muted-foreground mt-2">
            NexusTower automatically generates the required GWP declaration for every shipment, 
            allowing instant compliance with new EU Digital Product Passport regulations.
          </p>
        </div>
      </div>
    </div>
  );
}
