import { getShipments } from '@/server/shipments';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import Link from 'next/link';

import { ImportCSVButton } from './import-button';

export const dynamic = "force-dynamic";

function statusDot(status: string) {
  if (status === 'delayed') return 'bg-red-400';
  if (status === 'arrived') return 'bg-emerald-400';
  if (status === 'in_transit') return 'bg-sky-400';
  if (status === 'cancelled') return 'bg-zinc-400';
  return 'bg-amber-400'; // pending
}

export default async function ShipmentsPage() {
  const shipments = await getShipments();

  return (
    <div className="flex flex-col gap-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Shipments</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Manage and track all shipments</p>
        </div>
        <div className="flex gap-2">
          <ImportCSVButton />
          <Link href="/dashboard/shipments/new">
            <Button size="sm">
              <Plus className="mr-2 size-4" />
              New Shipment
            </Button>
          </Link>
        </div>
      </div>

      <div className="rounded-xl border border-border/50 bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="text-[11px] font-medium tracking-widest uppercase text-muted-foreground">ID</TableHead>
              <TableHead className="text-[11px] font-medium tracking-widest uppercase text-muted-foreground">Name</TableHead>
              <TableHead className="text-[11px] font-medium tracking-widest uppercase text-muted-foreground">Status</TableHead>
              <TableHead className="text-[11px] font-medium tracking-widest uppercase text-muted-foreground">Origin</TableHead>
              <TableHead className="text-[11px] font-medium tracking-widest uppercase text-muted-foreground">Destination</TableHead>
              <TableHead className="text-[11px] font-medium tracking-widest uppercase text-muted-foreground">ETA</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {shipments.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">
                  No shipments found.
                </TableCell>
              </TableRow>
            ) : (
              shipments.map((s) => (
                <TableRow key={s.id} className="hover:bg-white/[0.03] transition-colors">
                  <TableCell className="font-mono font-medium">
                    <Link href={`/dashboard/shipments/${s.id}`} className="hover:underline text-sky-400">
                      {s.id}
                    </Link>
                  </TableCell>
                  <TableCell>{s.name}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <div className={`size-1.5 rounded-full ${statusDot(s.status ?? 'pending')}`} />
                      <span className="text-sm capitalize">{s.status?.replace('_', ' ')}</span>
                    </div>
                  </TableCell>
                  <TableCell className="font-mono text-sm">{s.originPortId || '--'}</TableCell>
                  <TableCell className="font-mono text-sm">{s.destinationPortId || '--'}</TableCell>
                  <TableCell className="font-mono text-sm">{s.eta ? s.eta.toLocaleDateString() : '--'}</TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
