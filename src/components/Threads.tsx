"use client";

import { useState, useRef, useEffect } from "react";
import { MessageSquare, Plus, MessagesSquare, Sparkles, MoreHorizontal, Pencil, Trash2, Check, AlertTriangle } from "lucide-react";
import { ThreadsProps } from "@/lib/types";

function DeleteDialog({ isOpen, title, onConfirm, onCancel }: { 
  isOpen: boolean; 
  title: string; 
  onConfirm: () => void; 
  onCancel: () => void;
}) {
  useEffect(() => {
    if (isOpen) {
      const handleEsc = (e: KeyboardEvent) => { if (e.key === "Escape") onCancel(); };
      document.addEventListener("keydown", handleEsc);
      return () => document.removeEventListener("keydown", handleEsc);
    }
  }, [isOpen, onCancel]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-200" onClick={onCancel}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm mx-4 overflow-hidden animate-in fade-in zoom-in-95 duration-200" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center gap-4 p-5 border-b border-slate-100">
          <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center">
            <AlertTriangle className="w-6 h-6 text-red-600" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-slate-900">Удалить чат</h3>
            <p className="text-sm text-slate-500">Это действие необратимо</p>
          </div>
        </div>
        <div className="p-5">
          <p className="text-sm text-slate-600">
            Чат <span className="font-semibold text-slate-900">"{title}"</span> и все сообщения в нём будут удалены.
          </p>
        </div>
        <div className="flex gap-3 p-5 pt-0">
          <button onClick={onCancel} className="flex-1 px-4 py-2.5 text-sm font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors">
            Отмена
          </button>
          <button onClick={onConfirm} className="flex-1 px-4 py-2.5 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-xl transition-colors shadow-sm">
            Удалить
          </button>
        </div>
      </div>
    </div>
  );
}

export default function Threads({ threads, activeId, onNew, onSelect, onHome, onRename, onDelete, isLoading = false }: ThreadsProps) {
  const [menuOpenId, setMenuOpenId] = useState<number | null>(null);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [deleteDialog, setDeleteDialog] = useState<{ isOpen: boolean; id: number; title: string }>({ isOpen: false, id: 0, title: "" });
  const inputRef = useRef<HTMLInputElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) setMenuOpenId(null);
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    if (editingId && inputRef.current) inputRef.current.focus();
  }, [editingId]);

  const handleStartEdit = (e: React.MouseEvent, id: number, currentTitle: string) => {
    e.stopPropagation();
    setEditingId(id);
    setEditTitle(currentTitle);
    setMenuOpenId(null);
  };

  const handleSaveEdit = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (editingId && editTitle.trim()) {
      onRename(editingId, editTitle.trim());
      setEditingId(null);
    }
  };

  const handleDeleteClick = (e: React.MouseEvent, id: number, title: string) => {
    e.stopPropagation();
    setMenuOpenId(null);
    setDeleteDialog({ isOpen: true, id, title: title || "Безымянная беседа" });
  };

  return (
    <>
      <DeleteDialog
        isOpen={deleteDialog.isOpen}
        title={deleteDialog.title}
        onConfirm={() => { onDelete(deleteDialog.id); setDeleteDialog({ isOpen: false, id: 0, title: "" }); }}
        onCancel={() => setDeleteDialog({ isOpen: false, id: 0, title: "" })}
      />

      <div className="w-72 bg-slate-50 border-r border-slate-200 flex flex-col h-full font-sans">
        <div className="p-5 border-b border-slate-200/50 bg-white">
          <button onClick={onHome} className="flex items-center gap-3 w-full hover:opacity-80 transition-opacity group">
            <div className="w-8 h-8 rounded-lg bg-slate-900 flex items-center justify-center shadow-lg shadow-slate-900/20 group-hover:scale-105 transition-transform">
              <Sparkles className="w-4 h-4 text-white" />
            </div>
            <span className="text-lg font-bold text-slate-900 tracking-tight">AI Помощник</span>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-3 custom-scrollbar" onClick={() => setMenuOpenId(null)}>
          <button
            onClick={onNew}
            className="w-full flex items-center gap-3 px-4 py-3 mb-3 bg-slate-900 text-white rounded-xl hover:bg-black transition-all shadow-md hover:shadow-lg active:scale-98 font-medium"
          >
            <Plus className="w-4.5 h-4.5" />
            <span>Новый чат</span>
          </button>

          <div className="flex items-center gap-2 px-3 py-3 mb-1 text-xs font-bold text-slate-400 uppercase tracking-widest">
            <MessagesSquare className="w-3.5 h-3.5" />
            <span>История</span>
          </div>

          {isLoading ? (
            <div className="space-y-2 mt-1">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex items-center gap-3 px-3 py-3 rounded-lg">
                  <div className="w-4 h-4 rounded bg-slate-200 animate-pulse" />
                  <div className="flex-1"><div className="h-4 bg-slate-200 rounded animate-pulse w-3/4" /></div>
                </div>
              ))}
            </div>
          ) : threads.length === 0 ? (
            <div className="mt-10 px-6 text-center">
              <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <MessageSquare className="w-5 h-5 text-slate-400" />
              </div>
              <p className="text-sm text-slate-500">Пока нет бесед</p>
            </div>
          ) : (
            <div className="space-y-1">
              {threads.map((t) => (
                <div key={t.id} className="relative group/item">
                  {editingId === t.id ? (
                    <form onSubmit={handleSaveEdit} className="flex items-center gap-2 px-2 py-2 bg-white border border-blue-500 rounded-lg shadow-sm">
                      <input
                        ref={inputRef}
                        value={editTitle}
                        onChange={(e) => setEditTitle(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Escape") setEditingId(null);
                          if (e.key === "Enter") { e.preventDefault(); handleSaveEdit(); }
                          e.stopPropagation();
                        }}
                        onBlur={(e) => {
                          const relatedTarget = e.relatedTarget as HTMLElement;
                          if (relatedTarget?.closest('form')) return;
                          setTimeout(() => setEditingId(null), 150);
                        }}
                        className="flex-1 min-w-0 text-sm text-slate-900 bg-transparent outline-none"
                      />
                      <button type="submit" className="p-1 text-green-600 hover:bg-green-50 rounded"><Check className="w-3.5 h-3.5" /></button>
                    </form>
                  ) : (
                    <div
                      onClick={() => onSelect(t.id)}
                      role="button"
                      tabIndex={0}
                      onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") onSelect(t.id); }}
                      className={`w-full flex items-center gap-3 px-3 py-3 rounded-lg transition-all text-left border relative pr-10 cursor-pointer ${
                        activeId === t.id ? "bg-white text-slate-900 border-slate-200 shadow-sm" : "border-transparent text-slate-500 hover:bg-slate-200/50 hover:text-slate-900"
                      }`}
                    >
                      <MessageSquare className={`w-4 h-4 shrink-0 ${activeId === t.id ? "text-slate-900" : "text-slate-400 group-hover/item:text-slate-600"}`} />
                      <div className="flex-1 min-w-0 pr-2">
                        <div className="text-sm font-medium truncate">{t.title || "Безымянная беседа"}</div>
                      </div>
                      <button
                        onClick={(e) => { e.stopPropagation(); setMenuOpenId(menuOpenId === t.id ? null : t.id); }}
                        className={`absolute right-2 p-1.5 rounded-md transition-all z-10 ${
                          activeId === t.id || menuOpenId === t.id ? 'opacity-100' : 'opacity-0 group-hover/item:opacity-100'
                        } ${menuOpenId === t.id ? 'bg-slate-200 text-slate-900' : 'text-slate-400 hover:bg-slate-200 hover:text-slate-700'}`}
                      >
                        <MoreHorizontal className="w-4 h-4" />
                      </button>
                    </div>
                  )}

                  {menuOpenId === t.id && (
                    <div ref={menuRef} className="absolute right-0 top-full mt-1 w-36 bg-white rounded-xl shadow-xl border border-slate-100 z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                      <button onClick={(e) => handleStartEdit(e, t.id, t.title)} className="w-full text-left px-3 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-50 flex items-center gap-2.5">
                        <Pencil className="w-4 h-4" /> Изменить
                      </button>
                      <button onClick={(e) => handleDeleteClick(e, t.id, t.title)} className="w-full text-left px-3 py-2.5 text-sm font-medium text-red-600 hover:bg-red-50 flex items-center gap-2.5">
                        <Trash2 className="w-4 h-4" /> Удалить
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="p-4 border-t border-slate-200 bg-slate-50/50">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-white border border-slate-200 flex items-center justify-center text-slate-700 text-xs font-bold shadow-sm">AI</div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-slate-700 truncate">Пользователь</p>
              <p className="text-xs text-slate-400 truncate">Pro Plan</p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
