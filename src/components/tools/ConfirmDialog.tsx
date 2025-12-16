"use client";

import { Trash2, Pencil, Eraser, Table, Check, X, AlertTriangle } from "lucide-react";
import type { ActionType, ConfirmActionParams } from "@/lib/tools";
import type { LucideIcon } from "lucide-react";

interface ConfirmDialogProps {
  toolCallId: string;
  args: ConfirmActionParams;
  addToolResult: (result: { toolCallId: string; result: string }) => void;
}

const actionStyles: Record<ActionType, { icon: LucideIcon; bgColor: string; borderColor: string; iconColor: string }> = {
  deleteThread: { icon: Trash2, bgColor: "bg-red-50", borderColor: "border-red-200", iconColor: "text-red-600" },
  updateThreadTitle: { icon: Pencil, bgColor: "bg-blue-50", borderColor: "border-blue-200", iconColor: "text-blue-600" },
  clearMessages: { icon: Eraser, bgColor: "bg-orange-50", borderColor: "border-orange-200", iconColor: "text-orange-600" },
  updateExcelCell: { icon: Table, bgColor: "bg-emerald-50", borderColor: "border-emerald-200", iconColor: "text-emerald-600" },
};

export default function ConfirmDialog({ toolCallId, args, addToolResult }: ConfirmDialogProps) {
  const { actionType, actionTitle, actionDescription, params } = args;
  const style = actionStyles[actionType] || actionStyles.deleteThread;
  const Icon = style.icon;

  const handleConfirm = () => {
    addToolResult({
      toolCallId,
      result: JSON.stringify({ status: "confirmed", actionType, params, message: "Foydalanuvchi tasdiqladi" }),
    });
  };

  const handleReject = () => {
    addToolResult({
      toolCallId,
      result: JSON.stringify({ status: "rejected", actionType, message: "Foydalanuvchi rad etdi" }),
    });
  };

  return (
    <div className={`${style.bgColor} border ${style.borderColor} rounded-xl p-4 my-3 shadow-sm max-w-md`}>
      <div className="flex items-start gap-3">
        <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${style.bgColor} border ${style.borderColor}`}>
          <Icon className={`w-5 h-5 ${style.iconColor}`} />
        </div>
        <div className="flex-1">
          <h3 className="font-semibold text-slate-900 text-base">{actionTitle}</h3>
          <p className="text-sm text-slate-600 mt-1">{actionDescription}</p>
        </div>
      </div>

      <div className="mt-3 px-3 py-2 bg-white/60 rounded-lg text-xs text-slate-500 space-y-0.5">
        {params.threadId && <div><span className="font-medium">Thread ID:</span> {params.threadId}</div>}
        {params.newTitle && <div><span className="font-medium">Yangi nom:</span> {params.newTitle}</div>}
        {params.sheet && <div><span className="font-medium">Sheet:</span> {params.sheet}</div>}
        {params.cell && <div><span className="font-medium">Katak:</span> {params.cell}</div>}
        {params.value !== undefined && <div><span className="font-medium">Yangi qiymat:</span> {String(params.value)}</div>}
      </div>

      <div className="flex gap-2 mt-4 justify-end">
        <button
          onClick={handleReject}
          className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-slate-700 bg-white hover:bg-slate-50 border border-slate-300 rounded-lg transition-colors"
        >
          <X className="w-4 h-4" />
          Yo&apos;q
        </button>
        <button
          onClick={handleConfirm}
          className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
        >
          <Check className="w-4 h-4" />
          Ha, tasdiqlash
        </button>
      </div>

      <div className="flex items-center justify-center gap-1.5 text-xs text-slate-400 mt-3">
        <AlertTriangle className="w-3 h-3" />
        <span>Bu amal qaytarib bo&apos;lmaydi</span>
      </div>
    </div>
  );
}
