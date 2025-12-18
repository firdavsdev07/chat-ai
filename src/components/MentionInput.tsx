"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { Table, Send, FileSpreadsheet, StopCircle } from "lucide-react";
import TableModal from "@/components/TableModal";
import { parseMentions, generateMentionFromSelection, insertMentionAtCursor, segmentTextWithMentions, type Mention } from "@/lib/mentionParser";

interface SheetData { name: string; data: (string | number | boolean | null)[][] }

interface MentionInputProps {
  value: string;
  onChange: (value: string) => void;
  onSubmit: (e: React.FormEvent) => void;
  disabled?: boolean;
  placeholder?: string;
  sheets?: SheetData[];
  onMentionsChange?: (mentions: Mention[]) => void;
  isStreaming?: boolean;
  onStop?: () => void;
}

export default function MentionInput({ value, onChange, onSubmit, disabled = false, placeholder = "Напишите сообщение...", sheets = [], onMentionsChange, isStreaming = false, onStop }: MentionInputProps) {
  const [cursor, setCursor] = useState(0);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedSheet, setSelectedSheet] = useState<string | null>(null);
  const [showPicker, setShowPicker] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = Math.min(textareaRef.current.scrollHeight, 200) + "px";
    }
  }, [value]);

  useEffect(() => { onMentionsChange?.(parseMentions(value)); }, [value, onMentionsChange]);

  const openTableModal = useCallback(() => {
    if (!sheets.length) return;
    if (sheets.length === 1) { setSelectedSheet(sheets[0].name); setIsModalOpen(true); }
    else setShowPicker(true);
  }, [sheets]);

  const handleSelectRange = useCallback((range: { from: string; to: string }) => {
    if (!selectedSheet) return;
    const mention = generateMentionFromSelection(selectedSheet, range);
    const { text, newCursorPosition } = insertMentionAtCursor(value, cursor, mention);
    onChange(text);
    requestAnimationFrame(() => {
      textareaRef.current?.focus();
      requestAnimationFrame(() => {
        textareaRef.current?.setSelectionRange(newCursorPosition, newCursorPosition);
        setCursor(newCursorPosition);
      });
    });
  }, [selectedSheet, value, cursor, onChange]);

  const closeModal = useCallback(() => { setIsModalOpen(false); setSelectedSheet(null); setTimeout(() => textareaRef.current?.focus(), 0); }, []);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); onSubmit(e); }
    if ((e.ctrlKey || e.metaKey) && e.key === "m") { e.preventDefault(); openTableModal(); }
  };

  const hasMentions = segmentTextWithMentions(value).some(s => s.type === "mention");

  return (
    <>
      <form onSubmit={onSubmit} className="pb-6 pt-2 px-4 bg-white/80 backdrop-blur-sm sticky bottom-0 z-10 w-full max-w-4xl mx-auto">
        <div className="relative group">
          <div className="absolute -inset-0.5 bg-gradient-to-r from-slate-200 to-slate-200 rounded-2xl opacity-0 group-hover:opacity-100 transition duration-500 blur-sm"></div>
          
          <div className="relative bg-white rounded-2xl border border-slate-200 shadow-lg shadow-slate-200/40 transition-all focus-within:shadow-xl focus-within:border-slate-300">
            {hasMentions && (
              <div className="px-4 pt-3 pb-1 flex items-center gap-2 text-xs font-semibold text-blue-600 bg-blue-50/50 rounded-t-2xl border-b border-blue-100/50">
                <FileSpreadsheet className="w-3.5 h-3.5" />
                <span>Прикреплено ссылок: {parseMentions(value).length}</span>
              </div>
            )}

            <textarea
              ref={textareaRef}
              value={value}
              onChange={(e) => { onChange(e.target.value); setCursor(e.target.selectionStart || 0); }}
              onSelect={(e) => setCursor((e.target as HTMLTextAreaElement).selectionStart || 0)}
              onKeyDown={handleKeyDown}
              placeholder={placeholder}
              disabled={disabled}
              rows={1}
              className="w-full px-5 py-4 pr-24 bg-transparent text-slate-900 text-[15px] placeholder:text-slate-400 resize-none outline-none disabled:opacity-50 min-h-[56px] max-h-[200px] leading-relaxed"
            />

            <div className="absolute right-2 bottom-2 flex items-center gap-1.5">
              {sheets.length > 0 && !isStreaming && (
                <button
                  type="button"
                  onClick={openTableModal}
                  disabled={disabled}
                  className="w-9 h-9 rounded-xl text-slate-400 hover:bg-slate-100 hover:text-slate-600 flex items-center justify-center transition-all disabled:opacity-50"
                  title="Выбрать из таблицы Excel (Ctrl+M)"
                >
                  <Table className="w-4.5 h-4.5" />
                </button>
              )}
              
              {isStreaming ? (
                <button
                  type="button"
                  onClick={onStop}
                  className="w-9 h-9 rounded-xl bg-red-500 text-white flex items-center justify-center hover:bg-red-600 transition-all shadow-md active:scale-95 animate-pulse"
                  title="Остановить ответ"
                >
                  <StopCircle className="w-4 h-4" />
                </button>
              ) : (
                <button
                  type="submit"
                  disabled={disabled || !value.trim()}
                  className="w-9 h-9 rounded-xl bg-slate-900 text-white flex items-center justify-center disabled:opacity-30 disabled:cursor-not-allowed hover:bg-black transition-all shadow-md active:scale-95"
                >
                  <Send className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>
        </div>

        <p className="text-[11px] text-slate-400 text-center mt-2 font-medium">
          {isStreaming ? (
            <span className="flex items-center justify-center gap-2">
              <span className="inline-block w-1.5 h-1.5 bg-red-500 rounded-full animate-pulse"></span>
              AI печатает ответ...
            </span>
          ) : (
            "Enter - отправить • Shift+Enter - новая строка"
          )}
        </p>
      </form>

      {showPicker && (
        <div className="fixed inset-0 z-40 bg-slate-900/20 backdrop-blur-sm flex items-center justify-center" onClick={() => setShowPicker(false)}>
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl min-w-[320px] overflow-hidden animate-in fade-in zoom-in-95 duration-200" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center gap-3 px-5 py-4 bg-slate-50 border-b border-slate-100">
              <div className="w-8 h-8 rounded-lg bg-green-100 flex items-center justify-center text-green-600">
                <FileSpreadsheet className="w-4 h-4" />
              </div>
              <span className="text-base font-bold text-slate-900">Выберите таблицу</span>
            </div>
            <div className="p-2 space-y-1">
              {sheets.map((s) => (
                <button
                  key={s.name}
                  onClick={() => { setSelectedSheet(s.name); setShowPicker(false); setIsModalOpen(true); }}
                  className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-left hover:bg-slate-50 transition-colors group border border-transparent hover:border-slate-100"
                >
                  <Table className="w-4 h-4 text-slate-400 group-hover:text-slate-600" />
                  <span className="flex-1 text-sm font-medium text-slate-700 group-hover:text-slate-900">{s.name}</span>
                  <span className="text-xs font-medium text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">{s.data.length} строк</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      <TableModal isOpen={isModalOpen} data={sheets.find((s) => s.name === selectedSheet)?.data || []} sheet={selectedSheet || ""} onSelectRange={handleSelectRange} onClose={closeModal} />
    </>
  );
}
