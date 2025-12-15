"use client";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport, type UIMessage } from "ai";
import { useState, useEffect } from "react";
import Chat from "@/components/Chat";
import Input from "@/components/Input";
import { Message } from "@/lib/types";

interface ChatAreaProps {
  threadId: number;
}

export default function ChatArea({ threadId }: ChatAreaProps) {
  const [input, setInput] = useState("");
  
  const {
    messages,
    sendMessage,
    status,
    setMessages,
  } = useChat({
    transport: new DefaultChatTransport({
      api: `/api/chat?id=${threadId}`,
    }),
    id: threadId.toString(),
  });

  // Load messages when component mounts
  useEffect(() => {
    loadMessages();
  }, []);

  const loadMessages = async () => {
    const res = await fetch(`/api/chat?thread_id=${threadId}`);
    const data = await res.json();
    
    if (Array.isArray(data)) {
      const formattedMessages: UIMessage[] = data.map((msg: any) => ({
        id: msg.id.toString(),
        role: msg.role,
        parts: [{ type: "text", text: msg.content }],
      }));
      setMessages(formattedMessages);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (input.trim()) {
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
    <>
      <Chat messages={displayMessages} isLoading={status === "streaming"} />
      <Input
        input={input}
        onChange={(e) => setInput(e.target.value)}
        onSubmit={handleSubmit}
        disabled={status !== "ready"}
      />
    </>
  );
}
