import { db } from "@/db";
import { eventsAudit } from "@/db/schema";
import { desc } from "drizzle-orm";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { User, ShieldCheck } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function AuditPage() {
  const logs = await db.query.eventsAudit.findMany({
    orderBy: [desc(eventsAudit.timestamp)],
    limit: 50,
  });

  return (
    <div className="flex flex-col gap-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <ShieldCheck className="size-5 text-emerald-400" />
            <h1 className="text-2xl font-semibold tracking-tight">Execution Audit Log</h1>
          </div>
          <p className="text-sm text-muted-foreground mt-0.5">Immutable records of all agent and human actions</p>
        </div>
        <Badge variant="outline" className="text-sky-400 bg-sky-400/10 border-transparent h-6">
          Immutable Records
        </Badge>
      </div>

      <div className="rounded-xl border border-border/50 bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="text-[11px] font-medium tracking-widest uppercase text-muted-foreground">Timestamp</TableHead>
              <TableHead className="text-[11px] font-medium tracking-widest uppercase text-muted-foreground">Operator</TableHead>
              <TableHead className="text-[11px] font-medium tracking-widest uppercase text-muted-foreground">Action</TableHead>
              <TableHead className="text-[11px] font-medium tracking-widest uppercase text-muted-foreground">Tool</TableHead>
              <TableHead className="text-[11px] font-medium tracking-widest uppercase text-muted-foreground">Outcome</TableHead>
              <TableHead className="text-[11px] font-medium tracking-widest uppercase text-muted-foreground">Payload</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {logs.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">
                  No execution events recorded yet.
                </TableCell>
              </TableRow>
            ) : (
              logs.map((log) => (
                <TableRow key={log.id} className="hover:bg-white/[0.03] transition-colors">
                  <TableCell className="text-xs font-mono text-muted-foreground">
                    {log.timestamp?.toLocaleString()}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2 text-xs">
                      <User className="size-3 text-muted-foreground" />
                      <span className="font-mono">{log.actorUserId.slice(0, 8)}...</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className="uppercase text-[10px] font-mono">
                      {log.action}
                    </Badge>
                  </TableCell>
                  <TableCell className="font-mono text-xs">
                    {log.tool}
                  </TableCell>
                  <TableCell className="max-w-[300px] truncate text-sm text-muted-foreground">
                    {log.outcome}
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className="font-mono text-[10px]">
                      JSON
                    </Badge>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
