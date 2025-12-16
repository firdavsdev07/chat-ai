import { z } from "zod";

export type ActionType = "deleteThread" | "updateThreadTitle" | "clearMessages" | "updateExcelCell";

export interface ConfirmActionParams {
  actionType: ActionType;
  actionTitle: string;
  actionDescription: string;
  params: { threadId?: number; newTitle?: string; sheet?: string; cell?: string; value?: string | number | boolean };
}

export interface ExecuteActionParams {
  actionType: ActionType;
  params: { threadId?: number; newTitle?: string; sheet?: string; cell?: string; value?: string | number | boolean };
}

const paramsSchema = z.object({
  threadId: z.number().optional(),
  newTitle: z.string().optional(),
  sheet: z.string().optional(),
  cell: z.string().optional(),
  value: z.union([z.string(), z.number(), z.boolean()]).optional(),
});

export const confirmActionSchema = z.object({
  actionType: z.enum(["deleteThread", "updateThreadTitle", "clearMessages", "updateExcelCell"]).describe("Action type"),
  actionTitle: z.string().describe("Dialog title"),
  actionDescription: z.string().describe("Description"),
  params: paramsSchema,
});

export const executeConfirmedActionSchema = z.object({
  actionType: z.enum(["deleteThread", "updateThreadTitle", "clearMessages", "updateExcelCell"]),
  params: paramsSchema,
});

export const showTableSchema = z.object({
  sheet: z.string().describe("Sheet name"),
  data: z.array(z.array(z.union([z.string(), z.number(), z.boolean(), z.null()]))).describe("2D array"),
  range: z.object({ from: z.string(), to: z.string() }).optional().describe("Range to highlight"),
});

export const TOOL_NAMES = {
  CONFIRM_ACTION: "confirmAction",
  EXECUTE_CONFIRMED_ACTION: "executeConfirmedAction",
} as const;
