"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { Table, Link, FileSpreadsheet, Send } from "lucide-react";
import TableModal from "@/components/TableModal";
import { parseMentions, generateMentionFromSelection, insertMentionAtCursor, segmentTextWithMentions, type Mention } from "@/lib/mentionParser";

interface SheetData {
  name: string;
  data: (string | number | boolean | null)[][];
}

interface MentionInputProps {
  value: string;
  onChange: (value: string) => void;
  onSubmit: (e: React.FormEvent) => void;
  disabled?: boolean;
  placeholder?: string;
  sheets?: SheetData[];
  onMentionsChange?: (mentions: Mention[]) => void;
}

export default function MentionInput({
  value,
  onChange,
  onSubmit,
  disabled = false,
  placeholder = "Xabar yozing... (@Sheet!A1 mention qo'shish uchun)",
  sheets = [],
  onMentionsChange,
}: MentionInputProps) {
  const [cursor, setCursor] = useState(0);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedSheet, setSelectedSheet] = useState<string | null>(null);
  const [showPicker, setShowPicker] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    onMentionsChange?.(parseMentions(value));
  }, [value, onMentionsChange]);

  const openTableModal = useCallback(() => {
    if (!sheets.length) return alert("Sheet ma'lumotlari yuklanmagan");
    if (sheets.length === 1) {
      setSelectedSheet(sheets[0].name);
      setIsModalOpen(true);
    } else {
      setShowPicker(true);
    }
  }, [sheets]);

  const handleSelectRange = useCallback((range: { from: string; to: string }) => {
    if (!selectedSheet) return;
    const mention = generateMentionFromSelection(selectedSheet, range);
    const { text, newCursorPosition } = insertMentionAtCursor(value, cursor, mention);
    onChange(text);
    requestAnimationFrame(() => {
      inputRef.current?.focus();
      requestAnimationFrame(() => {
        inputRef.current?.setSelectionRange(newCursorPosition, newCursorPosition);
        setCursor(newCursorPosition);
      });
    });
  }, [selectedSheet, value, cursor, onChange]);

  const closeModal = useCallback(() => {
    setIsModalOpen(false);
    setSelectedSheet(null);
    setTimeout(() => inputRef.current?.focus(), 0);
  }, []);

  const hasMentions = segmentTextWithMentions(value).some(s => s.type === "mention");

  return (
    <>
      <form onSubmit={onSubmit} className="flex gap-3 items-center p-4 bg-white border-t border-slate-200">
        <div className="flex-1 flex items-center gap-2 bg-slate-50 border-2 border-slate-200 rounded-xl p-1 focus-within:border-blue-500 focus-within:bg-white focus-within:ring-2 focus-within:ring-blue-500/20 transition-all">
          <input
            ref={inputRef}
            type="text"
            className="flex-1 px-3 py-2.5 text-[15px] text-slate-800 bg-transparent border-none outline-none placeholder:text-slate-400 disabled:cursor-not-allowed"
            value={value}
            onChange={(e) => { onChange(e.target.value); setCursor(e.target.selectionStart || 0); }}
            onSelect={(e) => setCursor((e.target as HTMLInputElement).selectionStart || 0)}
            onKeyDown={(e) => { if ((e.ctrlKey || e.metaKey) && e.key === "m") { e.preventDefault(); openTableModal(); } }}
            placeholder={placeholder}
            disabled={disabled}
          />
          <button
            type="button"
            onClick={openTableModal}
            disabled={disabled || !sheets.length}
            className="w-10 h-10 rounded-lg bg-gradient-to-br from-emerald-50 to-emerald-100 border border-emerald-200 text-emerald-600 flex items-center justify-center hover:from-emerald-100 hover:to-emerald-200 disabled:opacity-50 disabled:cursor-not-allowed transition-all hover:scale-105"
            title="Excel jadvalidan hujayra tanlash (Ctrl+M)"
          >
            <Table className="w-5 h-5" />
          </button>
        </div>

        <button
          type="submit"
          disabled={disabled || !value.trim()}
          className="px-5 py-3 text-sm font-semibold text-white bg-gradient-to-r from-blue-600 to-blue-700 rounded-xl shadow-md shadow-blue-500/25 hover:from-blue-700 hover:to-blue-800 disabled:from-slate-300 disabled:to-slate-300 disabled:shadow-none disabled:cursor-not-allowed transition-all flex items-center gap-2"
        >
          <Send className="w-4 h-4" />
          Yuborish
        </button>

        {hasMentions && (
          <div className="absolute bottom-full left-5 mb-2 flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-blue-600 bg-blue-50 border border-blue-200 rounded-md">
            <Link className="w-3.5 h-3.5" />
            {parseMentions(value).length} ta havola
          </div>
        )}
      </form>

      {showPicker && (
        <div className="fixed inset-0 z-40 bg-black/30 flex items-center justify-center" onClick={() => setShowPicker(false)}>
          <div className="bg-white rounded-2xl shadow-2xl min-w-[280px] overflow-hidden" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center gap-2.5 px-5 py-4 bg-slate-100 border-b border-slate-200">
              <FileSpreadsheet className="w-5 h-5 text-slate-600" />
              <span className="text-base font-semibold text-slate-800">Sheet tanlang</span>
            </div>
            <div className="p-2">
              {sheets.map((s) => (
                <button
                  key={s.name}
                  onClick={() => { setSelectedSheet(s.name); setShowPicker(false); setIsModalOpen(true); }}
                  className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-left hover:bg-slate-50 transition-colors"
                >
                  <Table className="w-4 h-4 text-slate-500" />
                  <span className="flex-1 text-sm font-medium text-slate-700">{s.name}</span>
                  <span className="text-xs text-slate-400">{s.data.length} qator</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      <TableModal
        isOpen={isModalOpen}
        data={sheets.find((s) => s.name === selectedSheet)?.data || []}
        sheet={selectedSheet || ""}
        onSelectRange={handleSelectRange}
        onClose={closeModal}
      />
    </>
  );
}
