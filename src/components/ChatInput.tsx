import React, { useCallback, useRef, useState } from "react";
import type { ContextRef } from "../types";
import { ContextCard } from "./ContextCard";
import { generateId, blobToDataUrl } from "../lib/utils";

interface ChatInputProps {
  contexts: ContextRef[];
  onAddContext: (context: ContextRef) => void;
  onRemoveContext: (id: string) => void;
  onSend: (text: string, contexts: ContextRef[]) => void;
  disabled: boolean;
}

const MAX_IMAGE_SIZE = 20 * 1024 * 1024;

export function ChatInput({ contexts, onAddContext, onRemoveContext, onSend, disabled }: ChatInputProps) {
  const [text, setText] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSend = useCallback(() => {
    const trimmed = text.trim();
    if (!trimmed && contexts.length === 0) return;

    // Smart default: only use "请分析这张图片" for image-only contexts
    const hasImages = contexts.some(c => c.type === "image");
    const hasText = contexts.some(c => c.type === "text");
    const defaultText = (hasImages && !hasText) ? "请分析这张图片" : (hasText ? "请解释这段文字" : "");

    onSend(trimmed || defaultText, contexts);
    setText("");
  }, [text, contexts, onSend]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); }
  }, [handleSend]);

  const handlePaste = useCallback(async (e: React.ClipboardEvent) => {
    const items = e.clipboardData?.items;
    if (!items) return;
    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      if (item.type.startsWith("image/")) {
        e.preventDefault();
        const file = item.getAsFile();
        if (!file) continue;
        try {
          let blob: Blob = file;
          if (file.size > MAX_IMAGE_SIZE) {
            const { compressImage } = await import("../lib/utils");
            blob = await compressImage(file);
          }
          const dataUrl = await blobToDataUrl(blob);
          onAddContext({ id: generateId(), type: "image", content: dataUrl, label: `截图 (${(blob.size / 1024).toFixed(0)} KB)` });
        } catch (err) { console.error("Failed to process pasted image:", err); }
      }
    }
  }, [onAddContext]);

  const handleScreenshotClick = useCallback(() => { fileInputRef.current?.click(); }, []);

  const handleFileChange = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      let blob: Blob = file;
      if (file.size > MAX_IMAGE_SIZE) {
        const { compressImage } = await import("../lib/utils");
        blob = await compressImage(file);
      }
      const dataUrl = await blobToDataUrl(blob);
      onAddContext({ id: generateId(), type: "image", content: dataUrl, label: file.name });
    } catch (err) { console.error("Failed to process image:", err); }
    e.target.value = "";
  }, [onAddContext]);

  return (
    <div className="border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 p-3 space-y-2">
      {contexts.length > 0 && (
        <div className="space-y-1.5">
          {contexts.map((ctx) => <ContextCard key={ctx.id} context={ctx} onRemove={onRemoveContext} />)}
        </div>
      )}
      <div className="flex gap-2 items-end">
        <textarea ref={textareaRef} value={text} onChange={(e) => setText(e.target.value)} onKeyDown={handleKeyDown} onPaste={handlePaste} disabled={disabled}
          placeholder={disabled ? "请先在设置中配置 AI 服务" : "输入问题，或选中文字后点「追问」..."}
          rows={2}
          className="flex-1 resize-none rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2 text-xs text-gray-800 dark:text-gray-200 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed" />
        <div className="flex flex-col gap-1.5">
          <button onClick={handleScreenshotClick} disabled={disabled} className="p-2 rounded-md bg-gray-200 dark:bg-gray-600 hover:bg-gray-300 dark:hover:bg-gray-500 text-gray-600 dark:text-gray-300 transition-colors disabled:opacity-50 disabled:cursor-not-allowed" aria-label="添加截图" title="添加截图">📷</button>
          <input ref={fileInputRef} type="file" accept="image/*" onChange={handleFileChange} className="hidden" />
          <button onClick={handleSend} disabled={disabled || (!text.trim() && contexts.length === 0)} className="p-2 rounded-md bg-blue-500 hover:bg-blue-600 disabled:bg-gray-300 dark:disabled:bg-gray-600 text-white transition-colors disabled:cursor-not-allowed" aria-label="发送">→</button>
        </div>
      </div>
      <div className="text-[10px] text-gray-400 dark:text-gray-500 text-center">Enter 发送 · Shift+Enter 换行 · Ctrl+V 粘贴截图</div>
    </div>
  );
}
