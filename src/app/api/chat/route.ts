import { db } from "@/lib/db";
import { streamText } from "ai";
import { openai } from "@ai-sdk/openai";

export const maxDuration = 30;

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const threadId = searchParams.get("thread_id");

  if (!threadId) {
    return Response.json({ error: "thread_id kerak" }, { status: 400 });
  }

  const messages = db
    .query("SELECT * FROM messages WHERE thread_id = ? ORDER BY id ASC")
    .all(threadId) as Array<{ role: string; content: string }>;
  
  return Response.json(messages);
}

export async function POST(req: Request) {
  const { messages, threadId } = await req.json();

  // User xabarini DB ga saqlash
  const lastMessage = messages[messages.length - 1];
  if (lastMessage.role === "user") {
    db.run("INSERT INTO messages (thread_id, role, content) VALUES (?, ?, ?)", [
      threadId,
      "user",
      lastMessage.content,
    ]);
  }

  // AI javobini stream qilish
  const result = streamText({
    model: openai("gpt-4o-mini"),
    messages,
    async onFinish({ text }) {
      // AI javobini DB ga saqlash
      db.run("INSERT INTO messages (thread_id, role, content) VALUES (?, ?, ?)", [
        threadId,
        "assistant",
        text,
      ]);
    },
  });

  return result.toTextStreamResponse();
}
