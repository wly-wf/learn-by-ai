import { BookOpen, ListTree, Sparkles, Settings } from "lucide-react";

export type ViewType = "reading" | "outline" | "ai";

interface IconRailProps {
  activeView: ViewType;
  onViewChange: (view: ViewType) => void;
  onOpenSettings: () => void;
  aiUnread?: boolean;
}

const views: Array<{ id: ViewType; icon: typeof BookOpen; label: string }> = [
  { id: "reading", icon: BookOpen, label: "阅读" },
  { id: "outline", icon: ListTree, label: "大纲" },
  { id: "ai", icon: Sparkles, label: "AI 对话" },
];

export function IconRail({ activeView, onViewChange, onOpenSettings, aiUnread }: IconRailProps) {
  return (
    <div className="flex flex-col items-center gap-0.5 pt-2.5 pb-2 w-12 flex-shrink-0"
      style={{ background: "var(--bg-sidebar)", backdropFilter: "blur(20px)", borderRight: "0.5px solid var(--border-subtle)" }}>
      {views.map(({ id, icon: Icon, label }) => {
        const isActive = activeView === id;
        return (
          <button
            key={id}
            onClick={() => onViewChange(id)}
            aria-label={label}
            title={label}
            className="relative w-[30px] h-[30px] rounded-[7px] flex items-center justify-center transition-colors"
            style={{
              background: isActive ? "var(--accent)" : "transparent",
              color: isActive ? "white" : "var(--text-secondary)",
            }}
          >
            <Icon size={16} strokeWidth={1.8} />
            {id === "ai" && aiUnread && (
              <span className="absolute top-1 right-1 w-1.5 h-1.5 rounded-full bg-[#FF3B30]" />
            )}
          </button>
        );
      })}

      {/* Spacer pushes settings to bottom */}
      <div className="flex-1" />

      {/* Settings at bottom-left */}
      <button
        onClick={onOpenSettings}
        aria-label="设置"
        title="设置"
        className="w-[30px] h-[30px] rounded-[7px] flex items-center justify-center transition-colors hover:bg-black/5"
        style={{ color: "var(--text-tertiary)" }}
      >
        <Settings size={16} strokeWidth={1.8} />
      </button>
    </div>
  );
}
