import * as XLSX from "xlsx";
import { readFileSync, writeFileSync, existsSync } from "fs";
import { join } from "path";

const EXCEL_FILE_PATH = join(process.cwd(), "data", "example.xlsx");

// Simple in-memory cache for read operations
let cachedWorkbook: XLSX.WorkBook | null = null;
let cacheTimestamp = 0;
const CACHE_TTL = 5000; // 5 seconds cache

function getCachedWorkbook(): XLSX.WorkBook {
  const now = Date.now();
  if (cachedWorkbook && (now - cacheTimestamp) < CACHE_TTL) {
    return cachedWorkbook;
  }
  cachedWorkbook = loadWorkbook();
  cacheTimestamp = now;
  return cachedWorkbook;
}

function invalidateCache() {
  cachedWorkbook = null;
  cacheTimestamp = 0;
}

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

function loadWorkbook(): XLSX.WorkBook {
  if (!existsSync(EXCEL_FILE_PATH)) {
    throw new Error(`Excel file not found: ${EXCEL_FILE_PATH}`);
  }
  const buffer = readFileSync(EXCEL_FILE_PATH);
  return XLSX.read(buffer, { type: "buffer", cellFormula: true });
}

function saveWorkbook(wb: XLSX.WorkBook): void {
  const buffer = XLSX.write(wb, { type: "buffer", bookType: "xlsx" });
  writeFileSync(EXCEL_FILE_PATH, buffer);
}

function colToIndex(col: string): number {
  let result = 0;
  for (let i = 0; i < col.length; i++) {
    result = result * 26 + (col.charCodeAt(i) - 64);
  }
  return result - 1;
}

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

function parseCellRef(ref: string): { col: number; row: number } {
  const match = ref.match(/^([A-Z]+)(\d+)$/i);
  if (!match) throw new Error(`Invalid cell reference: ${ref}`);
  return { col: colToIndex(match[1].toUpperCase()), row: parseInt(match[2], 10) - 1 };
}

function getCellData(cell: XLSX.CellObject | undefined): CellValue {
  if (!cell) return { value: null, type: "empty" };

  let type: CellValue["type"] = "string";
  let value: string | number | boolean | null = null;

  switch (cell.t) {
    case "n": type = "number"; value = cell.v as number; break;
    case "s": type = "string"; value = cell.v as string; break;
    case "b": type = "boolean"; value = cell.v as boolean; break;
    case "d": type = "date"; value = cell.w || String(cell.v); break;
    case "e": type = "error"; value = cell.w || "#ERROR"; break;
    default: value = cell.v !== undefined ? String(cell.v) : null;
  }

  return { value, type, formula: cell.f };
}

export function listSheets(): SheetInfo[] {
  const wb = getCachedWorkbook();
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

export function getCell(sheet: string, cell: string): CellResult {
  const wb = getCachedWorkbook();
  const ws = wb.Sheets[sheet];
  if (!ws) throw new Error(`Sheet not found: ${sheet}. Available: ${wb.SheetNames.join(", ")}`);
  
  const cellRef = cell.toUpperCase();
  const cellData = getCellData(ws[cellRef]);
  return { sheet, cell: cellRef, value: cellData.value, formula: cellData.formula, type: cellData.type };
}

export function getCellFormula(sheet: string, cell: string): { sheet: string; cell: string; formula: string | null; hasFormula: boolean } {
  const wb = getCachedWorkbook();
  const ws = wb.Sheets[sheet];
  if (!ws) throw new Error(`Sheet not found: ${sheet}. Available: ${wb.SheetNames.join(", ")}`);
  
  const cellRef = cell.toUpperCase();
  const cellObj = ws[cellRef];
  return { sheet, cell: cellRef, formula: cellObj?.f || null, hasFormula: !!cellObj?.f };
}

export function getRange(sheet: string, from: string, to: string): RangeResult {
  const wb = getCachedWorkbook();
  const ws = wb.Sheets[sheet];
  if (!ws) throw new Error(`Sheet not found: ${sheet}. Available: ${wb.SheetNames.join(", ")}`);
  
  const startRef = parseCellRef(from.toUpperCase());
  const endRef = parseCellRef(to.toUpperCase());
  
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
  
  return {
    sheet,
    range: `${from.toUpperCase()}:${to.toUpperCase()}`,
    data,
    rowCount: maxRow - minRow + 1,
    colCount: maxCol - minCol + 1,
  };
}

export function getSheetData(sheet: string): RangeResult {
  const wb = getCachedWorkbook();
  const ws = wb.Sheets[sheet];
  if (!ws) throw new Error(`Sheet not found: ${sheet}. Available: ${wb.SheetNames.join(", ")}`);
  
  const range = XLSX.utils.decode_range(ws["!ref"] || "A1");
  const startCell = indexToCol(range.s.c) + (range.s.r + 1);
  const endCell = indexToCol(range.e.c) + (range.e.r + 1);
  return getRange(sheet, startCell, endCell);
}

export function deleteRow(sheet: string, rowIndex: number): void {
  const wb = loadWorkbook(); // Always reload for write operations
  const ws = wb.Sheets[sheet];
  if (!ws) throw new Error(`Sheet not found: ${sheet}`);

  // Convert to 2D array
  const data = XLSX.utils.sheet_to_json(ws, { header: 1 }) as any[][];

  if (rowIndex < 0 || rowIndex >= data.length) {
    throw new Error(`Row index ${rowIndex + 1} out of bounds (Total: ${data.length})`);
  }

  // Remove row
  data.splice(rowIndex, 1);

  // Re-create sheet
  const newWs = XLSX.utils.aoa_to_sheet(data);
  wb.Sheets[sheet] = newWs;
  saveWorkbook(wb);
  invalidateCache(); // Invalidate cache after write
}

export function addRow(sheet: string, rowIndex: number, rowData: any[]): void {
  const wb = loadWorkbook(); // Always reload for write operations
  const ws = wb.Sheets[sheet];
  if (!ws) throw new Error(`Sheet not found: ${sheet}`);

  const data = XLSX.utils.sheet_to_json(ws, { header: 1 }) as any[][];

  // Если rowIndex слишком большой, добавляем в конец
  if (rowIndex > data.length) rowIndex = data.length;

  data.splice(rowIndex, 0, rowData);

  const newWs = XLSX.utils.aoa_to_sheet(data);
  wb.Sheets[sheet] = newWs;
  saveWorkbook(wb);
  invalidateCache(); // Invalidate cache after write
}

export function updateCell(sheet: string, cell: string, value: string | number | boolean | null): CellResult {
  const wb = loadWorkbook();
  const ws = wb.Sheets[sheet];
  if (!ws) throw new Error(`Sheet not found: ${sheet}. Available: ${wb.SheetNames.join(", ")}`);
  
  const cellRef = cell.toUpperCase();
  const cellAddress = XLSX.utils.decode_cell(cellRef);

  // Безопасность: предотвращение записи в слишком дальние ячейки
  if (cellAddress.r > 20000) throw new Error("Row limit exceeded (max 20000)");
  if (cellAddress.c > 1000) throw new Error("Column limit exceeded (max 1000)");
  
  if (typeof value === 'string' && value.startsWith('=')) {
    ws[cellRef] = { f: value.substring(1) };
  } else {
    let cellObj: XLSX.CellObject;
    if (value === null) cellObj = { t: 's', v: '' }; // Clear cell
    else if (typeof value === 'number') cellObj = { t: 'n', v: value };
    else if (typeof value === 'boolean') cellObj = { t: 'b', v: value };
    else cellObj = { t: 's', v: String(value) };
    ws[cellRef] = cellObj;
  }
  
  const range = XLSX.utils.decode_range(ws["!ref"] || "A1");
  
  // Расширение диапазона
  if (range.s.r > cellAddress.r) range.s.r = cellAddress.r;
  if (range.s.c > cellAddress.c) range.s.c = cellAddress.c;
  if (range.e.r < cellAddress.r) range.e.r = cellAddress.r;
  if (range.e.c < cellAddress.c) range.e.c = cellAddress.c;
  
  ws["!ref"] = XLSX.utils.encode_range(range);
  saveWorkbook(wb);
  invalidateCache(); // Invalidate cache after write
  return getCell(sheet, cell);
}
