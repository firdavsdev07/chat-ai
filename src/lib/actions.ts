"use server";

import { db } from "./db";
import type { ActionType } from "./tools";
import { updateCell } from "./excel";

// ============================================
// SERVER ACTIONS - Database operations
// ============================================

export interface ActionResult {
  success: boolean;
  message: string;
  data?: unknown;
}

/**
 * Thread ni o'chirish
 */
export async function deleteThread(threadId: number): Promise<ActionResult> {
  try {
    // Avval threadga tegishli xabarlarni o'chirish
    db.run("DELETE FROM messages WHERE thread_id = ?", [threadId]);
    // Keyin threadni o'chirish
    db.run("DELETE FROM threads WHERE id = ?", [threadId]);
    
    return {
      success: true,
      message: `Thread #${threadId} muvaffaqiyatli o'chirildi`,
    };
  } catch (error) {
    return {
      success: false,
      message: `Xatolik: ${error instanceof Error ? error.message : "Noma'lum xato"}`,
    };
  }
}

/**
 * Thread title ni yangilash
 */
export async function updateThreadTitle(threadId: number, newTitle: string): Promise<ActionResult> {
  try {
    db.run("UPDATE threads SET title = ? WHERE id = ?", [newTitle, threadId]);
    
    return {
      success: true,
      message: `Thread #${threadId} nomi "${newTitle}" ga o'zgartirildi`,
    };
  } catch (error) {
    return {
      success: false,
      message: `Xatolik: ${error instanceof Error ? error.message : "Noma'lum xato"}`,
    };
  }
}

/**
 * Thread xabarlarini tozalash
 */
export async function clearMessages(threadId: number): Promise<ActionResult> {
  try {
    const result = db.run("DELETE FROM messages WHERE thread_id = ?", [threadId]);
    
    return {
      success: true,
      message: `Thread #${threadId} dagi barcha xabarlar o'chirildi`,
      data: { deletedCount: result.changes },
    };
  } catch (error) {
    return {
      success: false,
      message: `Xatolik: ${error instanceof Error ? error.message : "Noma'lum xato"}`,
    };
  }
}

/**
 * Excel katakni yangilash
 */
export async function updateExcelCellAction(sheet: string, cell: string, value: string | number | boolean): Promise<ActionResult> {
  try {
    const result = updateCell(sheet, cell, value === undefined ? null : value);
    
    return {
      success: true,
      message: `Excel: ${sheet}!${cell} yangilandi. Yangi qiymat: ${result.value}`,
      data: result,
    };
  } catch (error) {
    return {
      success: false,
      message: `Excel Xatolik: ${error instanceof Error ? error.message : "Noma'lum xato"}`,
    };
  }
}

/**
 * Tasdiqlangan action ni bajarish
 */
export async function executeConfirmedAction(
  actionType: ActionType,
  params: { 
    threadId?: number; 
    newTitle?: string;
    sheet?: string;
    cell?: string;
    value?: string | number | boolean;
  }
): Promise<ActionResult> {
  switch (actionType) {
    case "deleteThread":
      if (!params.threadId) {
        return { success: false, message: "threadId kerak" };
      }
      return deleteThread(params.threadId);

    case "updateThreadTitle":
      if (!params.threadId || !params.newTitle) {
        return { success: false, message: "threadId va newTitle kerak" };
      }
      return updateThreadTitle(params.threadId, params.newTitle);

    case "clearMessages":
      if (!params.threadId) {
        return { success: false, message: "threadId kerak" };
      }
      return clearMessages(params.threadId);

    case "updateExcelCell":
      if (!params.sheet || !params.cell || params.value === undefined) {
        return { success: false, message: "sheet, cell va value kerak" };
      }
      return updateExcelCellAction(params.sheet, params.cell, params.value);

    default:
      return { success: false, message: `Noma'lum action: ${actionType}` };
  }
}
