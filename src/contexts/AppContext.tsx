import React, { createContext, useContext, useCallback } from "react";
import type { DocumentMeta, Conversation, AIProvider, AppSettings, ContextRef } from "../types";
import { useDocuments } from "../hooks/useDocuments";
import { useConversation } from "../hooks/useConversation";
import { useSettings } from "../hooks/useSettings";
import { getFileNameFromPath } from "../lib/utils";
import { detectFormat } from "../services/documentParser";

interface AppContextType {
  documents: DocumentMeta[]; activeDocument: DocumentMeta | null; activeDocumentId: string | null;
  openDocumentFile: (filePath: string) => Promise<DocumentMeta>;
  closeDocument: (id: string) => void; setActiveDocumentId: (id: string) => void;
  updateScrollPosition: (id: string, position: number) => void;
  conversation: Conversation | null; sendMessage: (content: string, contexts: ContextRef[]) => Promise<void>; newConversation: () => void;
  hasApiKey: boolean; activeProvider: AIProvider | null; settings: AppSettings;
  addProvider: (p: Omit<AIProvider, "id">) => Promise<void>; removeProvider: (id: string) => Promise<void>;
  setActiveProvider: (id: string) => Promise<void>; setSettings: (s: AppSettings) => Promise<void>;
}

const AppContext = createContext<AppContextType | null>(null);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const docs = useDocuments();
  const settingsHook = useSettings();
  const conv = useConversation(docs.activeDocumentId, settingsHook.activeProvider);

  const openDocumentFile = useCallback(async (filePath: string) => {
    const fileName = getFileNameFromPath(filePath);
    const format = detectFormat(fileName);
    let size = 0;
    try {
      const { invoke } = await import("@tauri-apps/api/core");
      const metadata = await invoke<{ size: number }>("get_file_metadata", { path: filePath });
      size = metadata.size;
    } catch { /* non-Tauri fallback */ }
    return docs.openDocument(fileName, fileName, format, size);
  }, [docs]);

  return (
    <AppContext.Provider value={{
      documents: docs.documents, activeDocument: docs.activeDocument, activeDocumentId: docs.activeDocumentId,
      openDocumentFile, closeDocument: docs.closeDocument, setActiveDocumentId: docs.setActiveDocumentId,
      updateScrollPosition: docs.updateScrollPosition,
      conversation: conv.conversation, sendMessage: conv.sendMessage, newConversation: conv.newConversation,
      hasApiKey: settingsHook.hasApiKey, activeProvider: settingsHook.activeProvider, settings: settingsHook.settings,
      addProvider: settingsHook.addProvider, removeProvider: settingsHook.removeProvider,
      setActiveProvider: settingsHook.setActiveProvider, setSettings: settingsHook.setSettings,
    }}>
      {children}
    </AppContext.Provider>
  );
}

export function useAppContext() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useAppContext must be used within AppProvider");
  return ctx;
}
