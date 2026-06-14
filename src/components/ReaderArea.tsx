import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import DOMPurify from "dompurify";
import type { DocumentMeta } from "../types";
import { FloatingToolbar } from "./FloatingToolbar";
import { ContextMenu } from "./ContextMenu";
import { truncateText } from "../services/documentParser";

interface ReaderAreaProps {
  document: DocumentMeta | null;
  htmlContent: string;
  onAskAI: (selectedText: string) => void;
  onTakeNote: (selectedText: string) => void;
  onExplain: (selectedText: string) => void;
  onTranslate: (selectedText: string) => void;
  onSummarize: (selectedText: string) => void;
  onScrollPositionChange: (scrollPct: number) => void;
  onActiveHeadingChange?: (headingId: string | null) => void;
}

const MAX_CONTEXT_LENGTH = 5000;

export const ReaderArea = React.memo(function ReaderArea({
  document, htmlContent, onAskAI, onTakeNote, onExplain, onTranslate, onSummarize, onScrollPositionChange, onActiveHeadingChange,
}: ReaderAreaProps) {
  const contentRef = useRef<HTMLDivElement>(null);
  const selectionTimerRef = useRef<ReturnType<typeof window.setTimeout> | null>(null);
  const scrollTimerRef = useRef<ReturnType<typeof window.setTimeout> | null>(null);
  const [toolbar, setToolbar] = useState<{ visible: boolean; position: { x: number; y: number }; selectedText: string }>({ visible: false, position: { x: 0, y: 0 }, selectedText: "" });
  const [contextMenu, setContextMenu] = useState<{ visible: boolean; position: { x: number; y: number }; selectedText: string }>({ visible: false, position: { x: 0, y: 0 }, selectedText: "" });

  const getSelectionInfo = useCallback(() => {
    const selection = window.getSelection();
    if (!selection || selection.isCollapsed || !selection.toString().trim()) return null;
    const range = selection.getRangeAt(0);
    const rect = range.getBoundingClientRect();
    const containerRect = contentRef.current?.getBoundingClientRect();
    if (!containerRect) return null;
    return {
      text: truncateText(selection.toString().trim(), MAX_CONTEXT_LENGTH),
      x: rect.left - containerRect.left + rect.width / 2 - 60,
      y: rect.top - containerRect.top,
    };
  }, []);

  const handleMouseUp = useCallback(() => {
    if (selectionTimerRef.current) clearTimeout(selectionTimerRef.current);
    selectionTimerRef.current = setTimeout(() => {
      const info = getSelectionInfo();
      if (info) setToolbar({ visible: true, position: { x: Math.max(0, info.x), y: info.y }, selectedText: info.text });
    }, 300);
  }, [getSelectionInfo]);

  const handleContextMenu = useCallback((e: React.MouseEvent) => {
    const selection = window.getSelection();
    const selectedText = selection?.toString().trim();
    if (selectedText) {
      e.preventDefault();
      const containerRect = contentRef.current?.getBoundingClientRect();
      if (containerRect) {
        setContextMenu({ visible: true, position: { x: e.clientX - containerRect.left, y: e.clientY - containerRect.top }, selectedText: truncateText(selectedText, MAX_CONTEXT_LENGTH) });
      }
    }
  }, []);

  const closeToolbar = useCallback(() => setToolbar((prev) => ({ ...prev, visible: false })), []);
  const closeContextMenu = useCallback(() => setContextMenu((prev) => ({ ...prev, visible: false })), []);

  // Memoize sanitized HTML — DOMPurify is expensive on large documents (e.g. Word)
  // and re-running it on every toolbar/context-menu state change causes visual jitter.
  const sanitizedHtml = useMemo(() => DOMPurify.sanitize(htmlContent), [htmlContent]);

  const handleContainerClick = useCallback((_e: React.MouseEvent) => {
    // Only close toolbar if clicking outside any text selection
    const selection = window.getSelection();
    if (!selection || selection.isCollapsed) {
      closeToolbar();
    }
  }, [closeToolbar]);

  const handleScroll = useCallback(() => {
    if (!contentRef.current) return;
    const { scrollHeight, clientHeight } = contentRef.current;
    if (scrollHeight <= clientHeight) return;

    // Throttle scroll position updates to every 500ms to prevent re-render jitter
    if (scrollTimerRef.current) return;
    scrollTimerRef.current = setTimeout(() => {
      scrollTimerRef.current = null;
      if (!contentRef.current) return;
      const { scrollTop: st, scrollHeight: sh, clientHeight: ch } = contentRef.current;
      if (sh <= ch) return;
      onScrollPositionChange(Math.round((st / (sh - ch)) * 100));
    }, 500);
  }, [onScrollPositionChange]);

  useEffect(() => {
    return () => {
      if (selectionTimerRef.current) clearTimeout(selectionTimerRef.current);
      if (scrollTimerRef.current) clearTimeout(scrollTimerRef.current);
    };
  }, []);

  // IntersectionObserver for heading tracking (bidirectional outline sync)
  useEffect(() => {
    if (!document || !htmlContent || !onActiveHeadingChange) return;

    const container = contentRef.current;
    if (!container) return;

    const observer = new IntersectionObserver(
      (entries) => {
        // Find the topmost visible heading
        const visibleHeadings = entries
          .filter((e) => e.isIntersecting)
          .map((e) => ({
            id: (e.target as HTMLElement).id,
            top: e.boundingClientRect.top,
          }))
          .sort((a, b) => a.top - b.top);

        if (visibleHeadings.length > 0) {
          onActiveHeadingChange(visibleHeadings[0].id);
        }
      },
      {
        root: container,
        rootMargin: "-10% 0px -70% 0px", // Top 10% zone triggers heading change
        threshold: 0,
      },
    );

    // Observe all heading elements with IDs
    const headings = container.querySelectorAll("h1[id], h2[id], h3[id], h4[id], h5[id], h6[id]");
    headings.forEach((h) => observer.observe(h));

    return () => observer.disconnect();
  }, [htmlContent, onActiveHeadingChange]);

  if (!document) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-gray-400 dark:text-gray-500">
        <span className="text-4xl mb-3">📖</span>
        <span className="text-sm">打开一个文档开始阅读</span>
        <span className="text-xs mt-1">支持 PDF、Word、Markdown、TXT</span>
      </div>
    );
  }

  return (
    <div className="relative h-full overflow-hidden" onClick={handleContainerClick}>
      <div ref={contentRef} className="h-full overflow-y-auto px-8 py-6" onMouseUp={handleMouseUp} onContextMenu={handleContextMenu} onScroll={handleScroll}>
        <div className="prose prose-sm dark:prose-invert max-w-none" dangerouslySetInnerHTML={{ __html: sanitizedHtml }} />
      </div>
      <FloatingToolbar visible={toolbar.visible} position={toolbar.position} onAskAI={() => { onAskAI(toolbar.selectedText); closeToolbar(); }} onTakeNote={() => { onTakeNote(toolbar.selectedText); closeToolbar(); }} onExplain={() => { onExplain(toolbar.selectedText); closeToolbar(); }} />
      <ContextMenu visible={contextMenu.visible} position={contextMenu.position} onClose={closeContextMenu} onAskAI={() => onAskAI(contextMenu.selectedText)} onTranslate={() => onTranslate(contextMenu.selectedText)} onSummarize={() => onSummarize(contextMenu.selectedText)} />
    </div>
  );
});
