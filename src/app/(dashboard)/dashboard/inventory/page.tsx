import { db } from "@/db";
import { inventoryItems } from "@/db/schema";
import { desc } from "drizzle-orm";
import { Package, AlertOctagon } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { ImportInventoryCSVButton } from "./import-button";

export const dynamic = "force-dynamic";

export default async function InventoryPage() {
  const items = await db.query.inventoryItems.findMany({
    orderBy: [desc(inventoryItems.sku)],
  });

  const criticalItems = items.filter(item => 
    item.reorderPoint !== null && item.onHand <= item.reorderPoint
  );

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Package className="size-8 text-indigo-500" />
            Inventory Monitor
          </h1>
          <p className="text-muted-foreground">
            SKU safety stock levels and reorder alerts.
          </p>
        </div>
        <ImportInventoryCSVButton />
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total SKUs Tracked</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{items.length}</div>
          </CardContent>
        </Card>
        <Card className={criticalItems.length > 0 ? "border-red-500/50 bg-red-500/5" : ""}>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <AlertOctagon className={`size-4 ${criticalItems.length > 0 ? "text-red-500" : "text-muted-foreground"}`} />
              Critical Alerts
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${criticalItems.length > 0 ? "text-red-500" : ""}`}>
              {criticalItems.length}
            </div>
            <p className="text-xs text-muted-foreground mt-1">Below reorder point</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Service Level</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">95%</div>
            <p className="text-xs text-muted-foreground mt-1">Z-Score: 1.65</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>SKU Inventory Status</CardTitle>
          <CardDescription>Current on-hand quantities vs computed thresholds.</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>SKU</TableHead>
                <TableHead>Item Name</TableHead>
                <TableHead className="text-right">On Hand</TableHead>
                <TableHead className="text-right">Safety Stock</TableHead>
                <TableHead className="text-right">Reorder Pt</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">
                    No inventory data. Import a CSV to get started.
                  </TableCell>
                </TableRow>
              ) : (
                items.map((item) => {
                  const isCritical = item.reorderPoint !== null && item.onHand <= item.reorderPoint;
                  return (
                    <TableRow key={item.sku} className={isCritical ? "bg-red-500/5" : ""}>
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
                          <Badge variant="destructive">Reorder</Badge>
                        ) : (
                          <Badge variant="outline" className="text-green-500 border-green-500/30 bg-green-500/10">Healthy</Badge>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
