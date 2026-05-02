import { getShipment, deleteShipment } from '@/server/shipments';
import { notFound, redirect } from 'next/navigation';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Trash2, MapPin, Ship, Calendar } from 'lucide-react';

import { LiveMap } from '@/components/map/live-map';

export const dynamic = "force-dynamic";

function statusColor(status: string) {
  if (status === 'delayed') return { dot: 'bg-red-400', text: 'text-red-400', bg: 'bg-red-400/10' };
  if (status === 'arrived') return { dot: 'bg-emerald-400', text: 'text-emerald-400', bg: 'bg-emerald-400/10' };
  if (status === 'in_transit') return { dot: 'bg-sky-400', text: 'text-sky-400', bg: 'bg-sky-400/10' };
  if (status === 'cancelled') return { dot: 'bg-zinc-400', text: 'text-zinc-400', bg: 'bg-zinc-400/10' };
  return { dot: 'bg-amber-400', text: 'text-amber-400', bg: 'bg-amber-400/10' };
}

export default async function ShipmentDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const shipment = await getShipment(id);

  if (!shipment) {
    notFound();
  }

  async function handleDelete() {
    'use server';
    await deleteShipment(id);
    redirect('/dashboard/shipments');
  }

  const sc = statusColor(shipment.status ?? 'pending');

  return (
    <div className="flex flex-col gap-6 animate-fade-in">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-semibold tracking-tight font-mono break-all">{shipment.id}</h1>
            <Badge variant="outline" className={`${sc.text} ${sc.bg} border-transparent capitalize`}>
              {shipment.status?.replace('_', ' ')}
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground mt-0.5">{shipment.name}</p>
        </div>
        <div className="flex gap-2">
          <form action={handleDelete}>
            <Button variant="destructive" size="sm" type="submit">
              <Trash2 className="mr-2 size-4" />
              Delete
            </Button>
          </form>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card className="rounded-xl border border-border/50 bg-card p-4">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 p-0 pb-3">
            <p className="text-[11px] font-medium tracking-widest uppercase text-muted-foreground">Route Information</p>
            <MapPin className="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent className="flex flex-col gap-4 p-0">
            <div className="flex flex-col gap-1">
              <span className="text-[11px] font-medium tracking-widest uppercase text-muted-foreground">Origin</span>
              <span className="font-medium">{shipment.originPort?.name ?? shipment.originPortId ?? 'Not specified'}</span>
              {shipment.originPort?.name && <span className="text-xs text-muted-foreground font-mono">{shipment.originPortId}</span>}
            </div>
            <Separator />
            <div className="flex flex-col gap-1">
              <span className="text-[11px] font-medium tracking-widest uppercase text-muted-foreground">Destination</span>
              <span className="font-medium">{shipment.destinationPort?.name ?? shipment.destinationPortId ?? 'Not specified'}</span>
              {shipment.destinationPort?.name && <span className="text-xs text-muted-foreground font-mono">{shipment.destinationPortId}</span>}
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-xl border border-border/50 bg-card p-4">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 p-0 pb-3">
            <p className="text-[11px] font-medium tracking-widest uppercase text-muted-foreground">Logistics Details</p>
            <Ship className="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent className="flex flex-col gap-4 p-0">
            <div className="flex flex-col gap-1">
              <span className="text-[11px] font-medium tracking-widest uppercase text-muted-foreground">Carrier</span>
              <span className="font-medium">{shipment.carrier?.name ?? shipment.carrierId ?? 'Not specified'}</span>
              {shipment.carrier?.name && <span className="text-xs text-muted-foreground font-mono">{shipment.carrierId}</span>}
            </div>
            <Separator />
            <div className="flex flex-col gap-1">
              <span className="text-[11px] font-medium tracking-widest uppercase text-muted-foreground">Vessel MMSI</span>
              <span className="font-medium">{shipment.vessel?.name ?? shipment.vesselMmsi ?? 'Not specified'}</span>
              {shipment.vessel?.name && <span className="text-xs text-muted-foreground font-mono">{shipment.vesselMmsi}</span>}
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-xl border border-border/50 bg-card p-4">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 p-0 pb-3">
            <p className="text-[11px] font-medium tracking-widest uppercase text-muted-foreground">Timeline</p>
            <Calendar className="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent className="flex flex-col gap-4 p-0">
            <div className="flex flex-col gap-1">
              <span className="text-[11px] font-medium tracking-widest uppercase text-muted-foreground">Estimated Arrival (ETA)</span>
              <span className="font-mono font-medium">
                {shipment.eta ? shipment.eta.toLocaleString() : 'TBD'}
              </span>
            </div>
            <Separator />
            <div className="flex flex-col gap-1">
              <span className="text-[11px] font-medium tracking-widest uppercase text-muted-foreground">Created At</span>
              <span className="font-mono font-medium">{shipment.createdAt?.toLocaleString()}</span>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="rounded-xl border border-border/50 overflow-hidden">
        <LiveMap mmsis={shipment.vesselMmsi ? [shipment.vesselMmsi] : []} height="400px" />
      </div>
    </div>
  );
}
