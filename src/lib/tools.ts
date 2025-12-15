import { z } from 'zod';

// ============================================
// TOOL TYPE DEFINITIONS
// ============================================

export type ActionType = 'deleteThread' | 'updateThreadTitle' | 'clearMessages';

export interface ConfirmActionParams {
  actionType: ActionType;
  actionTitle: string;
  actionDescription: string;
  params: {
    threadId?: number;
    newTitle?: string;
  };
}

export interface ExecuteActionParams {
  actionType: ActionType;
  params: {
    threadId?: number;
    newTitle?: string;
  };
}

// ============================================
// ZOD SCHEMAS for tools
// ============================================

export const confirmActionSchema = z.object({
  actionType: z.enum(['deleteThread', 'updateThreadTitle', 'clearMessages'])
    .describe('Type of dangerous action'),
  actionTitle: z.string()
    .describe('Title shown in dialog, e.g., "Thread o\'chirish"'),
  actionDescription: z.string()
    .describe('Description of what will happen'),
  params: z.object({
    threadId: z.number().optional(),
    newTitle: z.string().optional(),
  }),
});

export const executeConfirmedActionSchema = z.object({
  actionType: z.enum(['deleteThread', 'updateThreadTitle', 'clearMessages']),
  params: z.object({
    threadId: z.number().optional(),
    newTitle: z.string().optional(),
  }),
});

// ============================================
// TOOL NAMES - for reference
// ============================================

export const TOOL_NAMES = {
  CONFIRM_ACTION: 'confirmAction',
  EXECUTE_CONFIRMED_ACTION: 'executeConfirmedAction',
} as const;
