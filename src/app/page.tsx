"use client";
import { useState, useEffect } from "react";
import Threads from "@/components/Threads";
import Chat from "@/components/Chat";
import Input from "@/components/Input";
import { Thread, Message } from "@/lib/types";

export default function Home() {
  const [threads, setThreads] = useState<Thread[]>([]);
  const [threadId, setThreadId] = useState<number | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    loadThreads();
  }, []);

  useEffect(() => {
    if (threadId) {
      loadMessages(threadId);
    } else {
      setMessages([]);
    }
  }, [threadId]);

  const loadThreads = async () => {
    const res = await fetch("/api/threads");
    const data = await res.json();
    setThreads(data);
  };

  const loadMessages = async (id: number) => {
    const res = await fetch(`/api/chat?thread_id=${id}`);
    const data = await res.json();
    setMessages(data);
  };

  const createChat = async () => {
    const res = await fetch("/api/threads", {
      method: "POST",
      body: JSON.stringify({
        title: `Chat ${new Date().toLocaleTimeString('uz-UZ', { hour: '2-digit', minute: '2-digit' })}`,
      }),
    });
    const newThread = await res.json();
    setThreads([newThread, ...threads]);
    setThreadId(newThread.id);
  };

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!threadId || !input.trim()) return;

    const userMsg: Message = {
      id: Date.now().toString(),
      role: "user",
      content: input,
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setIsLoading(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [...messages, userMsg],
          threadId,
        }),
      });

      if (!res.ok || !res.body) throw new Error("Stream xatosi");

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let aiText = "";

      // Temporary AI message
      const aiMsgId = (Date.now() + 1).toString();
      setMessages((prev) => [...prev, { id: aiMsgId, role: "assistant", content: "" }]);

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);
        const lines = chunk.split("\n").filter((line) => line.trim());

        for (const line of lines) {
          if (line.startsWith("0:")) {
            try {
              const json = JSON.parse(line.slice(2).trim());
              if (json.textDelta) {
                aiText += json.textDelta;
                setMessages((prev) =>
                  prev.map((m) =>
                    m.id === aiMsgId ? { ...m, content: aiText } : m
                  )
                );
              }
            } catch (e) {
              // Ignore parse errors
            }
          }
        }
      }
    } catch (error) {
      console.error("Xato:", error);
    } finally {
      setIsLoading(false);
      // Reload messages from DB
      if (threadId) await loadMessages(threadId);
    }
  };

  return (
    <div className="flex h-screen bg-gray-50">
      <Threads
        threads={threads}
        activeId={threadId}
        onNew={createChat}
        onSelect={setThreadId}
      />

      <div className="flex-1 flex flex-col">
        {threadId ? (
          <>
            <Chat messages={messages} isLoading={isLoading} />
            <Input
              input={input}
              onChange={(e) => setInput(e.target.value)}
              onSubmit={sendMessage}
              disabled={isLoading}
            />
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-gray-400">
            <div className="text-center">
              <p className="text-2xl mb-2">💬</p>
              <p className="text-lg">Chat tanlang yoki yangi chat yarating</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
