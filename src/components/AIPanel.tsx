import React, { useCallback, useState } from "react";
import { Sparkles, Plus, X } from "lucide-react";
import type { ContextRef, Conversation } from "../types";
import { ChatMessages } from "./ChatMessages";
import { ChatInput } from "./ChatInput";

interface AIPanelProps {
  conversation: Conversation | null;
  hasApiKey: boolean;
  onSendMessage: (content: string, contexts: ContextRef[], conversationId: string) => Promise<void>;
  onNewConversation: () => void;
  onAddTextContext?: (text: string) => void;
  onClose?: () => void;
}

const panelStyle: React.CSSProperties = {
  background: "rgba(252,252,255,0.96)",
  backdropFilter: "blur(30px)",
  borderLeft: "0.5px solid var(--border-subtle)",
};

export function AIPanel({ conversation, hasApiKey, onSendMessage, onNewConversation, onAddTextContext: _onAddTextContext, onClose }: AIPanelProps) {
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

  const addContext = useCallback((ctx: ContextRef) => setContexts((prev) => [...prev, ctx]), []);
  const removeContext = useCallback((id: string) => setContexts((prev) => prev.filter((c) => c.id !== id)), []);

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
      <div className="flex flex-col h-full" style={panelStyle}>
        <div className="flex items-center justify-between px-3.5 py-2.5 border-b" style={{ borderColor: "rgba(0,0,0,0.04)" }}>
          <div className="flex items-center gap-1.5">
            <Sparkles size={14} strokeWidth={1.8} color="var(--accent)" />
            <span className="text-[11px] font-semibold" style={{ color: "var(--text-primary)" }}>AI 对话</span>
          </div>
          {onClose && (
            <button onClick={onClose} className="p-1 rounded hover:bg-black/5 transition-colors" aria-label="关闭 AI 面板">
              <X size={13} strokeWidth={1.8} color="var(--text-secondary)" />
            </button>
          )}
        </div>
        <div className="flex-1 flex flex-col items-center justify-center p-4" style={{ color: "var(--text-secondary)" }}>
          <span className="text-lg mb-2 opacity-50">🔑</span>
          <span className="text-[10px] text-center">请先在设置中配置 AI 服务</span>
          <span className="text-[9px] mt-1 opacity-60 text-center">点击右上角 ⚙️ 添加 API Key</span>
        </div>
        <ChatInput contexts={contexts} onAddContext={addContext} onRemoveContext={removeContext} onSend={() => {}} disabled={true} />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full" style={panelStyle}>
      <div className="flex items-center justify-between px-3.5 py-2.5 border-b" style={{ borderColor: "rgba(0,0,0,0.04)" }}>
        <div className="flex items-center gap-1.5">
          <Sparkles size={14} strokeWidth={1.8} color="var(--accent)" />
          <span className="text-[11px] font-semibold" style={{ color: "var(--text-primary)" }}>AI 对话</span>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={onNewConversation} className="p-1 rounded hover:bg-black/5 transition-colors" title="新对话" aria-label="新对话">
            <Plus size={13} strokeWidth={1.8} color="var(--text-secondary)" />
          </button>
          {onClose && (
            <button onClick={onClose} className="p-1 rounded hover:bg-black/5 transition-colors" aria-label="关闭 AI 面板">
              <X size={13} strokeWidth={1.8} color="var(--text-secondary)" />
            </button>
          )}
        </div>
      </div>
      <ChatMessages messages={conversation?.messages || []} />
      {isLoading && (
        <div className="px-3 py-1">
          <span className="text-[10px] animate-pulse" style={{ color: "var(--text-secondary)" }}>AI 思考中...</span>
        </div>
      )}
      <ChatInput
        contexts={contexts}
        onAddContext={addContext}
        onRemoveContext={removeContext}
        onSend={handleSend}
        disabled={isLoading}
      />
    </div>
  );
}
