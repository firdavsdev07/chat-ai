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
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetch("/api/threads")
      .then((res) => res.json())
      .then(setThreads);
  }, []);

  useEffect(() => {
    if (threadId) {
      fetch(`/api/chat?thread_id=${threadId}`)
        .then((res) => res.json())
        .then(setMessages);
    } else {
      setMessages([]);
    }
  }, [threadId]);

  const createChat = async () => {
    setLoading(true);
    const res = await fetch("/api/threads", {
      method: "POST",
      body: JSON.stringify({ 
        title: `Yangi chat ${new Date().toLocaleTimeString('uz-UZ', { hour: '2-digit', minute: '2-digit' })}` 
      }),
    });
    const newThread = await res.json();
    setThreads([newThread, ...threads]);
    setThreadId(newThread.id);
    setLoading(false);
  };

  const sendMessage = async () => {
    if (!threadId || !input.trim()) return;
    
    const userMsg: Message = {
      id: Date.now(),
      thread_id: threadId,
      role: 'user',
      content: input,
      created_at: new Date().toISOString(),
    };
    
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setLoading(true);

    await fetch("/api/chat", {
      method: "POST",
      body: JSON.stringify({ thread_id: threadId, content: userMsg.content }),
    });
    
    const res = await fetch(`/api/chat?thread_id=${threadId}`);
    const data = await res.json();
    setMessages(data);
    setLoading(false);
  };

  return (
    <div className="flex h-screen bg-gray-50">
      <Threads
        threads={threads}
        threadId={threadId}
        loading={loading}
        onNew={createChat}
        onSelect={setThreadId}
      />

      <div className="flex-1 flex flex-col">
        {threadId ? (
          <>
            <Chat messages={messages} loading={loading} />
            <Input
              value={input}
              onChange={setInput}
              onSend={sendMessage}
              disabled={loading}
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
