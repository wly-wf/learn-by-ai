import type { DocumentMeta } from "../types";
import { TabBar } from "./TabBar";

interface TopBarProps {
  documents: DocumentMeta[];
  activeDocumentId: string | null;
  onSelectDocument: (id: string) => void;
  onCloseDocument: (id: string) => void;
  onOpenFile: () => void;
  onImportFolder: () => void;
  onOpenSettings: () => void;
}

export function TopBar({
  documents,
  activeDocumentId,
  onSelectDocument,
  onCloseDocument,
  onOpenFile,
  onImportFolder,
  onOpenSettings,
}: TopBarProps) {
  return (
    <div className="flex flex-col bg-gray-50 dark:bg-gray-800">
      <div className="flex items-center h-9 px-2 gap-2 border-b border-gray-200 dark:border-gray-700">
        <span className="text-sm font-semibold text-gray-800 dark:text-gray-200 mr-2 select-none">
          LearnByAI
        </span>
        <div className="w-px h-5 bg-gray-300 dark:bg-gray-600" />
        <button onClick={onOpenFile} className="flex items-center gap-1 px-2 py-1 text-xs text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 rounded transition-colors">
          <span>📂</span><span>打开</span>
        </button>
        <button onClick={onImportFolder} className="flex items-center gap-1 px-2 py-1 text-xs text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 rounded transition-colors">
          <span>📁</span><span>导入文件夹</span>
        </button>
        <div className="flex-1 ml-3 overflow-hidden">
          <TabBar documents={documents} activeDocumentId={activeDocumentId} onSelectDocument={onSelectDocument} onCloseDocument={onCloseDocument} />
        </div>
        <button onClick={onOpenSettings} className="flex items-center gap-1 px-2 py-1 text-xs text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 rounded transition-colors" aria-label="设置">
          <span>⚙️</span>
        </button>
      </div>
    </div>
  );
}
