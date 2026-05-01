import { NextResponse } from "next/server";
import { db } from "@/db";
import { sql } from "drizzle-orm";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const result = await db.run(sql`SELECT count(*) as count FROM sqlite_master WHERE type='table'`);
    return NextResponse.json({ 
      status: "ok", 
      tableCount: result.rows[0]?.count ?? 0 
    });
  } catch (error) {
    console.error("DB Health Check Failed:", error);
    return NextResponse.json({ 
      status: "error", 
      message: error instanceof Error ? error.message : "Unknown error" 
    }, { status: 500 });
  }
}
