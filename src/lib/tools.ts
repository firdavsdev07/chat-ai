import { z } from 'zod';

// ============================================
// TOOL TYPE DEFINITIONS
// ============================================

export type ActionType = 
  | 'deleteThread' 
  | 'updateThreadTitle' 
  | 'clearMessages' 
  | 'updateExcelCell';

export interface ConfirmActionParams {
  actionType: ActionType;
  actionTitle: string;
  actionDescription: string;
  params: {
    threadId?: number;
    newTitle?: string;
    // Excel params
    sheet?: string;
    cell?: string;
    value?: string | number | boolean;
  };
}

export interface ExecuteActionParams {
  actionType: ActionType;
  params: {
    threadId?: number;
    newTitle?: string;
    // Excel params
    sheet?: string;
    cell?: string;
    value?: string | number | boolean;
  };
}

// ============================================
// ZOD SCHEMAS for tools
// ============================================

export const confirmActionSchema = z.object({
  actionType: z.enum(['deleteThread', 'updateThreadTitle', 'clearMessages', 'updateExcelCell'])
    .describe('Type of dangerous action'),
  actionTitle: z.string()
    .describe('Title shown in dialog, e.g., "Thread o\'chirish" or "Excel katakni yangilash"'),
  actionDescription: z.string()
    .describe('Description of what will happen'),
  params: z.object({
    threadId: z.number().optional(),
    newTitle: z.string().optional(),
    // Excel params
    sheet: z.string().optional(),
    cell: z.string().optional(),
    value: z.union([z.string(), z.number(), z.boolean()]).optional(),
  }),
});

export const executeConfirmedActionSchema = z.object({
  actionType: z.enum(['deleteThread', 'updateThreadTitle', 'clearMessages', 'updateExcelCell']),
  params: z.object({
    threadId: z.number().optional(),
    newTitle: z.string().optional(),
    // Excel params
    sheet: z.string().optional(),
    cell: z.string().optional(),
    value: z.union([z.string(), z.number(), z.boolean()]).optional(),
  }),
});

// ============================================
// TOOL NAMES - for reference
// ============================================

export const TOOL_NAMES = {
  CONFIRM_ACTION: 'confirmAction',
  EXECUTE_CONFIRMED_ACTION: 'executeConfirmedAction',
} as const;
