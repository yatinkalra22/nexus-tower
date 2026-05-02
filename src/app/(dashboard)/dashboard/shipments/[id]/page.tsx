import { getShipment, deleteShipment } from '@/server/shipments';
import { notFound, redirect } from 'next/navigation';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Trash2, Edit, MapPin, Ship, Calendar } from 'lucide-react';
import Link from 'next/link';
import { revalidatePath } from 'next/cache';

import { LiveMap } from '@/components/map/live-map';

export const dynamic = "force-dynamic";

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

  return (
    <div className="flex flex-col gap-6">
      {/* ... header ... */}
      <div className="flex items-center justify-between">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2">
            <h1 className="text-3xl font-bold">{shipment.id}</h1>
            <Badge variant={shipment.status === 'delayed' ? 'destructive' : 'secondary'}>
              {shipment.status}
            </Badge>
          </div>
          <p className="text-muted-foreground">{shipment.name}</p>
        </div>
        <div className="flex gap-2">
          <Link href={`/dashboard/shipments/${shipment.id}/edit`}>
            <Button variant="outline" size="sm">
              <Edit className="mr-2 size-4" />
              Edit
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

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {/* ... existing cards ... */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Route Information</CardTitle>
            <MapPin className="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent className="flex flex-col gap-4 pt-4">
            <div className="flex flex-col gap-1">
              <span className="text-xs text-muted-foreground uppercase font-semibold">Origin</span>
              <span className="font-medium">{shipment.originPortId || 'Not specified'}</span>
            </div>
            <Separator />
            <div className="flex flex-col gap-1">
              <span className="text-xs text-muted-foreground uppercase font-semibold">
                Destination
              </span>
              <span className="font-medium">{shipment.destinationPortId || 'Not specified'}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Logistics Details</CardTitle>
            <Ship className="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent className="flex flex-col gap-4 pt-4">
            <div className="flex flex-col gap-1">
              <span className="text-xs text-muted-foreground uppercase font-semibold">Carrier</span>
              <span className="font-medium">{shipment.carrierId || 'Not specified'}</span>
            </div>
            <Separator />
            <div className="flex flex-col gap-1">
              <span className="text-xs text-muted-foreground uppercase font-semibold">
                Vessel MMSI
              </span>
              <span className="font-medium">{shipment.vesselMmsi || 'Not specified'}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Timeline</CardTitle>
            <Calendar className="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent className="flex flex-col gap-4 pt-4">
            <div className="flex flex-col gap-1">
              <span className="text-xs text-muted-foreground uppercase font-semibold">
                Estimated Arrival (ETA)
              </span>
              <span className="font-medium">
                {shipment.eta ? shipment.eta.toLocaleString() : 'TBD'}
              </span>
            </div>
            <Separator />
            <div className="flex flex-col gap-1">
              <span className="text-xs text-muted-foreground uppercase font-semibold">
                Created At
              </span>
              <span className="font-medium">{shipment.createdAt?.toLocaleString()}</span>
            </div>
          </CardContent>
        </Card>
      </div>

      <LiveMap mmsis={shipment.vesselMmsi ? [shipment.vesselMmsi] : []} height="400px" />
    </div>
  );
}
