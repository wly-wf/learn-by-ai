import { useState } from "react";
import { Search, FileText, FileType, FileType2, Plus, FolderOpen, X } from "lucide-react";
import type { DocumentMeta, OutlineNode } from "../types";

interface SidebarProps {
  documents: DocumentMeta[];
  activeDocumentId: string | null;
  onSelectDocument: (id: string) => void;
  onCloseDocument: (id: string) => void;
  outline: OutlineNode[];
  activeHeadingId: string | null;
  onNavigate: (anchorId: string) => void;
  onOpenFile: () => void;
  onImportFolder?: () => void;
}

const formatIcons: Record<string, typeof FileText> = {
  txt: FileText,
  md: FileText,
  pdf: FileType,
  docx: FileType2,
};

const formatColors: Record<string, string> = {
  txt: "#86868B",
  md: "#F59E0B",
  pdf: "#EF4444",
  docx: "#3B82F6",
};

function OutlineItem({
  node,
  activeHeadingId,
  onNavigate,
  depth,
}: {
  node: OutlineNode;
  activeHeadingId: string | null;
  onNavigate: (id: string) => void;
  depth: number;
}) {
  const [expanded, setExpanded] = useState(true);
  const hasChildren = node.children.length > 0;
  const isActive = node.anchorId === activeHeadingId;
  const paddingLeft = 8 + depth * 12;

  return (
    <div>
      <div
        onClick={() => {
          if (hasChildren) setExpanded(!expanded);
          if (node.anchorId) onNavigate(node.anchorId);
        }}
        className="flex items-center gap-1 text-[13px] rounded-[5px] cursor-pointer select-none py-1.5"
        style={{
          paddingLeft: `${paddingLeft}px`,
          paddingRight: "6px",
          color: isActive
            ? "var(--accent)"
            : depth === 0
              ? "var(--text-primary)"
              : "var(--text-secondary)",
          background: isActive ? "var(--accent-subtle)" : "transparent",
          fontWeight: isActive ? 500 : 400,
        }}
      >
        {hasChildren ? (
          <span className="text-[11px] w-3 text-center flex-shrink-0">
            {expanded ? "▾" : "▸"}
          </span>
        ) : (
          <span className="w-3 flex-shrink-0" />
        )}
        <span className="truncate">{node.title}</span>
      </div>
      {expanded &&
        hasChildren &&
        node.children.map((child) => (
          <OutlineItem
            key={child.id}
            node={child}
            activeHeadingId={activeHeadingId}
            onNavigate={onNavigate}
            depth={depth + 1}
          />
        ))}
    </div>
  );
}

export function Sidebar({
  documents,
  activeDocumentId,
  onSelectDocument,
  onCloseDocument,
  outline,
  activeHeadingId,
  onNavigate,
  onOpenFile,
  onImportFolder,
}: SidebarProps) {
  return (
    <div
      className="flex flex-col h-full overflow-y-auto px-2 py-2.5"
      style={{
        background: "var(--bg-sidebar)",
        backdropFilter: "blur(20px)",
        borderRight: "0.5px solid var(--border-subtle)",
      }}
    >
      {/* Search placeholder */}
      <div
        className="flex items-center gap-1.5 rounded-[7px] px-2 py-1.5 mb-3"
        style={{ background: "rgba(0,0,0,0.03)" }}
      >
        <Search size={14} strokeWidth={1.8} color="var(--text-tertiary)" />
        <span className="text-[12px]" style={{ color: "var(--text-tertiary)" }}>
          搜索文档...
        </span>
      </div>

      {/* Action buttons */}
      <div className="flex gap-1 mb-3">
        <button
          onClick={onOpenFile}
          className="flex items-center gap-1 px-2 py-1 text-[12px] rounded-md hover:bg-black/5 transition-colors flex-1"
          style={{ color: "var(--text-secondary)" }}
        >
          <Plus size={14} strokeWidth={1.8} /> 打开
        </button>
        {onImportFolder && (
          <button
            onClick={onImportFolder}
            className="flex items-center gap-1 px-2 py-1 text-[12px] rounded-md hover:bg-black/5 transition-colors"
            style={{ color: "var(--text-secondary)" }}
          >
            <FolderOpen size={14} strokeWidth={1.8} /> 导入
          </button>
        )}
      </div>

      {/* Document List */}
      <div className="mb-3">
        <div
          className="text-[11px] uppercase font-semibold tracking-[0.5px] px-1 mb-1"
          style={{ color: "var(--text-tertiary)" }}
        >
          文档
        </div>
        {documents.length === 0 ? (
          <div
            className="text-[12px] py-2 text-center"
            style={{ color: "var(--text-tertiary)" }}
          >
            暂无文档
          </div>
        ) : (
          documents.map((doc) => {
            const FormatIcon = formatIcons[doc.format] || FileText;
            const iconColor = formatColors[doc.format] || "#86868B";
            const isActive = doc.id === activeDocumentId;

            return (
              <div
                key={doc.id}
                onClick={() => onSelectDocument(doc.id)}
                className="flex items-center gap-1.5 text-[13px] rounded-[5px] cursor-pointer group py-1.5 px-1.5"
                style={{
                  color: isActive ? "white" : iconColor,
                  background: isActive ? "var(--accent)" : "transparent",
                }}
              >
                <FormatIcon size={14} strokeWidth={1.8} />
                <span className="truncate flex-1">{doc.fileName}</span>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onCloseDocument(doc.id);
                  }}
                  className="opacity-0 group-hover:opacity-100 p-0.5 rounded hover:bg-black/10 transition-opacity"
                  aria-label={`关闭 ${doc.fileName}`}
                >
                  <X size={12} strokeWidth={1.8} />
                </button>
              </div>
            );
          })
        )}
      </div>

      {/* Outline */}
      <div>
        <div
          className="text-[11px] uppercase font-semibold tracking-[0.5px] px-1 mb-1"
          style={{ color: "var(--text-tertiary)" }}
        >
          大纲
        </div>
        {outline.length === 0 ? (
          <div
            className="text-[12px] py-2 text-center"
            style={{ color: "var(--text-tertiary)" }}
          >
            暂无大纲
          </div>
        ) : (
          outline.map((node) => (
            <OutlineItem
              key={node.id}
              node={node}
              activeHeadingId={activeHeadingId}
              onNavigate={onNavigate}
              depth={0}
            />
          ))
        )}
      </div>
    </div>
  );
}
