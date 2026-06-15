import { useEffect, useRef } from "react";
import type { OutlineNode } from "../types";
import { PdfViewer } from "./PdfViewer";

interface PdfReaderWrapperProps {
  data: ArrayBuffer;
  outline: OutlineNode[];
  onActiveHeadingChange?: (headingId: string | null) => void;
}

export function PdfReaderWrapper({ data, outline, onActiveHeadingChange }: PdfReaderWrapperProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const observerRef = useRef<IntersectionObserver | null>(null);

  useEffect(() => {
    if (!onActiveHeadingChange || outline.length === 0) return;
    const container = containerRef.current;
    if (!container) return;

    const pageToAnchorId = new Map<number, string>();
    function walk(nodes: OutlineNode[]) {
      for (const node of nodes) {
        if (node.anchorId) {
          const m = node.anchorId.match(/^pdf-page-(\d+)$/);
          if (m && !pageToAnchorId.has(parseInt(m[1], 10))) {
            pageToAnchorId.set(parseInt(m[1], 10), node.anchorId);
          }
        }
        walk(node.children);
      }
    }
    walk(outline);
    if (pageToAnchorId.size === 0) return;

    const sortedPages = Array.from(pageToAnchorId.keys()).sort((a, b) => a - b);

    // PdfViewer renders asynchronously — wait for page elements via MutationObserver
    const mo = new MutationObserver(() => {
      const pageElements = container.querySelectorAll('[id^="pdf-page-"]');
      if (pageElements.length === 0) return;
      mo.disconnect();

      const io = new IntersectionObserver(
        (entries) => {
          const visible = entries
            .filter((e) => e.isIntersecting)
            .map((e) => {
              const m = (e.target as HTMLElement).id.match(/^pdf-page-(\d+)$/);
              return m ? parseInt(m[1], 10) : null;
            })
            .filter((n): n is number => n !== null);

          if (visible.length === 0) return;
          const topPage = Math.min(...visible);

          let best: string | null = null;
          for (const p of sortedPages) {
            if (p <= topPage) best = pageToAnchorId.get(p) ?? null;
            else break;
          }
          if (best) onActiveHeadingChange(best);
        },
        { root: container, rootMargin: "-5% 0px -80% 0px", threshold: 0 },
      );

      pageElements.forEach((el) => io.observe(el));
      observerRef.current = io;
    });

    mo.observe(container, { childList: true, subtree: true });

    return () => {
      mo.disconnect();
      observerRef.current?.disconnect();
    };
  }, [outline, onActiveHeadingChange]);

  return (
    <div ref={containerRef} className="h-full overflow-y-auto py-4 px-6">
      <div style={{
        background: "var(--bg-card)",
        borderRadius: "12px",
        boxShadow: "0 1px 3px rgba(0,0,0,0.04), 0 0 0 0.5px rgba(0,0,0,0.04)",
        padding: "20px",
        maxWidth: "800px",
        margin: "0 auto",
      }}>
        <PdfViewer data={data} />
      </div>
    </div>
  );
}
