"use client";

import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport, lastAssistantMessageIsCompleteWithToolCalls } from "ai";
import { useState, useEffect, useCallback, useRef } from "react";
import { Check, X, Loader2, Table } from "lucide-react";
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
    sendAutomaticallyWhen: lastAssistantMessageIsCompleteWithToolCalls,
    onError: () => {
      clearTimeout(timeoutRef.current!);
      setIsWaiting(false);
      setError({ type: "server", message: "AI xizmati bilan bog'lanishda xatolik.", lastUserMessage: lastMsgRef.current });
    },
  }) as any;

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages, status]);
  useEffect(() => { if (messages.length > 0 && status === "ready") setError(null); }, [messages, status]);
  useEffect(() => { if (status === "streaming") { clearTimeout(timeoutRef.current!); setIsWaiting(false); } }, [status]);
  useEffect(() => { loadMessages(); loadSheets(); }, []); // eslint-disable-line
  useEffect(() => () => { if (timeoutRef.current) clearTimeout(timeoutRef.current); }, []);

  const loadMessages = async () => {
    try {
      const res = await fetch(`/api/chat?thread_id=${threadId}`);
      const data = await res.json();
      if (Array.isArray(data)) {
        setMessages(data.map((m: any) => ({ id: m.id.toString(), role: m.role, parts: [{ type: "text", text: m.content }] })));
      }
    } catch { setError({ type: "network", message: "Xabarlarni yuklashda xatolik." }); }
  };

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

  const isLoading = status === "streaming" || isWaiting;

  const renderToolPart = (part: any, toolName: string, toolArgs: any) => {
    const callId = toolArgs.toolCallId;
    const args = toolArgs.args || toolArgs.input;
    const result = toolArgs.result || toolArgs.output;

    if (toolName === "confirmAction") {
      if (toolArgs.state === "partial-call" || toolArgs.state === "input-streaming") {
        return <div key={callId} className="flex items-center gap-2 text-sm text-slate-500"><Loader2 className="w-4 h-4 animate-spin" />Tayyorlanmoqda...</div>;
      }
      if (toolArgs.state === "call" || toolArgs.state === "input-available") {
        return <ConfirmDialog key={callId} toolCallId={callId} args={args} addToolResult={(r) => addToolOutput({ tool: "confirmAction", toolCallId: callId, output: r.result })} />;
      }
      if (toolArgs.state === "result" || toolArgs.state === "output-available") {
        const res = typeof result === "string" ? JSON.parse(result) : result;
        const ok = res?.status === "confirmed";
        return (
          <div key={callId} className={`mt-2 px-3 py-2 rounded-lg text-sm flex items-center gap-2 ${ok ? "bg-emerald-50 text-emerald-700 border border-emerald-200" : "bg-red-50 text-red-700 border border-red-200"}`}>
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
          <div key={callId} className={`mt-2 px-3 py-2 rounded-lg text-sm flex items-center gap-2 ${ok ? "bg-emerald-50 text-emerald-700 border border-emerald-200" : "bg-red-50 text-red-700 border border-red-200"}`}>
            {ok ? <Check className="w-4 h-4" /> : <X className="w-4 h-4" />}
            {result?.message || "Amal bajarildi"}
          </div>
        );
      }
      return <div key={callId} className="mt-2 px-3 py-2 bg-slate-50 rounded-lg text-sm text-slate-500 flex items-center gap-2"><Loader2 className="w-4 h-4 animate-spin" />Bajarilmoqda...</div>;
    }

    if (toolName === "showTable" && (toolArgs.state === "call" || toolArgs.state === "result" || toolArgs.state === "input-available" || toolArgs.state === "output-available") && args) {
      return (
        <div key={callId} className="mt-2">
          <button onClick={() => setTablePreview({ isOpen: true, sheet: args.sheet, data: args.data })} className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-emerald-200 rounded-xl text-emerald-700 hover:bg-emerald-50 transition-colors shadow-sm">
            <Table className="w-5 h-5" />
            <span className="font-medium">Jadvalni ko&apos;rish: {args.sheet}</span>
          </button>
        </div>
      );
    }

    return null;
  };

  return (
    <>
      <div className="flex-1 overflow-y-auto p-6 space-y-4">
        {!messages.length && !error ? (
          <div className="mt-20"><EmptyState variant="chat" description="Birinchi xabaringizni yozing yoki jadvaldan ma'lumot so'rang" /></div>
        ) : (
          <>
            {messages.map((m: any) => (
              <div key={m.id} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
                <div className={`max-w-2xl px-4 py-3 rounded-2xl shadow-sm ${m.role === "user" ? "bg-gradient-to-br from-blue-600 to-blue-700 text-white" : "bg-white text-slate-800 border border-slate-200"}`}>
                  {m.parts.map((p: any, i: number) => {
                    if (p.type === "text") return <div key={i} className="text-[15px] leading-relaxed whitespace-pre-wrap">{p.text}</div>;
                    const toolName = p.type === "tool-invocation" ? p.toolInvocation.toolName : p.type.startsWith("tool-") ? p.type.replace("tool-", "") : null;
                    const toolArgs = p.type === "tool-invocation" ? p.toolInvocation : p;
                    return toolName ? renderToolPart(p, toolName, toolArgs) : null;
                  })}
                </div>
              </div>
            ))}
            {error && <ErrorMessage message={error.message} onRetry={handleRetry} onDismiss={() => setError(null)} showRetry={!!error.lastUserMessage} />}
            {isWaiting && !error && <TypingIndicator />}
            {status === "streaming" && (
              <div className="flex justify-start">
                <div className="flex items-center gap-2 px-3 py-2 text-sm text-slate-500"><Loader2 className="w-4 h-4 animate-spin" />Javob yozilmoqda...</div>
              </div>
            )}
          </>
        )}
        <div ref={endRef} />
      </div>

      {tablePreview && <TableModal isOpen={tablePreview.isOpen} sheet={tablePreview.sheet} data={tablePreview.data} onClose={() => setTablePreview(null)} />}

      <MentionInput value={input} onChange={setInput} onSubmit={handleSubmit} disabled={isLoading} sheets={sheets} onMentionsChange={useCallback((_: Mention[]) => {}, [])} />
    </>
  );
}
