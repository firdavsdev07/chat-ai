import { useState, useCallback, useRef } from "react";

export interface CellPosition {
  row: number;
  col: number;
}

export interface SelectionRange {
  start: CellPosition;
  end: CellPosition;
}

export interface RangeResult {
  from: string; 
  to: string;   
}

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


export function indexToRow(index: number): number {
  return index + 1;
}

export function positionToRef(position: CellPosition): string {
  return `${indexToCol(position.col)}${indexToRow(position.row)}`;
}


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


export function isCellStart(row: number, col: number, range: SelectionRange | null): boolean {
  if (!range) return false;
  const normalized = normalizeRange(range);
  return row === normalized.start.row && col === normalized.start.col;
}


export function isCellEnd(row: number, col: number, range: SelectionRange | null): boolean {
  if (!range) return false;
  const normalized = normalizeRange(range);
  return row === normalized.end.row && col === normalized.end.col;
}

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


  const getSelectionResult = useCallback((): RangeResult | null => {
    if (!selection) return null;
    
    const normalized = normalizeRange(selection);
    const from = positionToRef(normalized.start);
    const to = positionToRef(normalized.end);
    
    if (from === to) {
      return { from, to: from };
    }
    
    return { from, to };
  }, [selection]);


  const handleMouseDown = useCallback((row: number, col: number) => {
    const startPos = { row, col };
    startCellRef.current = startPos;
    setIsSelecting(true);
    setSelection({
      start: startPos,
      end: startPos,
    });
  }, []);

  const handleMouseMove = useCallback((row: number, col: number) => {
    if (!isSelecting || !startCellRef.current) return;
    
    setSelection({
      start: startCellRef.current,
      end: { row, col },
    });
  }, [isSelecting]);


  const handleMouseUp = useCallback(() => {
    setIsSelecting(false);
  }, []);

  const clearSelection = useCallback(() => {
    setSelection(null);
    setIsSelecting(false);
    startCellRef.current = null;
  }, []);


  const isCellSelected = useCallback((row: number, col: number): boolean => {
    return isCellInRange(row, col, selection);
  }, [selection]);

  const isCellSelectionStart = useCallback((row: number, col: number): boolean => {
    return isCellStart(row, col, selection);
  }, [selection]);

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
