/**
 * Test page for TableModal component
 * Navigate to /test-table to see the modal in action
 */
"use client";

import { useState, useEffect } from "react";
import TableModal from "@/components/TableModal";

// Sample Excel-like data
const SAMPLE_DATA: (string | number | boolean | null)[][] = [
  ["ID", "Name", "Email", "Role", "Salary"],
  [1, "Ali Valiyev", "ali@example.com", "Developer", 5000000],
  [2, "Olim Karimov", "olim@example.com", "Designer", 4500000],
  [3, "Nodira Saidova", "nodira@example.com", "Manager", 6000000],
  [4, "Bobur Toshmatov", "bobur@example.com", "Developer", 5200000],
  [5, "Zarina Rahimova", "zarina@example.com", "HR", 4000000],
  [6, "Jasur Umarov", "jasur@example.com", "Developer", 5500000],
  [7, "Malika Nurullayeva", "malika@example.com", "Accountant", 4200000],
  [8, "Shaxzod Ergashev", "shaxzod@example.com", "Designer", 4700000],
];

export default function TestTablePage() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedRange, setSelectedRange] = useState<{ from: string; to: string } | null>(null);
  const [data, setData] = useState<(string | number | boolean | null)[][]>(SAMPLE_DATA);
  const [isLoading, setIsLoading] = useState(false);

  // Optionally load real data from API
  const loadRealData = async () => {
    setIsLoading(true);
    try {
      // This would call your Excel API
      // For now, we'll just simulate it
      await new Promise(resolve => setTimeout(resolve, 500));
      setData(SAMPLE_DATA);
    } catch (error) {
      console.error("Failed to load data:", error);
    }
    setIsLoading(false);
  };

  const handleSelectRange = (range: { from: string; to: string }) => {
    setSelectedRange(range);
    console.log("Selected range:", range);
    console.log("Mention format:", getMentionFormat(range));
  };

  const getMentionFormat = (range: { from: string; to: string }): string => {
    if (range.from === range.to) {
      return `@Users!${range.from}`;
    }
    return `@Users!${range.from}:${range.to}`;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            📊 Table Modal Test
          </h1>
          <p className="text-gray-600">
            Excel jadval modalni test qilish sahifasi
          </p>
        </div>

        {/* Controls */}
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">
            Test Controls
          </h2>
          
          <div className="flex flex-wrap gap-4">
            <button
              onClick={() => setIsModalOpen(true)}
              className="px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white font-semibold rounded-xl hover:from-blue-700 hover:to-blue-800 transition-all shadow-lg shadow-blue-500/30 hover:shadow-blue-500/40"
            >
              📊 Modalni ochish
            </button>

            <button
              onClick={loadRealData}
              disabled={isLoading}
              className="px-6 py-3 bg-gradient-to-r from-green-600 to-green-700 text-white font-semibold rounded-xl hover:from-green-700 hover:to-green-800 transition-all shadow-lg shadow-green-500/30 disabled:opacity-50"
            >
              {isLoading ? "⏳ Yuklanmoqda..." : "🔄 Ma'lumot yangilash"}
            </button>
          </div>
        </div>

        {/* Selection Result */}
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">
            Tanlangan diapazon
          </h2>
          
          {selectedRange ? (
            <div className="space-y-3">
              <div className="flex items-center gap-4">
                <span className="text-gray-500 text-sm font-medium min-w-[80px]">From:</span>
                <code className="px-3 py-1 bg-blue-50 text-blue-700 rounded-lg font-mono">
                  {selectedRange.from}
                </code>
              </div>
              <div className="flex items-center gap-4">
                <span className="text-gray-500 text-sm font-medium min-w-[80px]">To:</span>
                <code className="px-3 py-1 bg-blue-50 text-blue-700 rounded-lg font-mono">
                  {selectedRange.to}
                </code>
              </div>
              <div className="flex items-center gap-4 pt-2 border-t border-gray-100">
                <span className="text-gray-500 text-sm font-medium min-w-[80px]">Mention:</span>
                <code className="px-4 py-2 bg-green-50 text-green-700 rounded-lg font-mono border border-green-200">
                  {getMentionFormat(selectedRange)}
                </code>
              </div>
            </div>
          ) : (
            <div className="text-gray-400 text-center py-8">
              <span className="text-4xl block mb-2">📭</span>
              <span>Hali hech narsa tanlanmagan</span>
            </div>
          )}
        </div>

        {/* Data Preview */}
        <div className="bg-white rounded-2xl shadow-lg p-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">
            Ma'lumotlar preview (Sample Data)
          </h2>
          
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50">
                  {data[0]?.map((header, i) => (
                    <th key={i} className="px-4 py-2 text-left font-semibold text-gray-600 border-b">
                      {String(header)}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {data.slice(1, 5).map((row, i) => (
                  <tr key={i} className="hover:bg-gray-50">
                    {row.map((cell, j) => (
                      <td key={j} className="px-4 py-2 text-gray-700 border-b border-gray-100">
                        {String(cell ?? "")}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
            {data.length > 5 && (
              <div className="text-center py-2 text-gray-400 text-sm">
                +{data.length - 5} qatorlar...
              </div>
            )}
          </div>
        </div>

        {/* Usage Instructions */}
        <div className="mt-6 p-4 bg-blue-50 rounded-xl border border-blue-100">
          <h3 className="font-semibold text-blue-800 mb-2">📖 Foydalanish:</h3>
          <ul className="text-blue-700 text-sm space-y-1">
            <li>1. "Modalni ochish" tugmasini bosing</li>
            <li>2. Jadvalda hujayra yoki diapazon tanlang (suring)</li>
            <li>3. "Tasdiqlash" tugmasini bosing</li>
            <li>4. Tanlangan diapazon quyida ko'rinadi</li>
          </ul>
        </div>
      </div>

      {/* Modal */}
      <TableModal
        isOpen={isModalOpen}
        data={data}
        sheet="Users"
        onSelectRange={handleSelectRange}
        onClose={() => setIsModalOpen(false)}
      />
    </div>
  );
}
