export default function TypingIndicator() {
  return (
    <div className="flex justify-start animate-in fade-in slide-in-from-bottom-2 duration-300 ml-8">
      <div className="flex items-center gap-2 px-4 py-3 bg-white border border-slate-100 rounded-2xl rounded-tl-none shadow-sm">
        <div className="flex gap-1">
          <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce [animation-delay:-0.3s]"></span>
          <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce [animation-delay:-0.15s]"></span>
          <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce"></span>
        </div>
      </div>
    </div>
  );
}
