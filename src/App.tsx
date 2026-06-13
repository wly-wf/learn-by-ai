import { useState, useCallback } from "react";
import { AppShell } from "./components/AppShell";
import { TopBar } from "./components/TopBar";
import { OutlinePanel } from "./components/OutlinePanel";
import { ReaderArea } from "./components/ReaderArea";
import { AIPanel } from "./components/AIPanel";
import { SettingsDialog } from "./components/SettingsDialog";
import { AppProvider, useAppContext } from "./contexts/AppContext";
import { ErrorBoundary } from "./components/ErrorBoundary";
import { parseDocument, extractOutline } from "./services/documentParser";
import type { OutlineNode } from "./types";
import { generateId } from "./lib/utils";

function AppInner() {
  const ctx = useAppContext();
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [htmlContent, setHtmlContent] = useState("");
  const [outline, setOutline] = useState<OutlineNode[]>([]);
  const [activeHeadingId, setActiveHeadingId] = useState<string | null>(null);

  const loadDocumentContent = useCallback(async (_docId: string, content: ArrayBuffer, format: string) => {
    try {
      const result = await parseDocument(content, format as any);
      setHtmlContent(result.html);
      const newOutline = extractOutline(
        format === "md" ? result.rawText : result.html,
        format as any,
      );
      setOutline(newOutline);
    } catch (err) {
      setHtmlContent(`<div class="error p-4 text-red-500">文档解析失败: ${err instanceof Error ? err.message : "未知错误"}</div>`);
      setOutline([]);
    }
  }, []);

  const handleOpenFile = useCallback(async () => {
    try {
      const { open } = await import("@tauri-apps/plugin-dialog");
      const selected = await open({
        multiple: false,
        filters: [{ name: "文档", extensions: ["txt", "pdf", "docx", "doc", "md", "markdown"] }],
      });
      if (selected && typeof selected === "string") {
        const doc = await ctx.openDocumentFile(selected);
        try {
          const { invoke } = await import("@tauri-apps/api/core");
          const content = await invoke<number[]>("read_file", { path: selected });
          const buffer = new Uint8Array(content).buffer;
          await loadDocumentContent(doc.id, buffer, doc.format);
        } catch { /* Tauri unavailable */ }
      }
    } catch {
      // Fallback: use browser file input
      const input = document.createElement("input");
      input.type = "file";
      input.accept = ".txt,.pdf,.docx,.doc,.md,.markdown";
      input.onchange = async (e) => {
        const file = (e.target as HTMLInputElement).files?.[0];
        if (file) {
          const doc = await ctx.openDocumentFile(file.name);
          const buffer = await file.arrayBuffer();
          await loadDocumentContent(doc.id, buffer, doc.format);
        }
      };
      input.click();
    }
  }, [ctx, loadDocumentContent]);

  const handleImportFolder = useCallback(async () => {
    try {
      const { open } = await import("@tauri-apps/plugin-dialog");
      const selected = await open({ directory: true });
      if (selected && typeof selected === "string") {
        const { invoke } = await import("@tauri-apps/api/core");
        const files = await invoke<Array<{ name: string; path: string; extension: string }>>("list_folder_files", { folderPath: selected });
        for (const file of files) {
          try { await ctx.openDocumentFile(file.path); } catch { /* skip */ }
        }
      }
    } catch { /* folder import requires Tauri */ }
  }, [ctx]);

  const handleAskAI = useCallback((selectedText: string) => {
    window.dispatchEvent(new CustomEvent("add-context", {
      detail: { id: generateId(), type: "text", content: selectedText, label: selectedText.length > 50 ? selectedText.slice(0, 50) + "..." : selectedText },
    }));
  }, []);

  const handleScrollChange = useCallback((pct: number) => {
    if (ctx.activeDocumentId) ctx.updateScrollPosition(ctx.activeDocumentId, pct);
  }, [ctx]);

  return (
    <>
      <AppShell
        topBar={
          <TopBar
            documents={ctx.documents} activeDocumentId={ctx.activeDocumentId}
            onSelectDocument={ctx.setActiveDocumentId} onCloseDocument={ctx.closeDocument}
            onOpenFile={handleOpenFile} onImportFolder={handleImportFolder}
            onOpenSettings={() => setSettingsOpen(true)}
          />
        }
        outlinePanel={
          <OutlinePanel outline={outline} activeHeadingId={activeHeadingId}
            onNavigate={(anchorId) => {
              const el = document.querySelector(`[id="${anchorId}"]`) || document.getElementById(anchorId);
              if (el) el.scrollIntoView({ behavior: "smooth" });
              setActiveHeadingId(anchorId);
            }}
          />
        }
        readerArea={
          <ReaderArea document={ctx.activeDocument} htmlContent={htmlContent}
            onAskAI={handleAskAI}
            onTakeNote={(text) => handleAskAI(text)}
            onExplain={(text) => handleAskAI(text)}
            onTranslate={(text) => handleAskAI(text)}
            onSummarize={(text) => handleAskAI(text)}
            onScrollPositionChange={handleScrollChange}
            onActiveHeadingChange={setActiveHeadingId}
          />
        }
        aiPanel={
          <AIPanel conversation={ctx.conversation} hasApiKey={ctx.hasApiKey}
            onSendMessage={async (content, contexts, _convId) => { await ctx.sendMessage(content, contexts); }}
            onNewConversation={ctx.newConversation}
          />
        }
      />
      <SettingsDialog open={settingsOpen} onClose={() => setSettingsOpen(false)} />
    </>
  );
}

export default function App() {
  return (
    <AppProvider>
      <ErrorBoundary>
        <AppInner />
      </ErrorBoundary>
    </AppProvider>
  );
}
