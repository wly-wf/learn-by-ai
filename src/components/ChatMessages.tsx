import { useEffect, useRef } from "react";
import type { Message } from "../types";

interface ChatMessagesProps {
  messages: Message[];
}

export function ChatMessages({ messages }: ChatMessagesProps) {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  if (messages.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-gray-400 dark:text-gray-500 text-xs p-4">
        <span className="text-2xl mb-2">🤖</span>
        <span>选中文字或输入问题开始对话</span>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto p-3 space-y-3">
      {messages.map((msg) => (
        <div key={msg.id} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
          <div className={`max-w-[85%] rounded-lg px-3 py-2 text-xs leading-relaxed ${
            msg.role === "user"
              ? "bg-blue-500 text-white"
              : msg.error
                ? "bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-700 text-red-700 dark:text-red-300"
                : "bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200 border border-gray-200 dark:border-gray-600"
          }`}>
            <div className="font-semibold mb-0.5 text-[10px] opacity-70">{msg.role === "user" ? "🙋 你" : "🤖 AI"}</div>
            {msg.contexts && msg.contexts.length > 0 && (
              <div className="mb-1.5 space-y-1">
                {msg.contexts.map((ctx) => (
                  <div key={ctx.id} className="text-[10px] px-2 py-0.5 rounded bg-white/20 text-white/80">
                    {ctx.type === "text" ? `📌 ${ctx.label || ctx.content.slice(0, 50)}` : "🖼️ 截图"}
                  </div>
                ))}
              </div>
            )}
            <div className="whitespace-pre-wrap break-words">{msg.content}</div>
            {msg.error && (
              <div className="mt-1.5 flex items-center gap-2">
                <span className="text-[10px] text-red-500">{msg.error}</span>
                <button className="text-[10px] text-red-500 underline hover:text-red-600">重试</button>
              </div>
            )}
          </div>
        </div>
      ))}
      <div ref={bottomRef} />
    </div>
  );
}
