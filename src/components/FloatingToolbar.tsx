import { MessageSquare, MapPin, FileText } from "lucide-react";

interface FloatingToolbarProps {
  visible: boolean;
  position: { x: number; y: number };
  onAskAI: () => void;
  onTakeNote: () => void;
  onExplain: () => void;
}

export function FloatingToolbar({ visible, position, onAskAI, onTakeNote, onExplain }: FloatingToolbarProps) {
  if (!visible) return null;

  const btnClass = "flex items-center gap-1.5 text-[12px] px-2 py-1 rounded-[6px] transition-colors";

  return (
    <div
      className="absolute z-40 flex items-center gap-0.5 px-1.5 py-1 rounded-[9px]"
      style={{
        left: `${position.x}px`,
        top: `${position.y - 40}px`,
        background: "rgba(30, 30, 32, 0.94)",
        backdropFilter: "blur(24px)",
        boxShadow: "0 4px 20px rgba(0,0,0,0.15), 0 0 0 0.5px rgba(255,255,255,0.08)",
      }}
    >
      <button onClick={onAskAI} className={btnClass}
        style={{ color: "white", background: "rgba(255,255,255,0.15)" }}>
        <MessageSquare size={13} strokeWidth={1.8} /> 追问
      </button>
      <button onClick={onExplain} className={btnClass}
        style={{ color: "rgba(255,255,255,0.65)" }}>
        <MapPin size={13} strokeWidth={1.8} /> 解释
      </button>
      <button onClick={onTakeNote} className={btnClass}
        style={{ color: "rgba(255,255,255,0.65)" }}>
        <FileText size={13} strokeWidth={1.8} /> 笔记
      </button>
    </div>
  );
}
