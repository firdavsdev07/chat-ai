"use client";

import { useCallback, useEffect } from "react";
import { useRangeSelection, indexToCol, normalizeRange, type RangeResult } from "@/hooks/useRangeSelection";

interface ExcelGridProps {
  data: (string | number | boolean | null)[][];
  onSelectionChange?: (range: RangeResult | null) => void;
  maxHeight?: string;
}

export default function ExcelGrid({ data, onSelectionChange, maxHeight = "400px" }: ExcelGridProps) {
  const { selection, isSelecting, getSelectionResult, handleMouseDown, handleMouseMove, handleMouseUp, isCellSelected, isCellSelectionStart, isCellSelectionEnd } = useRangeSelection();

  useEffect(() => {
    onSelectionChange?.(getSelectionResult());
  }, [selection, getSelectionResult, onSelectionChange]);

  useEffect(() => {
    const onMouseUp = () => isSelecting && handleMouseUp();
    document.addEventListener("mouseup", onMouseUp);
    return () => document.removeEventListener("mouseup", onMouseUp);
  }, [isSelecting, handleMouseUp]);

  const getCellClass = useCallback((row: number, col: number): string => {
    const classes = ["excel-cell"];
    if (isCellSelected(row, col)) {
      classes.push("excel-cell-selected");
      if (selection) {
        const n = normalizeRange(selection);
        if (row === n.start.row) classes.push("excel-cell-top");
        if (row === n.end.row) classes.push("excel-cell-bottom");
        if (col === n.start.col) classes.push("excel-cell-left");
        if (col === n.end.col) classes.push("excel-cell-right");
      }
      if (isCellSelectionStart(row, col)) classes.push("excel-cell-start");
      if (isCellSelectionEnd(row, col)) classes.push("excel-cell-end");
    }
    return classes.join(" ");
  }, [selection, isCellSelected, isCellSelectionStart, isCellSelectionEnd]);

  const formatValue = (v: string | number | boolean | null) => v === null ? "" : typeof v === "boolean" ? (v ? "TRUE" : "FALSE") : String(v);

  const colCount = data.length > 0 ? Math.max(...data.map(r => r.length)) : 0;

  if (!data.length) {
    return <div className="flex items-center justify-center h-40 text-slate-400">Ma&apos;lumot topilmadi</div>;
  }

  return (
    <div className="overflow-auto border border-slate-300 rounded-lg bg-white shadow-sm" style={{ maxHeight }}>
      <table className="w-full border-collapse select-none text-[13px]">
        <thead className="sticky top-0 z-10">
          <tr>
            <th className="sticky left-0 z-20 min-w-[44px] h-8 bg-slate-600 border border-slate-700 border-t-0 border-l-0" />
            {Array.from({ length: colCount }, (_, i) => (
              <th key={i} className="min-w-[90px] h-8 px-2.5 bg-slate-600 border border-slate-700 border-t-0 text-white text-xs font-semibold text-center">
                {indexToCol(i)}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((row, ri) => (
            <tr key={ri}>
              <td className="sticky left-0 z-5 min-w-[44px] px-2.5 py-1.5 bg-slate-100 border border-slate-300 text-slate-600 text-xs font-semibold text-center">
                {ri + 1}
              </td>
              {Array.from({ length: colCount }, (_, ci) => (
                <td
                  key={ci}
                  className={getCellClass(ri, ci)}
                  onMouseDown={(e) => { e.preventDefault(); handleMouseDown(ri, ci); }}
                  onMouseMove={() => handleMouseMove(ri, ci)}
                  onMouseUp={handleMouseUp}
                >
                  <span className="block truncate max-w-[150px]">{formatValue(row[ci])}</span>
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>

      <style jsx>{`
        .excel-cell {
          min-width: 90px; height: 28px; padding: 4px 8px;
          background: white; border: 1px solid #e2e8f0;
          cursor: cell; color: #1e293b;
        }
        .excel-cell:hover:not(.excel-cell-selected) { background: #f8fafc; }
        .excel-cell-selected { background: rgba(59, 130, 246, 0.12) !important; }
        .excel-cell-selected.excel-cell-top { border-top: 2px solid #3b82f6; }
        .excel-cell-selected.excel-cell-bottom { border-bottom: 2px solid #3b82f6; }
        .excel-cell-selected.excel-cell-left { border-left: 2px solid #3b82f6; }
        .excel-cell-selected.excel-cell-right { border-right: 2px solid #3b82f6; }
        .excel-cell-start { background: rgba(59, 130, 246, 0.2) !important; }
        .excel-cell-end { position: relative; }
        .excel-cell-end::after {
          content: ''; position: absolute; right: -3px; bottom: -3px;
          width: 6px; height: 6px; background: #3b82f6; border: 1px solid white;
        }
      `}</style>
    </div>
  );
}
