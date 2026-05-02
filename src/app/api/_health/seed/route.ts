import { NextRequest, NextResponse } from "next/server";
import { timingSafeEqual } from "crypto";
import { seedMajorPorts } from "@/server/seed-uncodes";

export const dynamic = "force-dynamic";

function safeCompare(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  return timingSafeEqual(Buffer.from(a), Buffer.from(b));
}

export async function GET(req: NextRequest) {
  const secret = req.headers.get("x-cron-secret");
  const expected = process.env.CRON_SECRET;
  if (!secret || !expected || !safeCompare(secret, expected)) {
    return NextResponse.json({ status: "error", message: "Forbidden" }, { status: 403 });
  }

  try {
    const result = await seedMajorPorts();
    return NextResponse.json({
      status: "ok",
      seeded: result
    });
  } catch (error) {
    console.error("Seeding Failed:", error);
    return NextResponse.json({
      status: "error",
      message: "Seeding failed"
    }, { status: 500 });
  }
}
