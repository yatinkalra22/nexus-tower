"use client";

import { useState, useCallback, useMemo } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Upload, Download, Loader2, CheckCircle, AlertTriangle, X } from "lucide-react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import Papa from "papaparse";

const OUR_FIELDS = [
  { key: "id", label: "Shipment ID", required: true },
  { key: "name", label: "Name", required: true },
  { key: "status", label: "Status", required: false },
  { key: "originPortId", label: "Origin Port", required: false },
  { key: "destinationPortId", label: "Destination Port", required: false },
  { key: "carrierId", label: "Carrier ID", required: false },
  { key: "vesselMmsi", label: "Vessel MMSI", required: false },
  { key: "eta", label: "ETA", required: false },
] as const;

type FieldKey = (typeof OUR_FIELDS)[number]["key"];

// Fuzzy matching: map common CSV header names to our fields
const HEADER_ALIASES: Record<string, FieldKey> = {
  // id
  id: "id", shipment_id: "id", shipmentid: "id", "shipment id": "id", ref: "id", reference: "id",
  // name
  name: "name", shipment_name: "name", description: "name", desc: "name", title: "name",
  // status
  status: "status", state: "status", shipment_status: "status",
  // origin
  originportid: "originPortId", origin_port_id: "originPortId", origin: "originPortId",
  origin_port: "originPortId", from: "originPortId", departure: "originPortId", pol: "originPortId",
  // destination
  destinationportid: "destinationPortId", destination_port_id: "destinationPortId",
  destination: "destinationPortId", dest: "destinationPortId", to: "destinationPortId",
  arrival_port: "destinationPortId", pod: "destinationPortId",
  // carrier
  carrierid: "carrierId", carrier_id: "carrierId", carrier: "carrierId", shipping_line: "carrierId",
  // vessel
  vesselmmsi: "vesselMmsi", vessel_mmsi: "vesselMmsi", mmsi: "vesselMmsi", vessel: "vesselMmsi",
  // eta
  eta: "eta", estimated_arrival: "eta", arrival_date: "eta", due_date: "eta",
};

function autoMapHeaders(csvHeaders: string[]): Record<string, FieldKey | "skip"> {
  const mapping: Record<string, FieldKey | "skip"> = {};
  const usedFields = new Set<FieldKey>();

  for (const header of csvHeaders) {
    const normalized = header.toLowerCase().trim().replace(/[\s-]+/g, "_");
    const match = HEADER_ALIASES[normalized];
    if (match && !usedFields.has(match)) {
      mapping[header] = match;
      usedFields.add(match);
    } else {
      mapping[header] = "skip";
    }
  }
  return mapping;
}

type Step = "upload" | "map" | "preview" | "result";

interface ImportResult {
  ok: number;
  errors: { row: number; error: string }[];
}

export function CSVImportModal() {
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState<Step>("upload");
  const [csvHeaders, setCsvHeaders] = useState<string[]>([]);
  const [csvData, setCsvData] = useState<Record<string, string>[]>([]);
  const [mapping, setMapping] = useState<Record<string, FieldKey | "skip">>({});
  const [importing, setImporting] = useState(false);
  const [result, setResult] = useState<ImportResult | null>(null);
  const router = useRouter();

  const reset = () => {
    setStep("upload");
    setCsvHeaders([]);
    setCsvData([]);
    setMapping({});
    setResult(null);
  };

  const handleFile = useCallback((file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      const parsed = Papa.parse<Record<string, string>>(text, {
        header: true,
        skipEmptyLines: true,
      });

      if (parsed.errors.length > 0 && parsed.data.length === 0) {
        toast.error("Failed to parse CSV file");
        return;
      }

      const headers = parsed.meta.fields ?? [];
      setCsvHeaders(headers);
      setCsvData(parsed.data);
      setMapping(autoMapHeaders(headers));
      setStep("map");
    };
    reader.readAsText(file);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      const file = e.dataTransfer.files[0];
      if (file && file.name.endsWith(".csv")) handleFile(file);
      else toast.error("Please upload a .csv file");
    },
    [handleFile]
  );

  const updateMapping = (header: string, value: FieldKey | "skip") => {
    setMapping((prev) => ({ ...prev, [header]: value }));
  };

  const mappedFields = useMemo(() => Object.values(mapping).filter((v) => v !== "skip"), [mapping]);
  const visibleFields = useMemo(() => OUR_FIELDS.filter((f) => mappedFields.includes(f.key)), [mappedFields]);
  const hasId = mappedFields.includes("id");
  const hasName = mappedFields.includes("name");
  const canProceed = hasId && hasName;

  // Transform CSV data using the mapping
  const transformedData = useMemo(() => csvData.map((row) => {
    const out: Record<string, string> = {};
    for (const [header, field] of Object.entries(mapping)) {
      if (field !== "skip" && row[header]) {
        out[field] = row[header];
      }
    }
    return out;
  }), [csvData, mapping]);

  const handleImport = async () => {
    setImporting(true);
    try {
      // Build a CSV string from the transformed data with our expected headers
      const ourHeaders = OUR_FIELDS.map((f) => f.key);
      const lines = [ourHeaders.join(",")];
      for (const row of transformedData) {
        lines.push(ourHeaders.map((h) => row[h] ?? "").join(","));
      }
      const csvString = lines.join("\n");

      const blob = new Blob([csvString], { type: "text/csv" });
      const formData = new FormData();
      formData.append("file", blob, "import.csv");

      const res = await fetch("/api/ingest/csv", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      setResult({ ok: data.ok ?? 0, errors: data.errors ?? [] });
      setStep("result");
      router.refresh();
    } catch {
      toast.error("Import failed");
    } finally {
      setImporting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(o) => { setOpen(o); if (!o) reset(); }}>
      <DialogTrigger render={
        <Button variant="outline" size="sm">
          <Upload className="mr-2 size-4" />
          Import CSV
        </Button>
      } />
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {step === "upload" && "Import Shipments"}
            {step === "map" && "Map Columns"}
            {step === "preview" && "Preview Import"}
            {step === "result" && "Import Complete"}
          </DialogTitle>
          <DialogDescription>
            {step === "upload" && "Upload a CSV file with your shipment data. We'll help you map the columns."}
            {step === "map" && "We auto-detected your columns. Adjust the mapping if needed."}
            {step === "preview" && `${transformedData.length} rows ready to import. Review before confirming.`}
            {step === "result" && "Here's a summary of the import."}
          </DialogDescription>
        </DialogHeader>

        {/* Step 1: Upload */}
        {step === "upload" && (
          <div className="flex flex-col gap-4">
            <div
              onDragOver={(e) => e.preventDefault()}
              onDrop={handleDrop}
              className="border-2 border-dashed border-border/50 rounded-xl p-10 text-center hover:border-primary/30 transition-colors cursor-pointer"
              onClick={() => document.getElementById("csv-file-input")?.click()}
            >
              <Upload className="size-8 mx-auto mb-3 text-muted-foreground/40" />
              <p className="text-sm text-muted-foreground">
                Drag & drop a CSV file here, or click to browse
              </p>
              <p className="text-xs text-muted-foreground/40 mt-1">
                Any format works — we'll help you map the columns
              </p>
              <input
                id="csv-file-input"
                type="file"
                accept=".csv"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleFile(file);
                }}
              />
            </div>
            <div className="flex items-center justify-between text-xs text-muted-foreground/60">
              <span>Need a template?</span>
              <a
                href="/shipment-template.csv"
                download
                className="flex items-center gap-1 text-primary hover:underline"
              >
                <Download className="size-3" />
                Download Template
              </a>
            </div>
          </div>
        )}

        {/* Step 2: Column Mapping */}
        {step === "map" && (
          <div className="flex flex-col gap-4">
            <div className="rounded-lg border border-border/50 overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-muted/30">
                    <th className="text-left px-3 py-2 text-[11px] font-medium tracking-widest uppercase text-muted-foreground">
                      Your Column
                    </th>
                    <th className="text-left px-3 py-2 text-[11px] font-medium tracking-widest uppercase text-muted-foreground">
                      Maps To
                    </th>
                    <th className="text-left px-3 py-2 text-[11px] font-medium tracking-widest uppercase text-muted-foreground">
                      Sample
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {csvHeaders.map((header) => (
                    <tr key={header} className="border-t border-border/30">
                      <td className="px-3 py-2 font-mono text-xs">{header}</td>
                      <td className="px-3 py-2">
                        <Select
                          value={mapping[header] || "skip"}
                          onValueChange={(v) => updateMapping(header, v as FieldKey | "skip")}
                        >
                          <SelectTrigger className="h-8 text-xs w-44">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="skip">— Skip —</SelectItem>
                            {OUR_FIELDS.map((f) => (
                              <SelectItem key={f.key} value={f.key}>
                                {f.label} {f.required ? "*" : ""}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </td>
                      <td className="px-3 py-2 text-xs text-muted-foreground font-mono truncate max-w-[150px]">
                        {csvData[0]?.[header] ?? "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {!canProceed && (
              <div className="flex items-center gap-2 text-xs text-amber-400">
                <AlertTriangle className="size-3.5" />
                <span>
                  You must map at least <strong>Shipment ID</strong> and <strong>Name</strong> to proceed.
                </span>
              </div>
            )}

            <DialogFooter>
              <Button variant="outline" size="sm" onClick={reset}>
                Back
              </Button>
              <Button size="sm" disabled={!canProceed} onClick={() => setStep("preview")}>
                Preview ({csvData.length} rows)
              </Button>
            </DialogFooter>
          </div>
        )}

        {/* Step 3: Preview */}
        {step === "preview" && (
          <div className="flex flex-col gap-4">
            <div className="rounded-lg border border-border/50 overflow-x-auto max-h-[300px] overflow-y-auto">
              <table className="w-full text-xs">
                <thead className="sticky top-0 bg-card">
                  <tr className="bg-muted/30">
                    <th className="px-2 py-1.5 text-left font-medium text-muted-foreground">#</th>
                    {visibleFields.map((f) => (
                      <th key={f.key} className="px-2 py-1.5 text-left font-medium text-muted-foreground">
                        {f.label}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {transformedData.slice(0, 20).map((row, i) => (
                    <tr key={i} className="border-t border-border/20">
                      <td className="px-2 py-1.5 text-muted-foreground/40">{i + 1}</td>
                      {visibleFields.map((f) => (
                        <td key={f.key} className="px-2 py-1.5 font-mono">
                          {row[f.key] || <span className="text-muted-foreground/30">—</span>}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {transformedData.length > 20 && (
              <p className="text-xs text-muted-foreground/40 text-center">
                Showing first 20 of {transformedData.length} rows
              </p>
            )}

            <DialogFooter>
              <Button variant="outline" size="sm" onClick={() => setStep("map")}>
                Back
              </Button>
              <Button size="sm" onClick={handleImport} disabled={importing}>
                {importing ? (
                  <>
                    <Loader2 className="mr-2 size-4 animate-spin" />
                    Importing...
                  </>
                ) : (
                  `Import ${transformedData.length} Shipments`
                )}
              </Button>
            </DialogFooter>
          </div>
        )}

        {/* Step 4: Result */}
        {step === "result" && result && (
          <div className="flex flex-col gap-4">
            <div className="flex items-center gap-3 p-4 rounded-lg bg-emerald-500/5 border border-emerald-500/15">
              <CheckCircle className="size-5 text-emerald-400 shrink-0" />
              <div>
                <p className="text-sm font-medium">
                  {result.ok} shipment{result.ok !== 1 ? "s" : ""} imported successfully
                </p>
                {result.errors.length > 0 && (
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {result.errors.length} row{result.errors.length !== 1 ? "s" : ""} skipped due to errors
                  </p>
                )}
              </div>
            </div>

            {result.errors.length > 0 && (
              <div className="rounded-lg border border-amber-500/15 bg-amber-500/5 p-3 max-h-[150px] overflow-y-auto">
                <p className="text-[11px] font-medium tracking-widest uppercase text-amber-400 mb-2">Skipped Rows</p>
                {result.errors.map((err, i) => (
                  <p key={i} className="text-xs text-muted-foreground font-mono">
                    Row {err.row}: {err.error}
                  </p>
                ))}
              </div>
            )}

            <DialogFooter>
              <DialogClose render={<Button size="sm">Done</Button>} />
            </DialogFooter>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
