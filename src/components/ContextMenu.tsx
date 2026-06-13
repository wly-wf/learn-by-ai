import { useEffect, useRef } from "react";

interface ContextMenuProps {
  visible: boolean;
  position: { x: number; y: number };
  onClose: () => void;
  onAskAI: () => void;
  onTranslate: () => void;
  onSummarize: () => void;
}

export function ContextMenu({ visible, position, onClose, onAskAI, onTranslate, onSummarize }: ContextMenuProps) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!visible) return;
    const handler = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) onClose(); };
    const escHandler = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("mousedown", handler);
    document.addEventListener("keydown", escHandler);
    return () => { document.removeEventListener("mousedown", handler); document.removeEventListener("keydown", escHandler); };
  }, [visible, onClose]);

  if (!visible) return null;

  return (
    <div ref={ref} className="absolute z-50 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-lg shadow-lg py-1 min-w-[140px]" style={{ left: `${position.x}px`, top: `${position.y}px` }}>
      <button onClick={() => { onAskAI(); onClose(); }} className="w-full text-left px-3 py-1.5 text-xs text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">🤖 AI 提问</button>
      <button onClick={() => { onTranslate(); onClose(); }} className="w-full text-left px-3 py-1.5 text-xs text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">🌐 AI 翻译</button>
      <button onClick={() => { onSummarize(); onClose(); }} className="w-full text-left px-3 py-1.5 text-xs text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">📋 AI 总结</button>
    </div>
  );
}
