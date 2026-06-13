import React, { useCallback, useEffect, useRef, useState } from "react";
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
}

const MAX_CONTEXT_LENGTH = 5000;

export function ReaderArea({
  document, htmlContent, onAskAI, onTakeNote, onExplain, onTranslate, onSummarize, onScrollPositionChange,
}: ReaderAreaProps) {
  const contentRef = useRef<HTMLDivElement>(null);
  const selectionTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
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

  const handleScroll = useCallback(() => {
    if (!contentRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = contentRef.current;
    if (scrollHeight <= clientHeight) return;
    onScrollPositionChange(Math.round((scrollTop / (scrollHeight - clientHeight)) * 100));
  }, [onScrollPositionChange]);

  useEffect(() => { return () => { if (selectionTimerRef.current) clearTimeout(selectionTimerRef.current); }; }, []);

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
    <div className="relative h-full overflow-hidden">
      <div ref={contentRef} className="h-full overflow-y-auto px-8 py-6" onMouseUp={handleMouseUp} onContextMenu={handleContextMenu} onClick={closeToolbar} onScroll={handleScroll}>
        <div className="prose prose-sm dark:prose-invert max-w-none" dangerouslySetInnerHTML={{ __html: htmlContent }} />
      </div>
      <FloatingToolbar visible={toolbar.visible} position={toolbar.position} onAskAI={() => { onAskAI(toolbar.selectedText); closeToolbar(); }} onTakeNote={() => { onTakeNote(toolbar.selectedText); closeToolbar(); }} onExplain={() => { onExplain(toolbar.selectedText); closeToolbar(); }} />
      <ContextMenu visible={contextMenu.visible} position={contextMenu.position} onClose={closeContextMenu} onAskAI={() => onAskAI(contextMenu.selectedText)} onTranslate={() => onTranslate(contextMenu.selectedText)} onSummarize={() => onSummarize(contextMenu.selectedText)} />
    </div>
  );
}
