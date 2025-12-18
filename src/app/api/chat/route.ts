import { db } from "@/lib/db";
import { streamText, convertToModelMessages, type UIMessage, tool } from "ai";
import { openai } from "@ai-sdk/openai";
import { executeConfirmedAction } from "@/lib/actions";
import { excelReadTools } from "@/lib/tools/excelTools";
import {
  confirmActionSchema,
  executeConfirmedActionSchema,
  showTableSchema,
} from "@/lib/tools";

export const maxDuration = 30;

const SYSTEM_PROMPT = `You are an AI assistant that works with Excel files. Communicate in Russian/English.

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
    return Response.json({ error: "требуется thread_id" }, { status: 400 });

  const messages = db
    .query("SELECT * FROM messages WHERE thread_id = ? ORDER BY id ASC")
    .all(threadId) as Array<{
      id: number;
      role: string;
      content: string;
      tool_invocations: string | null;
    }>;

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
    return Response.json({ error: "требуется thread_id" }, { status: 400 });

  const lastMessage = messages[messages.length - 1];
  if (lastMessage.role === "user") {
    const textContent = lastMessage.parts
      .filter((part) => part.type === "text")
      .map((part) => ("text" in part ? part.text : ""))
      .join("");

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
      model: openai("gpt-4o-mini"),
      system: SYSTEM_PROMPT,
      messages: convertToModelMessages(messages),
      // @ts-expect-error
      maxSteps: 10,
      temperature: 0.7,
      maxRetries: 2,
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
      async onStepFinish({ text, toolCalls, toolResults, finishReason }) {
        Promise.resolve().then(() => {
          try {
            const hasConfirmAction = toolCalls?.some(
              (call: any) =>
                call.toolName === "confirmAction" &&
                !toolResults?.some((r: any) => r.toolCallId === call.toolCallId)
            );

            if (!hasConfirmAction) {
              return;
            }

            const toolInvocations: any[] = [];

            if (toolCalls && toolCalls.length > 0) {
              for (const call of toolCalls) {
                if (call.toolName === "confirmAction") {
                  const callArgs = (call as any).args;

                  if (!callArgs || typeof callArgs !== 'object' || !callArgs.actionType) {
                    console.error('Skipping confirmAction without valid args:', call);
                    continue;
                  }

                  const hasResult = toolResults?.some(
                    (r) => r.toolCallId === call.toolCallId
                  );
                  toolInvocations.push({
                    toolCallId: call.toolCallId,
                    toolName: call.toolName,
                    args: callArgs,
                    state: hasResult ? "result" : "call",
                  });
                }
              }
            }

            if (toolInvocations.length > 0) {
              const toolInvocationsJson = JSON.stringify(toolInvocations);
              const currentContent = text || "";

              const lastMsg = db
                .query(
                  "SELECT id, content, tool_invocations FROM messages WHERE thread_id = ? ORDER BY id DESC LIMIT 1"
                )
                .get(threadId) as any;

              if (
                lastMsg &&
                lastMsg.content === currentContent &&
                lastMsg.tool_invocations === toolInvocationsJson
              ) {
                console.log("Skipping duplicate confirmAction");
                return;
              }

              db.run(
                "INSERT INTO messages (thread_id, role, content, tool_invocations) VALUES (?, ?, ?, ?)",
                [threadId, "assistant", currentContent, toolInvocationsJson]
              );
              console.log("💾 Saved confirmAction step:", {
                content: currentContent.substring(0, 50),
                toolInvocations: toolInvocations.length,
                args: toolInvocations[0]?.args
              });
            }
          } catch (error) {
            console.error("Failed to save step:", error);
          }
        });
      },
      async onFinish({ text, toolCalls, toolResults }) {
        Promise.resolve().then(() => {
          try {
            if (!text || !text.trim()) return;

            const toolInvocations: any[] = [];

            if (toolCalls && toolCalls.length > 0) {
              for (const call of toolCalls) {
                const result = toolResults?.find(
                  (r: any) => r.toolCallId === call.toolCallId
                );
                toolInvocations.push({
                  toolCallId: call.toolCallId,
                  toolName: call.toolName,
                  args: (call as any).args,
                  state: result ? "result" : "call",
                  result: result ? (result as any).result : undefined,
                });
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
            console.log("Saved final message");
          } catch (error) {
            console.error("Failed to save final message:", error);
          }
        });
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
