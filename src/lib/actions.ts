"use server";

import { db } from "./db";
import type { ActionType } from "./tools";
import { updateCell, deleteRow, addRow } from "./excel";
import * as XLSX from "xlsx";
import { readFileSync } from "fs";
import { join } from "path";

export interface ActionResult {
  success: boolean;
  message: string;
  data?: unknown;
}

export async function deleteThread(threadId: number): Promise<ActionResult> {
  try {
    db.run("DELETE FROM messages WHERE thread_id = ?", [threadId]);
    db.run("DELETE FROM threads WHERE id = ?", [threadId]);
    return { success: true, message: `Thread #${threadId} muvaffaqiyatli o'chirildi` };
  } catch (error) {
    return { success: false, message: `Xatolik: ${error instanceof Error ? error.message : "Noma'lum xato"}` };
  }
}

export async function updateThreadTitle(threadId: number, newTitle: string): Promise<ActionResult> {
  try {
    db.run("UPDATE threads SET title = ? WHERE id = ?", [newTitle, threadId]);
    return { success: true, message: `Thread #${threadId} nomi "${newTitle}" ga o'zgartirildi` };
  } catch (error) {
    return { success: false, message: `Xatolik: ${error instanceof Error ? error.message : "Noma'lum xato"}` };
  }
}

export async function clearMessages(threadId: number): Promise<ActionResult> {
  try {
    const result = db.run("DELETE FROM messages WHERE thread_id = ?", [threadId]);
    return { success: true, message: `Thread #${threadId} dagi barcha xabarlar o'chirildi`, data: { deletedCount: result.changes } };
  } catch (error) {
    return { success: false, message: `Xatolik: ${error instanceof Error ? error.message : "Noma'lum xato"}` };
  }
}

export async function updateExcelCellAction(sheet: string, cell: string, value: string | number | boolean): Promise<ActionResult> {
  try {
    const result = updateCell(sheet, cell, value === undefined ? null : value);
    return { success: true, message: `Excel: ${sheet}!${cell} yangilandi. Yangi qiymat: ${result.value}`, data: result };
  } catch (error) {
    return { success: false, message: `Excel Xatolik: ${error instanceof Error ? error.message : "Noma'lum xato"}` };
  }
}

export async function deleteExcelRowAction(sheet: string, rowIndex: number): Promise<ActionResult> {
  try {
    deleteRow(sheet, rowIndex - 1); // 1-based to 0-based
    return { success: true, message: `Excel: ${sheet} sheetidan ${rowIndex}-qator o'chirildi.` };
  } catch (error) {
    return { success: false, message: `Excel Xatolik: ${error instanceof Error ? error.message : "Noma'lum xato"}` };
  }
}

export async function addExcelRowAction(sheet: string, rowData: any[], rowIndex?: number): Promise<ActionResult> {
  try {
    const wb = XLSX.read(readFileSync(join(process.cwd(), "data", "example.xlsx")), { type: "buffer" });
    const ws = wb.Sheets[sheet];
    if (!ws) throw new Error(`Sheet not found: ${sheet}`);
    
    const data = XLSX.utils.sheet_to_json(ws, { header: 1 }) as any[][];
    
    // Auto-generate ID if first column looks like an ID column
    const headers = data[0] || [];
    const firstHeader = String(headers[0] || "").toLowerCase();
    const hasIdColumn = firstHeader === "id" || firstHeader === "no" || firstHeader === "№";
    
    if (hasIdColumn && data.length > 1) {
      // Extract all IDs from first column (skip header)
      const ids: number[] = [];
      for (let i = 1; i < data.length; i++) {
        const id = data[i][0];
        if (typeof id === "number" && !isNaN(id)) {
          ids.push(id);
        }
      }
      
      // If user didn't provide an ID in rowData, auto-generate it
      const firstValue = rowData[0];
      const userProvidedId = typeof firstValue === "number" && !isNaN(firstValue);
      
      if (!userProvidedId && ids.length > 0) {
        const maxId = Math.max(...ids);
        rowData = [maxId + 1, ...rowData]; // Prepend new ID
      }
    }
    
    const targetIndex = rowIndex !== undefined ? rowIndex - 1 : data.length; // 1-based to 0-based or append
    
    addRow(sheet, targetIndex, rowData);
    return { success: true, message: `Excel: ${sheet} sheetiga ${targetIndex + 1}-qatorga yangi ma'lumot qo'shildi.`, data: { addedRow: rowData } };
  } catch (error) {
    return { success: false, message: `Excel Xatolik: ${error instanceof Error ? error.message : "Noma'lum xato"}` };
  }
}

export async function executeConfirmedAction(
  actionType: ActionType,
  params: { 
    threadId?: number; 
    newTitle?: string; 
    sheet?: string; 
    cell?: string; 
    value?: string | number | boolean;
    rowIndex?: number;
    rowData?: (string | number | boolean | null)[];
  }
): Promise<ActionResult> {
  switch (actionType) {
    case "deleteThread":
      if (!params.threadId) return { success: false, message: "threadId kerak" };
      return deleteThread(params.threadId);
    case "updateThreadTitle":
      if (!params.threadId || !params.newTitle) return { success: false, message: "threadId va newTitle kerak" };
      return updateThreadTitle(params.threadId, params.newTitle);
    case "clearMessages":
      if (!params.threadId) return { success: false, message: "threadId kerak" };
      return clearMessages(params.threadId);
    case "updateExcelCell":
      if (!params.sheet || !params.cell || params.value === undefined) return { success: false, message: "sheet, cell va value kerak" };
      return updateExcelCellAction(params.sheet, params.cell, params.value);
    case "deleteExcelRow":
      if (!params.sheet || !params.rowIndex) return { success: false, message: "sheet va rowIndex kerak" };
      return deleteExcelRowAction(params.sheet, params.rowIndex);
    case "addExcelRow":
      if (!params.sheet || !params.rowData) return { success: false, message: "sheet va rowData kerak" };
      return addExcelRowAction(params.sheet, params.rowData, params.rowIndex);
    default:
      return { success: false, message: `Noma'lum action: ${actionType}` };
  }
}
