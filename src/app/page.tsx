"use client";
import { useState, useEffect } from "react";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport, type UIMessage } from "ai";
import Threads from "@/components/Threads";
import Chat from "@/components/Chat";
import Input from "@/components/Input";
import { Thread, Message } from "@/lib/types";

export default function Home() {
  const [threads, setThreads] = useState<Thread[]>([]);
  const [threadId, setThreadId] = useState<number | null>(null);
  const [input, setInput] = useState("");

  // useChat hook - replaces all manual streaming logic
  const {
    messages,
    sendMessage,
    status,
    setMessages,
  } = useChat({
    transport: new DefaultChatTransport({
      api: "/api/chat",
    }),
    id: threadId?.toString(),
  });

  useEffect(() => {
    loadThreads();
  }, []);

  // Load messages when thread changes
  useEffect(() => {
    if (threadId) {
      loadMessages(threadId);
    } else {
      setMessages([]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [threadId]);

  const loadThreads = async () => {
    const res = await fetch("/api/threads");
    const data = await res.json();
    setThreads(data);
  };

  const loadMessages = async (id: number) => {
    const res = await fetch(`/api/chat?thread_id=${id}`);
    const data = await res.json();
    
    // Convert DB messages to UIMessage format
    const formattedMessages: UIMessage[] = data.map((msg: any) => ({
      id: msg.id.toString(),
      role: msg.role,
      parts: [{ type: "text", text: msg.content }],
    }));
    
    // Set initial messages for this thread
    setMessages(formattedMessages);
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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (input.trim() && threadId) {
      sendMessage({ text: input });
      setInput("");
    }
  };

  // Convert UIMessages to our Message format for display
  const displayMessages: Message[] = messages.map((msg) => ({
    id: msg.id,
    role: msg.role as "user" | "assistant",
    content: msg.parts
      .filter((part) => part.type === "text")
      .map((part) => "text" in part ? part.text : "")
      .join(""),
  }));

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
            <Chat messages={displayMessages} isLoading={status === "streaming"} />
            <Input
              input={input}
              onChange={(e) => setInput(e.target.value)}
              onSubmit={handleSubmit}
              disabled={status !== "ready"}
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
