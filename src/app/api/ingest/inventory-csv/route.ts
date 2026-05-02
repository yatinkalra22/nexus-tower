import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { inventoryItems } from "@/db/schema";
import { z } from "zod";
import Papa from "papaparse";
import { calculateSafetyStock, calculateReorderPoint } from "@/server/inventory/safety-stock";

const rowSchema = z.object({
  sku: z.string().min(1),
  name: z.string().min(1),
  onHand: z.string().transform(Number),
  leadTimeDays: z.string().transform(Number),
  demandMean: z.string().transform(Number),
  demandSigma: z.string().transform(Number),
  unit: z.string().optional().default("pcs"),
});

interface InventoryRow {
  sku: string;
  name: string;
  onHand: string;
  leadTimeDays: string;
  demandMean: string;
  demandSigma: string;
  unit?: string;
}

const MAX_FILE_SIZE = 2 * 1024 * 1024; // 2MB

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
    }

    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json({ error: "File too large. Maximum size is 2MB." }, { status: 413 });
    }

    const text = await file.text();
    const { data, errors } = Papa.parse<InventoryRow>(text, {
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
        
        // Calculate dynamically on ingest
        const safetyStock = calculateSafetyStock(validated.demandSigma, validated.leadTimeDays);
        const reorderPoint = calculateReorderPoint(validated.demandMean, validated.leadTimeDays, safetyStock);

        await db.insert(inventoryItems).values({
          sku: validated.sku,
          name: validated.name,
          onHand: validated.onHand,
          safetyStock,
          reorderPoint,
          unit: validated.unit,
        }).onConflictDoUpdate({
          target: inventoryItems.sku,
          set: { 
            name: validated.name,
            onHand: validated.onHand,
            safetyStock,
            reorderPoint,
            unit: validated.unit,
          }
        });
        results.ok++;
        results.inserted.push(validated.sku);
      } catch (err) {
        results.errors.push({ row: index + 1, error: err instanceof Error ? err.message : "Validation failed" });
      }
    }

    return NextResponse.json(results);
  } catch (error) {
    console.error("Inventory Ingestion Failed:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
