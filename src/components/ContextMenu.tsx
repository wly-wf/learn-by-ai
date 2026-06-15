import { useEffect, useRef } from "react";
import { MessageSquare, Globe, FileText } from "lucide-react";

interface ContextMenuProps {
  visible: boolean;
  position: { x: number; y: number };
  onClose: () => void;
  onAskAI: () => void;
  onTranslate: () => void;
  onSummarize: () => void;
}

const menuItemStyle = {
  color: "rgba(255,255,255,0.8)",
  fontSize: "13px",
  padding: "4px 8px",
  borderRadius: "5px",
  display: "flex",
  alignItems: "center",
  gap: "6px",
  width: "100%",
};

export function ContextMenu({ visible, position, onClose, onAskAI, onTranslate, onSummarize }: ContextMenuProps) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!visible) return;
    const handler = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) onClose(); };
    const escHandler = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("mousedown", handler);
    document.addEventListener("keydown", escHandler);
    return () => { document.removeEventListener("mousedown", handler); document.removeEventListener("keydown", escHandler); };
  }, [visible, onClose]);

  if (!visible) return null;

  return (
    <div
      ref={ref}
      className="absolute"
      style={{
        left: `${position.x}px`,
        top: `${position.y}px`,
        background: "rgba(30, 30, 32, 0.94)",
        backdropFilter: "blur(24px)",
        borderRadius: "9px",
        boxShadow: "0 4px 20px rgba(0,0,0,0.15), 0 0 0 0.5px rgba(255,255,255,0.08)",
        padding: "4px",
        zIndex: 50,
      }}
    >
      <button
        onClick={() => { onAskAI(); onClose(); }}
        style={menuItemStyle}
        onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.1)"; }}
        onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = ""; }}
      >
        <MessageSquare size={13} strokeWidth={1.8} /> 追问
      </button>
      <button
        onClick={() => { onTranslate(); onClose(); }}
        style={menuItemStyle}
        onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.1)"; }}
        onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = ""; }}
      >
        <Globe size={13} strokeWidth={1.8} /> 翻译
      </button>
      <button
        onClick={() => { onSummarize(); onClose(); }}
        style={menuItemStyle}
        onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.1)"; }}
        onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = ""; }}
      >
        <FileText size={13} strokeWidth={1.8} /> 总结
      </button>
    </div>
  );
}
