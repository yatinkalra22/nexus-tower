import { db } from "@/db";
import { inventoryItems } from "@/db/schema";
import { desc } from "drizzle-orm";
import { Package, AlertOctagon } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { ImportInventoryCSVButton } from "./import-button";

import type { Metadata } from "next";

export const metadata: Metadata = { title: "Inventory | NexusTower" };
export const dynamic = "force-dynamic";

export default async function InventoryPage() {
  const items = await db.query.inventoryItems.findMany({
    orderBy: [desc(inventoryItems.sku)],
  });

  const criticalItems = items.filter(item =>
    item.reorderPoint !== null && item.onHand <= item.reorderPoint
  );

  return (
    <div className="flex flex-col gap-8 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Package className="size-5 text-sky-400" />
            <h1 className="text-2xl font-semibold tracking-tight">Inventory Monitor</h1>
          </div>
          <p className="text-sm text-muted-foreground mt-0.5">
            SKU safety stock levels and reorder alerts.
          </p>
        </div>
        <ImportInventoryCSVButton />
      </div>

      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 md:grid-cols-3">
        <Card className="rounded-xl border border-border/50 bg-card p-4">
          <CardHeader className="p-0 pb-2">
            <p className="text-[11px] font-medium tracking-widest uppercase text-muted-foreground">Total SKUs Tracked</p>
          </CardHeader>
          <CardContent className="p-0">
            <div className="text-2xl font-semibold tracking-tight font-mono">{items.length}</div>
          </CardContent>
        </Card>
        <Card className={`rounded-xl border bg-card p-4 ${criticalItems.length > 0 ? "border-red-500/30" : "border-border/50"}`}>
          <CardHeader className="p-0 pb-2">
            <div className="flex items-center gap-2">
              <AlertOctagon className={`size-3.5 ${criticalItems.length > 0 ? "text-red-400" : "text-muted-foreground"}`} />
              <p className="text-[11px] font-medium tracking-widest uppercase text-muted-foreground">Critical Alerts</p>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className={`text-2xl font-semibold tracking-tight font-mono ${criticalItems.length > 0 ? "text-red-400" : ""}`}>
              {criticalItems.length}
            </div>
            <p className="text-xs text-muted-foreground mt-1">Below reorder point</p>
          </CardContent>
        </Card>
        <Card className="rounded-xl border border-border/50 bg-card p-4">
          <CardHeader className="p-0 pb-2">
            <p className="text-[11px] font-medium tracking-widest uppercase text-muted-foreground">Service Level</p>
          </CardHeader>
          <CardContent className="p-0">
            <div className="text-2xl font-semibold tracking-tight font-mono text-emerald-400">95%</div>
            <p className="text-xs text-muted-foreground mt-1">Z-Score: <span className="font-mono">1.65</span></p>
          </CardContent>
        </Card>
      </div>

      <Card className="rounded-xl border border-border/50 bg-card">
        <CardHeader className="px-4 pt-4 pb-2">
          <p className="text-[11px] font-medium tracking-widest uppercase text-muted-foreground">SKU Inventory Status</p>
          <CardDescription className="text-xs">Current on-hand quantities vs computed thresholds.</CardDescription>
        </CardHeader>
        <CardContent className="px-0 pb-0">
          <div className="overflow-x-auto">
          <Table className="min-w-[600px]">
            <TableHeader>
              <TableRow>
                <TableHead className="text-[11px] font-medium tracking-widest uppercase text-muted-foreground">SKU</TableHead>
                <TableHead className="text-[11px] font-medium tracking-widest uppercase text-muted-foreground">Item Name</TableHead>
                <TableHead className="text-[11px] font-medium tracking-widest uppercase text-muted-foreground text-right">On Hand</TableHead>
                <TableHead className="text-[11px] font-medium tracking-widest uppercase text-muted-foreground text-right">Safety Stock</TableHead>
                <TableHead className="text-[11px] font-medium tracking-widest uppercase text-muted-foreground text-right">Reorder Pt</TableHead>
                <TableHead className="text-[11px] font-medium tracking-widest uppercase text-muted-foreground">Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="h-48">
                    <div className="flex flex-col items-center justify-center gap-3 py-8">
                      <Package className="size-8 text-muted-foreground/20" />
                      <div className="text-center">
                        <p className="text-sm font-medium text-muted-foreground">No SKUs tracked</p>
                        <p className="text-xs text-muted-foreground/60 mt-1">Import inventory data via CSV to monitor safety stock levels and reorder alerts.</p>
                      </div>
                      <div className="mt-2">
                        <ImportInventoryCSVButton />
                      </div>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                items.map((item) => {
                  const isCritical = item.reorderPoint !== null && item.onHand <= item.reorderPoint;
                  return (
                    <TableRow key={item.sku} className="hover:bg-white/[0.03] transition-colors">
                      <TableCell className="font-mono font-medium">{item.sku}</TableCell>
                      <TableCell>{item.name}</TableCell>
                      <TableCell className="text-right font-mono">
                        {item.onHand.toLocaleString()} <span className="text-[10px] text-muted-foreground ml-1">{item.unit}</span>
                      </TableCell>
                      <TableCell className="text-right font-mono text-muted-foreground">
                        {item.safetyStock?.toLocaleString() || "--"}
                      </TableCell>
                      <TableCell className="text-right font-mono">
                        {item.reorderPoint?.toLocaleString() || "--"}
                      </TableCell>
                      <TableCell>
                        {isCritical ? (
                          <div className="flex items-center gap-2">
                            <div className="size-1.5 rounded-full bg-red-400" />
                            <span className="text-sm text-red-400">Reorder</span>
                          </div>
                        ) : (
                          <div className="flex items-center gap-2">
                            <div className="size-1.5 rounded-full bg-emerald-400" />
                            <span className="text-sm text-emerald-400">Healthy</span>
                          </div>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
