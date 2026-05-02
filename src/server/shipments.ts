"use server";

import { db } from "@/db";
import { shipments } from "@/db/schema";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { revalidatePath } from "next/cache";

const shipmentSchema = z.object({
  id: z.string().min(1, "ID is required"),
  name: z.string().min(1, "Name is required"),
  status: z.enum(["pending", "in_transit", "arrived", "delayed", "cancelled"]).default("pending"),
  originPortId: z.string().optional(),
  destinationPortId: z.string().optional(),
  carrierId: z.string().optional(),
  vesselMmsi: z.string().optional(),
  eta: z.date().optional(),
});

export async function createShipment(data: z.infer<typeof shipmentSchema>) {
  const validated = shipmentSchema.parse(data);
  await db.insert(shipments).values(validated);
  revalidatePath("/dashboard/shipments");
}

export async function updateShipment(id: string, data: Partial<z.infer<typeof shipmentSchema>>) {
  const validated = shipmentSchema.partial().parse(data);
  await db.update(shipments).set({ ...validated, updatedAt: new Date() }).where(eq(shipments.id, id));
  revalidatePath("/dashboard/shipments");
  revalidatePath(`/dashboard/shipments/${id}`);
}

export async function deleteShipment(id: string) {
  await db.delete(shipments).where(eq(shipments.id, id));
  revalidatePath("/dashboard/shipments");
}

export async function deleteShipments(ids: string[]) {
  if (ids.length === 0) return;
  const { inArray } = await import("drizzle-orm");
  await db.delete(shipments).where(inArray(shipments.id, ids));
  revalidatePath("/dashboard");
  revalidatePath("/dashboard/shipments");
}

export async function getShipments() {
  return db.query.shipments.findMany({
    orderBy: (shipments, { desc }) => [desc(shipments.createdAt)],
    with: {
      originPort: true,
      destinationPort: true,
      carrier: true,
    },
  });
}

export async function getShipment(id: string) {
  return db.query.shipments.findFirst({
    where: eq(shipments.id, id),
    with: {
      originPort: true,
      destinationPort: true,
      carrier: true,
      vessel: true,
      exceptions: true,
      waypoints: true,
    },
  });
}
