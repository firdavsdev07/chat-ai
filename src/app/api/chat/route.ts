import { db } from "@/lib/db";
import { streamText, convertToModelMessages, type UIMessage, tool } from "ai";
import { google } from "@ai-sdk/google";
import { z } from "zod";
import { executeConfirmedAction } from "@/lib/actions";
import { excelReadTools } from "@/lib/tools/excelTools";
import { confirmActionSchema, executeConfirmedActionSchema } from "@/lib/tools";

export const maxDuration = 30;

// System prompt with tool instructions
const SYSTEM_PROMPT = `Sen yordamchi AI assistantsan. O'zbek va rus tillarida javob bera olasan.

MUHIM QOIDALAR:

## XAvFLI AMALLAR (Thread va Excel operations):
1. Agar foydalanuvchi thread o'chirish, xabarlarni tozalash, yoki EXCEL KATAGINI O'ZGARTIRISHNI so'rasa - ALBATTA confirmAction tool ni chaqir.
2. Hech qachon xavfli amalni tasdiqlashsiz bajarma.
3. Foydalanuvchi tasdiqlashi ("confirmed") kelgandan keyingina executeConfirmedAction ni chaqir.
4. Agar foydalanuvchi rad etsa ("rejected"), xushmuomala ravishda amal bekor qilinganini ayt.

MAVJUD ACTIONLAR:
- deleteThread: Thread ni o'chirish
- updateThreadTitle: Thread nomini o'zgartirish
- clearMessages: Thread xabarlarini tozalash
- updateExcelCell: Excel katagini yangilash (sheet, cell, value kerak)

## EXCEL FAYL BILAN ISHLASH:
Excel faylida quyidagi sheetlar mavjud: Users, Sales, Inventory.

EXCEL TOOLS:
- listSheets: Barcha sheetlarni ko'rish
- getCell: Bitta hujayra qiymatini olish (sheet, cell)
- getCellFormula: Hujayradagi formulani olish (sheet, cell)
- getRange: Diapazon qiymatlarini olish (sheet, from, to)
- getSheetData: Butun sheet ma'lumotlarini olish (sheet)

Excel so'rovlariga javob berganda:
1. Avval listSheets bilan mavjud sheetlarni ko'r
2. Keyin getRange yoki getCell bilan kerakli ma'lumotni ol
3. Jadval formatida chiroyli ko'rsat

Foydalanuvchi so'roviga qarab to'g'ri tool ni tanla.`;

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

  try {
    // AI javobini stream qilish
    const result = streamText({
      model: google("gemini-2.5-flash"),
      system: SYSTEM_PROMPT,
      messages: convertToModelMessages(messages),
      tools: {
        // ============================================
        // CONFIRMATION TOOLS
        // ============================================
        
        // Confirmation tool - client-side render qilinadi
        confirmAction: tool({
          description: `Request user confirmation before performing a dangerous action. 
            Use this for delete, update, or clear operations, AND FOR EXCEL UPDATES.
            The user will see a confirmation dialog.`,
          inputSchema: confirmActionSchema,
          // No execute - this will be handled client-side
        }),

        // Execute tool - server-side bajariladi
        executeConfirmedAction: tool({
          description: `Execute a previously confirmed action. Only call after user confirmed.`,
          inputSchema: executeConfirmedActionSchema,
          execute: async ({ actionType, params }) => {
            console.log("🚀 Executing action:", actionType);
            const result = await executeConfirmedAction(actionType, params);
            return result;
          },
        }),

        // ============================================
        // EXCEL READ TOOLS
        // ============================================
        ...excelReadTools,
      },
      async onFinish({ text }) {
        // AI javobini DB ga saqlash (agar matn bo'lsa)
        if (text && text.trim()) {
          console.log("🤖 AI finished:", text.substring(0, 50) + "...");
          db.run("INSERT INTO messages (thread_id, role, content) VALUES (?, ?, ?)", [
            threadId,
            "assistant",
            text,
          ]);
        }
      },
      onError: (error) => {
        console.error("❌ AI Stream Error:", error);
      },
    });

    // Return stream response compatible with @ai-sdk/react v2
    return result.toUIMessageStreamResponse();
  } catch (error) {
    console.error("❌ General API Error:", error);
    return Response.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
