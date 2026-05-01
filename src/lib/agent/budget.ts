import { db } from "@/db";
import { agentTokenUsage } from "@/db/schema";
import { eq, and, sql } from "drizzle-orm";

const DAILY_TOKEN_BUDGET = 50000; // 50k tokens per user per day for the hackathon

export async function assertWithinBudget(userId: string) {
  const today = new Date().toISOString().split('T')[0];

  const usage = await db.query.agentTokenUsage.findFirst({
    where: and(
      eq(agentTokenUsage.userId, userId),
      eq(agentTokenUsage.date, today)
    ),
  });

  const totalUsed = (usage?.inputTokens ?? 0) + (usage?.outputTokens ?? 0);

  if (totalUsed >= DAILY_TOKEN_BUDGET) {
    throw new Error("Daily token budget exceeded. Please wait until tomorrow or contact support.");
  }
}

export async function recordUsage(userId: string, inputTokens: number, outputTokens: number) {
  const today = new Date().toISOString().split('T')[0];

  await db.insert(agentTokenUsage).values({
    userId,
    date: today,
    inputTokens,
    outputTokens,
  }).onConflictDoUpdate({
    target: [agentTokenUsage.userId, agentTokenUsage.date],
    set: {
      inputTokens: sql`${agentTokenUsage.inputTokens} + ${inputTokens}`,
      outputTokens: sql`${agentTokenUsage.outputTokens} + ${outputTokens}`,
    }
  });
}

export async function getDailyUsage(userId: string) {
  const today = new Date().toISOString().split('T')[0];
  const usage = await db.query.agentTokenUsage.findFirst({
    where: and(
      eq(agentTokenUsage.userId, userId),
      eq(agentTokenUsage.date, today)
    ),
  });

  return {
    used: (usage?.inputTokens ?? 0) + (usage?.outputTokens ?? 0),
    budget: DAILY_TOKEN_BUDGET,
  };
}
