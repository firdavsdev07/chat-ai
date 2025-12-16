/**
 * Home Page
 * Main layout for the chat application
 */
"use client";

import { useState, useEffect } from "react";
import dynamic from "next/dynamic";
import { MessageSquare } from "lucide-react";
import Threads from "@/components/Threads";
import EmptyState from "@/components/EmptyState";
import { Thread } from "@/lib/types";

const ChatArea = dynamic(() => import("@/components/ChatArea"), { 
  ssr: false,
  loading: () => (
    <div className="flex-1 flex items-center justify-center">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
    </div>
  )
});

export default function Home() {
  const [threads, setThreads] = useState<Thread[]>([]);
  const [threadId, setThreadId] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadThreads();
  }, []);

  const loadThreads = async () => {
    try {
      const res = await fetch("/api/threads");
      if (res.ok) {
        const data = await res.json();
        setThreads(data);
        // Optional: Auto-select latest thread
        // if (data.length > 0 && !threadId) setThreadId(data[0].id);
      }
    } catch (error) {
      console.error("Failed to load threads");
    } finally {
      setIsLoading(false);
    }
  };

  const createChat = async () => {
    try {
      const res = await fetch("/api/threads", {
        method: "POST",
        body: JSON.stringify({
          title: `Chat ${new Date().toLocaleTimeString('uz-UZ', { hour: '2-digit', minute: '2-digit' })}`,
        }),
      });
      
      if (res.ok) {
        const newThread = await res.json();
        setThreads([newThread, ...threads]);
        setThreadId(newThread.id);
      }
    } catch (error) {
      console.error("Failed to create chat");
    }
  };

  return (
    <div className="flex h-screen bg-white">
      <Threads
        threads={threads}
        activeId={threadId}
        onNew={createChat}
        onSelect={setThreadId}
      />

      <div className="flex-1 flex flex-col bg-slate-50 border-l border-slate-200">
        {isLoading ? (
          <div className="flex-1 flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        ) : threadId ? (
          <ChatArea key={threadId} threadId={threadId} />
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <EmptyState 
              icon={MessageSquare}
              title="Xush kelibsiz!"
              description="Suhbatni boshlash uchun chap tomondan yangi chat yarating yoki mavjudini tanlang."
            />
          </div>
        )}
      </div>
    </div>
  );
}
