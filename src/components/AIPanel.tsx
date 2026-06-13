import React, { useCallback, useState } from "react";
import type { ContextRef, Conversation } from "../types";
import { ChatMessages } from "./ChatMessages";
import { ChatInput } from "./ChatInput";

interface AIPanelProps {
  conversation: Conversation | null;
  hasApiKey: boolean;
  onSendMessage: (content: string, contexts: ContextRef[], conversationId: string) => Promise<void>;
  onNewConversation: () => void;
  onAddTextContext?: (text: string) => void;
}

export function AIPanel({ conversation, hasApiKey, onSendMessage, onNewConversation, onAddTextContext: _onAddTextContext }: AIPanelProps) {
  const [contexts, setContexts] = useState<ContextRef[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const handleSend = useCallback(async (text: string, ctxs: ContextRef[]) => {
    if (!conversation) return;
    setIsLoading(true);
    try {
      await onSendMessage(text, ctxs, conversation.id);
      setContexts([]);
    } finally {
      setIsLoading(false);
    }
  }, [conversation, onSendMessage]);

  // Listen for add-context events from ReaderArea
  React.useEffect(() => {
    const handler = (e: Event) => {
      const detail = (e as CustomEvent).detail as ContextRef;
      if (detail) setContexts((prev) => [...prev, detail]);
    };
    window.addEventListener("add-context", handler);
    return () => window.removeEventListener("add-context", handler);
  }, []);

  if (!hasApiKey) {
    return (
      <div className="flex flex-col h-full">
        <div className="px-3 py-2 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider border-b border-gray-200 dark:border-gray-700">🤖 AI 对话</div>
        <div className="flex-1 flex flex-col items-center justify-center text-gray-400 dark:text-gray-500 p-4">
          <span className="text-2xl mb-2">🔑</span>
          <span className="text-xs text-center">请先在设置中配置 AI 服务</span>
          <span className="text-[10px] mt-1 text-center">点击右上角 ⚙️ 添加 API Key</span>
        </div>
        <ChatInput contexts={contexts} onAddContext={() => {}} onRemoveContext={() => {}} onSend={() => {}} disabled={true} />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between px-3 py-2 border-b border-gray-200 dark:border-gray-700">
        <span className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">🤖 AI 对话</span>
        <button onClick={onNewConversation} className="text-[10px] text-blue-500 hover:text-blue-600 dark:text-blue-400 transition-colors">+ 新会话</button>
      </div>
      <ChatMessages messages={conversation?.messages || []} />
      {isLoading && <div className="px-3 py-1.5 text-[10px] text-gray-400 animate-pulse">🤖 AI 思考中...</div>}
      <ChatInput
        contexts={contexts}
        onAddContext={(ctx) => setContexts((prev) => [...prev, ctx])}
        onRemoveContext={(id) => setContexts((prev) => prev.filter((c) => c.id !== id))}
        onSend={handleSend}
        disabled={isLoading}
      />
    </div>
  );
}
