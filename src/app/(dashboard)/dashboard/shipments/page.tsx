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
import { Plus, Upload } from 'lucide-react';
import Link from 'next/link';

import { ImportCSVButton } from './import-button';

export const dynamic = "force-dynamic";

export default async function ShipmentsPage() {
  const shipments = await getShipments();

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Shipments</h1>
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

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>ID</TableHead>
              <TableHead>Name</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Origin</TableHead>
              <TableHead>Destination</TableHead>
              <TableHead>ETA</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {shipments.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="h-24 text-center">
                  No shipments found.
                </TableCell>
              </TableRow>
            ) : (
              shipments.map((s) => (
                <TableRow key={s.id}>
                  <TableCell className="font-medium">
                    <Link href={`/dashboard/shipments/${s.id}`} className="hover:underline">
                      {s.id}
                    </Link>
                  </TableCell>
                  <TableCell>{s.name}</TableCell>
                  <TableCell>
                    <Badge variant={s.status === 'delayed' ? 'destructive' : 'secondary'}>
                      {s.status}
                    </Badge>
                  </TableCell>
                  <TableCell>{s.originPortId || '--'}</TableCell>
                  <TableCell>{s.destinationPortId || '--'}</TableCell>
                  <TableCell>{s.eta ? s.eta.toLocaleDateString() : '--'}</TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
