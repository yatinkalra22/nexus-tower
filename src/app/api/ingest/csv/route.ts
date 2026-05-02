import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { shipments } from "@/db/schema";
import { z } from "zod";
import Papa from "papaparse";

const rowSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  status: z.enum(["pending", "in_transit", "arrived", "delayed", "cancelled"]).default("pending"),
  originPortId: z.string().optional(),
  destinationPortId: z.string().optional(),
  carrierId: z.string().optional(),
  vesselMmsi: z.string().optional(),
  eta: z.string().optional().transform(v => v ? new Date(v) : undefined),
});

interface ShipmentRow {
  id: string;
  name: string;
  status: "pending" | "in_transit" | "arrived" | "delayed" | "cancelled";
  originPortId?: string;
  destinationPortId?: string;
  carrierId?: string;
  vesselMmsi?: string;
  eta?: string;
}

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File;
    
    if (!file) {
      return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
    }

    const text = await file.text();
    const { data, errors } = Papa.parse<ShipmentRow>(text, {
      header: true,
      skipEmptyLines: true,
    });

    if (errors.length > 0) {
      return NextResponse.json({ error: "CSV parsing failed", details: errors }, { status: 400 });
    }

    const results = {
      ok: 0,
      errors: [] as { row: number; error: string }[],
      inserted: [] as string[],
    };

    for (const [index, row] of data.entries()) {
      try {
        const validated = rowSchema.parse(row);
        await db.insert(shipments).values(validated).onConflictDoUpdate({
          target: shipments.id,
          set: { ...validated, updatedAt: new Date() }
        });
        results.ok++;
        results.inserted.push(validated.id);
      } catch (err) {
        results.errors.push({ row: index + 1, error: err instanceof Error ? err.message : "Validation failed" });
      }
    }

    return NextResponse.json(results);
  } catch (error) {
    console.error("CSV Ingestion Failed:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
