import { Link, X } from "lucide-react";
import type { ContextRef } from "../types";

interface ContextCardProps {
  context: ContextRef;
  onRemove: (id: string) => void;
}

export function ContextCard({ context, onRemove }: ContextCardProps) {
  const isImage = context.type === "image";

  return (
    <div style={{
      background: "rgba(0,122,255,0.03)",
      border: "0.5px solid rgba(0,122,255,0.1)",
      borderRadius: "8px",
      padding: "6px 8px",
      display: "flex",
      alignItems: "flex-start",
      gap: "6px",
    }}>
      <Link size={13} strokeWidth={1.8} color="var(--accent)" style={{ flexShrink: 0, marginTop: 1 }} />
      {isImage ? (
        <img src={context.content} alt={context.label} style={{ maxHeight: "40px", borderRadius: "4px", objectFit: "cover" }} />
      ) : (
        <span style={{ flex: 1, fontSize: "12px", color: "var(--text-primary)", lineHeight: 1.4 }}>
          {context.content}
        </span>
      )}
      <button
        onClick={() => onRemove(context.id)}
        className="flex-shrink-0 p-0.5 rounded hover:bg-black/5 transition-colors"
        aria-label={`移除 ${context.label}`}
      >
        <X size={13} strokeWidth={1.8} color="var(--text-tertiary)" />
      </button>
    </div>
  );
}
