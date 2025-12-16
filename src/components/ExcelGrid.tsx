/**
 * ExcelGrid Component
 * Renders Excel-like table with cell/range selection support
 */
"use client";

import { useCallback, useRef, useEffect } from "react";
import { 
  useRangeSelection, 
  indexToCol, 
  normalizeRange,
  type RangeResult 
} from "@/hooks/useRangeSelection";

// ============================================
// TYPE DEFINITIONS
// ============================================

export interface ExcelGridProps {
  /** 2D array of cell values */
  data: (string | number | boolean | null)[][];
  /** Callback when range selection changes */
  onSelectionChange?: (range: RangeResult | null) => void;
  /** Maximum height of the grid container */
  maxHeight?: string;
}

// ============================================
// COMPONENT
// ============================================

export default function ExcelGrid({ 
  data, 
  onSelectionChange,
  maxHeight = "400px" 
}: ExcelGridProps) {
  const {
    selection,
    isSelecting,
    getSelectionResult,
    handleMouseDown,
    handleMouseMove,
    handleMouseUp,
    isCellSelected,
    isCellSelectionStart,
    isCellSelectionEnd,
  } = useRangeSelection();

  const tableRef = useRef<HTMLTableElement>(null);

  // Notify parent when selection changes
  useEffect(() => {
    if (onSelectionChange) {
      onSelectionChange(getSelectionResult());
    }
  }, [selection, getSelectionResult, onSelectionChange]);

  // Handle mouse up globally (for when mouse leaves table)
  useEffect(() => {
    const handleGlobalMouseUp = () => {
      if (isSelecting) {
        handleMouseUp();
      }
    };

    document.addEventListener("mouseup", handleGlobalMouseUp);
    return () => document.removeEventListener("mouseup", handleGlobalMouseUp);
  }, [isSelecting, handleMouseUp]);

  // Get cell class based on selection state
  const getCellClass = useCallback((rowIndex: number, colIndex: number): string => {
    const baseClass = "excel-cell";
    const classes = [baseClass];

    if (isCellSelected(rowIndex, colIndex)) {
      classes.push("excel-cell-selected");
      
      if (selection) {
        const normalized = normalizeRange(selection);
        
        // Border edges
        if (rowIndex === normalized.start.row) classes.push("excel-cell-top");
        if (rowIndex === normalized.end.row) classes.push("excel-cell-bottom");
        if (colIndex === normalized.start.col) classes.push("excel-cell-left");
        if (colIndex === normalized.end.col) classes.push("excel-cell-right");
      }

      if (isCellSelectionStart(rowIndex, colIndex)) {
        classes.push("excel-cell-start");
      }
      if (isCellSelectionEnd(rowIndex, colIndex)) {
        classes.push("excel-cell-end");
      }
    }

    return classes.join(" ");
  }, [selection, isCellSelected, isCellSelectionStart, isCellSelectionEnd]);

  // Format cell value for display
  const formatCellValue = (value: string | number | boolean | null): string => {
    if (value === null || value === undefined) return "";
    if (typeof value === "boolean") return value ? "TRUE" : "FALSE";
    return String(value);
  };

  // Calculate number of columns (use first row or max)
  const colCount = data.length > 0 
    ? Math.max(...data.map(row => row.length))
    : 0;

  if (data.length === 0) {
    return (
      <div className="flex items-center justify-center h-40 text-gray-400">
        <p>Ma'lumot topilmadi</p>
      </div>
    );
  }

  return (
    <div 
      className="excel-grid-container overflow-auto border border-gray-300 rounded-lg"
      style={{ maxHeight }}
    >
      <table
        ref={tableRef}
        className="excel-table w-full border-collapse select-none"
        onMouseLeave={() => {
          if (isSelecting) {
            // Don't end selection, let it continue if mouse returns
          }
        }}
      >
        {/* Column Headers (A, B, C, ...) */}
        <thead className="sticky top-0 z-10">
          <tr>
            {/* Row number header cell */}
            <th className="excel-header-corner" />
            
            {/* Column letters */}
            {Array.from({ length: colCount }, (_, i) => (
              <th key={`col-${i}`} className="excel-header-cell">
                {indexToCol(i)}
              </th>
            ))}
          </tr>
        </thead>

        <tbody>
          {data.map((row, rowIndex) => (
            <tr key={`row-${rowIndex}`}>
              {/* Row number */}
              <td className="excel-row-header">
                {rowIndex + 1}
              </td>

              {/* Data cells */}
              {Array.from({ length: colCount }, (_, colIndex) => {
                const value = row[colIndex];
                return (
                  <td
                    key={`cell-${rowIndex}-${colIndex}`}
                    className={getCellClass(rowIndex, colIndex)}
                    onMouseDown={(e) => {
                      e.preventDefault();
                      handleMouseDown(rowIndex, colIndex);
                    }}
                    onMouseMove={() => handleMouseMove(rowIndex, colIndex)}
                    onMouseUp={handleMouseUp}
                  >
                    <span className="excel-cell-content">
                      {formatCellValue(value)}
                    </span>
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>

      {/* Embedded Styles */}
      <style jsx>{`
        .excel-grid-container {
          background: white;
        }

        .excel-table {
          font-family: 'Segoe UI', -apple-system, BlinkMacSystemFont, sans-serif;
          font-size: 13px;
        }

        .excel-header-corner {
          position: sticky;
          left: 0;
          z-index: 20;
          min-width: 40px;
          height: 28px;
          background: linear-gradient(180deg, #f8f9fa 0%, #e9ecef 100%);
          border: 1px solid #d0d5dd;
          border-top: none;
          border-left: none;
        }

        .excel-header-cell {
          min-width: 80px;
          height: 28px;
          padding: 4px 8px;
          background: linear-gradient(180deg, #f8f9fa 0%, #e9ecef 100%);
          border: 1px solid #d0d5dd;
          border-top: none;
          font-weight: 600;
          color: #495057;
          text-align: center;
        }

        .excel-row-header {
          position: sticky;
          left: 0;
          z-index: 5;
          min-width: 40px;
          padding: 4px 8px;
          background: linear-gradient(90deg, #f8f9fa 0%, #e9ecef 100%);
          border: 1px solid #d0d5dd;
          font-weight: 600;
          color: #495057;
          text-align: center;
        }

        .excel-cell {
          min-width: 80px;
          height: 24px;
          padding: 2px 6px;
          background: white;
          border: 1px solid #e5e7eb;
          cursor: cell;
          transition: background-color 0.05s ease;
        }

        .excel-cell:hover:not(.excel-cell-selected) {
          background-color: #f8fafc;
        }

        .excel-cell-content {
          display: block;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
          max-width: 150px;
        }

        /* Selected cell styles */
        .excel-cell-selected {
          background-color: rgba(59, 130, 246, 0.15) !important;
        }

        .excel-cell-selected.excel-cell-top {
          border-top: 2px solid #3b82f6;
        }

        .excel-cell-selected.excel-cell-bottom {
          border-bottom: 2px solid #3b82f6;
        }

        .excel-cell-selected.excel-cell-left {
          border-left: 2px solid #3b82f6;
        }

        .excel-cell-selected.excel-cell-right {
          border-right: 2px solid #3b82f6;
        }

        /* Start cell (top-left of selection) */
        .excel-cell-start {
          background-color: rgba(59, 130, 246, 0.25) !important;
        }

        /* End cell (bottom-right of selection) - handle indicator */
        .excel-cell-end {
          position: relative;
        }

        .excel-cell-end::after {
          content: '';
          position: absolute;
          right: -3px;
          bottom: -3px;
          width: 6px;
          height: 6px;
          background: #3b82f6;
          border: 1px solid white;
          cursor: crosshair;
        }
      `}</style>
    </div>
  );
}
