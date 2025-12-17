"use client";

import { useState, useCallback, useEffect } from "react";
import { Table, X, Info, Check } from "lucide-react";
import ExcelGrid from "@/components/ExcelGrid";
import type { RangeResult } from "@/hooks/useRangeSelection";

export interface TableModalProps {
  isOpen: boolean;
  data: (string | number | boolean | null)[][];
  sheet: string;
  onSelectRange?: (range: { from: string; to: string }) => void;
  onClose: () => void;
}

export default function TableModal({ isOpen, data, sheet, onSelectRange, onClose }: TableModalProps) {
  const [selection, setSelection] = useState<RangeResult | null>(null);

  useEffect(() => { if (!isOpen) setSelection(null); }, [isOpen]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => { if (e.key === "Escape" && isOpen) onClose(); };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  const handleConfirm = useCallback(() => {
    if (selection && onSelectRange) {
      onSelectRange({ from: selection.from, to: selection.to });
      onClose();
    }
  }, [selection, onSelectRange, onClose]);

  const getSelectionText = () => {
    if (!selection) return "Katak tanlanmagan";
    return selection.from === selection.to ? `${sheet}!${selection.from}` : `${sheet}!${selection.from}:${selection.to}`;
  };

  const getMentionText = () => {
    if (!selection) return "";
    return selection.from === selection.to ? `@${sheet}!${selection.from}` : `@${sheet}!${selection.from}:${selection.to}`;
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4 animate-in fade-in duration-200"
      onClick={(e) => e.target === e.currentTarget && onClose()}
      role="dialog"
      aria-modal="true"
    >
      <div className="w-full max-w-5xl max-h-[90vh] flex flex-col bg-white rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200 border border-slate-200">
        <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100 bg-white">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-900">
              <Table className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900">{sheet}</h2>
              <p className="text-sm text-slate-500">Jadval ma'lumotlarini tanlash</p>
            </div>
          </div>
          <button onClick={onClose} className="w-9 h-9 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-900 flex items-center justify-center transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex items-center justify-between gap-4 px-6 py-3 bg-slate-50 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <span className="text-sm font-medium text-slate-500">Tanlangan soha:</span>
            <span className={`text-sm font-semibold px-2.5 py-1 rounded-md transition-colors ${selection ? "bg-white border border-slate-200 text-slate-900 shadow-sm" : "text-slate-400"}`}>
              {getSelectionText()}
            </span>
          </div>
          {selection && (
            <code className="text-sm font-mono text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-md border border-emerald-100">
              {getMentionText()}
            </code>
          )}
        </div>

        <div className="flex-1 p-6 overflow-hidden min-h-[300px] bg-slate-50/50">
          <ExcelGrid data={data} onSelectionChange={setSelection} maxHeight="500px" />
        </div>

        <div className="flex items-center justify-between px-6 py-4 border-t border-slate-100 bg-white">
          <div className="flex items-center gap-2 text-sm text-slate-400 hidden sm:flex">
            <Info className="w-4 h-4" />
            <span>Sichqoncha bilan tortib tanlang</span>
          </div>
          <div className="flex gap-3 w-full sm:w-auto">
            <button onClick={onClose} className="flex-1 sm:flex-none px-5 py-2.5 text-sm font-medium text-slate-600 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors">
              Bekor qilish
            </button>
            <button
              onClick={handleConfirm}
              disabled={!selection}
              className="flex-1 sm:flex-none px-6 py-2.5 text-sm font-medium text-white bg-slate-900 rounded-xl hover:bg-black disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-md hover:shadow-lg flex items-center justify-center gap-2"
            >
              <Check className="w-4 h-4" />
              Tanlash
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
