import { useState, useEffect, useCallback } from "react";
import { storageService } from "../services/storage";
import type { Conversation, Message, ContextRef, AIProvider } from "../types";
import { generateId } from "../lib/utils";
import { AIClient } from "../services/aiClient";

export function useConversation(documentId: string | null, activeProvider: AIProvider | null) {
  const [conversation, setConversation] = useState<Conversation | null>(null);

  useEffect(() => {
    if (!documentId) { setConversation(null); return; }
    storageService.getConversationsByDocument(documentId).then((convs) => {
      if (convs.length > 0) {
        setConversation(convs[0]);
      } else {
        const newConv: Conversation = { id: generateId(), documentId, title: "对话", messages: [], createdAt: Date.now(), updatedAt: Date.now() };
        storageService.saveConversation(newConv); setConversation(newConv);
      }
    });
  }, [documentId]);

  const sendMessage = useCallback(async (content: string, contexts: ContextRef[]) => {
    if (!conversation || !activeProvider) return;
    const client = new AIClient(activeProvider);
    const userMsg: Message = { id: generateId(), role: "user", content, contexts: contexts.length > 0 ? contexts : undefined, timestamp: Date.now() };
    const updatedConv: Conversation = { ...conversation, messages: [...conversation.messages, userMsg], updatedAt: Date.now() };
    setConversation(updatedConv); await storageService.saveConversation(updatedConv);

    try {
      const reply = contexts.length > 0 ? await client.chatWithContext(content, contexts) : await client.chat([...updatedConv.messages]);
      const aiMsg: Message = { id: generateId(), role: "assistant", content: reply, timestamp: Date.now() };
      const finalConv: Conversation = { ...updatedConv, messages: [...updatedConv.messages, aiMsg], updatedAt: Date.now(), title: updatedConv.messages[0]?.content.slice(0, 30) || "对话" };
      setConversation(finalConv); await storageService.saveConversation(finalConv);
    } catch (err) {
      const errorMsg: Message = { id: generateId(), role: "assistant", content: "", error: err instanceof Error ? err.message : "未知错误", timestamp: Date.now() };
      const errConv: Conversation = { ...updatedConv, messages: [...updatedConv.messages, errorMsg], updatedAt: Date.now() };
      setConversation(errConv); await storageService.saveConversation(errConv);
    }
  }, [conversation, activeProvider]);

  const newConversation = useCallback(async () => {
    if (!documentId) return;
    const newConv: Conversation = { id: generateId(), documentId, title: "新对话", messages: [], createdAt: Date.now(), updatedAt: Date.now() };
    await storageService.saveConversation(newConv); setConversation(newConv);
  }, [documentId]);

  return { conversation, sendMessage, newConversation };
}
