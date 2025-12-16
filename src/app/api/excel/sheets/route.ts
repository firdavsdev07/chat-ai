/**
 * Excel Sheets API
 * Returns all sheets with their data for MentionInput
 */
import { NextResponse } from "next/server";
import { listSheets, getSheetData } from "@/lib/excel";

export async function GET() {
  try {
    // Get all sheet names
    const sheetInfos = listSheets();
    
    // Load data for each sheet
    const sheets = sheetInfos.map(info => {
      try {
        const sheetData = getSheetData(info.name);
        return {
          name: info.name,
          data: sheetData.data,
          rowCount: sheetData.rowCount,
          colCount: sheetData.colCount,
        };
      } catch (error) {
        console.error(`Failed to load sheet ${info.name}:`, error);
        return {
          name: info.name,
          data: [],
          rowCount: 0,
          colCount: 0,
        };
      }
    });
    
    return NextResponse.json({ 
      sheets,
      totalSheets: sheets.length,
    });
  } catch (error) {
    console.error("Failed to get sheets:", error);
    return NextResponse.json(
      { error: "Failed to load Excel sheets" },
      { status: 500 }
    );
  }
}
