import { ThreadsProps } from '@/lib/types';

export default function Threads({ threads, activeId, onNew, onSelect }: ThreadsProps) {
  return (
    <div className="w-80 bg-white border-r border-gray-200 flex flex-col">
      <div className="p-4 border-b border-gray-200">
        <button
          onClick={onNew}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-4 rounded-lg transition-colors flex items-center justify-center gap-2"
        >
          <span className="text-xl">+</span>
          Yangi Chat
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-2">
        <h2 className="text-xs font-semibold text-gray-500 uppercase px-3 py-2">
          Chatlar
        </h2>
        {threads.map((t) => (
          <div
            key={t.id}
            className={`p-3 mx-2 mb-1 rounded-lg cursor-pointer transition-colors ${
              activeId === t.id
                ? "bg-blue-600 text-white"
                : "hover:bg-gray-100 text-gray-700"
            }`}
            onClick={() => onSelect(t.id)}
          >
            <div className="font-medium text-sm truncate">{t.title}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
