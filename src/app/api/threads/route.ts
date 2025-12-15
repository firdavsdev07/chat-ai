import { db } from "@/lib/db";
import { NextResponse } from "next/server";

// GET → barcha tредlar
export async function GET() {
  // Bun va better-sqlite3 uchun mos API
  const threads = typeof Bun !== "undefined" 
    ? db.query("SELECT * FROM threads").all()
    : db.prepare("SELECT * FROM threads").all();
  return NextResponse.json(threads);
}

// POST → yangi tред yaratish
export async function POST(req: Request) {
  const { title } = await req.json();
  // Bun va better-sqlite3 uchun mos API
  const result = typeof Bun !== "undefined"
    ? db.run("INSERT INTO threads (title) VALUES (?)", [title])
    : db.prepare("INSERT INTO threads (title) VALUES (?)").run(title);
  return NextResponse.json({ id: result.lastInsertRowid, title });
}
