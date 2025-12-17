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

const SYSTEM_PROMPT = `You are an AI assistant that works with Excel files. Communicate in Uzbek/Russian.

KEY RULES:
1. When user wants to modify data (add/update/delete) → CALL confirmAction tool immediately
2. DON'T ask for confirmation via text - the tool shows a UI dialog
3. After user confirms → call executeConfirmedAction
4. Use listSheets/getRange to read data, showTable to display nicely

For adding rows: rowData should NOT include ID (server auto-generates it)`;

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const threadId = searchParams.get("thread_id");
  if (!threadId)
    return Response.json({ error: "thread_id kerak" }, { status: 400 });

  const messages = db
    .query("SELECT * FROM messages WHERE thread_id = ? ORDER BY id ASC")
    .all(threadId) as Array<{
    id: number;
    role: string;
    content: string;
    tool_invocations: string | null;
  }>;

  // Parse tool_invocations from JSON string
  const parsedMessages = messages.map((msg) => ({
    id: msg.id,
    role: msg.role,
    content: msg.content,
    toolInvocations: msg.tool_invocations
      ? JSON.parse(msg.tool_invocations)
      : undefined,
  }));

  return Response.json(parsedMessages);
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
      // model: google("gemini-2.0-flash-exp"),
      model: groq("llama-3.3-70b-versatile"),
      system: SYSTEM_PROMPT,
      messages: convertToModelMessages(messages),
      // @ts-expect-error - maxSteps exists but not in type definition
      maxSteps: 3, // Reduced for Groq stability
      temperature: 0.3, // Lower temp for more predictable tool calling
      tools: {
        confirmAction: tool({
          description: `Request user confirmation before modifying data. Shows UI dialog with buttons. Don't ask via text - call this tool directly.`,
          inputSchema: confirmActionSchema,
        }),
        executeConfirmedAction: tool({
          description: `Execute action after user clicks confirm button. Call immediately after confirmAction returns confirmed status.`,
          inputSchema: executeConfirmedActionSchema,
          execute: async ({ actionType, params }) => {
            console.log("Executing action:", actionType, params);
            return await executeConfirmedAction(actionType, params);
          },
        }),
        showTable: tool({
          description: "Display Excel data in a visual table modal.",
          inputSchema: showTableSchema,
        }),
        ...excelReadTools,
      },
      async onFinish({ text, toolCalls, toolResults, response }) {
        // Save assistant message asynchronously (non-blocking)
        if (text && text.trim()) {
          Promise.resolve().then(() => {
            try {
              // Collect tool invocations from response
              const toolInvocations: any[] = [];

              // Add tool calls
              if (toolCalls && toolCalls.length > 0) {
                for (const call of toolCalls) {
                  toolInvocations.push({
                    toolCallId: call.toolCallId,
                    toolName: call.toolName,
                    args: (call as any).args,
                    state: "call",
                  });
                }
              }

              // Add tool results
              if (toolResults && toolResults.length > 0) {
                for (const result of toolResults) {
                  const existing = toolInvocations.find(
                    (t) => t.toolCallId === result.toolCallId
                  );
                  if (existing) {
                    existing.state = "result";
                    existing.result = (result as any).result;
                  } else {
                    toolInvocations.push({
                      toolCallId: result.toolCallId,
                      toolName: result.toolName,
                      result: (result as any).result,
                      state: "result",
                    });
                  }
                }
              }

              const toolInvocationsJson =
                toolInvocations.length > 0
                  ? JSON.stringify(toolInvocations)
                  : null;

              db.run(
                "INSERT INTO messages (thread_id, role, content, tool_invocations) VALUES (?, ?, ?, ?)",
                [threadId, "assistant", text, toolInvocationsJson]
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
