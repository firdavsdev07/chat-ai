"use client";

import {
  MessageSquare,
  Sparkles,
  Table,
  FileText,
  Search,
} from "lucide-react";

export default function EmptyState() {
  return (
    <div className="flex-1 flex flex-col items-center justify-center px-6 relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-[-10%] right-[-5%] w-[500px] h-[500px] bg-slate-50 rounded-full blur-3xl opacity-60" />
        <div className="absolute bottom-[-10%] left-[-10%] w-[600px] h-[600px] bg-blue-50/50 rounded-full blur-3xl opacity-60" />
      </div>

      <div className="text-center max-w-2xl relative z-10">
        {/* Icon */}
        <div className="mb-6 flex justify-center animate-in fade-in zoom-in duration-500">
          <div className="relative">
            <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-slate-100 to-slate-50 flex items-center justify-center shadow-lg border border-slate-200">
              <MessageSquare className="w-10 h-10 text-slate-600" />
            </div>
            <div className="absolute -top-2 -right-2 w-8 h-8 rounded-full bg-white border-2 border-slate-200 flex items-center justify-center shadow-md">
              <Sparkles className="w-4 h-4 text-slate-500" />
            </div>
          </div>
        </div>

        {/* Title */}
        <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4 animate-in fade-in slide-in-from-bottom-4 duration-700 delay-100">
          Suhbatni boshlang
        </h2>

        {/* Description */}
        <p className="text-lg text-slate-500 leading-relaxed animate-in fade-in slide-in-from-bottom-6 duration-700 delay-200">
          Chap paneldagi chatlardan birini tanlang yoki yangi chat yaratish uchun<br />
          sidebar header'dagi <span className="font-semibold text-slate-700">AI Xodim</span> tugmasini bosing.
        </p>

        {/* Hint */}
        <div className="mt-12 animate-in fade-in duration-1000 delay-500">
          <p className="text-sm text-slate-400 mb-3">Nimalar qila olasiz:</p>
          <div className="flex flex-wrap gap-2 justify-center">
            <span className="px-3 py-1.5 rounded-full bg-slate-100 text-xs text-slate-600 border border-slate-200 flex items-center gap-1.5">
              <Table className="w-3.5 h-3.5" />
              Excel tahlil
            </span>
            <span className="px-3 py-1.5 rounded-full bg-slate-100 text-xs text-slate-600 border border-slate-200 flex items-center gap-1.5">
              <MessageSquare className="w-3.5 h-3.5" />
              Savolga javob
            </span>
            <span className="px-3 py-1.5 rounded-full bg-slate-100 text-xs text-slate-600 border border-slate-200 flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5" />
              Matn yozish
            </span>
            <span className="px-3 py-1.5 rounded-full bg-slate-100 text-xs text-slate-600 border border-slate-200 flex items-center gap-1.5">
              <Search className="w-3.5 h-3.5" />
              Ma'lumot qidirish
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
