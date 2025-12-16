import { db } from "@/lib/db";
import { NextResponse } from "next/server";

export async function GET() {
  const threads = db.query("SELECT * FROM threads ORDER BY id DESC").all();
  return NextResponse.json(threads);
}

export async function POST(req: Request) {
  const { title } = await req.json();
  db.run("INSERT INTO threads (title) VALUES (?)", [title]);

  const row = db.query("SELECT last_insert_rowid() AS id").all()[0] as any;
  return NextResponse.json({ id: row.id, title });
}

export async function PUT(req: Request) {
  try {
    const { id, title } = await req.json();
    
    if (!id || !title) {
      return NextResponse.json({ error: "id va title kerak" }, { status: 400 });
    }
    
    db.run("UPDATE threads SET title = ? WHERE id = ?", [title, id]);
    return NextResponse.json({ id, title, success: true });
  } catch (error) {
    return NextResponse.json({ error: "Thread yangilashda xatolik" }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    
    if (!id) {
      return NextResponse.json({ error: "id kerak" }, { status: 400 });
    }
    
    // Avval threadga tegishli xabarlarni o'chirish
    db.run("DELETE FROM messages WHERE thread_id = ?", [id]);
    // Keyin threadni o'chirish
    db.run("DELETE FROM threads WHERE id = ?", [id]);
    
    return NextResponse.json({ id: parseInt(id), success: true });
  } catch (error) {
    return NextResponse.json({ error: "Thread o'chirishda xatolik" }, { status: 500 });
  }
}
