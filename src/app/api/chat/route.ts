import { db } from "@/lib/db";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const { thread_id, content } = await req.json();

  // User xabarini saqlash
  if (typeof Bun !== "undefined") {
    db.run("INSERT INTO messages (thread_id, role, content) VALUES (?, ?, ?)", [
      thread_id, "user", content
    ]);
  } else {
    db.prepare("INSERT INTO messages (thread_id, role, content) VALUES (?, ?, ?)")
      .run(thread_id, "user", content);
  }

  // Fake assistant javobi
  const assistantContent = `Sen yozding: ${content}`;
  if (typeof Bun !== "undefined") {
    db.run("INSERT INTO messages (thread_id, role, content) VALUES (?, ?, ?)", [
      thread_id, "assistant", assistantContent
    ]);
  } else {
    db.prepare("INSERT INTO messages (thread_id, role, content) VALUES (?, ?, ?)")
      .run(thread_id, "assistant", assistantContent);
  }

  return NextResponse.json({ content: assistantContent });
}
