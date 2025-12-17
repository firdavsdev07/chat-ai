"use client";

import { useTransition } from "react";
import { AlertTriangle, Trash2, Edit2, Eraser, Table, Loader2, Plus } from "lucide-react";

interface ConfirmDialogProps { 
  toolCallId: string; 
  args: any; 
  addToolResult: (result: { result: string }) => void; 
}

const actionStyles = {
  deleteThread: { icon: Trash2, bgColor: "bg-red-50", borderColor: "border-red-100", iconColor: "text-red-500" },
  clearMessages: { icon: Eraser, bgColor: "bg-orange-50", borderColor: "border-orange-100", iconColor: "text-orange-500" },
  updateThreadTitle: { icon: Edit2, bgColor: "bg-blue-50", borderColor: "border-blue-100", iconColor: "text-blue-500" },
  updateExcelCell: { icon: Table, bgColor: "bg-emerald-50", borderColor: "border-emerald-100", iconColor: "text-emerald-500" },
  deleteExcelRow: { icon: Trash2, bgColor: "bg-red-50", borderColor: "border-red-100", iconColor: "text-red-500" },
  addExcelRow: { icon: Plus, bgColor: "bg-emerald-50", borderColor: "border-emerald-100", iconColor: "text-emerald-500" },
};

export default function ConfirmDialog({ toolCallId, args, addToolResult }: ConfirmDialogProps) {
  const [isPending, startTransition] = useTransition();

  const handleConfirm = () => {
    startTransition(() => {
      // Send confirmation result to AI
      // AI will then automatically call executeConfirmedAction with the params
      addToolResult({ 
        result: JSON.stringify({ 
          status: "confirmed",
          actionType: args.actionType,
          params: args.params
        }) 
      });
    });
  };

  // Defensive: handle missing or malformed args
  if (!args || typeof args !== 'object') {
    console.error('ConfirmDialog: Invalid args', args);
    return null;
  }

  const { actionTitle, actionDescription, actionType, params } = args;
  
  if (!actionTitle || !actionType) {
    console.error('ConfirmDialog: Missing required fields', args);
    return null;
  }

  const style = actionStyles[actionType as keyof typeof actionStyles] || actionStyles.deleteThread;
  const Icon = style.icon;

  return (
    <div className={`mt-3 p-4 rounded-xl border ${style.bgColor} ${style.borderColor}`}>
      <div className="flex gap-4">
        <div className="w-10 h-10 rounded-lg bg-white flex items-center justify-center border border-black/5 shadow-sm">
          <Icon className={`w-5 h-5 ${style.iconColor}`} />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-bold text-slate-800 text-base">{actionTitle}</h3>
          <p className="text-sm text-slate-500 mt-1">{actionDescription}</p>
          {(params?.cell || params?.value) && (
            <div className="mt-3 px-3 py-2 bg-white rounded-lg text-xs text-slate-500 space-y-0.5 border border-slate-200/60 shadow-sm">
              {params.sheet && <div>Jadval: <span className="text-slate-900 font-medium">{params.sheet}</span></div>}
              {params.cell && <div>Katak: <span className="text-slate-900 font-medium">{params.cell}</span></div>}
              {params.value && <div>Qiymat: <span className="text-emerald-600 font-medium">{params.value}</span></div>}
              {params.rowIndex && <div>Qator: <span className="text-slate-900 font-medium">{params.rowIndex}</span></div>}
              {params.rowData && <div>Ma&apos;lumot: <span className="text-slate-600 text-xs">{JSON.stringify(params.rowData)}</span></div>}
            </div>
          )}
          <div className="flex gap-3 mt-4">
            <button 
              onClick={() => addToolResult({ result: JSON.stringify({ status: "rejected" }) })} 
              disabled={isPending} 
              className="px-4 py-2 text-sm font-medium text-slate-600 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
            >
              Bekor qilish
            </button>
            <button 
              onClick={handleConfirm} 
              disabled={isPending} 
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-slate-900 hover:bg-black rounded-lg transition-colors shadow-sm"
            >
              {isPending && <Loader2 className="w-3 h-3 animate-spin" />}
              Tasdiqlash
            </button>
          </div>
        </div>
      </div>
      <div className="flex items-center gap-1.5 text-xs text-slate-400 mt-3 pt-2">
        <AlertTriangle className="w-3.5 h-3.5" />
        <span>Bu amalni qaytarib bo'lmaydi</span>
      </div>
    </div>
  );
}
