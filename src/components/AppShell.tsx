import React, { useCallback, useRef, useState } from "react";

interface AppShellProps {
  topBar: React.ReactNode;
  outlinePanel: React.ReactNode;
  readerArea: React.ReactNode;
  aiPanel: React.ReactNode;
}

const DEFAULT_LEFT = 16.67;
const DEFAULT_CENTER = 50;
const DEFAULT_RIGHT = 33.33;
const MIN_PANEL_PCT = 10;

export function AppShell({
  topBar,
  outlinePanel,
  readerArea,
  aiPanel,
}: AppShellProps) {
  const [leftPct, setLeftPct] = useState(DEFAULT_LEFT);
  const [centerPct, setCenterPct] = useState(DEFAULT_CENTER);
  const [rightPct, setRightPct] = useState(DEFAULT_RIGHT);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleDividerMouseDown = useCallback(
    (divider: "left-center" | "center-right") => (e: React.MouseEvent) => {
      e.preventDefault();

      const handleMouseMove = (moveEvent: MouseEvent) => {
        if (!containerRef.current) return;
        const rect = containerRef.current.getBoundingClientRect();
        const x = moveEvent.clientX - rect.left;
        const pct = (x / rect.width) * 100;

        if (divider === "left-center") {
          const newLeft = Math.max(MIN_PANEL_PCT, Math.min(pct, 100 - MIN_PANEL_PCT * 2));
          const remaining = 100 - newLeft;
          const ratio = centerPct / (centerPct + rightPct);
          const newCenter = Math.max(MIN_PANEL_PCT, remaining * ratio);
          const newRight = Math.max(MIN_PANEL_PCT, remaining - newCenter);
          setLeftPct(newLeft);
          setCenterPct(newCenter);
          setRightPct(newRight);
        } else {
          const newCenter = Math.max(MIN_PANEL_PCT, Math.min(pct - leftPct, 100 - leftPct - MIN_PANEL_PCT));
          const newRight = Math.max(MIN_PANEL_PCT, 100 - leftPct - newCenter);
          setCenterPct(newCenter);
          setRightPct(newRight);
        }
      };

      const handleMouseUp = () => {
        document.removeEventListener("mousemove", handleMouseMove);
        document.removeEventListener("mouseup", handleMouseUp);
      };

      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", handleMouseUp);
    },
    [leftPct, centerPct, rightPct],
  );

  return (
    <div className="flex flex-col h-screen bg-white dark:bg-gray-900">
      <div className="flex-shrink-0 border-b border-gray-200 dark:border-gray-700">
        {topBar}
      </div>

      <div ref={containerRef} className="flex flex-1 overflow-hidden">
        <div
          data-panel="outline"
          style={{ width: `${leftPct}%` }}
          className="flex-shrink-0 overflow-hidden border-r border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800"
        >
          {outlinePanel}
        </div>

        <div
          data-divider="left-center"
          className="w-1 cursor-col-resize bg-gray-200 dark:bg-gray-600 hover:bg-blue-400 dark:hover:bg-blue-500 transition-colors flex-shrink-0"
          onMouseDown={handleDividerMouseDown("left-center")}
        />

        <div
          data-panel="reader"
          style={{ width: `${centerPct}%` }}
          className="flex-shrink-0 overflow-hidden"
        >
          {readerArea}
        </div>

        <div
          data-divider="center-right"
          className="w-1 cursor-col-resize bg-gray-200 dark:bg-gray-600 hover:bg-blue-400 dark:hover:bg-blue-500 transition-colors flex-shrink-0"
          onMouseDown={handleDividerMouseDown("center-right")}
        />

        <div
          data-panel="ai"
          style={{ width: `${rightPct}%` }}
          className="flex-shrink-0 overflow-hidden border-l border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800"
        >
          {aiPanel}
        </div>
      </div>
    </div>
  );
}
