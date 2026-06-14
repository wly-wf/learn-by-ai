import { useEffect, useRef } from "react";
import type { OutlineNode } from "../types";
import { PdfViewer } from "./PdfViewer";

interface PdfReaderWrapperProps {
  data: ArrayBuffer;
  outline: OutlineNode[];
  onActiveHeadingChange?: (headingId: string | null) => void;
}

/**
 * Wraps PdfViewer with IntersectionObserver to track which page is visible
 * and update the outline panel's active heading accordingly.
 *
 * Uses a MutationObserver to wait for PdfViewer's async page rendering,
 * then sets up an IntersectionObserver for scroll-based outline sync.
 */
export function PdfReaderWrapper({ data, outline, onActiveHeadingChange }: PdfReaderWrapperProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const observerRef = useRef<IntersectionObserver | null>(null);
  const mutationRef = useRef<MutationObserver | null>(null);

  useEffect(() => {
    if (!onActiveHeadingChange || outline.length === 0) return;
    const container = containerRef.current;
    if (!container) return;

    // Build a sorted map: page number → outline node anchorId
    const pageToAnchorId = new Map<number, string>();
    function walk(nodes: OutlineNode[]) {
      for (const node of nodes) {
        if (node.anchorId) {
          const m = node.anchorId.match(/^pdf-page-(\d+)$/);
          if (m) {
            const pageNum = parseInt(m[1], 10);
            if (!pageToAnchorId.has(pageNum)) {
              pageToAnchorId.set(pageNum, node.anchorId);
            }
          }
        }
        walk(node.children);
      }
    }
    walk(outline);

    if (pageToAnchorId.size === 0) return;

    const sortedPages = Array.from(pageToAnchorId.keys()).sort((a, b) => a - b);

    // PdfViewer renders pages asynchronously. Use MutationObserver to detect
    // when page elements appear in the DOM, then set up the IntersectionObserver.
    const mutationObserver = new MutationObserver(() => {
      const pageElements = container.querySelectorAll('[id^="pdf-page-"]');
      if (pageElements.length === 0) return;

      // Pages found — stop watching DOM mutations
      mutationObserver.disconnect();
      mutationRef.current = null;

      const intersectionObserver = new IntersectionObserver(
        (entries) => {
          const visiblePageNums = entries
            .filter((e) => e.isIntersecting)
            .map((e) => {
              const m = (e.target as HTMLElement).id.match(/^pdf-page-(\d+)$/);
              return m ? parseInt(m[1], 10) : null;
            })
            .filter((n): n is number => n !== null);

          if (visiblePageNums.length === 0) return;

          const topVisiblePage = Math.min(...visiblePageNums);

          let bestAnchorId: string | null = null;
          for (const pageNum of sortedPages) {
            if (pageNum <= topVisiblePage) {
              bestAnchorId = pageToAnchorId.get(pageNum) ?? null;
            } else {
              break;
            }
          }
          if (bestAnchorId) onActiveHeadingChange(bestAnchorId);
        },
        {
          root: container,
          rootMargin: "-5% 0px -80% 0px",
          threshold: 0,
        },
      );

      pageElements.forEach((el) => intersectionObserver.observe(el));
      observerRef.current = intersectionObserver;
    });

    mutationObserver.observe(container, { childList: true, subtree: true });
    mutationRef.current = mutationObserver;

    return () => {
      mutationObserver.disconnect();
      mutationRef.current = null;
      observerRef.current?.disconnect();
      observerRef.current = null;
    };
  }, [outline, onActiveHeadingChange]);

  return (
    <div ref={containerRef} className="h-full overflow-y-auto px-4 py-4">
      <PdfViewer data={data} />
    </div>
  );
}
