import { db } from "@/lib/db";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const { thread_id, content } = await req.json();

  db.run("INSERT INTO messages (thread_id, role, content) VALUES (?, ?, ?)", [
    thread_id,
    "user",
    content,
  ]);

  const assistantContent = `you : ${content}`;
  db.run("INSERT INTO messages (thread_id, role, content) VALUES (?, ?, ?)", [
    thread_id,
    "assistant",
    assistantContent,
  ]);

  return NextResponse.json({ content: assistantContent });
}
