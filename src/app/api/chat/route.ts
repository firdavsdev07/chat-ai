import { db } from "@/lib/db";
import { NextResponse } from "next/server";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const threadId = searchParams.get("thread_id");

  if (!threadId) {
    return NextResponse.json({ error: "thread_id kerak" }, { status: 400 });
  }

  const messages = db
    .query("SELECT * FROM messages WHERE thread_id = ? ORDER BY id ASC")
    .all(threadId);
  return NextResponse.json(messages);
}

export async function POST(req: Request) {
  const { thread_id, content } = await req.json();

  db.run("INSERT INTO messages (thread_id, role, content) VALUES (?, ?, ?)", [
    thread_id,
    "user",
    content,
  ]);

  // Auto javob variantlari
  const responses = [
    `Men sizning "${content}" degan fikringizga qo'shilaman.`,
    `"${content}" - juda qiziqarli fikr!`,
    `Tushundim, siz "${content}" demoqchisiz.`,
    `Rahmat! "${content}" haqida ko'proq gapiring.`,
    `"${content}" - ajoyib! Davom eting.`,
  ];
  
  const randomResponse = responses[Math.floor(Math.random() * responses.length)];
  const assistantContent = randomResponse;
  db.run("INSERT INTO messages (thread_id, role, content) VALUES (?, ?, ?)", [
    thread_id,
    "assistant",
    assistantContent,
  ]);

  return NextResponse.json({ content: assistantContent });
}
