/**
 * Excel Read Tool Definitions
 * Server-side tools for reading Excel files
 */
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

// ============================================
// TOOL SCHEMAS
// ============================================

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

// ============================================
// TOOL DEFINITIONS
// ============================================

/**
 * List all sheets in the Excel workbook
 */
export const listSheetsTool = tool({
  description: `List all sheets in the Excel file. Returns sheet names with their dimensions.
    Use this first to discover available sheets before reading data.
    The Excel file contains data about Users, Sales, and Inventory.`,
  inputSchema: listSheetsSchema,
  execute: async (): Promise<{ sheets: SheetInfo[] }> => {
    try {
      const sheets = listSheets();
      return { sheets };
    } catch (error) {
      throw new Error(`Failed to list sheets: ${error instanceof Error ? error.message : "Unknown error"}`);
    }
  },
});

/**
 * Get value of a single cell
 */
export const getCellTool = tool({
  description: `Get the value of a single cell from the Excel file.
    Returns the cell value, its type (string/number/boolean/date), and formula if present.
    Example: getCell("Users", "B2") returns the name in the second row.`,
  inputSchema: getCellSchema,
  execute: async ({ sheet, cell }): Promise<CellResult> => {
    try {
      return getCell(sheet, cell);
    } catch (error) {
      throw new Error(`Failed to get cell ${cell} from ${sheet}: ${error instanceof Error ? error.message : "Unknown error"}`);
    }
  },
});

/**
 * Get formula from a cell
 */
export const getCellFormulaTool = tool({
  description: `Get the formula from a cell in the Excel file without explaining it.
    Returns the formula string if the cell contains a formula, null otherwise.
    Example: getCellFormula("Sales", "E2") returns the formula that calculates the total.`,
  inputSchema: getCellFormulaSchema,
  execute: async ({ sheet, cell }): Promise<{ sheet: string; cell: string; formula: string | null; hasFormula: boolean }> => {
    try {
      return getCellFormula(sheet, cell);
    } catch (error) {
      throw new Error(`Failed to get formula from ${cell} in ${sheet}: ${error instanceof Error ? error.message : "Unknown error"}`);
    }
  },
});

/**
 * Explain formula in a cell
 */
export const explainFormulaTool = tool({
  description: `Get the formula from a cell AND explain it to the user.
    Use this tool when the user asks to "explain" or "understand" a formula.
    Returns the formula string. THE AI MUST THEN GENERATE A HUMAN-READABLE EXPLANATION based on this formula.
    Example: explainFormula("Sales", "E2") returns the formula, and you should explain what it calculates.`,
  inputSchema: explainFormulaSchema,
  execute: async ({ sheet, cell }): Promise<{ sheet: string; cell: string; formula: string | null; hasFormula: boolean }> => {
    try {
      return getCellFormula(sheet, cell);
    } catch (error) {
      throw new Error(`Failed to explain formula from ${cell} in ${sheet}: ${error instanceof Error ? error.message : "Unknown error"}`);
    }
  },
});

/**
 * Get range of cells
 */
export const getRangeTool = tool({
  description: `Get a range of cells from the Excel file.
    Returns a 2D array of values from the specified range.
    Example: getRange("Users", "A1", "E3") returns the first 3 rows including headers.
    Example: getRange("Sales", "A1", "E8") returns all sales data.`,
  inputSchema: getRangeSchema,
  execute: async ({ sheet, from, to }): Promise<RangeResult> => {
    try {
      return getRange(sheet, from, to);
    } catch (error) {
      throw new Error(`Failed to get range ${from}:${to} from ${sheet}: ${error instanceof Error ? error.message : "Unknown error"}`);
    }
  },
});

/**
 * Get all data from a sheet
 */
export const getSheetDataTool = tool({
  description: `Get all data from an entire sheet.
    Returns all rows and columns of the specified sheet.
    Use this when you need to see the complete data in a sheet.
    Warning: May return large amounts of data for big sheets.`,
  inputSchema: getSheetDataSchema,
  execute: async ({ sheet }): Promise<RangeResult> => {
    try {
      return getSheetData(sheet);
    } catch (error) {
      throw new Error(`Failed to get data from sheet ${sheet}: ${error instanceof Error ? error.message : "Unknown error"}`);
    }
  },
});

// ============================================
// TOOL COLLECTION
// ============================================

export const excelReadTools = {
  listSheets: listSheetsTool,
  getCell: getCellTool,
  getCellFormula: getCellFormulaTool,
  explainFormula: explainFormulaTool,
  getRange: getRangeTool,
  getSheetData: getSheetDataTool,
};

// Export types for use in other files
export type ExcelReadTools = typeof excelReadTools;
