"use client";

import { Loader2 } from "lucide-react";

export default function TypingIndicator({ message = "AI javob yozmoqda..." }: { message?: string }) {
  return (
    <div className="flex justify-start">
      <div className="flex items-center gap-3 px-4 py-3 bg-white border border-slate-200 rounded-2xl text-slate-600 shadow-sm">
        <Loader2 className="w-4 h-4 animate-spin text-blue-500" />
        <span className="text-sm font-medium">{message}</span>
      </div>
    </div>
  );
}
