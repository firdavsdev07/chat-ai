"use client";

import type { ActionType } from "@/lib/tools";

interface ConfirmDialogProps {
  toolCallId: string;
  args: {
    actionType: ActionType;
    actionTitle: string;
    actionDescription: string;
    params: {
      threadId?: number;
      newTitle?: string;
    };
  };
  addToolResult: (result: { toolCallId: string; result: string }) => void;
}

// Action type uchun icon va rang map
const actionStyles: Record<ActionType, { icon: string; bgColor: string; borderColor: string }> = {
  deleteThread: {
    icon: "🗑️",
    bgColor: "bg-red-50",
    borderColor: "border-red-200",
  },
  updateThreadTitle: {
    icon: "✏️",
    bgColor: "bg-blue-50",
    borderColor: "border-blue-200",
  },
  clearMessages: {
    icon: "🧹",
    bgColor: "bg-orange-50",
    borderColor: "border-orange-200",
  },
};

export default function ConfirmDialog({ toolCallId, args, addToolResult }: ConfirmDialogProps) {
  const { actionType, actionTitle, actionDescription, params } = args;
  const style = actionStyles[actionType] || actionStyles.deleteThread;

  const handleConfirm = () => {
    // "confirmed" natijasini AI ga yuborish
    addToolResult({
      toolCallId,
      result: JSON.stringify({
        status: "confirmed",
        actionType,
        params,
        message: "Foydalanuvchi tasdiqladi",
      }),
    });
  };

  const handleReject = () => {
    // "rejected" natijasini AI ga yuborish
    addToolResult({
      toolCallId,
      result: JSON.stringify({
        status: "rejected",
        actionType,
        message: "Foydalanuvchi rad etdi",
      }),
    });
  };

  return (
    <div className={`${style.bgColor} border ${style.borderColor} rounded-xl p-4 my-3 shadow-sm max-w-md`}>
      {/* Header */}
      <div className="flex items-start gap-3">
        <div className="text-2xl">{style.icon}</div>
        <div className="flex-1">
          <h3 className="font-semibold text-gray-900 text-base">
            {actionTitle}
          </h3>
          <p className="text-sm text-gray-600 mt-1">
            {actionDescription}
          </p>
        </div>
      </div>

      {/* Params info */}
      {params.threadId && (
        <div className="mt-3 px-3 py-2 bg-white/60 rounded-lg text-xs text-gray-500">
          <span className="font-medium">Thread ID:</span> {params.threadId}
          {params.newTitle && (
            <>
              <br />
              <span className="font-medium">Yangi nom:</span> {params.newTitle}
            </>
          )}
        </div>
      )}

      {/* Buttons */}
      <div className="flex gap-2 mt-4 justify-end">
        <button
          onClick={handleReject}
          className="px-4 py-2 text-sm font-medium text-gray-700 bg-white hover:bg-gray-100 border border-gray-300 rounded-lg transition-all duration-200 hover:shadow-sm"
        >
          ❌ Yo'q, bekor qilish
        </button>
        <button
          onClick={handleConfirm}
          className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-all duration-200 hover:shadow-md"
        >
          ✅ Ha, tasdiqlash
        </button>
      </div>

      {/* Warning */}
      <p className="text-xs text-gray-400 mt-3 text-center">
        ⚠️ Bu amal qaytarib bo'lmaydi
      </p>
    </div>
  );
}
