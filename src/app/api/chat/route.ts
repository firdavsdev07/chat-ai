import { db } from "@/lib/db";
import { streamText, convertToModelMessages, type UIMessage, tool } from "ai";
import { google } from "@ai-sdk/google";
import { z } from "zod";
import { executeConfirmedAction } from "@/lib/actions";

export const maxDuration = 30;

// System prompt with tool instructions
const SYSTEM_PROMPT = `Sen yordamchi AI assistantsan. O'zbek va rus tillarida javob bera olasan.

MUHIM QOIDALAR:
1. Agar foydalanuvchi thread o'chirish, xabarlarni tozalash, yoki boshqa xavfli amal so'rasa - ALBATTA confirmAction tool ni chaqir.
2. Hech qachon xavfli amalni tasdiqlashsiz bajarma.
3. Foydalanuvchi tasdiqlashi ("confirmed") kelgandan keyingina executeConfirmedAction ni chaqir.
4. Agar foydalanuvchi rad etsa ("rejected"), xushmuomala ravishda amal bekor qilinganini ayt.

MAVJUD ACTIONLAR:
- deleteThread: Thread ni o'chirish (threadId kerak)
- updateThreadTitle: Thread nomini o'zgartirish (threadId va newTitle kerak)
- clearMessages: Thread xabarlarini tozalash (threadId kerak)

Foydalanuvchi so'roviga qarab to'g'ri action type ni tanla.`;

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
    model: google("gemini-2.5-flash"),
    system: SYSTEM_PROMPT,
    messages: convertToModelMessages(messages),
    tools: {
      // Confirmation tool - client-side render qilinadi
      confirmAction: tool({
        description: `Request user confirmation before performing a dangerous action. 
          Use this for delete, update, or clear operations.
          The user will see a confirmation dialog.`,
        inputSchema: z.object({
          actionType: z.enum(['deleteThread', 'updateThreadTitle', 'clearMessages'])
            .describe('Type of dangerous action'),
          actionTitle: z.string()
            .describe('Title shown in dialog, e.g., "Thread o\'chirish"'),
          actionDescription: z.string()
            .describe('Description of what will happen'),
          params: z.object({
            threadId: z.number().optional(),
            newTitle: z.string().optional(),
          }),
        }),
        // No execute - this will be handled client-side
      }),

      // Execute tool - server-side bajariladi
      executeConfirmedAction: tool({
        description: `Execute a previously confirmed action. Only call after user confirmed.`,
        inputSchema: z.object({
          actionType: z.enum(['deleteThread', 'updateThreadTitle', 'clearMessages']),
          params: z.object({
            threadId: z.number().optional(),
            newTitle: z.string().optional(),
          }),
        }),
        execute: async ({ actionType, params }) => {
          const result = await executeConfirmedAction(actionType, params);
          return result;
        },
      }),
    },
    async onFinish({ text }) {
      // AI javobini DB ga saqlash (agar matn bo'lsa)
      if (text && text.trim()) {
        db.run("INSERT INTO messages (thread_id, role, content) VALUES (?, ?, ?)", [
          threadId,
          "assistant",
          text,
        ]);
      }
    },
  });

  // Return stream response compatible with @ai-sdk/react v2
  return result.toUIMessageStreamResponse();
}
