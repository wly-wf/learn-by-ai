import type { ContextRef } from "../types";

interface ContextCardProps {
  context: ContextRef;
  onRemove: (id: string) => void;
}

export function ContextCard({ context, onRemove }: ContextCardProps) {
  const isImage = context.type === "image";

  return (
    <div className={`flex items-start gap-2 px-2.5 py-1.5 rounded-md border text-xs ${isImage ? "bg-green-50 dark:bg-green-900/30 border-green-300 dark:border-green-700" : "bg-yellow-50 dark:bg-yellow-900/30 border-yellow-300 dark:border-yellow-700"}`}>
      <span className="flex-shrink-0 mt-0.5">{isImage ? "🖼️" : "📌"}</span>
      <div className="flex-1 min-w-0">
        {isImage ? (
          <div className="flex items-center gap-2">
            <img src={context.content} alt="截图" className="h-10 rounded border border-gray-200 object-cover" />
            <span className="text-gray-600 dark:text-gray-400 truncate text-[10px]">{context.label || "截图"}</span>
          </div>
        ) : (
          <span className="text-gray-700 dark:text-gray-300 line-clamp-2">{context.label || context.content}</span>
        )}
      </div>
      <button
        onClick={(e) => { e.stopPropagation(); e.preventDefault(); console.log("ContextCard remove clicked, id:", context.id); onRemove(context.id); }}
        className="flex-shrink-0 w-5 h-5 flex items-center justify-center rounded-full text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/30 transition-colors leading-none"
        aria-label="删除上下文"
      >
        ×
      </button>
    </div>
  );
}
