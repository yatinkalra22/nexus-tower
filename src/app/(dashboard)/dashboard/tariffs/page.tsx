import { db } from "@/db";
import { tariffRatesCache } from "@/db/schema";
import { desc } from "drizzle-orm";
import { Globe, BookOpen } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { TariffSimulator } from "@/components/dashboard/tariff-simulator";

export default async function TariffsPage() {
  const cachedRates = await db.query.tariffRatesCache.findMany({
    orderBy: [desc(tariffRatesCache.updatedAt)],
    limit: 10,
  });

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <Globe className="size-8 text-blue-500" />
          Tariff & Geopolitics
        </h1>
        <p className="text-muted-foreground">
          Live duty rates powered by the World Bank WITS API.
        </p>
      </div>

      <TariffSimulator />

      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <div className="space-y-1">
            <CardTitle>Recent Tariff Queries</CardTitle>
            <CardDescription>Cached rates from previous agent or human queries.</CardDescription>
          </div>
          <BookOpen className="size-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>HS Code</TableHead>
                <TableHead>Lane</TableHead>
                <TableHead className="text-right">Duty Rate</TableHead>
                <TableHead className="text-right">Last Updated</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {cachedRates.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="h-24 text-center text-muted-foreground">
                    No tariff queries cached yet. Try the simulator above.
                  </TableCell>
                </TableRow>
              ) : (
                cachedRates.map((rate) => (
                  <TableRow key={`${rate.hsCode}-${rate.origin}-${rate.destination}`}>
                    <TableCell className="font-mono">{rate.hsCode}</TableCell>
                    <TableCell>
                      <span className="font-medium text-xs bg-muted px-2 py-1 rounded">
                        {rate.origin} → {rate.destination}
                      </span>
                    </TableCell>
                    <TableCell className="text-right font-mono font-medium">
                      {rate.rate.toFixed(2)}%
                    </TableCell>
                    <TableCell className="text-right text-xs text-muted-foreground">
                      {rate.updatedAt?.toLocaleString()}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
