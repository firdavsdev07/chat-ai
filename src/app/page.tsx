"use client";
import { useState, useEffect } from "react";
import dynamic from "next/dynamic";
import Threads from "@/components/Threads";
import { Thread } from "@/lib/types";

const ChatArea = dynamic(() => import("@/components/ChatArea"), { ssr: false });

export default function Home() {
  const [threads, setThreads] = useState<Thread[]>([]);
  const [threadId, setThreadId] = useState<number | null>(null);

  useEffect(() => {
    loadThreads();
  }, []);

  const loadThreads = async () => {
    const res = await fetch("/api/threads");
    const data = await res.json();
    setThreads(data);
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
          <ChatArea key={threadId} threadId={threadId} />
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
