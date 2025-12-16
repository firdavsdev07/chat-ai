"use client";

import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport, lastAssistantMessageIsCompleteWithToolCalls } from "ai";
import { useState, useEffect, useCallback, useRef } from "react";
import { Check, X, Loader2, Table, User, Sparkles } from "lucide-react";
import MentionInput from "@/components/MentionInput";
import ConfirmDialog from "@/components/tools/ConfirmDialog";
import TypingIndicator from "@/components/TypingIndicator";
import ErrorMessage from "@/components/ErrorMessage";
import EmptyState from "@/components/EmptyState";
import TableModal from "@/components/TableModal";
import type { Mention } from "@/lib/mentionParser";

interface SheetData { name: string; data: (string | number | boolean | null)[][] }
interface ChatError { type: "timeout" | "network" | "server" | "unknown"; message: string; lastUserMessage?: string }

const AI_TIMEOUT_MS = 15000;

export default function ChatArea({ threadId }: { threadId: number }) {
  const [input, setInput] = useState("");
  const [sheets, setSheets] = useState<SheetData[]>([]);
  const [error, setError] = useState<ChatError | null>(null);
  const [isWaiting, setIsWaiting] = useState(false);
  const [tablePreview, setTablePreview] = useState<{ isOpen: boolean; sheet: string; data: any[][] } | null>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastMsgRef = useRef("");
  const endRef = useRef<HTMLDivElement>(null);

  const { messages, sendMessage, status, setMessages, addToolOutput, reload, stop } = useChat({
    transport: new DefaultChatTransport({ api: `/api/chat?id=${threadId}` }),
    id: threadId.toString(),
    // DO NOT auto-send for confirmAction - wait for user button click
    sendAutomaticallyWhen: (message: any) => {
      // Check if last assistant message has confirmAction tool call waiting for result
      const lastMsg = message;
      if (lastMsg?.role === 'assistant' && lastMsg?.parts) {
        for (const part of lastMsg.parts) {
          if (part.type === 'tool-invocation' || part.type === 'tool-call') {
            const toolInv = part.toolInvocation || part;
            if (toolInv.toolName === 'confirmAction' && (!toolInv.state || toolInv.state === 'call')) {
              return false; // Don't auto-send, wait for user confirmation
            }
          }
        }
      }
      return lastAssistantMessageIsCompleteWithToolCalls(message);
    },
    onError: () => {
      clearTimeout(timeoutRef.current!);
      setIsWaiting(false);
      setError({ type: "server", message: "AI xizmati bilan bog'lanishda xatolik.", lastUserMessage: lastMsgRef.current });
    },
  }) as any;

  const loadMessages = async () => {
    try {
      const res = await fetch(`/api/chat?thread_id=${threadId}`);
      const data = await res.json();
      if (Array.isArray(data)) {
        setMessages(data.map((m: any) => ({ id: m.id.toString(), role: m.role, parts: [{ type: "text", text: m.content }] })));
      }
    } catch { setError({ type: "network", message: "Xabarlarni yuklashda xatolik." }); }
  };

  useEffect(() => {
    // Reset messages first when thread changes
    setMessages([]);
    setError(null);
    loadMessages(); 
    loadSheets(); 
  }, [threadId]); // eslint-disable-line

  useEffect(() => {
    const pendingMsg = sessionStorage.getItem(`pendingMessage_${threadId}`);
    if (pendingMsg && status === "ready") {
      sessionStorage.removeItem(`pendingMessage_${threadId}`);
      // Send immediately without delay
      setTimeout(() => {
        sendMessage({ text: pendingMsg });
      }, 100);
    }
  }, [threadId, status, sendMessage]);

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages, status]);
  useEffect(() => { if (messages.length > 0 && status === "ready") setError(null); }, [messages, status]);
  useEffect(() => { if (status === "streaming") { clearTimeout(timeoutRef.current!); setIsWaiting(false); } }, [status]);
  useEffect(() => () => { if (timeoutRef.current) clearTimeout(timeoutRef.current); }, []);

  const loadSheets = async () => {
    try {
      const res = await fetch("/api/excel/sheets");
      if (res.ok) setSheets((await res.json()).sheets || []);
    } catch {}
  };

  const handleSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || status !== "ready") return;
    const text = input.trim();
    lastMsgRef.current = text;
    setError(null);
    setIsWaiting(true);
    timeoutRef.current = setTimeout(() => {
      setIsWaiting(false);
      stop();
      setError({ type: "timeout", message: "AI javob bermadi. Qayta urinib ko'ring.", lastUserMessage: text });
    }, AI_TIMEOUT_MS);
    sendMessage({ text });
    setInput("");
  }, [input, status, sendMessage, stop]);

  const handleRetry = useCallback(() => {
    if (error?.lastUserMessage) {
      setError(null);
      setIsWaiting(true);
      lastMsgRef.current = error.lastUserMessage;
      timeoutRef.current = setTimeout(() => {
        setIsWaiting(false);
        stop();
        setError({ type: "timeout", message: "AI javob bermadi.", lastUserMessage: lastMsgRef.current });
      }, AI_TIMEOUT_MS);
      sendMessage({ text: error.lastUserMessage });
    } else reload();
  }, [error, sendMessage, reload, stop]);

  // isLoading should be true when:
  // 1. AI is streaming
  // 2. Waiting for response (timeout)
  // 3. Waiting for tool confirmation/result (status === "awaiting_message")
  const isLoading = status === "streaming" || status === "awaiting_message" || isWaiting;
  
  // Check if AI is actively writing (not just waiting for tool result)
  const isActuallyStreaming = status === "streaming" && messages.length > 0 && messages[messages.length - 1]?.role === "assistant";
  
  // Debug: Log status changes
  useEffect(() => {
    console.log("🔄 ChatArea status:", status, "isWaiting:", isWaiting, "isLoading:", isLoading);
  }, [status, isWaiting, isLoading]);

  const renderToolPart = (part: any, toolName: string, toolArgs: any) => {
    const callId = toolArgs.toolCallId;
    const args = toolArgs.args || toolArgs.input;
    const result = toolArgs.result || toolArgs.output;

    // Excel read tools loading states
    const excelReadTools = ["getRange", "getCell", "getSheetData", "listSheets", "getCellFormula", "explainFormula"];
    if (excelReadTools.includes(toolName)) {
      if (toolArgs.state === "partial-call" || toolArgs.state === "input-streaming" || toolArgs.state === "call") {
        return (
          <div key={callId} className="mt-2 px-3 py-2 bg-purple-50 border border-purple-100 rounded-lg flex items-center gap-2">
            <Loader2 className="w-3.5 h-3.5 animate-spin text-purple-500" />
            <span className="text-sm font-medium text-purple-700">Excel ma&apos;lumotlari o&apos;qilmoqda...</span>
          </div>
        );
      }
    }

    if (toolName === "confirmAction") {
      if (toolArgs.state === "partial-call" || toolArgs.state === "input-streaming") {
        return (
          <div key={callId} className="mt-2 px-3 py-2 bg-blue-50 border border-blue-100 rounded-lg flex items-center gap-2">
            <Loader2 className="w-3.5 h-3.5 animate-spin text-blue-500" />
            <span className="text-sm font-medium text-blue-700">Tasdiqlash so'rovi tayyorlanmoqda...</span>
          </div>
        );
      }
      if (toolArgs.state === "call" || toolArgs.state === "input-available") {
        return <ConfirmDialog key={callId} toolCallId={callId} args={args} addToolResult={(r) => addToolOutput({ tool: "confirmAction", toolCallId: callId, output: r.result })} />;
      }
      if (toolArgs.state === "result" || toolArgs.state === "output-available") {
        const res = typeof result === "string" ? JSON.parse(result) : result;
        const ok = res?.status === "confirmed";
        return (
          <div key={callId} className={`mt-2 px-3 py-2 rounded-lg text-sm flex items-center gap-2 border font-medium ${ok ? "bg-emerald-50 text-emerald-700 border-emerald-100" : "bg-red-50 text-red-700 border-red-100"}`}>
            {ok ? <Check className="w-4 h-4" /> : <X className="w-4 h-4" />}
            {ok ? "Tasdiqlandi" : "Bekor qilindi"}
          </div>
        );
      }
    }

    if (toolName === "executeConfirmedAction") {
      if (toolArgs.state === "result" || toolArgs.state === "output-available") {
        const ok = result?.success;
        return (
          <div key={callId} className={`mt-2 px-3 py-2 rounded-lg text-sm flex items-center gap-2 border font-medium ${ok ? "bg-emerald-50 text-emerald-700 border-emerald-100" : "bg-red-50 text-red-700 border-red-100"}`}>
            {ok ? <Check className="w-4 h-4" /> : <X className="w-4 h-4" />}
            {result?.message || "Amal bajarildi"}
          </div>
        );
      }
      return (
        <div key={callId} className="mt-2 px-3 py-2 bg-amber-50 border border-amber-100 rounded-lg flex items-center gap-2">
          <Loader2 className="w-3.5 h-3.5 animate-spin text-amber-500" />
          <span className="text-sm font-medium text-amber-700">Amal bajarilmoqda...</span>
        </div>
      );
    }

    if (toolName === "showTable" && (toolArgs.state === "call" || toolArgs.state === "result" || toolArgs.state === "input-available" || toolArgs.state === "output-available") && args) {
      return (
        <div key={callId} className="mt-2">
          <button onClick={() => setTablePreview({ isOpen: true, sheet: args.sheet, data: args.data })} className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-emerald-200 rounded-xl text-emerald-700 hover:bg-emerald-50 transition-colors shadow-sm font-medium">
            <Table className="w-4.5 h-4.5" />
            <span className="font-medium">Jadvalni ko&apos;rish: {args.sheet}</span>
          </button>
        </div>
      );
    }

    return null;
  };

  return (
    <>
      <div className="flex-1 overflow-y-auto px-4 py-6 md:px-8 space-y-6 bg-white">
        {!messages.length && !error ? (
          <div className="mt-20"><EmptyState variant="chat" description="Birinchi xabaringizni yozing yoki jadvaldan ma'lumot so'rang" /></div>
        ) : (
          <>
            {messages.map((m: any) => (
              <div key={m.id} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"} group`}>
                <div className={`flex flex-col max-w-3xl ${m.role === "user" ? "items-end" : "items-start"}`}>
                  <div className={`flex items-center gap-2 mb-1.5 px-1 ${m.role === "user" ? "flex-row-reverse" : "flex-row"}`}>
                    <div className={`w-6 h-6 rounded-full flex items-center justify-center border shadow-sm ${m.role === "user" ? "bg-slate-100 border-slate-200" : "bg-white border-slate-200"}`}>
                      {m.role === "user" ? <User className="w-3.5 h-3.5 text-slate-600" /> : <Sparkles className="w-3.5 h-3.5 text-slate-900" />}
                    </div>
                    <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">{m.role === "user" ? "Siz" : "AI Xodim"}</span>
                  </div>
                  <div className={`px-5 py-3.5 rounded-2xl shadow-sm text-[15px] leading-relaxed ${
                    m.role === "user" 
                      ? "bg-slate-50 text-slate-900 border border-slate-200 rounded-tr-none" 
                      : "bg-white text-slate-800 border border-transparent group-hover:border-slate-100 rounded-tl-none -ml-2"
                  }`}>
                    {m.parts.map((p: any, i: number) => {
                      if (p.type === "text") return <div key={i} className="whitespace-pre-wrap">{p.text}</div>;
                      const toolName = p.type === "tool-invocation" ? p.toolInvocation.toolName : p.type.startsWith("tool-") ? p.type.replace("tool-", "") : null;
                      const toolArgs = p.type === "tool-invocation" ? p.toolInvocation : p;
                      return toolName ? renderToolPart(p, toolName, toolArgs) : null;
                    })}
                  </div>
                </div>
              </div>
            ))}
            {error && <ErrorMessage message={error.message} onRetry={handleRetry} onDismiss={() => setError(null)} showRetry={!!error.lastUserMessage} />}
            {isLoading && !error && <TypingIndicator />}
          </>
        )}
        <div ref={endRef} className="h-4" />
      </div>

      {tablePreview && <TableModal isOpen={tablePreview.isOpen} sheet={tablePreview.sheet} data={tablePreview.data} onClose={() => setTablePreview(null)} />}

      <MentionInput 
        value={input} 
        onChange={setInput} 
        onSubmit={handleSubmit} 
        disabled={isLoading} 
        sheets={sheets} 
        onMentionsChange={useCallback((_: Mention[]) => {}, [])} 
        isStreaming={isLoading}
        onStop={stop}
      />
    </>
  );
}
