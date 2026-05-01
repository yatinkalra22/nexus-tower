import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { getDailyUsage } from "@/lib/agent/budget";

export const dynamic = "force-dynamic";

export async function GET() {
  const { userId } = await auth();
  if (!userId) return new Response("Unauthorized", { status: 401 });

  try {
    const usage = await getDailyUsage(userId);
    return NextResponse.json(usage);
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch usage" }, { status: 500 });
  }
}
