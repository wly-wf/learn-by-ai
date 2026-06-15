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
    <div className="flex-1 overflow-y-auto px-3 py-3" style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
      {messages.map((msg) => (
        <div key={msg.id} style={{ display: "flex", flexDirection: "column", alignItems: msg.role === "user" ? "flex-end" : "flex-start" }}>
          {msg.role === "user" ? (
            <div style={{
              background: "var(--message-user)",
              color: "white",
              fontSize: "13px",
              padding: "10px 14px",
              borderRadius: "12px 12px 3px 12px",
              maxWidth: "80%",
              lineHeight: 1.5,
            }}>
              {msg.contexts && msg.contexts.length > 0 && (
                <div className="mb-1.5 space-y-1">
                  {msg.contexts.map((ctx) => (
                    <div key={ctx.id} className="text-[12px] px-2 py-0.5 rounded bg-white/20 text-white/80">
                      {ctx.type === "text" ? `📌 ${ctx.label || ctx.content.slice(0, 50)}` : "🖼️ 截图"}
                    </div>
                  ))}
                </div>
              )}
              <div className="whitespace-pre-wrap break-words">{msg.content}</div>
            </div>
          ) : msg.error ? (
            <div style={{
              background: "#FEE2E2",
              color: "#991B1B",
              fontSize: "13px",
              padding: "10px 14px",
              borderRadius: "12px 12px 12px 3px",
              maxWidth: "85%",
              lineHeight: 1.5,
            }}>
              <div className="whitespace-pre-wrap break-words">{msg.content}</div>
              <div className="mt-1.5 flex items-center gap-2">
                <span className="text-[12px]">{msg.error}</span>
                <button className="text-[12px] underline hover:opacity-80">重试</button>
              </div>
            </div>
          ) : (
            <div style={{
              background: "var(--message-ai)",
              color: "var(--text-primary)",
              fontSize: "13px",
              padding: "10px 14px",
              borderRadius: "12px 12px 12px 3px",
              maxWidth: "85%",
              lineHeight: 1.5,
            }}>
              <div className="whitespace-pre-wrap break-words">{msg.content}</div>
            </div>
          )}
        </div>
      ))}
      <div ref={bottomRef} />
    </div>
  );
}
