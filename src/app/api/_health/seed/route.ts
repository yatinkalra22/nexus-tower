import { NextResponse } from "next/server";
import { seedMajorPorts } from "@/server/seed-uncodes";

export const dynamic = "force-dynamic";

export async function GET() {
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
