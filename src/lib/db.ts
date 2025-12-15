// @ts-ignore - Bun runtime type'lari build paytida mavjud emas
import { Database } from "bun:sqlite";
import { mkdirSync } from "fs";

// data folder'ini yaratadi (agar yo'q bo'lsa)
try {
  mkdirSync("data", { recursive: true });
} catch (error) {
  // Folder mavjud bo'lsa, xatolikni e'tiborsiz qoldiradi
}

// SQLite faylini yaratadi (agar yo'q bo'lsa)
export const db = new Database("data/chat.sqlite");

// Threads jadvali
db.run(`
  CREATE TABLE IF NOT EXISTS threads (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL
  )
`);

// Messages jadvali
db.run(`
  CREATE TABLE IF NOT EXISTS messages (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    thread_id INTEGER NOT NULL,
    role TEXT NOT NULL,
    content TEXT NOT NULL
  )
`);
