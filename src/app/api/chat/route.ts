import { db } from "@/lib/db";
import { streamText, convertToModelMessages, type UIMessage, tool } from "ai";
import { google } from "@ai-sdk/google";
import { z } from "zod";
import { executeConfirmedAction } from "@/lib/actions";
import { excelReadTools } from "@/lib/tools/excelTools";
import { confirmActionSchema, executeConfirmedActionSchema, showTableSchema } from "@/lib/tools";

export const maxDuration = 30;

// System prompt with tool instructions
const SYSTEM_PROMPT = `Sen yordamchi AI assistantsan. O'zbek va rus tillarida javob bera olasan.

MUHIM QOIDALAR:

## XAVFLI AMALLAR (Thread va Excel operations):
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
- explainFormula: Formulani olish va uni tushuntirib berish (sheet, cell). Agar foydalanuvchi formulani tushuntirishni so'rasa, shu toolni ishlat.
- getRange: Diapazon qiymatlarini olish (sheet, from, to)
- getSheetData: Butun sheet ma'lumotlarini olish (sheet)

## VISUAL JADVAL (showTable):
Agar foydalanuvchi jadval ma'lumotlarini so'rasa yoki "ko'rsat" desa (ayniqsa mention bilan), Markdown jadval o'rniga \`showTable\` toolini ishlatish afzal.
Buning uchun:
1. Avval kerakli ma'lumotni \`getRange\` yoki \`getSheetData\` bilan ol (o'zing uchun).
2. Keyin \`showTable(sheet, data, range)\` toolini chaqirib foydalanuvchiga vizual ko'rsat.

## MENTION TIZIMI (MUHIM!):
Foydalanuvchi Excel hujayralariga MENTION formatida havola qilishi mumkin:
- Bitta hujayra: @SheetName!A1 (masalan: @Users!B2)
- Diapazon: @SheetName!A1:C5 (masalan: @Sales!A1:E10)

Agar xabarda @SheetName!Cell yoki @SheetName!From:To formatidagi mention bo'lsa:
1. Mention ni parse qil: sheet=SheetName, from=Cell/From, to=To (yoki from bilan bir xil)
2. getRange(sheet, from, to) tool ni chaqirib ma'lumotni ol.
3. Natijani \`showTable\` orqali vizual ko'rsat (afzal) yoki Markdown jadval qilib ber.

Misol:
- Foydalanuvchi: "@Users!A1:C3 qiymatlarini ko'rsat"
- Sen: 
  1. getRange("Users", "A1", "C3") -> data ni olasan
  2. showTable("Users", data, {from: "A1", to: "C3"}) -> vizual ko'rsatasan

- Foydalanuvchi: "@Sales!E5 ni tekshir"
- Sen: getCell("Sales", "E5") chaqir va qiymatni ko'rsat

Mention siz ham ishlaysan - "Users sheetidagi A1:C3" desa ham getRange chaqir.

Excel so'rovlariga javob berganda:
1. Avval mentionlarni parse qil (agar bo'lsa)
2. getRange yoki getCell bilan kerakli ma'lumotni ol
3. showTable bilan visual ko'rsatishga harakat qil

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
        // UI TOOLS
        // ============================================
        showTable: tool({
          description: "Show data in a visual table modal to the user. Use this when user asks to see data or mentions a range.",
          inputSchema: showTableSchema,
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
