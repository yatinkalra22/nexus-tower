import { model } from '@/lib/bedrock';
import { tools } from '@/lib/agent/tools';
import { streamText, stepCountIs } from 'ai';
import { auth } from '@clerk/nextjs/server';
import { db } from '@/db';
import { agentRuns } from '@/db/schema';
import { v4 as uuidv4 } from 'uuid';
import { assertWithinBudget, recordUsage } from '@/lib/agent/budget';

export const maxDuration = 60;

export async function POST(req: Request) {
  const { userId } = await auth();
  if (!userId) {
    return new Response('Unauthorized', { status: 401 });
  }

  try {
    await assertWithinBudget(userId);
  } catch (error) {
    return new Response(error instanceof Error ? error.message : 'Budget exceeded', {
      status: 429,
    });
  }

  const { messages } = await req.json();
  const runId = uuidv4();

  const result = streamText({
    model,
    tools,
    stopWhen: stepCountIs(8),
    messages,
    system: `You are the NexusTower Logistics Agent, an expert in autonomous supply chain execution.
    You have access to real-time AIS vessel tracking, Open-Meteo weather, and GDELT geopolitical disruption data.

    Current Operator ID: ${userId}

    Your goal is to help the operator detect, reason about, and resolve logistics disruptions.
    - Always use the provided tools to query the real state of the world.
    - If you detect a risk (weather, speed reduction, news event), explain it clearly.
    - When suggesting a change (like a reroute), use the 'proposeReroute' tool which requires human approval.
    - Be concise, professional, and data-driven. No fluff.`,
    onFinish: async ({ text, steps, usage }) => {
      try {
        await db.insert(agentRuns).values({
          id: runId,
          userId,
          prompt: messages[messages.length - 1].content ?? JSON.stringify(messages[messages.length - 1].parts),
          response: text,
          steps: JSON.stringify(steps?.map(s => ({
            toolCalls: s.toolCalls,
            toolResults: s.toolResults,
          }))),
        });

        if (usage) {
          await recordUsage(userId, usage.inputTokens || 0, usage.outputTokens || 0);
        }
      } catch (error) {
        console.error('Failed to persist agent run or usage:', error);
      }
    },
  });

  return result.toUIMessageStreamResponse();
}
