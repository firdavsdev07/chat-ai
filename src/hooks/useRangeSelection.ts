/**
 * Custom hook for Excel-like range selection
 * Handles cell and range selection with mouse drag
 */
import { useState, useCallback, useRef } from "react";

// ============================================
// TYPE DEFINITIONS
// ============================================

export interface CellPosition {
  row: number;
  col: number;
}

export interface SelectionRange {
  start: CellPosition;
  end: CellPosition;
}

export interface RangeResult {
  from: string; // e.g., "A1"
  to: string;   // e.g., "C5"
}

// ============================================
// HELPER FUNCTIONS
// ============================================

/**
 * Convert column index to Excel letter (0 = A, 1 = B, ..., 25 = Z, 26 = AA)
 */
export function indexToCol(index: number): string {
  let result = "";
  let i = index + 1;
  while (i > 0) {
    const remainder = (i - 1) % 26;
    result = String.fromCharCode(65 + remainder) + result;
    i = Math.floor((i - 1) / 26);
  }
  return result;
}

/**
 * Convert row index to Excel row number (0 = 1, 1 = 2, ...)
 */
export function indexToRow(index: number): number {
  return index + 1;
}

/**
 * Convert cell position to Excel reference (e.g., { row: 0, col: 0 } -> "A1")
 */
export function positionToRef(position: CellPosition): string {
  return `${indexToCol(position.col)}${indexToRow(position.row)}`;
}

/**
 * Normalize selection range so start is always top-left and end is bottom-right
 */
export function normalizeRange(range: SelectionRange): SelectionRange {
  return {
    start: {
      row: Math.min(range.start.row, range.end.row),
      col: Math.min(range.start.col, range.end.col),
    },
    end: {
      row: Math.max(range.start.row, range.end.row),
      col: Math.max(range.start.col, range.end.col),
    },
  };
}

/**
 * Check if a cell is within the selection range
 */
export function isCellInRange(row: number, col: number, range: SelectionRange | null): boolean {
  if (!range) return false;
  
  const normalized = normalizeRange(range);
  return (
    row >= normalized.start.row &&
    row <= normalized.end.row &&
    col >= normalized.start.col &&
    col <= normalized.end.col
  );
}

/**
 * Check if a cell is the start of selection
 */
export function isCellStart(row: number, col: number, range: SelectionRange | null): boolean {
  if (!range) return false;
  const normalized = normalizeRange(range);
  return row === normalized.start.row && col === normalized.start.col;
}

/**
 * Check if a cell is the end of selection
 */
export function isCellEnd(row: number, col: number, range: SelectionRange | null): boolean {
  if (!range) return false;
  const normalized = normalizeRange(range);
  return row === normalized.end.row && col === normalized.end.col;
}

// ============================================
// CUSTOM HOOK
// ============================================

interface UseRangeSelectionReturn {
  selection: SelectionRange | null;
  isSelecting: boolean;
  getSelectionResult: () => RangeResult | null;
  handleMouseDown: (row: number, col: number) => void;
  handleMouseMove: (row: number, col: number) => void;
  handleMouseUp: () => void;
  clearSelection: () => void;
  isCellSelected: (row: number, col: number) => boolean;
  isCellSelectionStart: (row: number, col: number) => boolean;
  isCellSelectionEnd: (row: number, col: number) => boolean;
}

export function useRangeSelection(): UseRangeSelectionReturn {
  const [selection, setSelection] = useState<SelectionRange | null>(null);
  const [isSelecting, setIsSelecting] = useState(false);
  const startCellRef = useRef<CellPosition | null>(null);

  /**
   * Get selection result as Excel range format
   */
  const getSelectionResult = useCallback((): RangeResult | null => {
    if (!selection) return null;
    
    const normalized = normalizeRange(selection);
    const from = positionToRef(normalized.start);
    const to = positionToRef(normalized.end);
    
    // If single cell, return same for from and to
    if (from === to) {
      return { from, to: from };
    }
    
    return { from, to };
  }, [selection]);

  /**
   * Handle mouse down - start selection
   */
  const handleMouseDown = useCallback((row: number, col: number) => {
    const startPos = { row, col };
    startCellRef.current = startPos;
    setIsSelecting(true);
    setSelection({
      start: startPos,
      end: startPos,
    });
  }, []);

  /**
   * Handle mouse move - extend selection
   */
  const handleMouseMove = useCallback((row: number, col: number) => {
    if (!isSelecting || !startCellRef.current) return;
    
    setSelection({
      start: startCellRef.current,
      end: { row, col },
    });
  }, [isSelecting]);

  /**
   * Handle mouse up - end selection
   */
  const handleMouseUp = useCallback(() => {
    setIsSelecting(false);
  }, []);

  /**
   * Clear current selection
   */
  const clearSelection = useCallback(() => {
    setSelection(null);
    setIsSelecting(false);
    startCellRef.current = null;
  }, []);

  /**
   * Check if cell is selected
   */
  const isCellSelected = useCallback((row: number, col: number): boolean => {
    return isCellInRange(row, col, selection);
  }, [selection]);

  /**
   * Check if cell is selection start (top-left)
   */
  const isCellSelectionStart = useCallback((row: number, col: number): boolean => {
    return isCellStart(row, col, selection);
  }, [selection]);

  /**
   * Check if cell is selection end (bottom-right)
   */
  const isCellSelectionEnd = useCallback((row: number, col: number): boolean => {
    return isCellEnd(row, col, selection);
  }, [selection]);

  return {
    selection,
    isSelecting,
    getSelectionResult,
    handleMouseDown,
    handleMouseMove,
    handleMouseUp,
    clearSelection,
    isCellSelected,
    isCellSelectionStart,
    isCellSelectionEnd,
  };
}
