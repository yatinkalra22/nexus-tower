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
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <ShieldCheck className="size-8 text-green-500" />
          Execution Audit Log
        </h1>
        <Badge variant="outline" className="h-6">
          Immutable Records
        </Badge>
      </div>

      <div className="rounded-md border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Timestamp</TableHead>
              <TableHead>Operator</TableHead>
              <TableHead>Action</TableHead>
              <TableHead>Tool</TableHead>
              <TableHead>Outcome</TableHead>
              <TableHead>Payload</TableHead>
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
                <TableRow key={log.id}>
                  <TableCell className="text-xs font-mono">
                    {log.timestamp?.toLocaleString()}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2 text-xs">
                      <User className="size-3" />
                      {log.actorUserId.slice(0, 8)}...
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary" className="uppercase text-[10px]">
                      {log.action}
                    </Badge>
                  </TableCell>
                  <TableCell className="font-mono text-xs">
                    {log.tool}
                  </TableCell>
                  <TableCell className="max-w-[300px] truncate text-sm">
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
