import type { DocumentMeta } from "../types";

interface TabBarProps {
  documents: DocumentMeta[];
  activeDocumentId: string | null;
  onSelectDocument: (id: string) => void;
  onCloseDocument: (id: string) => void;
}

export function TabBar({
  documents,
  activeDocumentId,
  onSelectDocument,
  onCloseDocument,
}: TabBarProps) {
  if (documents.length === 0) {
    return (
      <div className="flex items-center px-3 text-xs text-gray-400 select-none">
        尚未打开任何文档
      </div>
    );
  }

  return (
    <div className="flex items-center gap-1 overflow-x-auto" role="tablist">
      {documents.map((doc) => {
        const isActive = doc.id === activeDocumentId;
        return (
          <div
            key={doc.id}
            role="tab"
            aria-selected={isActive}
            onClick={() => onSelectDocument(doc.id)}
            className={[
              "flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-t-md cursor-pointer whitespace-nowrap select-none transition-colors",
              isActive
                ? "bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 border-t border-l border-r border-gray-200 dark:border-gray-700"
                : "text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800",
            ].join(" ")}
          >
            <span>{formatIcon(doc.format)}</span>
            <span className="max-w-[120px] truncate">{doc.fileName}</span>
            <button
              onClick={(e) => { e.stopPropagation(); onCloseDocument(doc.id); }}
              className="ml-0.5 p-0.5 rounded hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-400 hover:text-gray-600"
              aria-label={`关闭 ${doc.fileName}`}
            >
              ✕
            </button>
          </div>
        );
      })}
    </div>
  );
}

function formatIcon(format: string): string {
  switch (format) {
    case "pdf": return "📄";
    case "md": return "📝";
    case "docx": return "📊";
    case "txt": return "📃";
    default: return "📎";
  }
}
