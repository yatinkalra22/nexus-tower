import { auth } from "@clerk/nextjs/server";
import { db } from "@/db";
import { chatSessions } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function GET() {
  const { userId } = await auth();
  if (!userId) return new Response("Unauthorized", { status: 401 });

  const session = await db.query.chatSessions.findFirst({
    where: eq(chatSessions.userId, userId),
  });

  if (!session) return Response.json({ messages: [] });

  try {
    const messages = JSON.parse(session.messages);
    return Response.json({ messages });
  } catch {
    return Response.json({ messages: [] });
  }
}

export async function PUT(req: Request) {
  const { userId } = await auth();
  if (!userId) return new Response("Unauthorized", { status: 401 });

  const { messages } = await req.json();

  if (!Array.isArray(messages)) {
    return new Response("Invalid messages", { status: 400 });
  }

  await db
    .insert(chatSessions)
    .values({
      userId,
      messages: JSON.stringify(messages),
    })
    .onConflictDoUpdate({
      target: chatSessions.userId,
      set: {
        messages: JSON.stringify(messages),
      },
    });

  return Response.json({ ok: true });
}

export async function DELETE() {
  const { userId } = await auth();
  if (!userId) return new Response("Unauthorized", { status: 401 });

  await db.delete(chatSessions).where(eq(chatSessions.userId, userId));

  return Response.json({ ok: true });
}
