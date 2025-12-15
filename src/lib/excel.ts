/**
 * Excel utility functions for reading xlsx files
 * Uses SheetJS (xlsx) library
 */
import * as XLSX from "xlsx";
import { readFileSync, existsSync } from "fs";
import { join } from "path";

// Excel file path (hardcoded)
const EXCEL_FILE_PATH = join(process.cwd(), "data", "example.xlsx");

// ============================================
// TYPE DEFINITIONS
// ============================================

export interface CellValue {
  value: string | number | boolean | null;
  formula?: string;
  type: "string" | "number" | "boolean" | "date" | "error" | "empty";
}

export interface RangeResult {
  sheet: string;
  range: string;
  data: (string | number | boolean | null)[][];
  rowCount: number;
  colCount: number;
}

export interface CellResult {
  sheet: string;
  cell: string;
  value: string | number | boolean | null;
  formula?: string;
  type: string;
}

export interface SheetInfo {
  name: string;
  rowCount: number;
  colCount: number;
  usedRange: string;
}

// ============================================
// HELPER FUNCTIONS
// ============================================

/**
 * Load workbook from file
 */
function loadWorkbook(): XLSX.WorkBook {
  if (!existsSync(EXCEL_FILE_PATH)) {
    throw new Error(`Excel file not found: ${EXCEL_FILE_PATH}`);
  }
  
  const buffer = readFileSync(EXCEL_FILE_PATH);
  return XLSX.read(buffer, { type: "buffer", cellFormula: true });
}

/**
 * Convert column letter to index (A=0, B=1, etc.)
 */
function colToIndex(col: string): number {
  let result = 0;
  for (let i = 0; i < col.length; i++) {
    result = result * 26 + (col.charCodeAt(i) - 64);
  }
  return result - 1;
}

/**
 * Convert index to column letter (0=A, 1=B, etc.)
 */
function indexToCol(index: number): string {
  let result = "";
  index++;
  while (index > 0) {
    const remainder = (index - 1) % 26;
    result = String.fromCharCode(65 + remainder) + result;
    index = Math.floor((index - 1) / 26);
  }
  return result;
}

/**
 * Parse cell reference (e.g., "A1" -> { col: 0, row: 0 })
 */
function parseCellRef(ref: string): { col: number; row: number } {
  const match = ref.match(/^([A-Z]+)(\d+)$/i);
  if (!match) {
    throw new Error(`Invalid cell reference: ${ref}`);
  }
  return {
    col: colToIndex(match[1].toUpperCase()),
    row: parseInt(match[2], 10) - 1,
  };
}

/**
 * Get cell value and type
 */
function getCellData(cell: XLSX.CellObject | undefined): CellValue {
  if (!cell) {
    return { value: null, type: "empty" };
  }

  let type: CellValue["type"] = "string";
  let value: string | number | boolean | null = null;

  switch (cell.t) {
    case "n":
      type = "number";
      value = cell.v as number;
      break;
    case "s":
      type = "string";
      value = cell.v as string;
      break;
    case "b":
      type = "boolean";
      value = cell.v as boolean;
      break;
    case "d":
      type = "date";
      value = cell.w || String(cell.v);
      break;
    case "e":
      type = "error";
      value = cell.w || "#ERROR";
      break;
    default:
      value = cell.v !== undefined ? String(cell.v) : null;
  }

  return {
    value,
    type,
    formula: cell.f,
  };
}

// ============================================
// MAIN EXCEL FUNCTIONS
// ============================================

/**
 * Get list of all sheets in the workbook
 */
export function listSheets(): SheetInfo[] {
  const wb = loadWorkbook();
  
  return wb.SheetNames.map((name) => {
    const ws = wb.Sheets[name];
    const range = XLSX.utils.decode_range(ws["!ref"] || "A1");
    
    return {
      name,
      rowCount: range.e.r - range.s.r + 1,
      colCount: range.e.c - range.s.c + 1,
      usedRange: ws["!ref"] || "A1",
    };
  });
}

/**
 * Get value of a single cell
 */
export function getCell(sheet: string, cell: string): CellResult {
  const wb = loadWorkbook();
  const ws = wb.Sheets[sheet];
  
  if (!ws) {
    throw new Error(`Sheet not found: ${sheet}. Available sheets: ${wb.SheetNames.join(", ")}`);
  }
  
  const cellRef = cell.toUpperCase();
  const cellData = getCellData(ws[cellRef]);
  
  return {
    sheet,
    cell: cellRef,
    value: cellData.value,
    formula: cellData.formula,
    type: cellData.type,
  };
}

/**
 * Get formula from a cell (if exists)
 */
export function getCellFormula(sheet: string, cell: string): { sheet: string; cell: string; formula: string | null; hasFormula: boolean } {
  const wb = loadWorkbook();
  const ws = wb.Sheets[sheet];
  
  if (!ws) {
    throw new Error(`Sheet not found: ${sheet}. Available sheets: ${wb.SheetNames.join(", ")}`);
  }
  
  const cellRef = cell.toUpperCase();
  const cellObj = ws[cellRef];
  
  return {
    sheet,
    cell: cellRef,
    formula: cellObj?.f || null,
    hasFormula: !!cellObj?.f,
  };
}

/**
 * Get range of cells
 * @param sheet - Sheet name
 * @param from - Start cell (e.g., "A1")
 * @param to - End cell (e.g., "C5")
 */
export function getRange(sheet: string, from: string, to: string): RangeResult {
  const wb = loadWorkbook();
  const ws = wb.Sheets[sheet];
  
  if (!ws) {
    throw new Error(`Sheet not found: ${sheet}. Available sheets: ${wb.SheetNames.join(", ")}`);
  }
  
  const startRef = parseCellRef(from.toUpperCase());
  const endRef = parseCellRef(to.toUpperCase());
  
  // Ensure start is before end
  const minCol = Math.min(startRef.col, endRef.col);
  const maxCol = Math.max(startRef.col, endRef.col);
  const minRow = Math.min(startRef.row, endRef.row);
  const maxRow = Math.max(startRef.row, endRef.row);
  
  const data: (string | number | boolean | null)[][] = [];
  
  for (let row = minRow; row <= maxRow; row++) {
    const rowData: (string | number | boolean | null)[] = [];
    for (let col = minCol; col <= maxCol; col++) {
      const cellRef = indexToCol(col) + (row + 1);
      const cellData = getCellData(ws[cellRef]);
      rowData.push(cellData.value);
    }
    data.push(rowData);
  }
  
  const rangeStr = `${from.toUpperCase()}:${to.toUpperCase()}`;
  
  return {
    sheet,
    range: rangeStr,
    data,
    rowCount: maxRow - minRow + 1,
    colCount: maxCol - minCol + 1,
  };
}

/**
 * Get entire sheet as 2D array
 */
export function getSheetData(sheet: string): RangeResult {
  const wb = loadWorkbook();
  const ws = wb.Sheets[sheet];
  
  if (!ws) {
    throw new Error(`Sheet not found: ${sheet}. Available sheets: ${wb.SheetNames.join(", ")}`);
  }
  
  const range = XLSX.utils.decode_range(ws["!ref"] || "A1");
  const startCell = indexToCol(range.s.c) + (range.s.r + 1);
  const endCell = indexToCol(range.e.c) + (range.e.r + 1);
  
  return getRange(sheet, startCell, endCell);
}
