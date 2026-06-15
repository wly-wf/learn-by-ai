import React, { useCallback, useRef } from "react";

interface AppShellProps {
  titlebar: React.ReactNode;
  iconRail: React.ReactNode;
  sidebar: React.ReactNode;
  readerArea: React.ReactNode;
  aiDrawer: React.ReactNode;
  showSidebar: boolean;
  showAiDrawer: boolean;
  sidebarWidth: number;
  aiDrawerWidth: number;
  onSidebarWidthChange?: (w: number) => void;
  onAiDrawerWidthChange?: (w: number) => void;
}

export function AppShell({
  titlebar,
  iconRail,
  sidebar,
  readerArea,
  aiDrawer,
  showSidebar,
  showAiDrawer,
  sidebarWidth,
  aiDrawerWidth,
  onSidebarWidthChange,
  onAiDrawerWidthChange,
}: AppShellProps) {
  const sidebarResizeRef = useRef<{ startX: number; startWidth: number } | null>(null);
  const aiResizeRef = useRef<{ startX: number; startWidth: number } | null>(null);

  const handleSidebarMouseDown = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      sidebarResizeRef.current = { startX: e.clientX, startWidth: sidebarWidth };

      const onMove = (ev: MouseEvent) => {
        if (!sidebarResizeRef.current) return;
        const delta = ev.clientX - sidebarResizeRef.current.startX;
        onSidebarWidthChange?.(Math.max(150, sidebarResizeRef.current.startWidth + delta));
      };
      const onUp = () => {
        sidebarResizeRef.current = null;
        document.removeEventListener("mousemove", onMove);
        document.removeEventListener("mouseup", onUp);
      };
      document.addEventListener("mousemove", onMove);
      document.addEventListener("mouseup", onUp);
    },
    [sidebarWidth, onSidebarWidthChange],
  );

  const handleAiMouseDown = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      aiResizeRef.current = { startX: e.clientX, startWidth: aiDrawerWidth };

      const onMove = (ev: MouseEvent) => {
        if (!aiResizeRef.current) return;
        const delta = aiResizeRef.current.startX - ev.clientX;
        onAiDrawerWidthChange?.(Math.max(200, aiResizeRef.current.startWidth + delta));
      };
      const onUp = () => {
        aiResizeRef.current = null;
        document.removeEventListener("mousemove", onMove);
        document.removeEventListener("mouseup", onUp);
      };
      document.addEventListener("mousemove", onMove);
      document.addEventListener("mouseup", onUp);
    },
    [aiDrawerWidth, onAiDrawerWidthChange],
  );

  return (
    <div className="flex flex-col h-screen" style={{ background: "var(--bg-app)" }}>
      {titlebar}

      <div className="flex flex-1 overflow-hidden">
        {iconRail}

        {showSidebar && sidebar && (
          <>
            <div style={{ width: `${sidebarWidth}px` }} className="flex-shrink-0 overflow-hidden">
              {sidebar}
            </div>
            <div
              className="w-0.5 cursor-col-resize flex-shrink-0 transition-colors hover:bg-[#007AFF]/30"
              onMouseDown={handleSidebarMouseDown}
            />
          </>
        )}

        <div className="flex-1 overflow-hidden">{readerArea}</div>

        {showAiDrawer && aiDrawer && (
          <>
            <div
              className="w-0.5 cursor-col-resize flex-shrink-0 transition-colors hover:bg-[#007AFF]/30"
              onMouseDown={handleAiMouseDown}
            />
            <div style={{ width: `${aiDrawerWidth}px` }} className="flex-shrink-0 overflow-hidden">
              {aiDrawer}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
