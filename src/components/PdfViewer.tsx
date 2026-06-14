import React, { useEffect, useLayoutEffect, useState, useRef } from "react";

interface PageMeta {
  pageNum: number;
  viewport: any; // PageViewport from pdfjs-dist
}

interface PageInfo {
  pageNum: number;
  canvasRef: React.RefObject<HTMLCanvasElement | null>;
  textLayerRef: React.RefObject<HTMLDivElement | null>;
  viewportWidth: number;
  viewportHeight: number;
}

interface PdfViewerProps {
  data: ArrayBuffer;
}

/**
 * Lazy PDF page renderer.
 *
 * Phase 1: fetch all page viewports in parallel (metadata only), create DOM with
 *           correct canvas sizes so scrolling works immediately.
 * Phase 2: observe which pages enter the viewport via IntersectionObserver and
 *           render only those pages (canvas + text layer). Already-rendered pages
 *           are skipped. A rootMargin buffer renders pages slightly ahead of scroll.
 */
export function PdfViewer({ data }: PdfViewerProps) {
  const [pages, setPages] = useState<PageInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Refs that survive across renders — used inside IntersectionObserver callback
  const pageInfosRef = useRef<PageInfo[]>([]);
  const renderedRef = useRef<Set<number>>(new Set());
  const pdfRef = useRef<any>(null);
  const pdfjsLibRef = useRef<any>(null);
  const renderingRef = useRef<Set<number>>(new Set()); // Pages currently being rendered (prevent duplicates)
  const observerRef = useRef<IntersectionObserver | null>(null);

  useEffect(() => {
    let safeData: ArrayBuffer;
    try {
      safeData = data.slice(0);
    } catch {
      return;
    }

    let cancelled = false;

    async function load() {
      try {
        setLoading(true);

        const pdfjsLib = await import("pdfjs-dist");
        pdfjsLib.GlobalWorkerOptions.workerSrc =
          "https://unpkg.com/pdfjs-dist@4.0.379/build/pdf.worker.min.mjs";
        pdfjsLibRef.current = pdfjsLib;

        const loadingTask = pdfjsLib.getDocument({ data: new Uint8Array(safeData) });
        const pdf = await loadingTask.promise;
        pdfRef.current = pdf;

        // Phase 1: fetch all page viewports in parallel (metadata only — fast)
        const pageMetas: PageMeta[] = await Promise.all(
          Array.from({ length: pdf.numPages }, async (_, i) => {
            const page = await pdf.getPage(i + 1);
            const viewport = page.getViewport({ scale: 1.5 });
            return { pageNum: i + 1, viewport };
          }),
        );

        if (cancelled) return;

        const pageInfos: PageInfo[] = pageMetas.map(({ pageNum, viewport }) => ({
          pageNum,
          canvasRef: React.createRef<HTMLCanvasElement>(),
          textLayerRef: React.createRef<HTMLDivElement>(),
          viewportWidth: viewport.width,
          viewportHeight: viewport.height,
        }));

        pageInfosRef.current = pageInfos;
        setPages(pageInfos);
        setLoading(false);
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "PDF 加载失败");
          setLoading(false);
        }
      }
    }

    load();
    return () => { cancelled = true; };
  }, [data]);

  // After React commits page skeleton to DOM, set up lazy rendering
  useLayoutEffect(() => {
    if (loading || pages.length === 0) return;

    const container = containerRef.current;
    if (!container) return;

    // Render a single page (canvas + text layer)
    async function renderPage(pageNum: number) {
      const pdf = pdfRef.current;
      const pdfjsLib = pdfjsLibRef.current;
      if (!pdf || !pdfjsLib) return;

      // Prevent duplicate render triggers
      if (renderedRef.current.has(pageNum) || renderingRef.current.has(pageNum)) return;
      renderingRef.current.add(pageNum);

      const info = pageInfosRef.current[pageNum - 1];
      if (!info) { renderingRef.current.delete(pageNum); return; }

      try {
        const page = await pdf.getPage(pageNum);
        const viewport = page.getViewport({ scale: 1.5 });

        const canvas = info.canvasRef.current;
        if (canvas) {
          canvas.width = viewport.width;
          canvas.height = viewport.height;
          const ctx = canvas.getContext("2d")!;
          await page.render({ canvasContext: ctx, viewport }).promise;
        }

        const textLayerDiv = info.textLayerRef.current;
        if (textLayerDiv && pdfjsLib.renderTextLayer) {
          try {
            const textContent = await page.getTextContent();
            const renderTask = pdfjsLib.renderTextLayer({
              textContentSource: textContent,
              container: textLayerDiv,
              viewport,
              textDivs: [],
            });
            if (renderTask?.promise) await renderTask.promise;
          } catch { /* non-critical */ }
        }

        if (textLayerDiv) {
          textLayerDiv.style.height = `${viewport.height}px`;
          textLayerDiv.style.width = `${viewport.width}px`;
        }

        renderedRef.current.add(pageNum);
      } catch { /* page render can fail, don't block other pages */ }

      renderingRef.current.delete(pageNum);
    }

    // Render a batch of pages (limited concurrency)
    async function renderBatch(pageNums: number[]) {
      const unrendered = pageNums.filter(
        (n) => !renderedRef.current.has(n) && !renderingRef.current.has(n),
      );
      // Render up to 4 at a time
      for (let i = 0; i < unrendered.length; i += 4) {
        await Promise.allSettled(unrendered.slice(i, i + 4).map((n) => renderPage(n)));
      }
    }

    // Set up IntersectionObserver for lazy page rendering
    const observer = new IntersectionObserver(
      (entries) => {
        const toRender: number[] = [];
        for (const entry of entries) {
          if (entry.isIntersecting) {
            const m = (entry.target as HTMLElement).id.match(/^pdf-page-(\d+)$/);
            if (m) {
              const pageNum = parseInt(m[1], 10);
              if (!renderedRef.current.has(pageNum) && !renderingRef.current.has(pageNum)) {
                toRender.push(pageNum);
              }
            }
          }
        }
        if (toRender.length > 0) renderBatch(toRender);
      },
      {
        root: container,
        rootMargin: "50% 0px 50% 0px", // Render pages within half viewport ahead
        threshold: 0,
      },
    );

    // Observe all page elements
    const pageElements = container.querySelectorAll('[id^="pdf-page-"]');
    pageElements.forEach((el) => observer.observe(el));
    observerRef.current = observer;

    // Render first page immediately so user sees content
    renderPage(1);

    return () => {
      observer.disconnect();
      observerRef.current = null;
    };
  }, [loading, pages.length]); // Run when Phase 1 completes

  // Clean up rendered set when data changes (new PDF)
  useEffect(() => {
    renderedRef.current = new Set();
    renderingRef.current = new Set();
  }, [data]);

  if (error) {
    return <div className="p-4 text-red-500 text-sm">PDF 渲染失败: {error}</div>;
  }

  if (loading) {
    return <div className="flex items-center justify-center py-12 text-gray-400 text-sm">正在加载 PDF...</div>;
  }

  return (
    <div ref={containerRef} className="pdf-viewer space-y-4">
      <style>{`
        .pdf-text-layer {
          position: absolute;
          left: 0;
          top: 0;
          overflow: hidden;
          opacity: 0.2;
          line-height: 1.0;
          pointer-events: auto;
        }
        .pdf-text-layer span {
          color: transparent;
          position: absolute;
          white-space: pre;
          cursor: text;
          transform-origin: 0% 0%;
        }
        .pdf-text-layer ::selection {
          background: rgba(0, 0, 180, 0.35);
        }
        .pdf-text-layer br {
          display: none;
        }
      `}</style>
      {pages.map(({ pageNum, canvasRef, textLayerRef, viewportWidth, viewportHeight }) => (
        <div key={pageNum} id={`pdf-page-${pageNum}`} className="pdf-page shadow-md bg-white mx-auto relative" style={{ maxWidth: "100%" }}>
          <div className="text-xs text-gray-400 text-center py-1 bg-gray-50 border-b">第 {pageNum} 页</div>
          <div className="relative">
            <canvas ref={canvasRef} width={viewportWidth} height={viewportHeight} className="block mx-auto" style={{ maxWidth: "100%", height: "auto" }} />
            <div ref={textLayerRef} className="pdf-text-layer" />
          </div>
        </div>
      ))}
    </div>
  );
}
