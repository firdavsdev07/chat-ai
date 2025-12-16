"use client";

import { AlertTriangle, RotateCcw, X } from "lucide-react";

interface ErrorMessageProps {
  title?: string;
  message: string;
  onRetry?: () => void;
  onDismiss?: () => void;
  showRetry?: boolean;
}

export default function ErrorMessage({
  title = "Xatolik yuz berdi",
  message,
  onRetry,
  onDismiss,
  showRetry = true,
}: ErrorMessageProps) {
  return (
    <div className="flex justify-start">
      <div className="max-w-md bg-red-50 border border-red-200 rounded-2xl p-4">
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0 w-8 h-8 bg-red-100 rounded-full flex items-center justify-center">
            <AlertTriangle className="w-4 h-4 text-red-600" />
          </div>
          <div className="flex-1 min-w-0">
            <h4 className="text-sm font-semibold text-red-800">{title}</h4>
            <p className="mt-1 text-sm text-red-600">{message}</p>
          </div>
          {onDismiss && (
            <button onClick={onDismiss} className="flex-shrink-0 p-1 text-red-400 hover:text-red-600 transition-colors">
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
        {showRetry && onRetry && (
          <div className="mt-3">
            <button
              onClick={onRetry}
              className="inline-flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-red-700 bg-red-100 hover:bg-red-200 rounded-lg transition-colors"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Qayta urinish
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
