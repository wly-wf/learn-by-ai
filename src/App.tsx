import { useState, useCallback, useEffect, useRef } from "react";
import { AppShell } from "./components/AppShell";
import { IconRail, type ViewType } from "./components/IconRail";
import { Titlebar } from "./components/Titlebar";
import { Sidebar } from "./components/Sidebar";
import { ReaderArea } from "./components/ReaderArea";
import { AIPanel } from "./components/AIPanel";
import { SettingsDialog } from "./components/SettingsDialog";
import { AppProvider, useAppContext } from "./contexts/AppContext";
import { ErrorBoundary } from "./components/ErrorBoundary";
import { PdfReaderWrapper } from "./components/PdfReaderWrapper";
import { parseDocument, extractOutline } from "./services/documentParser";
import type { OutlineNode } from "./types";
import { generateId } from "./lib/utils";

interface DocContent {
  html: string;
  outline: OutlineNode[];
  format: string;
  pdfBuffer?: ArrayBuffer;
}

function AppInner() {
  const ctx = useAppContext();
  const ctxRef = useRef(ctx);
  ctxRef.current = ctx;

  const [settingsOpen, setSettingsOpen] = useState(false);
  const [docContents, setDocContents] = useState<Map<string, DocContent>>(new Map());
  const [activeHeadingId, setActiveHeadingId] = useState<string | null>(null);

  // Layout state
  const [activeView, setActiveView] = useState<ViewType>("reading");
  const [showSidebar, setShowSidebar] = useState(true);
  const [showAiDrawer, setShowAiDrawer] = useState(true);
  const [sidebarWidth, setSidebarWidth] = useState(195);
  const [aiDrawerWidth, setAiDrawerWidth] = useState(285);

  const activeContent = ctx.activeDocumentId
    ? docContents.get(ctx.activeDocumentId)
    : undefined;

  const activeDoc = ctx.activeDocument;

  const loadDocumentContent = useCallback(async (_docId: string, content: ArrayBuffer, format: string) => {
    try {
      const contentClone = content.slice(0);
      const result = await parseDocument(content, format as any);
      const newOutline = result.pdfOutline
        ?? extractOutline(format === "md" ? result.rawText : result.html, format as any);

      const docContent: DocContent = {
        html: result.html, outline: newOutline, format,
        pdfBuffer: format === "pdf" ? contentClone : undefined,
      };

      setDocContents((prev) => {
        const next = new Map(prev);
        next.set(_docId, docContent);
        return next;
      });
    } catch (err) {
      const errorHtml = `<div class="error p-4 text-red-500">文档解析失败: ${err instanceof Error ? err.message : "未知错误"}</div>`;
      setDocContents((prev) => {
        const next = new Map(prev);
        next.set(_docId, { html: errorHtml, outline: [], format });
        return next;
      });
    }
  }, []);

  useEffect(() => {
    setDocContents((prev) => {
      const docIds = new Set(ctx.documents.map((d) => d.id));
      const next = new Map(prev);
      let changed = false;
      for (const key of next.keys()) {
        if (!docIds.has(key)) { next.delete(key); changed = true; }
      }
      return changed ? next : prev;
    });
  }, [ctx.documents]);

  useEffect(() => {
    setActiveHeadingId(null);
  }, [ctx.activeDocumentId]);

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
          if (doc.format === "txt" || doc.format === "md") {
            const text = await invoke<string>("read_text_file", { path: selected });
            const buffer = new TextEncoder().encode(text).buffer;
            await loadDocumentContent(doc.id, buffer, doc.format);
          } else {
            const content = await invoke<number[]>("read_file", { path: selected });
            const buffer = new Uint8Array(content).buffer;
            await loadDocumentContent(doc.id, buffer, doc.format);
          }
        } catch {
          const input = document.createElement("input");
          input.type = "file";
          input.accept = ".txt,.pdf,.docx,.doc,.md,.markdown";
          input.onchange = async (e) => {
            const file = (e.target as HTMLInputElement).files?.[0];
            if (file) {
              const doc2 = await ctx.openDocumentFile(file.name);
              const buffer = await file.arrayBuffer();
              await loadDocumentContent(doc2.id, buffer, doc2.format);
            }
          };
          input.click();
        }
      }
    } catch {
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
    setShowAiDrawer(true);
    setActiveView("ai");
  }, []);

  const handleScrollChange = useCallback((pct: number) => {
    const c = ctxRef.current;
    if (c.activeDocumentId) c.updateScrollPosition(c.activeDocumentId, pct);
  }, []);

  const handleViewChange = useCallback((view: ViewType) => {
    setActiveView(view);
    if (view === "outline") setShowSidebar(true);
    if (view === "ai") setShowAiDrawer(true);
  }, []);

  return (
    <>
      <AppShell
        showSidebar={showSidebar}
        showAiDrawer={showAiDrawer}
        sidebarWidth={sidebarWidth}
        aiDrawerWidth={aiDrawerWidth}
        onSidebarWidthChange={setSidebarWidth}
        onAiDrawerWidthChange={setAiDrawerWidth}
        titlebar={
          <Titlebar
            fileName={activeDoc?.fileName}
            format={activeDoc?.format}
            isSaved={!!activeDoc}
            onOpenSettings={() => setSettingsOpen(true)}
          />
        }
        iconRail={
          <IconRail activeView={activeView} onViewChange={handleViewChange} />
        }
        sidebar={
          <Sidebar
            documents={ctx.documents}
            activeDocumentId={ctx.activeDocumentId}
            onSelectDocument={ctx.setActiveDocumentId}
            onCloseDocument={ctx.closeDocument}
            outline={activeContent?.outline || []}
            activeHeadingId={activeHeadingId}
            onNavigate={(anchorId) => {
              const el = document.querySelector(`[id="${anchorId}"]`) || document.getElementById(anchorId);
              if (el) el.scrollIntoView({ behavior: "smooth" });
              setActiveHeadingId(anchorId);
            }}
            onOpenFile={handleOpenFile}
            onImportFolder={handleImportFolder}
          />
        }
        readerArea={
          !activeDoc ? (
            <div className="flex flex-col items-center justify-center h-full" style={{ color: "var(--text-secondary)" }}>
              <span className="text-3xl mb-3 opacity-60">📖</span>
              <span className="text-[14px]">打开一个文档开始阅读</span>
              <span className="text-[13px] mt-1 opacity-60">支持 PDF、Word、Markdown、TXT</span>
            </div>
          ) : activeDoc.format === "pdf" ? (
            activeContent?.pdfBuffer ? (
              <PdfReaderWrapper
                key={ctx.activeDocumentId}
                data={activeContent.pdfBuffer}
                outline={activeContent.outline}
                onActiveHeadingChange={setActiveHeadingId}
              />
            ) : (
              <div className="flex items-center justify-center h-full text-sm" style={{ color: "var(--text-secondary)" }}>正在解析 PDF...</div>
            )
          ) : (
            <ReaderArea document={activeDoc} htmlContent={activeContent?.html || ""}
              onAskAI={handleAskAI}
              onTakeNote={(text) => handleAskAI(text)}
              onExplain={(text) => handleAskAI(text)}
              onTranslate={(text) => handleAskAI(text)}
              onSummarize={(text) => handleAskAI(text)}
              onScrollPositionChange={handleScrollChange}
              onActiveHeadingChange={setActiveHeadingId}
            />
          )
        }
        aiDrawer={showAiDrawer ? (
          <AIPanel conversation={ctx.conversation} hasApiKey={ctx.hasApiKey}
            onSendMessage={async (content, contexts, _convId) => { await ctx.sendMessage(content, contexts); }}
            onNewConversation={ctx.newConversation}
            onClose={() => setShowAiDrawer(false)}
          />
        ) : null}
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
