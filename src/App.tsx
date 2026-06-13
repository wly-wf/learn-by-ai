import { useState, useCallback, useEffect } from "react";
import { AppShell } from "./components/AppShell";
import { TopBar } from "./components/TopBar";
import { OutlinePanel } from "./components/OutlinePanel";
import { ReaderArea } from "./components/ReaderArea";
import { AIPanel } from "./components/AIPanel";
import { SettingsDialog } from "./components/SettingsDialog";
import { AppProvider, useAppContext } from "./contexts/AppContext";
import { ErrorBoundary } from "./components/ErrorBoundary";
import { PdfViewer } from "./components/PdfViewer";
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
  const [settingsOpen, setSettingsOpen] = useState(false);
  // Document content cache keyed by document ID
  const [docContents, setDocContents] = useState<Map<string, DocContent>>(new Map());
  const [activeHeadingId, setActiveHeadingId] = useState<string | null>(null);

  // Get active document's content from cache
  const activeContent = ctx.activeDocumentId
    ? docContents.get(ctx.activeDocumentId)
    : undefined;

  console.log("[App] activeDocumentId:", ctx.activeDocumentId, "docCount:", ctx.documents.length, "cachedDocs:", [...docContents.keys()], "hasActiveContent:", !!activeContent, "outlineLen:", activeContent?.outline?.length);

  const loadDocumentContent = useCallback(async (_docId: string, content: ArrayBuffer, format: string) => {
    console.log("[App] loadDocumentContent called:", { docId: _docId, format, contentBytes: content.byteLength });
    try {
      // Clone buffer for safe storage — parseDocument/pdf.js may transfer the original
      const contentClone = content.slice(0);
      const result = await parseDocument(content, format as any);
      console.log("[App] parseDocument done, rawText len:", result.rawText?.length, "html len:", result.html?.length);
      const sourceForOutline = format === "md" ? result.rawText : result.html;
      console.log("[App] extractOutline source len:", sourceForOutline?.length, "format:", format);
      const newOutline = extractOutline(sourceForOutline, format as any);
      console.log("[App] extractOutline result:", newOutline?.length, "headings:", JSON.stringify(newOutline.slice(0, 3).map(n => n.title)));

      // Store in cache
      const docContent: DocContent = {
        html: result.html,
        outline: newOutline,
        format,
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

  // Clean up closed documents from cache
  useEffect(() => {
    setDocContents((prev) => {
      const docIds = new Set(ctx.documents.map((d) => d.id));
      const next = new Map(prev);
      let changed = false;
      for (const key of next.keys()) {
        if (!docIds.has(key)) {
          next.delete(key);
          changed = true;
        }
      }
      return changed ? next : prev;
    });
  }, [ctx.documents]);

  // Reset heading when switching documents
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
        console.log("[App] Tauri file selected:", selected);
        const doc = await ctx.openDocumentFile(selected);
        console.log("[App] doc created:", { id: doc.id, format: doc.format });
        try {
          const { invoke } = await import("@tauri-apps/api/core");
          if (doc.format === "txt" || doc.format === "md") {
            console.log("[App] using read_text_file for", selected);
            const text = await invoke<string>("read_text_file", { path: selected });
            console.log("[App] read_text_file returned", text?.length, "chars, first 100:", text?.slice(0, 100));
            const buffer = new TextEncoder().encode(text).buffer;
            await loadDocumentContent(doc.id, buffer, doc.format);
          } else {
            console.log("[App] using read_file for", selected);
            const content = await invoke<number[]>("read_file", { path: selected });
            console.log("[App] read_file returned", content?.length, "bytes");
            const buffer = new Uint8Array(content).buffer;
            await loadDocumentContent(doc.id, buffer, doc.format);
          }
        } catch (err) {
          console.warn("[App] Tauri file read failed:", err);
          // Fallback: use browser file input
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
          <OutlinePanel outline={activeContent?.outline || []} activeHeadingId={activeHeadingId}
            onNavigate={(anchorId) => {
              const el = document.querySelector(`[id="${anchorId}"]`) || document.getElementById(anchorId);
              if (el) el.scrollIntoView({ behavior: "smooth" });
              setActiveHeadingId(anchorId);
            }}
          />
        }
        readerArea={
          activeContent?.format === "pdf" && activeContent.pdfBuffer ? (
            <div className="h-full overflow-y-auto px-4 py-4">
              <PdfViewer data={activeContent.pdfBuffer} />
            </div>
          ) : (
            <ReaderArea document={ctx.activeDocument} htmlContent={activeContent?.html || ""}
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
