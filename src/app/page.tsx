"use client";
import { useState, useEffect } from "react";

export default function Home() {
  const [threads, setThreads] = useState<any[]>([]);
  const [threadId, setThreadId] = useState<number | null>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [input, setInput] = useState("");

  useEffect(() => {
    fetch("/api/threads")
      .then((r) => r.json())
      .then(setThreads);
  }, []);

  const sendMessage = async () => {
    if (!threadId || !input) return;
    const res = await fetch("/api/chat", {
      method: "POST",
      body: JSON.stringify({ thread_id: threadId, content: input }),
    });
    const data = await res.json();
    setMessages([
      ...messages,
      { role: "user", content: input },
      { role: "assistant", content: data.content },
    ]);
    setInput("");
  };

  return (
    <div className="flex h-screen">
      <div className="w-1/4 border-r p-2">
        <h2 className="font-bold">Threads</h2>
        {threads.map((t) => (
          <div
            key={t.id}
            className={`p-1 cursor-pointer ${threadId === t.id ? "bg-gray-200" : ""}`}
            onClick={() => setThreadId(t.id)}
          >
            {t.title}
          </div>
        ))}
      </div>
      <div className="flex-1 p-2 flex flex-col">
        <div className="flex-1 overflow-y-auto">
          {messages.map((m, i) => (
            <div key={i}>
              <b>{m.role}:</b> {m.content}
            </div>
          ))}
        </div>
        <div className="mt-2 flex">
          <input
            className="border p-1 flex-1"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Xabar yozing..."
          />
          <button className="ml-2 border p-1" onClick={sendMessage}>
            Send
          </button>
        </div>
      </div>
    </div>
  );
}
