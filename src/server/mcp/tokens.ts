"use server";

import { db } from "@/db";
import { mcpTokens } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { v4 as uuidv4 } from "uuid";
import { auth } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";

export async function createMcpToken(name: string) {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  const token = `nt_${uuidv4().replace(/-/g, '')}`;
  await db.insert(mcpTokens).values({
    token,
    userId,
    name,
  });

  revalidatePath("/dashboard/settings/mcp");
  return token;
}

export async function getMcpTokens() {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  return db.query.mcpTokens.findMany({
    where: eq(mcpTokens.userId, userId),
    orderBy: (mcpTokens, { desc }) => [desc(mcpTokens.createdAt)],
  });
}

export async function revokeMcpToken(token: string) {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  await db.delete(mcpTokens).where(and(eq(mcpTokens.token, token), eq(mcpTokens.userId, userId)));
  revalidatePath("/dashboard/settings/mcp");
}

export async function validateMcpToken(token: string) {
  const result = await db.query.mcpTokens.findFirst({
    where: eq(mcpTokens.token, token),
  });
  return result?.userId || null;
}
