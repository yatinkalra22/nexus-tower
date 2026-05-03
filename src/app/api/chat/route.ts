import { model } from '@/lib/bedrock';
import { tools } from '@/lib/agent/tools';
import { streamText, stepCountIs, convertToModelMessages } from 'ai';
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
  } catch {
    return new Response('Budget exceeded', { status: 429 });
  }

  const { messages: uiMessages } = await req.json();
  const runId = uuidv4();
  const messages = await convertToModelMessages(uiMessages);

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
    onError: ({ error }) => {
      console.error('[chat] streamText error:', error);
    },
    onFinish: async ({ text, steps, usage }) => {
      try {
        const lastUserMsg = uiMessages[uiMessages.length - 1];
        const promptText = lastUserMsg?.parts?.find((p: { type: string }) => p.type === 'text')?.text
          ?? JSON.stringify(lastUserMsg);
        await db.insert(agentRuns).values({
          id: runId,
          userId,
          prompt: promptText,
          response: text,
          steps: JSON.stringify(steps?.map(s => ({
            toolCalls: s.toolCalls,
            toolResults: s.toolResults,
          }))),
        });

        if (usage) {
          await recordUsage(userId, usage.inputTokens || 0, usage.outputTokens || 0);
        }
      } catch (err) {
        console.error('Failed to persist agent run or usage:', err);
      }
    },
  });

  return result.toUIMessageStreamResponse({
    onError: (error) => {
      const e = error as { name?: string; message?: string; statusCode?: number };
      const status = e?.statusCode;
      const name = e?.name ?? 'Error';
      const message = e?.message ?? String(error);
      console.error('[chat] uiMessageStream error:', { name, status, message });
      if (status === 403 || /AccessDenied|not authorized/i.test(message)) {
        return `Bedrock denied this request (403). Likely causes: model access not granted in ${process.env.AWS_REGION}, IAM missing bedrock:InvokeModelWithResponseStream, or the model ID needs a cross-region inference profile prefix (e.g. "us.anthropic.claude-3-5-sonnet-..."). Check Vercel function logs for the full error.`;
      }
      if (status === 429 || /Throttl|TooManyRequests/i.test(message)) {
        return 'Bedrock throttled this request. Wait a moment and retry.';
      }
      return `${name}: ${message}`;
    },
  });
}
