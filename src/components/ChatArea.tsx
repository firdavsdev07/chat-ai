"use client";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport, lastAssistantMessageIsCompleteWithToolCalls } from "ai";
import { useState, useEffect } from "react";
import Input from "@/components/Input";
import ConfirmDialog from "@/components/tools/ConfirmDialog";

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
    addToolOutput,
  } = useChat({
    transport: new DefaultChatTransport({
      api: `/api/chat?id=${threadId}`,
    }),
    id: threadId.toString(),
    sendAutomaticallyWhen: lastAssistantMessageIsCompleteWithToolCalls,
  });

  // Load messages when component mounts
  useEffect(() => {
    loadMessages();
  }, []);

  const loadMessages = async () => {
    const res = await fetch(`/api/chat?thread_id=${threadId}`);
    const data = await res.json();
    
    if (Array.isArray(data)) {
      const formattedMessages = data.map((msg: any) => ({
        id: msg.id.toString(),
        role: msg.role as "user" | "assistant",
        parts: [{ type: "text" as const, text: msg.content }],
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

  return (
    <>
      {/* Chat Messages */}
      <div className="flex-1 overflow-y-auto p-6 space-y-4">
        {messages.length === 0 ? (
          <div className="text-center text-gray-400 mt-20">
            <p className="text-4xl mb-4">💬</p>
            <p className="text-lg font-medium">Xabar yo'q</p>
            <p className="text-sm mt-2">Birinchi xabaringizni yozing</p>
            <div className="mt-6 text-xs text-gray-300">
              <p>💡 Misol: "Bu thread ni o'chir"</p>
              <p>"Thread nomini o'zgartir"</p>
              <p>"Xabarlarni tozala"</p>
            </div>
          </div>
        ) : (
          messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`max-w-xl px-4 py-3 rounded-2xl ${
                  message.role === "user"
                    ? "bg-blue-600 text-white"
                    : "bg-gray-100 text-gray-900 border border-gray-200"
                }`}
              >
                {/* Render message parts */}
                {message.parts.map((part, partIndex) => {
                  // Text parts
                  if (part.type === "text") {
                    return (
                      <div key={partIndex} className="text-base whitespace-pre-wrap">
                        {part.text}
                      </div>
                    );
                  }

                  // Tool parts - confirmAction
                  if (part.type === "tool-confirmAction") {
                    const toolPart = part as any;
                    const callId = toolPart.toolCallId;

                    switch (toolPart.state) {
                      case "input-streaming":
                        return (
                          <div key={callId} className="text-sm text-gray-500 animate-pulse">
                            Tasdiqlash so'rovi tayyorlanmoqda...
                          </div>
                        );
                      case "input-available":
                        return (
                          <ConfirmDialog
                            key={callId}
                            toolCallId={callId}
                            args={toolPart.input}
                            addToolResult={(result) => {
                              addToolOutput({
                                tool: "confirmAction",
                                toolCallId: callId,
                                output: result.result,
                              });
                            }}
                          />
                        );
                      case "output-available":
                        const outputResult = typeof toolPart.output === "string"
                          ? JSON.parse(toolPart.output)
                          : toolPart.output;
                        return (
                          <div
                            key={callId}
                            className={`mt-2 px-3 py-2 rounded-lg text-sm ${
                              outputResult?.status === "confirmed"
                                ? "bg-green-50 text-green-700 border border-green-200"
                                : "bg-red-50 text-red-700 border border-red-200"
                            }`}
                          >
                            {outputResult?.status === "confirmed"
                              ? "✅ Tasdiqlandi"
                              : "❌ Bekor qilindi"}
                          </div>
                        );
                      case "output-error":
                        return (
                          <div key={callId} className="text-red-500 text-sm">
                            Xatolik: {toolPart.errorText}
                          </div>
                        );
                    }
                  }

                  // Tool parts - executeConfirmedAction
                  if (part.type === "tool-executeConfirmedAction") {
                    const toolPart = part as any;
                    const callId = toolPart.toolCallId;

                    switch (toolPart.state) {
                      case "input-streaming":
                      case "input-available":
                        return (
                          <div
                            key={callId}
                            className="mt-2 px-3 py-2 bg-gray-50 rounded-lg text-sm text-gray-500 flex items-center gap-2"
                          >
                            <div className="animate-spin h-4 w-4 border-2 border-gray-300 border-t-gray-600 rounded-full"></div>
                            Amal bajarilmoqda...
                          </div>
                        );
                      case "output-available":
                        const result = toolPart.output;
                        return (
                          <div
                            key={callId}
                            className={`mt-2 px-3 py-2 rounded-lg text-sm ${
                              result?.success
                                ? "bg-green-50 text-green-700 border border-green-200"
                                : "bg-red-50 text-red-700 border border-red-200"
                            }`}
                          >
                            {result?.success ? "✅" : "❌"} {result?.message || "Amal bajarildi"}
                          </div>
                        );
                      case "output-error":
                        return (
                          <div key={callId} className="text-red-500 text-sm">
                            Xatolik: {toolPart.errorText}
                          </div>
                        );
                    }
                  }

                  return null;
                })}
              </div>
            </div>
          ))
        )}

        {/* Loading indicator */}
        {status === "streaming" && (
          <div className="flex justify-start">
            <div className="bg-white text-gray-800 border border-gray-200 px-4 py-3 rounded-2xl">
              <div className="flex gap-1">
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "0.1s" }}></div>
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "0.2s" }}></div>
              </div>
            </div>
          </div>
        )}
      </div>

      <Input
        input={input}
        onChange={(e) => setInput(e.target.value)}
        onSubmit={handleSubmit}
        disabled={status !== "ready"}
      />
    </>
  );
}
