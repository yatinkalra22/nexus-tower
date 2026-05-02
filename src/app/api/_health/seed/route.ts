import { NextRequest, NextResponse } from "next/server";
import { seedMajorPorts } from "@/server/seed-uncodes";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const secret = req.headers.get("x-cron-secret") || req.nextUrl.searchParams.get("secret");
  if (secret !== process.env.CRON_SECRET) {
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
      message: error instanceof Error ? error.message : "Unknown error"
    }, { status: 500 });
  }
}
