import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { db } from "@/db";
import { shipments, eventsAudit } from "@/db/schema";
import { eq } from "drizzle-orm";
import { z } from "zod";

const executeSchema = z.discriminatedUnion("action", [
  z.object({
    action: z.literal("reroute"),
    payload: z.object({ shipmentId: z.string().min(1), newDestinationPortId: z.string().min(1) }),
  }),
  z.object({
    action: z.literal("rebook"),
    payload: z.object({ shipmentId: z.string().min(1), newCarrierId: z.string().min(1) }),
  }),
  z.object({
    action: z.literal("notify"),
    payload: z.object({ shipmentId: z.string().min(1), message: z.string().min(1) }),
  }),
]);

export async function POST(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) return new Response("Unauthorized", { status: 401 });

  const body = await req.json();
  const parsed = executeSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ ok: false, error: "Invalid request", details: parsed.error.flatten() }, { status: 400 });
  }

  const { action, payload } = parsed.data;

  try {
    // Verify shipment exists before mutating
    const shipment = await db.query.shipments.findFirst({
      where: eq(shipments.id, payload.shipmentId),
    });
    if (!shipment) {
      return NextResponse.json({ ok: false, error: "Shipment not found" }, { status: 404 });
    }

    return await db.transaction(async (tx) => {
      let outcome = "";

      if (action === "reroute") {
        await tx.update(shipments)
          .set({ destinationPortId: payload.newDestinationPortId, updatedAt: new Date() })
          .where(eq(shipments.id, payload.shipmentId));
        outcome = `Rerouted shipment ${payload.shipmentId} to ${payload.newDestinationPortId}`;
      } else if (action === "rebook") {
        await tx.update(shipments)
          .set({ carrierId: payload.newCarrierId, updatedAt: new Date() })
          .where(eq(shipments.id, payload.shipmentId));
        outcome = `Rebooked shipment ${payload.shipmentId} with carrier ${payload.newCarrierId}`;
      } else if (action === "notify") {
        // In a real app, this would trigger an email/SMS
        outcome = `Notified client for shipment ${payload.shipmentId}: ${payload.message}`;
      }

      await tx.insert(eventsAudit).values({
        actorUserId: userId,
        action: "execute_tool",
        tool: action,
        payload: JSON.stringify(payload),
        outcome,
      });

      return NextResponse.json({ ok: true, outcome });
    });
  } catch (error) {
    console.error("Execution failed:", error);
    return NextResponse.json({ ok: false, error: "Mutation failed" }, { status: 500 });
  }
}
