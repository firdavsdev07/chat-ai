import { db } from "@/lib/db";
import { streamText, convertToModelMessages, type UIMessage, tool } from "ai";
// import { google } from "@ai-sdk/google";
import { groq } from "@ai-sdk/groq";
import { executeConfirmedAction } from "@/lib/actions";
import { excelReadTools } from "@/lib/tools/excelTools";
import {
  confirmActionSchema,
  executeConfirmedActionSchema,
  showTableSchema,
} from "@/lib/tools";

export const maxDuration = 30;

const SYSTEM_PROMPT = `You are a professional AI assistant. You communicate fluently in Uzbek and Russian.
Your primary function is working with Excel files and analyzing data.

## CRITICAL BEHAVIOR RULES

### RULE #1: WHEN USER WANTS TO MODIFY DATA - CALL TOOL IMMEDIATELY!

YOU MUST NOT:
- Ask "Alexsandr uchun qanday ID raqamini berasiz?" (WRONG!)
- Ask "Tasdiqlaysizmi?" or "Ma'qulmi?" (WRONG!)
- Say "Iltimos, tasdiqlash uchun confirmAction funksiyasini chaqiring" (WRONG!)
- Ask for any additional information if you have enough data

YOU MUST:
- When user says "add/update/delete" → IMMEDIATELY CALL THE TOOL
- If sheet has ID column → DON'T ask for ID, server generates it automatically
- Call confirmAction first, then wait for user button click

### RULE #2: CONCRETE EXAMPLES

Example 1 - Add Row:
User: "Yangi user qo'shamiz: Alexsandr, alex@gmail.com, Developer, 4760"
❌ WRONG: "Alexsandr uchun qanday ID raqamini berasiz?"
✅ RIGHT: [IMMEDIATELY CALL confirmAction tool with:
  actionType: "addExcelRow",
  actionTitle: "Yangi foydalanuvchi",
  actionDescription: "Alexsandr (alex@gmail.com, Developer, 4760) qo'shiladi",
  params: {sheet: "Users", rowData: ["Alexsandr", "alex@gmail.com", "Developer", 4760]}
]
Server will auto-generate ID!

Example 2 - Update Cell:
User: "Firdavsning maoshini 4500 qil"
❌ WRONG: "Ma'qulmi?"
✅ RIGHT: [IMMEDIATELY CALL confirmAction tool with:
  actionType: "updateExcelCell",
  actionTitle: "Maoshni yangilash",
  actionDescription: "Firdavs maoshi 4500 ga o'zgaradi",
  params: {sheet: "Users", cell: "E2", value: 4500}
]

Example 3 - Delete Row:
User: "6-qatorni o'chir"
❌ WRONG: "Tasdiqlaysizmi?"
✅ RIGHT: [IMMEDIATELY CALL confirmAction tool]

### RULE #3: WORKFLOW

1. User requests modification
2. YOU: Call confirmAction (no text asking first!)
3. SYSTEM: Shows UI dialog with buttons
4. USER: Clicks "Tasdiqlash" button
5. YOU: Receive {status: "confirmed", ...}
6. YOU: Call executeConfirmedAction
7. YOU: Report success

### RULE #4: DATA OPERATIONS

Inspect first: Use listSheets or getSheetData to understand structure

Update Cell:
- actionType: "updateExcelCell"
- params: {sheet, cell, value}

Delete Row:
- actionType: "deleteExcelRow"
- params: {sheet, rowIndex}

Add Row:
- actionType: "addExcelRow"
- params: {sheet, rowData} (WITHOUT ID - server generates it!)
- rowData: Just data fields, NO ID at start

Visualize: Use showTable to show data nicely

### RULE #5: COMMUNICATION
- Clear, concise, friendly
- Report what will happen, then call tool
- NEVER ask for confirmation via text - TOOL DOES THAT!`;

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const threadId = searchParams.get("thread_id");
  if (!threadId)
    return Response.json({ error: "thread_id kerak" }, { status: 400 });

  const messages = db
    .query("SELECT * FROM messages WHERE thread_id = ? ORDER BY id ASC")
    .all(threadId) as Array<{ id: number; role: string; content: string }>;
  return Response.json(messages);
}

export async function POST(req: Request) {
  const { messages }: { messages: UIMessage[] } = await req.json();
  const { searchParams } = new URL(req.url);
  const threadId = searchParams.get("id");
  if (!threadId)
    return Response.json({ error: "thread_id kerak" }, { status: 400 });

  // Save user message asynchronously (non-blocking)
  const lastMessage = messages[messages.length - 1];
  if (lastMessage.role === "user") {
    const textContent = lastMessage.parts
      .filter((part) => part.type === "text")
      .map((part) => ("text" in part ? part.text : ""))
      .join("");

    // Non-blocking save
    Promise.resolve().then(() => {
      try {
        db.run(
          "INSERT INTO messages (thread_id, role, content) VALUES (?, ?, ?)",
          [threadId, "user", textContent]
        );
      } catch (error) {
        console.error("Failed to save user message:", error);
      }
    });
  }

  try {
    const result = streamText({
      // model: google("gemini-2.5-flash-lite"),
      model: groq("llama-3.3-70b-versatile"), // Faster and better with tools
      system: SYSTEM_PROMPT,
      messages: convertToModelMessages(messages),
      // @ts-expect-error - maxSteps exists but not in type definition
      maxSteps: 10, // Allow multiple tool calls in sequence
      temperature: 0.7,
      tools: {
        confirmAction: tool({
          description: `IMMEDIATE ACTION REQUIRED: Call this tool when user wants to modify data.
          
          DO NOT ASK USER VIA TEXT! Call this tool immediately!
          
          Bad: "Alexsandr uchun qanday ID berasiz?" ❌
          Bad: "Tasdiqlaysizmi?" ❌
          Good: [Call this tool immediately] ✅
          
          This tool shows a visual dialog with "Tasdiqlash" and "Bekor qilish" buttons.
          User clicks the button, then you get the result and call executeConfirmedAction.
          
          Parameters:
          - actionType: "updateExcelCell" | "deleteExcelRow" | "addExcelRow"
          - actionTitle: Brief title (e.g., "Yangi foydalanuvchi", "Maoshni yangilash")
          - actionDescription: What will change (e.g., "Alexsandr qo'shiladi")
          - params: {sheet, cell?, value?, rowIndex?, rowData?}
          
          For addExcelRow: rowData should NOT include ID - server generates it automatically!`,
          inputSchema: confirmActionSchema,
        }),
        executeConfirmedAction: tool({
          description: `Execute an action after user confirmation.
          
          CRITICAL: Call this IMMEDIATELY after confirmAction returns {status: "confirmed"}.
          User already confirmed via button click - no additional confirmation needed.
          
          Parameters:
          - actionType: Same as in confirmAction
          - params: Same params from confirmAction
          
          Returns: {success: boolean, message: string}`,
          inputSchema: executeConfirmedActionSchema,
          execute: async ({ actionType, params }) => {
            console.log("Executing action:", actionType, params);
            return await executeConfirmedAction(actionType, params);
          },
        }),
        showTable: tool({
          description:
            "Display data in a visual table grid modal. Use this instead of listing raw arrays. Better UX for viewing Excel data.",
          inputSchema: showTableSchema,
        }),
        ...excelReadTools,
      },
      async onFinish({ text }) {
        // Save assistant message asynchronously (non-blocking)
        if (text && text.trim()) {
          Promise.resolve().then(() => {
            try {
              db.run(
                "INSERT INTO messages (thread_id, role, content) VALUES (?, ?, ?)",
                [threadId, "assistant", text]
              );
            } catch (error) {
              console.error("Failed to save assistant message:", error);
            }
          });
        }
      },
      onError: (error) => {
        console.error("AI Error:", error);
      },
    });

    return result.toUIMessageStreamResponse();
  } catch (error) {
    console.error("API Error:", error);
    return Response.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
