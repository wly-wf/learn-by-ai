import React, { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
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

  // Set innerHTML imperatively outside React's virtual DOM to avoid re-diffing
  // large Word document HTML on every toolbar/context-menu state change.
  useLayoutEffect(() => {
    if (contentRef.current) {
      contentRef.current.innerHTML = DOMPurify.sanitize(htmlContent);
    }
  }, [htmlContent]);

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

  // Only update state when visible actually changes — prevents unnecessary re-renders
  const closeToolbar = useCallback(() => setToolbar((prev) => (prev.visible ? { ...prev, visible: false } : prev)), []);
  const closeContextMenu = useCallback(() => setContextMenu((prev) => (prev.visible ? { ...prev, visible: false } : prev)), []);

  const handleContainerClick = useCallback((_e: React.MouseEvent) => {
    const selection = window.getSelection();
    if (!selection || selection.isCollapsed) {
      closeToolbar();
    }
  }, [closeToolbar]);

  const handleScroll = useCallback(() => {
    if (!contentRef.current) return;
    const { scrollHeight, clientHeight } = contentRef.current;
    if (scrollHeight <= clientHeight) return;

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
        rootMargin: "-10% 0px -70% 0px",
        threshold: 0,
      },
    );

    const headings = container.querySelectorAll("h1[id], h2[id], h3[id], h4[id], h5[id], h6[id]");
    headings.forEach((h) => observer.observe(h));

    return () => observer.disconnect();
  }, [htmlContent, onActiveHeadingChange]);

  if (!document) {
    return (
      <div className="flex flex-col items-center justify-center h-full" style={{ color: "var(--text-secondary)" }}>
        <span className="text-3xl mb-3 opacity-60">📖</span>
        <span className="text-[14px]">打开一个文档开始阅读</span>
        <span className="text-[13px] mt-1 opacity-60">支持 PDF、Word、Markdown、TXT</span>
      </div>
    );
  }

  return (
    <div className="relative h-full overflow-hidden" onClick={handleContainerClick} style={{ background: "var(--bg-app)" }}>
      <div ref={contentRef}
        className="h-full overflow-y-auto max-w-[800px] mx-auto my-4"
        style={{
          background: "var(--bg-card)",
          borderRadius: "12px",
          padding: "36px 40px",
          boxShadow: "0 1px 3px rgba(0,0,0,0.04), 0 0 0 0.5px rgba(0,0,0,0.04)",
        }}
        onMouseUp={handleMouseUp}
        onContextMenu={handleContextMenu}
        onScroll={handleScroll}
      />
      <FloatingToolbar visible={toolbar.visible} position={toolbar.position} onAskAI={() => { onAskAI(toolbar.selectedText); closeToolbar(); }} onTakeNote={() => { onTakeNote(toolbar.selectedText); closeToolbar(); }} onExplain={() => { onExplain(toolbar.selectedText); closeToolbar(); }} />
      <ContextMenu visible={contextMenu.visible} position={contextMenu.position} onClose={closeContextMenu} onAskAI={() => onAskAI(contextMenu.selectedText)} onTranslate={() => onTranslate(contextMenu.selectedText)} onSummarize={() => onSummarize(contextMenu.selectedText)} />
    </div>
  );
});
