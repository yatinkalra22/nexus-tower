import { model } from "@/lib/bedrock";
import { tools } from "@/lib/agent/tools";
import { streamText, stepCountIs } from "ai";
import { auth } from "@clerk/nextjs/server";
import { db } from "@/db";
import { agentRuns } from "@/db/schema";
import { v4 as uuidv4 } from "uuid";
import { assertWithinBudget, recordUsage } from "@/lib/agent/budget";

export const maxDuration = 30;

export async function POST(req: Request) {
  const { userId } = await auth();
  if (!userId) {
    return new Response("Unauthorized", { status: 401 });
  }

  try {
    await assertWithinBudget(userId);
  } catch (error) {
    return new Response(error instanceof Error ? error.message : "Budget exceeded", { status: 429 });
  }

  const { messages } = await req.json();
  const runId = uuidv4();

  const result = streamText({
    model,
    tools,
    messages,
    maxSteps: 8,
    system: `You are the NexusTower Logistics Agent, an expert in autonomous supply chain execution.
    You have access to real-time AIS vessel tracking, Open-Meteo weather, and GDELT geopolitical disruption data.
    
    Current Operator ID: ${userId}
    
    Your goal is to help the operator detect, reason about, and resolve logistics disruptions.
    - Always use the provided tools to query the real state of the world.
    - If you detect a risk (weather, speed reduction, news event), explain it clearly.
    - When suggesting a change (like a reroute), use the 'proposeReroute' tool which requires human approval.
    - Be concise, professional, and data-driven. No fluff.`,
    onFinish: async ({ text, toolCalls, toolResults, usage }) => {
      // Persist the run to the database for the audit log
      try {
        await db.insert(agentRuns).values({
          id: runId,
          userId,
          prompt: messages[messages.length - 1].content,
          response: text,
          steps: JSON.stringify({ toolCalls, toolResults }),
        });

        // Record token usage
        if (usage) {
          await recordUsage(userId, usage.promptTokens, usage.completionTokens);
        }
      } catch (error) {
        console.error("Failed to persist agent run or usage:", error);
      }
    },
  });

  return result.toDataStreamResponse();
}
