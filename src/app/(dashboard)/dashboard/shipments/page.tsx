import { getShipments } from '@/server/shipments';
import { Button } from '@/components/ui/button';
import { Plus, Ship } from 'lucide-react';
import Link from 'next/link';

import { CSVImportModal } from '@/components/shipments/csv-import-modal';
import { ShipmentsTable } from '@/components/shipments/shipments-table';
import { SeedDemoButton } from '@/components/shipments/seed-demo-button';

import type { Metadata } from "next";

export const metadata: Metadata = { title: "Shipments | NexusTower" };
export const dynamic = "force-dynamic";

export default async function ShipmentsPage() {
  const shipments = await getShipments();

  return (
    <div className="flex flex-col gap-6 animate-fade-in">
      {shipments.length === 0 ? (
        <>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-2xl font-semibold tracking-tight">Shipments</h1>
              <p className="text-sm text-muted-foreground mt-0.5">Manage and track all shipments</p>
            </div>
            <div className="flex items-center gap-2">
              <CSVImportModal />
              <Link href="/dashboard/shipments/new">
                <Button size="sm">
                  <Plus className="mr-2 size-4" />
                  New Shipment
                </Button>
              </Link>
            </div>
          </div>
          <div className="rounded-xl border border-border/50 bg-card">
            <div className="flex flex-col items-center justify-center gap-3 py-16">
              <Ship className="size-8 text-muted-foreground/20" />
              <div className="text-center">
                <p className="text-sm font-medium text-muted-foreground">No shipments yet</p>
                <p className="text-xs text-muted-foreground/60 mt-1">Import a CSV file or create your first shipment to start tracking.</p>
              </div>
              <div className="flex flex-wrap gap-2 mt-2">
                <CSVImportModal />
                <Link href="/dashboard/shipments/new">
                  <Button size="sm" variant="outline" className="border-border/50">
                    <Plus className="mr-2 size-4" />
                    New Shipment
                  </Button>
                </Link>
                <SeedDemoButton />
              </div>
            </div>
          </div>
        </>
      ) : (
        <ShipmentsTable shipments={shipments} />
      )}
    </div>
  );
}
