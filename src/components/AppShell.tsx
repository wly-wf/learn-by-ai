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
  // Refs for direct DOM manipulation during drag (avoids React re-renders on every mousemove)
  const sidebarElRef = useRef<HTMLDivElement>(null);
  const aiDrawerElRef = useRef<HTMLDivElement>(null);

  const handleSidebarMouseDown = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      const startX = e.clientX;
      const startWidth = sidebarElRef.current?.offsetWidth ?? sidebarWidth;
      document.body.style.cursor = "col-resize";
      document.body.style.userSelect = "none";

      const onMove = (ev: MouseEvent) => {
        const newWidth = Math.max(150, startWidth + (ev.clientX - startX));
        if (sidebarElRef.current) {
          sidebarElRef.current.style.width = `${newWidth}px`;
        }
      };
      const onUp = () => {
        document.body.style.cursor = "";
        document.body.style.userSelect = "";
        document.removeEventListener("mousemove", onMove);
        document.removeEventListener("mouseup", onUp);
        // Commit final width to React state only on mouseup
        const finalWidth = sidebarElRef.current?.offsetWidth;
        if (finalWidth) onSidebarWidthChange?.(finalWidth);
      };
      document.addEventListener("mousemove", onMove);
      document.addEventListener("mouseup", onUp);
    },
    [sidebarWidth, onSidebarWidthChange],
  );

  const handleAiMouseDown = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      const startX = e.clientX;
      const startWidth = aiDrawerElRef.current?.offsetWidth ?? aiDrawerWidth;
      document.body.style.cursor = "col-resize";
      document.body.style.userSelect = "none";

      const onMove = (ev: MouseEvent) => {
        const newWidth = Math.max(200, startWidth + (startX - ev.clientX));
        if (aiDrawerElRef.current) {
          aiDrawerElRef.current.style.width = `${newWidth}px`;
        }
      };
      const onUp = () => {
        document.body.style.cursor = "";
        document.body.style.userSelect = "";
        document.removeEventListener("mousemove", onMove);
        document.removeEventListener("mouseup", onUp);
        const finalWidth = aiDrawerElRef.current?.offsetWidth;
        if (finalWidth) onAiDrawerWidthChange?.(finalWidth);
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
            <div
              ref={sidebarElRef}
              style={{ width: `${sidebarWidth}px` }}
              className="flex-shrink-0 overflow-hidden"
            >
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
            <div
              ref={aiDrawerElRef}
              style={{ width: `${aiDrawerWidth}px` }}
              className="flex-shrink-0 overflow-hidden"
            >
              {aiDrawer}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
