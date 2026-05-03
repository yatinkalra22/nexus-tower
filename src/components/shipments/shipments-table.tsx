"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Trash2, Loader2, Plus, Search } from "lucide-react";
import { CSVImportModal } from "@/components/shipments/csv-import-modal";
import { SeedDemoButton } from "@/components/shipments/seed-demo-button";
import { deleteShipments } from "@/server/shipments";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

interface Shipment {
  id: string;
  name: string;
  status: string | null;
  originPortId: string | null;
  destinationPortId: string | null;
  eta: Date | null;
  originPort?: { name: string } | null;
  destinationPort?: { name: string } | null;
  carrier?: { name: string } | null;
}

const STATUS_COLORS = new Map([
  ["delayed", "bg-red-400"],
  ["arrived", "bg-emerald-400"],
  ["in_transit", "bg-sky-400"],
  ["cancelled", "bg-zinc-400"],
]);

const statusDot = (status: string) => STATUS_COLORS.get(status) ?? "bg-amber-400";

const STATUSES = ["all", "in_transit", "delayed", "pending", "arrived", "cancelled"] as const;

export function ShipmentsTable({ shipments }: { shipments: Shipment[] }) {
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [deleting, setDeleting] = useState(false);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const router = useRouter();

  const filtered = useMemo(() => {
    let result = shipments;
    if (statusFilter !== "all") {
      result = result.filter((s) => s.status === statusFilter);
    }
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter((s) =>
        s.name.toLowerCase().includes(q) ||
        s.id.toLowerCase().includes(q) ||
        s.originPort?.name?.toLowerCase().includes(q) ||
        s.originPortId?.toLowerCase().includes(q) ||
        s.destinationPort?.name?.toLowerCase().includes(q) ||
        s.destinationPortId?.toLowerCase().includes(q)
      );
    }
    return result;
  }, [shipments, search, statusFilter]);

  const hasSelection = selected.size > 0;
  const allSelected = filtered.length > 0 && selected.size === filtered.length;

  const toggleAll = () => {
    setSelected(allSelected ? new Set() : new Set(filtered.map((s) => s.id)));
  };

  const toggleOne = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleBulkDelete = async () => {
    if (selected.size === 0) return;
    setDeleting(true);
    try {
      await deleteShipments(Array.from(selected));
      toast.success(`Deleted ${selected.size} shipment${selected.size > 1 ? "s" : ""}`);
      setSelected(new Set());
      router.refresh();
    } catch {
      toast.error("Failed to delete shipments");
    } finally {
      setDeleting(false);
    }
  };

  return (
    <>
      {/* Fixed-height header area — swaps between title and bulk actions */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between min-h-[40px]">
        {hasSelection ? (
          <>
            <span className="text-sm font-medium">
              {selected.size} shipment{selected.size > 1 ? "s" : ""} selected
            </span>
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setSelected(new Set())}
                className="text-xs text-muted-foreground"
              >
                Clear
              </Button>
              <Button
                size="sm"
                variant="destructive"
                onClick={handleBulkDelete}
                disabled={deleting}
              >
                {deleting ? (
                  <Loader2 className="mr-2 size-3.5 animate-spin" />
                ) : (
                  <Trash2 className="mr-2 size-3.5" />
                )}
                Delete {selected.size}
              </Button>
            </div>
          </>
        ) : (
          <>
            <div>
              <h1 className="text-2xl font-semibold tracking-tight">Shipments</h1>
              <p className="text-sm text-muted-foreground mt-0.5">Manage and track all shipments</p>
            </div>
            <div className="flex items-center gap-2">
              <SeedDemoButton />
              <CSVImportModal />
              <Link href="/dashboard/shipments/new">
                <Button size="sm">
                  <Plus className="mr-2 size-4" />
                  New Shipment
                </Button>
              </Link>
            </div>
          </>
        )}
      </div>

      {/* Search + Status Filter */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground/50" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search shipments..."
            className="pl-8 h-8 text-sm bg-transparent border-border/50"
          />
        </div>
        <div className="flex items-center gap-1">
          {STATUSES.map((s) => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={`rounded-md px-2.5 py-1 text-[11px] font-medium capitalize transition-colors ${
                statusFilter === s
                  ? "bg-primary/10 text-primary border border-primary/20"
                  : "text-muted-foreground hover:text-foreground border border-transparent"
              }`}
            >
              {s === "all" ? "All" : s.replace("_", " ")}
            </button>
          ))}
        </div>
      </div>

      <div className="rounded-xl border border-border/50 bg-card">
        <div className="overflow-x-auto">
          <Table className="min-w-[650px]">
            <TableHeader>
              <TableRow>
                <TableHead className="w-10 px-3">
                  <input
                    type="checkbox"
                    checked={allSelected}
                    onChange={toggleAll}
                    className="size-3.5 rounded border-border accent-primary cursor-pointer"
                  />
                </TableHead>
                <TableHead className="text-[11px] font-medium tracking-widest uppercase text-muted-foreground">ID</TableHead>
                <TableHead className="text-[11px] font-medium tracking-widest uppercase text-muted-foreground">Name</TableHead>
                <TableHead className="text-[11px] font-medium tracking-widest uppercase text-muted-foreground">Status</TableHead>
                <TableHead className="text-[11px] font-medium tracking-widest uppercase text-muted-foreground">Origin</TableHead>
                <TableHead className="text-[11px] font-medium tracking-widest uppercase text-muted-foreground">Destination</TableHead>
                <TableHead className="text-[11px] font-medium tracking-widest uppercase text-muted-foreground">ETA</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((s) => (
                <TableRow
                  key={s.id}
                  className={`transition-colors ${selected.has(s.id) ? "bg-primary/5" : "hover:bg-white/[0.03]"}`}
                >
                  <TableCell className="px-3">
                    <input
                      type="checkbox"
                      checked={selected.has(s.id)}
                      onChange={() => toggleOne(s.id)}
                      className="size-3.5 rounded border-border accent-primary cursor-pointer"
                    />
                  </TableCell>
                  <TableCell className="font-mono font-medium">
                    <Link href={`/dashboard/shipments/${s.id}`} className="hover:underline text-sky-400">
                      {s.id}
                    </Link>
                  </TableCell>
                  <TableCell>{s.name}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <div className={`size-1.5 rounded-full ${statusDot(s.status ?? "pending")}`} />
                      <span className="text-sm capitalize">{s.status?.replace("_", " ")}</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-sm">
                    {s.originPort?.name ?? s.originPortId ?? "--"}
                    {s.originPort?.name && <span className="ml-1 text-xs text-muted-foreground font-mono">({s.originPortId})</span>}
                  </TableCell>
                  <TableCell className="text-sm">
                    {s.destinationPort?.name ?? s.destinationPortId ?? "--"}
                    {s.destinationPort?.name && <span className="ml-1 text-xs text-muted-foreground font-mono">({s.destinationPortId})</span>}
                  </TableCell>
                  <TableCell className="font-mono text-sm">{s.eta ? new Date(s.eta).toLocaleDateString() : "--"}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>
    </>
  );
}
