import { z } from "zod";
import { tool } from "ai";
import {
  listSheets,
  getCell,
  getCellFormula,
  getRange,
  getSheetData,
  type SheetInfo,
  type CellResult,
  type RangeResult,
} from "@/lib/excel";

export const listSheetsSchema = z.object({});

export const getCellSchema = z.object({
  sheet: z.string().describe("The name of the sheet (e.g., 'Users', 'Sales')"),
  cell: z.string().describe("The cell reference (e.g., 'A1', 'B5', 'C10')"),
});

export const getCellFormulaSchema = z.object({
  sheet: z.string().describe("The name of the sheet"),
  cell: z.string().describe("The cell reference to get formula from"),
});

export const getRangeSchema = z.object({
  sheet: z.string().describe("The name of the sheet"),
  from: z.string().describe("Start cell reference (e.g., 'A1')"),
  to: z.string().describe("End cell reference (e.g., 'C5')"),
});

export const getSheetDataSchema = z.object({
  sheet: z.string().describe("The name of the sheet to get all data from"),
});

// Reuse getCellFormulaSchema for explainFormula
export const explainFormulaSchema = getCellFormulaSchema;

export const listSheetsTool = tool({
  description: `List all sheets in Excel file with dimensions.`,
  inputSchema: listSheetsSchema,
  execute: async (): Promise<{ sheets: SheetInfo[] }> => {
    try {
      const sheets = listSheets();
      return { sheets };
    } catch (error) {
      throw new Error(
        `Failed to list sheets: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    }
  },
});

export const getCellTool = tool({
  description: `Get value from a single Excel cell.`,
  inputSchema: getCellSchema,
  execute: async ({ sheet, cell }): Promise<CellResult> => {
    try {
      return getCell(sheet, cell);
    } catch (error) {
      throw new Error(
        `Failed to get cell ${cell} from ${sheet}: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    }
  },
});

export const getCellFormulaTool = tool({
  description: `Get formula from a cell (returns null if no formula).`,
  inputSchema: getCellFormulaSchema,
  execute: async ({
    sheet,
    cell,
  }): Promise<{
    sheet: string;
    cell: string;
    formula: string | null;
    hasFormula: boolean;
  }> => {
    try {
      return getCellFormula(sheet, cell);
    } catch (error) {
      throw new Error(
        `Failed to get formula from ${cell} in ${sheet}: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    }
  },
});

export const explainFormulaTool = tool({
  description: `Get formula from cell to explain to user.`,
  inputSchema: explainFormulaSchema,
  execute: async ({
    sheet,
    cell,
  }): Promise<{
    sheet: string;
    cell: string;
    formula: string | null;
    hasFormula: boolean;
  }> => {
    try {
      return getCellFormula(sheet, cell);
    } catch (error) {
      throw new Error(
        `Failed to explain formula from ${cell} in ${sheet}: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    }
  },
});

export const getRangeTool = tool({
  description: `Get range of cells from Excel as 2D array.`,
  inputSchema: getRangeSchema,
  execute: async ({ sheet, from, to }): Promise<RangeResult> => {
    try {
      return getRange(sheet, from, to);
    } catch (error) {
      throw new Error(
        `Failed to get range ${from}:${to} from ${sheet}: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    }
  },
});

export const getSheetDataTool = tool({
  description: `Get all data from entire sheet.`,
  inputSchema: getSheetDataSchema,
  execute: async ({ sheet }): Promise<RangeResult> => {
    try {
      return getSheetData(sheet);
    } catch (error) {
      throw new Error(
        `Failed to get data from sheet ${sheet}: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    }
  },
});

export const excelReadTools = {
  listSheets: listSheetsTool,
  getCell: getCellTool,
  getCellFormula: getCellFormulaTool,
  explainFormula: explainFormulaTool,
  getRange: getRangeTool,
  getSheetData: getSheetDataTool,
};

export type ExcelReadTools = typeof excelReadTools;
