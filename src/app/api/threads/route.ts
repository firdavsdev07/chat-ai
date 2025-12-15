import { db } from "@/lib/db";
import { NextResponse } from "next/server";

export async function GET() {
  const threads = db.query("SELECT * FROM threads").all();
  return NextResponse.json(threads);
}

export async function POST(req: Request) {
  const { title } = await req.json();
  db.run("INSERT INTO threads (title) VALUES (?)", [title]);

  const row = db.query("SELECT last_insert_rowid() AS id").all()[0];
  return NextResponse.json({ id: row.id, title });
}
