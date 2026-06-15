import { FileText, FileType, FileType2 } from "lucide-react";
import type { DocumentFormat } from "../types";

interface TitlebarProps {
  fileName?: string;
  format?: DocumentFormat;
  pageInfo?: string;
  isSaved?: boolean;
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

export function Titlebar({ fileName, format, pageInfo, isSaved }: TitlebarProps) {
  const FormatIcon = format && formatIcons[format] ? formatIcons[format] : FileText;
  const iconColor = format ? formatColors[format] || "#86868B" : "#86868B";

  return (
    <div
      className="flex items-center h-[44px] px-3 gap-2.5 flex-shrink-0 select-none"
      style={{
        background: "var(--bg-sidebar)",
        backdropFilter: "blur(20px)",
        borderBottom: "0.5px solid var(--border-subtle)",
      }}
    >
      {fileName ? (
        <>
          <FormatIcon size={14} strokeWidth={1.8} color={iconColor} />
          <span
            className="text-[14px] font-medium truncate max-w-[200px]"
            style={{ color: "var(--text-primary)" }}
          >
            {fileName}
          </span>
          {isSaved && (
            <span
              className="text-[11px] px-1.5 py-px rounded-[10px] font-medium flex-shrink-0"
              style={{ background: "var(--accent-subtle)", color: "var(--accent)" }}
            >
              已保存
            </span>
          )}
        </>
      ) : (
        <span className="text-[14px] font-semibold" style={{ color: "var(--text-primary)" }}>
          LearnByAI
        </span>
      )}

      <div className="flex-1" />

      {pageInfo && (
        <span className="text-[12px]" style={{ color: "var(--text-secondary)" }}>
          {pageInfo}
        </span>
      )}
    </div>
  );
}
