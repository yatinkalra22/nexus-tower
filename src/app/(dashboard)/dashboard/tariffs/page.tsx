import { db } from "@/db";
import { tariffRatesCache } from "@/db/schema";
import { desc } from "drizzle-orm";
import { Globe, BookOpen } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { TariffSimulator } from "@/components/dashboard/tariff-simulator";

export const dynamic = "force-dynamic";

export default async function TariffsPage() {
  const cachedRates = await db.query.tariffRatesCache.findMany({
    orderBy: [desc(tariffRatesCache.updatedAt)],
    limit: 10,
  });

  return (
    <div className="flex flex-col gap-8 animate-fade-in">
      <div>
        <div className="flex items-center gap-2">
          <Globe className="size-5 text-sky-400" />
          <h1 className="text-2xl font-semibold tracking-tight">Tariff & Geopolitics</h1>
        </div>
        <p className="text-sm text-muted-foreground mt-0.5">
          Live duty rates powered by the World Bank WITS API.
        </p>
      </div>

      <TariffSimulator />

      <Card className="rounded-xl border border-border/50 bg-card">
        <CardHeader className="flex flex-row items-center justify-between px-4 pt-4 pb-2">
          <div className="space-y-1">
            <p className="text-[11px] font-medium tracking-widest uppercase text-muted-foreground">Recent Tariff Queries</p>
            <CardDescription className="text-xs">Cached rates from previous agent or human queries.</CardDescription>
          </div>
          <BookOpen className="size-4 text-muted-foreground" />
        </CardHeader>
        <CardContent className="px-0 pb-0">
          <div className="overflow-x-auto">
          <Table className="min-w-[600px]">
            <TableHeader>
              <TableRow>
                <TableHead className="text-[11px] font-medium tracking-widest uppercase text-muted-foreground">HS Code</TableHead>
                <TableHead className="text-[11px] font-medium tracking-widest uppercase text-muted-foreground">Lane</TableHead>
                <TableHead className="text-[11px] font-medium tracking-widest uppercase text-muted-foreground text-right">Duty Rate</TableHead>
                <TableHead className="text-[11px] font-medium tracking-widest uppercase text-muted-foreground text-right">Last Updated</TableHead>
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
                  <TableRow key={`${rate.hsCode}-${rate.origin}-${rate.destination}`} className="hover:bg-white/[0.03] transition-colors">
                    <TableCell className="font-mono font-medium">{rate.hsCode}</TableCell>
                    <TableCell>
                      <span className="font-mono text-xs text-muted-foreground">
                        {rate.origin} <span className="text-sky-400">-&gt;</span> {rate.destination}
                      </span>
                    </TableCell>
                    <TableCell className="text-right font-mono font-medium">
                      {rate.rate.toFixed(2)}%
                    </TableCell>
                    <TableCell className="text-right font-mono text-xs text-muted-foreground">
                      {rate.updatedAt?.toLocaleString()}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
