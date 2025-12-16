"use client";

import { MessageSquare, Plus, MessagesSquare } from "lucide-react";
import { ThreadsProps } from "@/lib/types";
import EmptyState from "./EmptyState";

export default function Threads({ threads, activeId, onNew, onSelect }: ThreadsProps) {
  return (
    <div className="w-80 bg-white border-r border-slate-200 flex flex-col h-full">
      <div className="p-4 border-b border-slate-200">
        <button
          onClick={onNew}
          className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-medium py-2.5 px-4 rounded-xl transition-all duration-200 flex items-center justify-center gap-2 shadow-sm hover:shadow-md active:scale-[0.98]"
        >
          <Plus className="w-5 h-5" />
          <span>Yangi Chat</span>
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-3 custom-scrollbar">
        <div className="flex items-center gap-2 px-3 py-2 mb-2 text-xs font-semibold text-slate-400 uppercase tracking-wider">
          <MessagesSquare className="w-3.5 h-3.5" />
          <span>Mening Chatlarim</span>
        </div>

        {threads.length === 0 ? (
          <div className="mt-8 px-2">
            <EmptyState variant="threads" description="Hali chatlar yo'q" />
          </div>
        ) : (
          <div className="space-y-1.5">
            {threads.map((t) => (
              <button
                key={t.id}
                onClick={() => onSelect(t.id)}
                className={`w-full group flex items-center gap-3 p-3 rounded-xl transition-all duration-200 text-left ${
                  activeId === t.id
                    ? "bg-blue-50 text-blue-700 shadow-sm ring-1 ring-blue-200"
                    : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                }`}
              >
                <div className={`p-2 rounded-lg transition-colors ${
                  activeId === t.id ? "bg-blue-100" : "bg-slate-100 group-hover:bg-white"
                }`}>
                  <MessageSquare className={`w-4 h-4 ${
                    activeId === t.id ? "text-blue-600" : "text-slate-500"
                  }`} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-sm truncate">
                    {t.title || "Nomsiz suhbat"}
                  </div>
                  <div className={`text-xs truncate ${
                    activeId === t.id ? "text-blue-500/70" : "text-slate-400"
                  }`}>
                    {new Date().toLocaleDateString()}
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="p-4 border-t border-slate-200 bg-slate-50">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-blue-500 to-indigo-500 flex items-center justify-center text-white text-xs font-bold shadow-sm">
            AI
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-slate-700 truncate">Foydalanuvchi</p>
            <p className="text-xs text-slate-500 truncate">Pro versiya</p>
          </div>
        </div>
      </div>
    </div>
  );
}
