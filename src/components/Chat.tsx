import { ChatProps } from '@/lib/types';
import ConfirmDialog from './tools/ConfirmDialog';

interface ExtendedChatProps extends ChatProps {
  addToolResult?: (result: { toolCallId: string; result: string }) => void;
}

export default function Chat({ messages, isLoading, addToolResult }: ExtendedChatProps) {
  if (messages.length === 0) {
    return (
      <div className="flex-1 overflow-y-auto p-6">
        <div className="text-center text-gray-400 mt-20">
          <p className="text-4xl mb-4">💬</p>
          <p className="text-lg font-medium">Xabar yo'q</p>
          <p className="text-sm mt-2">Birinchi xabaringizni yozing</p>
          <div className="mt-6 text-xs text-gray-300">
            <p>💡 Misol: "Bu thread ni o'chir"</p>
            <p>"Thread nomini o'zgartir"</p>
            <p>"Xabarlarni tozala"</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto p-6 space-y-4">
      {messages.map((m) => (
        <div
          key={m.id}
          className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}
        >
          <div
            className={`max-w-xl px-4 py-3 rounded-2xl ${
              m.role === "user"
                ? "bg-blue-600 text-white"
                : "bg-gray-100 text-gray-900 border border-gray-200"
            }`}
          >
            {/* Message content */}
            {m.content && (
              <div className="text-base whitespace-pre-wrap">
                {m.content}
              </div>
            )}
            
            {/* Tool invocations */}
            {m.role === "assistant" && m.toolInvocations && (
              <div className="mt-2">
                {m.toolInvocations.map((tool: any, i: number) => {
                  // confirmAction tool - render ConfirmDialog
                  if (tool.toolName === "confirmAction" && tool.state === "call" && addToolResult) {
                    return (
                      <ConfirmDialog
                        key={tool.toolCallId || i}
                        toolCallId={tool.toolCallId}
                        args={tool.args}
                        addToolResult={addToolResult}
                      />
                    );
                  }
                  
                  // confirmAction result - ko'rsatish
                  if (tool.toolName === "confirmAction" && tool.state === "result") {
                    const result = typeof tool.result === 'string' 
                      ? JSON.parse(tool.result) 
                      : tool.result;
                    return (
                      <div 
                        key={tool.toolCallId || i}
                        className={`mt-2 px-3 py-2 rounded-lg text-sm ${
                          result.status === "confirmed" 
                            ? "bg-green-50 text-green-700 border border-green-200" 
                            : "bg-red-50 text-red-700 border border-red-200"
                        }`}
                      >
                        {result.status === "confirmed" 
                          ? "✅ Tasdiqlandi" 
                          : "❌ Bekor qilindi"}
                      </div>
                    );
                  }
                  
                  // executeConfirmedAction result
                  if (tool.toolName === "executeConfirmedAction" && tool.state === "result") {
                    const result = tool.result;
                    return (
                      <div 
                        key={tool.toolCallId || i}
                        className={`mt-2 px-3 py-2 rounded-lg text-sm ${
                          result?.success 
                            ? "bg-green-50 text-green-700 border border-green-200" 
                            : "bg-red-50 text-red-700 border border-red-200"
                        }`}
                      >
                        {result?.success ? "✅" : "❌"} {result?.message || "Amal bajarildi"}
                      </div>
                    );
                  }
                  
                  // Loading state for tools
                  if (tool.state === "call" || tool.state === "partial-call") {
                    return (
                      <div 
                        key={tool.toolCallId || i}
                        className="mt-2 px-3 py-2 bg-gray-50 rounded-lg text-sm text-gray-500 flex items-center gap-2"
                      >
                        <div className="animate-spin h-4 w-4 border-2 border-gray-300 border-t-gray-600 rounded-full"></div>
                        {tool.toolName}...
                      </div>
                    );
                  }

                  return null;
                })}
              </div>
            )}
          </div>
        </div>
      ))}
      
      {/* Loading indicator */}
      {isLoading && (
        <div className="flex justify-start">
          <div className="bg-white text-gray-800 border border-gray-200 px-4 py-3 rounded-2xl">
            <div className="flex gap-1">
              <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
              <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "0.1s" }}></div>
              <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "0.2s" }}></div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
