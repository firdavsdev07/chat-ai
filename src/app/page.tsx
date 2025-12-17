"use client";

import { useState, useEffect, Suspense } from "react";
import dynamic from "next/dynamic";
import { useRouter, useSearchParams } from "next/navigation";
import Threads from "@/components/Threads";
import EmptyState from "@/components/EmptyState";
import { Thread } from "@/lib/types";

const ChatArea = dynamic(() => import("@/components/ChatArea"), {
  ssr: false,
  loading: () => (
    <div className="flex-1 flex items-center justify-center bg-white">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-slate-900" />
    </div>
  ),
});

function HomeContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [threads, setThreads] = useState<Thread[]>([]);
  const [threadId, setThreadId] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const chatParam = searchParams.get('chat');
    if (chatParam) {
      const id = parseInt(chatParam);
      if (!isNaN(id)) setThreadId(id);
    } else {
      setThreadId(null);
    }
  }, [searchParams]);

  useEffect(() => { loadThreads(); }, []);

  const updateActiveThread = (id: number | null) => {
    if (id) {
      router.push(`/?chat=${id}`);
      setThreadId(id);
    } else {
      router.push('/');
      setThreadId(null);
    }
  };

  const loadThreads = async () => {
    try {
      const res = await fetch("/api/threads");
      if (res.ok) setThreads(await res.json());
    } catch {} finally { setIsLoading(false); }
  };


  const handleRename = async (id: number, newTitle: string) => {
    setThreads(threads.map(t => t.id === id ? { ...t, title: newTitle } : t));
    try {
      await fetch("/api/threads", { method: "PUT", body: JSON.stringify({ id, title: newTitle }) });
    } catch { loadThreads(); }
  };

  const handleDelete = async (id: number) => {
    setThreads(threads.filter(t => t.id !== id));
    if (threadId === id) updateActiveThread(null);
    try {
      await fetch(`/api/threads?id=${id}`, { method: "DELETE" });
    } catch { loadThreads(); }
  };

  const handleNewChat = async () => {
    try {
      const res = await fetch("/api/threads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: "Yangi suhbat" })
      });
      if (res.ok) {
        const newThread = await res.json();
        setThreads([newThread, ...threads]);
        updateActiveThread(newThread.id);
      }
    } catch (error) {
      console.error("Failed to create thread:", error);
    }
  };


  return (
    <div className="flex h-screen bg-white text-slate-900 font-sans">
      <Threads 
        threads={threads} 
        activeId={threadId}
        onNew={handleNewChat}
        onSelect={updateActiveThread}
        onHome={() => updateActiveThread(null)}
        onRename={handleRename}
        onDelete={handleDelete}
        isLoading={isLoading} 
      />

      <div className="flex-1 flex flex-col relative overflow-hidden">
        {threadId ? (
          <ChatArea key={threadId} threadId={threadId} />
        ) : (
          <EmptyState />
        )}
      </div>
    </div>
  );
}

export default function Home() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center h-screen bg-white"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-slate-900"></div></div>}>
      <HomeContent />
    </Suspense>
  );
}
