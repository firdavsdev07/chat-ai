import { db } from "@/lib/db";
import { streamText, convertToModelMessages, type UIMessage } from "ai";
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
    .all(threadId) as Array<{ id: number; role: string; content: string }>;
  
  return Response.json(messages);
}

export async function POST(req: Request) {
  const { messages }: { messages: UIMessage[] } = await req.json();
  
  // Extract threadId from URL search params (sent by useChat as ?id=threadId)
  const { searchParams } = new URL(req.url);
  const threadId = searchParams.get("id");

  if (!threadId) {
    return Response.json({ error: "thread_id kerak" }, { status: 400 });
  }

  // User xabarini DB ga saqlash
  const lastMessage = messages[messages.length - 1];
  if (lastMessage.role === "user") {
    // Extract text from message parts
    const textContent = lastMessage.parts
      .filter((part) => part.type === "text")
      .map((part) => "text" in part ? part.text : "")
      .join("");
      
    db.run("INSERT INTO messages (thread_id, role, content) VALUES (?, ?, ?)", [
      threadId,
      "user",
      textContent,
    ]);
  }

  // AI javobini stream qilish
  const result = streamText({
    model: openai("gpt-4o-mini"),
    messages: convertToModelMessages(messages),
    async onFinish({ text }) {
      // AI javobini DB ga saqlash
      db.run("INSERT INTO messages (thread_id, role, content) VALUES (?, ?, ?)", [
        threadId,
        "assistant",
        text,
      ]);
    },
  });

  // Return stream response compatible with @ai-sdk/react v2
  return result.toUIMessageStreamResponse();
}
