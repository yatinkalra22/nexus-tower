import { getShipment, deleteShipment } from '@/server/shipments';
import { notFound, redirect } from 'next/navigation';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Trash2, MapPin, Ship, Calendar, AlertTriangle, MessageSquare } from 'lucide-react';
import Link from 'next/link';

import { LiveMap } from '@/components/map/live-map';

export const dynamic = "force-dynamic";

function statusColor(status: string) {
  if (status === 'delayed') return { dot: 'bg-red-400', text: 'text-red-400', bg: 'bg-red-400/10' };
  if (status === 'arrived') return { dot: 'bg-emerald-400', text: 'text-emerald-400', bg: 'bg-emerald-400/10' };
  if (status === 'in_transit') return { dot: 'bg-sky-400', text: 'text-sky-400', bg: 'bg-sky-400/10' };
  if (status === 'cancelled') return { dot: 'bg-zinc-400', text: 'text-zinc-400', bg: 'bg-zinc-400/10' };
  return { dot: 'bg-amber-400', text: 'text-amber-400', bg: 'bg-amber-400/10' };
}

function severityColor(severity: string) {
  if (severity === 'critical') return 'text-red-400 bg-red-400/10';
  if (severity === 'high') return 'text-amber-400 bg-amber-400/10';
  return 'text-yellow-400 bg-yellow-400/10';
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
  const openExceptions = (shipment.exceptions ?? []).filter(e => e.status === 'open');
  const waypoints = (shipment.waypoints ?? [])
    .sort((a, b) => a.sequence - b.sequence)
    .map(w => ({ latitude: w.latitude, longitude: w.longitude }));

  const agentPrompt = `Analyze shipment ${shipment.id} "${shipment.name}" from ${shipment.originPort?.name ?? shipment.originPortId} to ${shipment.destinationPort?.name ?? shipment.destinationPortId}. Check weather, disruptions, and current vessel status.`;

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
          <Link href={`/dashboard/agent?prompt=${encodeURIComponent(agentPrompt)}`}>
            <Button size="sm" variant="outline" className="border-primary/20 text-primary hover:bg-primary/5">
              <MessageSquare className="mr-2 size-4" />
              Ask Agent
            </Button>
          </Link>
          <form action={handleDelete}>
            <Button variant="destructive" size="sm" type="submit">
              <Trash2 className="mr-2 size-4" />
              Delete
            </Button>
          </form>
        </div>
      </div>

      {/* Exceptions Alert */}
      {openExceptions.length > 0 && (
        <div className="flex flex-col gap-2">
          {openExceptions.map((exc) => (
            <div key={exc.id} className="flex items-start gap-3 rounded-xl border border-amber-500/20 bg-amber-500/5 px-4 py-3">
              <AlertTriangle className="size-4 text-amber-400 shrink-0 mt-0.5" />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <Badge variant="outline" className={`${severityColor(exc.severity ?? 'medium')} border-transparent text-[10px] uppercase`}>
                    {exc.severity}
                  </Badge>
                  <span className="text-[10px] font-mono text-muted-foreground uppercase">{exc.type}</span>
                </div>
                <p className="text-sm text-foreground/80">{exc.description}</p>
              </div>
            </div>
          ))}
        </div>
      )}

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
              <span className="text-[11px] font-medium tracking-widest uppercase text-muted-foreground">Vessel</span>
              <span className="font-medium">{shipment.vessel?.name ?? shipment.vesselMmsi ?? 'Not specified'}</span>
              {shipment.vessel?.name && <span className="text-xs text-muted-foreground font-mono">MMSI {shipment.vesselMmsi}</span>}
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
        <LiveMap
          mmsis={shipment.vesselMmsi ? [shipment.vesselMmsi] : []}
          waypoints={waypoints}
          height="400px"
        />
      </div>
    </div>
  );
}
