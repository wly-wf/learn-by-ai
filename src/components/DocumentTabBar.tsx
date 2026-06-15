import { FileText, FileType, FileType2, X, Plus } from "lucide-react";
import type { DocumentMeta } from "../types";

interface DocumentTabBarProps {
  documents: DocumentMeta[];
  activeDocumentId: string | null;
  onSelectDocument: (id: string) => void;
  onCloseDocument: (id: string) => void;
  onOpenFile: () => void;
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

export function DocumentTabBar({
  documents,
  activeDocumentId,
  onSelectDocument,
  onCloseDocument,
  onOpenFile,
}: DocumentTabBarProps) {
  return (
    <div
      className="flex items-center h-[36px] flex-shrink-0 gap-0.5 px-1 overflow-x-auto"
      style={{
        background: "var(--bg-sidebar)",
        borderBottom: "0.5px solid var(--border-subtle)",
      }}
    >
      {documents.map((doc) => {
        const FormatIcon = formatIcons[doc.format] || FileText;
        const iconColor = formatColors[doc.format] || "#86868B";
        const isActive = doc.id === activeDocumentId;

        return (
          <div
            key={doc.id}
            onClick={() => onSelectDocument(doc.id)}
            className="flex items-center gap-1.5 text-[12px] rounded-t-md cursor-pointer group flex-shrink-0 max-w-[180px] h-[30px] px-2.5 transition-colors select-none"
            style={{
              color: isActive ? "var(--text-primary)" : "var(--text-secondary)",
              background: isActive ? "var(--bg-card)" : "transparent",
              borderBottom: isActive ? "2px solid var(--accent)" : "2px solid transparent",
            }}
          >
            <FormatIcon size={13} strokeWidth={1.8} color={isActive ? iconColor : "var(--text-tertiary)"} />
            <span className="truncate flex-1">{doc.fileName}</span>
            <button
              onClick={(e) => { e.stopPropagation(); onCloseDocument(doc.id); }}
              className="flex-shrink-0 p-0.5 rounded-sm hover:bg-black/10 opacity-0 group-hover:opacity-100 transition-opacity"
              aria-label={`关闭 ${doc.fileName}`}
            >
              <X size={11} strokeWidth={1.8} />
            </button>
          </div>
        );
      })}

      {/* Add tab button */}
      <button
        onClick={onOpenFile}
        className="flex-shrink-0 p-1 rounded-md hover:bg-black/5 transition-colors ml-1"
        aria-label="打开文件"
        title="打开文件"
      >
        <Plus size={14} strokeWidth={1.8} color="var(--text-secondary)" />
      </button>

      {/* Empty state */}
      {documents.length === 0 && (
        <span className="text-[12px] px-2" style={{ color: "var(--text-tertiary)" }}>
          打开文件开始阅读 — 点击 <span style={{ color: "var(--accent)" }}>+</span> 或拖拽文件
        </span>
      )}
    </div>
  );
}
