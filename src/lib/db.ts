// @ts-ignore - Типы Bun runtime недоступны во время сборки
import { Database } from "bun:sqlite";
import { mkdirSync } from "fs";

// Создаёт папку data (если не существует)
try {
  mkdirSync("data", { recursive: true });
} catch (error) {
  // Если папка существует, игнорируем ошибку
}

// Создаёт файл SQLite (если не существует)
export const db = new Database("data/chat.sqlite");

// Таблица бесед
db.run(`
  CREATE TABLE IF NOT EXISTS threads (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL
  )
`);

// Таблица сообщений
db.run(`
  CREATE TABLE IF NOT EXISTS messages (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    thread_id INTEGER NOT NULL,
    role TEXT NOT NULL,
    content TEXT NOT NULL,
    tool_invocations TEXT
  )
`);
