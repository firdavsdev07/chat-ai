"use client";

import { useState, useEffect, useRef, Suspense } from "react";
import dynamic from "next/dynamic";
import { useRouter, useSearchParams } from "next/navigation";
import { Send, Sparkles, Table, Database, BarChart3, Search } from "lucide-react";
import Threads from "@/components/Threads";
import { Thread } from "@/lib/types";

const ChatArea = dynamic(() => import("@/components/ChatArea"), {
  ssr: false,
  loading: () => (
    <div className="flex-1 flex items-center justify-center bg-white">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-slate-900" />
    </div>
  ),
});

const suggestions = [
  { icon: Table, text: "Excel tahlil", desc: "Jadvallar bilan ishlash" },
  { icon: BarChart3, text: "Hisobot", desc: "Grafik va diagrammalar" },
  { icon: Search, text: "Qidiruv", desc: "Ma'lumotlarni izlash" },
  { icon: Database, text: "CRM", desc: "Mijozlar bazasi" },
];

function HomeContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [threads, setThreads] = useState<Thread[]>([]);
  const [threadId, setThreadId] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [welcomeInput, setWelcomeInput] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

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

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = Math.min(textareaRef.current.scrollHeight, 200) + "px";
    }
  }, [welcomeInput]);

  const loadThreads = async () => {
    try {
      const res = await fetch("/api/threads");
      if (res.ok) setThreads(await res.json());
    } catch {} finally { setIsLoading(false); }
  };

  const createChat = async (initialMessage?: string) => {
    try {
      const res = await fetch("/api/threads", {
        method: "POST",
        body: JSON.stringify({ title: initialMessage?.slice(0, 50) || `Chat ${new Date().toLocaleTimeString("uz-UZ", { hour: "2-digit", minute: "2-digit" })}` }),
      });
      if (res.ok) {
        const newThread = await res.json();
        setThreads([newThread, ...threads]);
        return newThread;
      }
    } catch {}
    return null;
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

  const handleWelcomeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!welcomeInput.trim()) return;
    const msg = welcomeInput.trim();
    setWelcomeInput("");
    
    const newThread = await createChat(msg);
    if (newThread) {
      sessionStorage.setItem(`pendingMessage_${newThread.id}`, msg);
      updateActiveThread(newThread.id);
    }
  };

  const handleSuggestionClick = async (text: string) => {
    const newThread = await createChat(text);
    if (newThread) {
      sessionStorage.setItem(`pendingMessage_${newThread.id}`, text);
      updateActiveThread(newThread.id);
    }
  };

  return (
    <div className="flex h-screen bg-white text-slate-900 font-sans">
      <Threads 
        threads={threads} 
        activeId={threadId} 
        onNew={() => updateActiveThread(null)} 
        onSelect={updateActiveThread}
        onHome={() => updateActiveThread(null)}
        onRename={handleRename}
        onDelete={handleDelete}
        isLoading={isLoading} 
      />

      <div className="flex-1 flex flex-col relative overflow-hidden">
        {!threadId && (
          <div className="absolute inset-0 pointer-events-none overflow-hidden">
            <div className="absolute top-[-10%] right-[-5%] w-[500px] h-[500px] bg-slate-50 rounded-full blur-3xl opacity-60" />
            <div className="absolute bottom-[-10%] left-[-10%] w-[600px] h-[600px] bg-blue-50/50 rounded-full blur-3xl opacity-60" />
          </div>
        )}

        {threadId ? (
          <ChatArea key={threadId} threadId={threadId} />
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center px-6 py-12 relative z-10 max-w-5xl mx-auto w-full">
            <div className="flex gap-2 mb-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
              <span className="px-3 py-1 rounded-full bg-slate-100 text-xs font-medium text-slate-600 border border-slate-200">AI Yordamchi</span>
              <span className="px-3 py-1 rounded-full bg-slate-100 text-xs font-medium text-slate-600 border border-slate-200">Beta v1.0</span>
            </div>

            <div className="text-center mb-10 max-w-3xl animate-in fade-in slide-in-from-bottom-6 duration-700 delay-100">
              <h1 className="text-4xl md:text-6xl font-extrabold text-slate-900 leading-[1.1] tracking-tight mb-6">
                Sizning birinchi <br />
                virtual <span className="text-transparent bg-clip-text bg-gradient-to-r from-slate-700 to-slate-900">AI xodimingiz</span>
              </h1>
              <p className="text-lg md:text-xl text-slate-500 max-w-2xl mx-auto leading-relaxed font-light">
                U savollarga javob beradi, ma'lumotlarni tahlil qiladi va 24/7 ishlaydi.
                Jadvallar bilan ishlash, matn yozish va tahlil qilish uchun ideal yordamchi.
              </p>
            </div>

            <form onSubmit={handleWelcomeSubmit} className="w-full max-w-2xl mb-12 animate-in fade-in slide-in-from-bottom-8 duration-700 delay-200">
              <div className="relative group">
                <div className="absolute -inset-0.5 bg-gradient-to-r from-slate-200 to-slate-200 rounded-2xl opacity-50 blur transition duration-500 group-hover:opacity-100"></div>
                <div className="relative bg-white rounded-2xl shadow-xl shadow-slate-200/50 flex flex-col transition-all focus-within:shadow-2xl focus-within:shadow-slate-200/80">
                  <textarea
                    ref={textareaRef}
                    value={welcomeInput}
                    onChange={(e) => setWelcomeInput(e.target.value)}
                    onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleWelcomeSubmit(e); } }}
                    placeholder="Nimani tahlil qilamiz?"
                    rows={1}
                    className="w-full px-5 py-4 pr-14 bg-transparent text-slate-900 text-lg placeholder:text-slate-400 resize-none outline-none rounded-2xl"
                    style={{ minHeight: "68px", maxHeight: "200px" }}
                  />
                  <button
                    type="submit"
                    disabled={!welcomeInput.trim()}
                    className="absolute right-3 bottom-3 w-10 h-10 rounded-xl bg-slate-900 text-white flex items-center justify-center disabled:opacity-30 disabled:bg-slate-300 hover:bg-black transition-all shadow-md"
                  >
                    <Send className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </form>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 w-full max-w-4xl animate-in fade-in slide-in-from-bottom-10 duration-700 delay-300">
              {suggestions.map((s, i) => (
                <button
                  key={i}
                  onClick={() => handleSuggestionClick(s.text)}
                  className="flex flex-col gap-3 p-5 rounded-2xl bg-slate-50 hover:bg-white border border-slate-100 hover:border-slate-200 transition-all shadow-sm hover:shadow-md text-left group"
                >
                  <div className="w-10 h-10 rounded-xl bg-white border border-slate-200 flex items-center justify-center text-slate-700 group-hover:scale-110 transition-transform">
                    <s.icon className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-slate-900">{s.text}</h3>
                    <p className="text-xs text-slate-500 mt-0.5">{s.desc}</p>
                  </div>
                </button>
              ))}
            </div>
            
            <div className="mt-16 text-center animate-in fade-in duration-1000 delay-500">
              <p className="text-sm font-semibold text-slate-400 uppercase tracking-widest mb-4">Quyidagi platformalar bilan integratsiya</p>
              <div className="flex gap-6 items-center justify-center opacity-40 grayscale hover:grayscale-0 transition-all duration-500">
                <Table className="w-6 h-6" /> 
                <Database className="w-6 h-6" /> 
                <Sparkles className="w-6 h-6" /> 
              </div>
            </div>
          </div>
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
