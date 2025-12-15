"use client";

interface TablePreviewProps {
  args: {
    data: any[][];
    sheet: string;
    range: string;
  };
}

export default function TablePreview({ args }: TablePreviewProps) {
  const { data, sheet, range } = args;

  if (!data || data.length === 0) {
    return (
      <div className="p-4 bg-gray-50 rounded-lg text-gray-500 text-sm">
        Ma'lumot yo'q
      </div>
    );
  }

  return (
    <div className="my-2 border border-gray-200 rounded-xl overflow-hidden bg-white shadow-sm">
      <div className="bg-gray-50 px-4 py-2 border-b border-gray-200 flex justify-between items-center">
        <div className="flex items-center gap-2">
          <span className="text-green-600">📊</span>
          <span className="font-medium text-sm text-gray-700">{sheet}</span>
        </div>
        <span className="text-xs text-gray-400 font-mono">{range}</span>
      </div>
      
      <div className="overflow-x-auto max-h-60">
        <table className="w-full text-sm text-left">
          <tbody>
            {data.map((row, rowIndex) => (
              <tr key={rowIndex} className="border-b border-gray-100 last:border-0 hover:bg-gray-50">
                {row.map((cell: any, cellIndex: number) => (
                  <td 
                    key={cellIndex} 
                    className="px-4 py-2 border-r border-gray-100 last:border-0 whitespace-nowrap text-gray-600"
                  >
                    {cell?.toString() ?? ""}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
