import { AlertTriangle, RefreshCcw, X } from "lucide-react";

export default function ErrorMessage({ title = "Произошла ошибка", message, onRetry, onDismiss, showRetry = true }: any) {
  return (
    <div className="max-w-xl bg-red-50 border border-red-200 rounded-xl p-4 shadow-md animate-in fade-in slide-in-from-bottom-3 duration-300">
      <div className="flex gap-3">
        <div className="w-9 h-9 rounded-full bg-red-100 flex items-center justify-center shrink-0 text-red-600 border border-red-200">
          <AlertTriangle className="w-5 h-5" />
        </div>
        <div className="flex-1">
          <h4 className="text-sm font-bold text-red-900">{title}</h4>
          <p className="text-sm text-red-700 mt-1.5 leading-relaxed">{message}</p>
          <div className="flex gap-2 mt-4">
            {showRetry && onRetry && (
              <button onClick={onRetry} className="text-xs flex items-center gap-1.5 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors font-medium shadow-sm">
                <RefreshCcw className="w-3.5 h-3.5" /> Повторить
              </button>
            )}
            {onDismiss && (
              <button onClick={onDismiss} className="text-xs flex items-center gap-1.5 px-4 py-2 bg-white hover:bg-red-50 text-red-600 rounded-lg transition-colors font-medium border border-red-200">
                <X className="w-3.5 h-3.5" /> Закрыть
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
