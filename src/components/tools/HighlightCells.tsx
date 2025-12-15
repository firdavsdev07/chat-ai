"use client";

interface HighlightCellsProps {
  args: {
    sheet: string;
    cells: string[];
  };
}

export default function HighlightCells({ args }: HighlightCellsProps) {
  const { sheet, cells } = args;

  return (
    <div className="my-2 p-3 bg-blue-50 border border-blue-100 rounded-xl">
      <div className="flex items-center gap-2 mb-2">
        <span className="text-blue-500">🔍</span>
        <span className="text-sm font-medium text-blue-900">
          Belgilangan kataklar ({sheet})
        </span>
      </div>
      
      <div className="flex flex-wrap gap-2">
        {cells.map((cell, index) => (
          <div 
            key={index}
            className="px-2 py-1 bg-white border border-blue-200 rounded text-xs font-mono text-blue-700 shadow-sm"
          >
            {cell}
          </div>
        ))}
      </div>
    </div>
  );
}
