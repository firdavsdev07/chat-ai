"use client";

import { useState, useCallback, useEffect } from "react";
import { Table, X, Info } from "lucide-react";
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

  useEffect(() => {
    if (!isOpen) setSelection(null);
  }, [isOpen]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) onClose();
    };
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
    if (!selection) return "Hujayra tanlanmagan";
    return selection.from === selection.to ? `${sheet}!${selection.from}` : `${sheet}!${selection.from}:${selection.to}`;
  };

  const getMentionText = () => {
    if (!selection) return "";
    return selection.from === selection.to ? `@${sheet}!${selection.from}` : `@${sheet}!${selection.from}:${selection.to}`;
  };

  if (!isOpen) return null;

  return (
    <div
      className="table-modal-backdrop"
      onClick={(e) => e.target === e.currentTarget && onClose()}
      role="dialog"
      aria-modal="true"
    >
      <div className="table-modal-container">
        <div className="table-modal-header">
          <div className="flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center shadow-lg shadow-emerald-500/30">
              <Table className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">{sheet}</h2>
              <p className="text-sm text-slate-400">Hujayra yoki diapazon tanlang</p>
            </div>
          </div>
          <button onClick={onClose} className="w-9 h-9 rounded-lg bg-white/10 hover:bg-white/20 text-slate-400 hover:text-white flex items-center justify-center transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex items-center justify-between gap-4 px-6 py-3 bg-slate-50 border-b border-slate-200">
          <div className="flex items-center gap-2">
            <span className="text-sm text-slate-500">Tanlangan:</span>
            <span className={`text-sm font-medium px-2.5 py-1 rounded-md ${selection ? "bg-blue-100 text-blue-700" : "bg-slate-200 text-slate-500"}`}>
              {getSelectionText()}
            </span>
          </div>
          {selection && (
            <code className="text-sm font-mono text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-md border border-emerald-200">
              {getMentionText()}
            </code>
          )}
        </div>

        <div className="flex-1 p-6 overflow-hidden min-h-[300px]">
          <ExcelGrid data={data} onSelectionChange={setSelection} maxHeight="450px" />
        </div>

        <div className="flex items-center justify-between px-6 py-4 bg-slate-50 border-t border-slate-200">
          <div className="flex items-center gap-2 text-sm text-slate-500">
            <Info className="w-4 h-4" />
            <span>Hujayrani bosing yoki diapazon tanlash uchun suring</span>
          </div>
          <div className="flex gap-3">
            <button onClick={onClose} className="px-5 py-2.5 text-sm font-medium text-slate-600 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors">
              Bekor qilish
            </button>
            <button
              onClick={handleConfirm}
              disabled={!selection}
              className="px-5 py-2.5 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:bg-slate-300 disabled:cursor-not-allowed transition-colors"
            >
              Tasdiqlash
            </button>
          </div>
        </div>
      </div>

      <style jsx>{`
        .table-modal-backdrop {
          position: fixed;
          inset: 0;
          z-index: 50;
          display: flex;
          align-items: center;
          justify-content: center;
          background: rgba(15, 23, 42, 0.6);
          backdrop-filter: blur(4px);
        }
        .table-modal-container {
          width: 90%;
          max-width: 900px;
          max-height: 90vh;
          background: white;
          border-radius: 16px;
          box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
          display: flex;
          flex-direction: column;
          overflow: hidden;
        }
        .table-modal-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 20px 24px;
          background: linear-gradient(135deg, #1e293b 0%, #334155 100%);
        }
        @media (max-width: 640px) {
          .table-modal-container { width: 95%; max-height: 95vh; }
        }
      `}</style>
    </div>
  );
}
