interface FloatingToolbarProps {
  visible: boolean;
  position: { x: number; y: number };
  onAskAI: () => void;
  onTakeNote: () => void;
  onExplain: () => void;
}

export function FloatingToolbar({ visible, position, onAskAI, onTakeNote, onExplain }: FloatingToolbarProps) {
  if (!visible) return null;

  return (
    <div
      className="absolute z-50 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-lg shadow-lg flex gap-0.5 p-1"
      style={{ left: `${position.x}px`, top: `${position.y - 44}px` }}
    >
      <button onClick={onAskAI} className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/50 rounded transition-colors">
        💬 追问
      </button>
      <button onClick={onTakeNote} className="flex items-center gap-1 px-2.5 py-1.5 text-xs text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors">
        📝 笔记
      </button>
      <button onClick={onExplain} className="flex items-center gap-1 px-2.5 py-1.5 text-xs text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors">
        🔍 解释
      </button>
    </div>
  );
}
