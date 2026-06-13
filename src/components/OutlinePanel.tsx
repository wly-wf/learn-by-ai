import { useState } from "react";
import type { OutlineNode } from "../types";

interface OutlinePanelProps {
  outline: OutlineNode[];
  activeHeadingId: string | null;
  onNavigate: (anchorId: string) => void;
}

export function OutlinePanel({ outline, activeHeadingId, onNavigate }: OutlinePanelProps) {
  if (outline.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-gray-400 dark:text-gray-500 text-xs p-4">
        <span className="text-2xl mb-2">📭</span>
        <span>暂无大纲</span>
        <span className="mt-1 text-[10px]">导入文档后自动生成</span>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      <div className="px-3 py-2 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider border-b border-gray-200 dark:border-gray-700">
        📁 目录大纲
      </div>
      <div className="flex-1 overflow-y-auto p-2">
        {outline.map((node) => (
          <OutlineItem key={node.id} node={node} activeHeadingId={activeHeadingId} onNavigate={onNavigate} depth={0} />
        ))}
      </div>
    </div>
  );
}

interface OutlineItemProps {
  node: OutlineNode;
  activeHeadingId: string | null;
  onNavigate: (anchorId: string) => void;
  depth: number;
}

function OutlineItem({ node, activeHeadingId, onNavigate, depth }: OutlineItemProps) {
  const [expanded, setExpanded] = useState(true);
  const hasChildren = node.children.length > 0;
  const isActive = node.anchorId === activeHeadingId;

  const handleClick = () => {
    if (hasChildren) setExpanded(!expanded);
    if (node.anchorId) onNavigate(node.anchorId);
  };

  return (
    <div>
      <div
        data-active={isActive ? "true" : "false"}
        onClick={handleClick}
        className={`flex items-center gap-1 px-2 py-1 text-xs rounded cursor-pointer transition-colors select-none ${
          isActive
            ? "bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 font-medium"
            : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
        }`}
        style={{ paddingLeft: `${8 + depth * 14}px` }}
      >
        {hasChildren && <span className="text-[10px] w-3 text-center">{expanded ? "▼" : "▶"}</span>}
        {!hasChildren && <span className="w-3" />}
        <span className="truncate">{node.title}</span>
      </div>
      {expanded && hasChildren && node.children.map((child) => (
        <OutlineItem key={child.id} node={child} activeHeadingId={activeHeadingId} onNavigate={onNavigate} depth={depth + 1} />
      ))}
    </div>
  );
}
