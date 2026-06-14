import React, { useEffect, useState, useRef } from "react";

interface PdfViewerProps {
  data: ArrayBuffer;
}

export function PdfViewer({ data }: PdfViewerProps) {
  const [pages, setPages] = useState<Array<{ pageNum: number; canvasRef: React.RefObject<HTMLCanvasElement | null>; textLayerRef: React.RefObject<HTMLDivElement | null> }>>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Clone buffer immediately so pdf.js transfer doesn't detach the prop.
    // React StrictMode double-invokes effects — each needs its own copy.
    let safeData: ArrayBuffer;
    try {
      safeData = data.slice(0);
    } catch {
      return; // Buffer already detached, nothing we can do
    }

    let cancelled = false;

    async function renderPdf() {
      try {
        setLoading(true);
        const pdfjsLib = await import("pdfjs-dist");
        pdfjsLib.GlobalWorkerOptions.workerSrc =
          "https://unpkg.com/pdfjs-dist@4.0.379/build/pdf.worker.min.mjs";

        const loadingTask = pdfjsLib.getDocument({ data: new Uint8Array(safeData) });
        const pdf = await loadingTask.promise;

        const pageRefs: Array<{ pageNum: number; canvasRef: React.RefObject<HTMLCanvasElement | null>; textLayerRef: React.RefObject<HTMLDivElement | null> }> = [];

        for (let i = 1; i <= pdf.numPages; i++) {
          if (cancelled) return;
          pageRefs.push({
            pageNum: i,
            canvasRef: React.createRef<HTMLCanvasElement>(),
            textLayerRef: React.createRef<HTMLDivElement>(),
          });
        }
        setPages(pageRefs);
        setLoading(false);

        for (let i = 1; i <= pdf.numPages; i++) {
          if (cancelled) return;
          const page = await pdf.getPage(i);
          const viewport = page.getViewport({ scale: 1.5 });

          // Allow a tick for React to render the canvas & textLayer divs
          await new Promise((resolve) => setTimeout(resolve, 50));

          const canvas = pageRefs[i - 1].canvasRef.current;
          if (canvas) {
            canvas.width = viewport.width;
            canvas.height = viewport.height;
            const ctx = canvas.getContext("2d")!;
            await page.render({ canvasContext: ctx, viewport }).promise;
          }

          // Render selectable text layer on top of the canvas
          const textLayerDiv = pageRefs[i - 1].textLayerRef.current;
          if (textLayerDiv && pdfjsLib.renderTextLayer) {
            const textContent = await page.getTextContent();
            try {
              const renderTask = pdfjsLib.renderTextLayer({
                textContentSource: textContent,
                container: textLayerDiv,
                viewport,
                textDivs: [],
              });
              if (renderTask?.promise) await renderTask.promise;
            } catch {
              // Text layer rendering can fail on certain PDFs — non-critical
            }
          }

          // Sync text layer height with canvas after rendering
          if (textLayerDiv) {
            textLayerDiv.style.height = `${viewport.height}px`;
            textLayerDiv.style.width = `${viewport.width}px`;
          }
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "PDF 渲染失败");
          setLoading(false);
        }
      }
    }

    renderPdf();
    return () => { cancelled = true; };
  }, [data]);

  if (error) {
    return <div className="p-4 text-red-500 text-sm">PDF 渲染失败: {error}</div>;
  }

  if (loading) {
    return <div className="flex items-center justify-center py-12 text-gray-400 text-sm">正在加载 PDF...</div>;
  }

  return (
    <div ref={containerRef} className="pdf-viewer space-y-4">
      {/* Text layer CSS — injected once via style tag */}
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
      {pages.map(({ pageNum, canvasRef, textLayerRef }) => (
        <div key={pageNum} className="pdf-page shadow-md bg-white mx-auto relative" style={{ maxWidth: "100%" }}>
          <div className="text-xs text-gray-400 text-center py-1 bg-gray-50 border-b">第 {pageNum} 页</div>
          <div className="relative">
            <canvas ref={canvasRef} className="block mx-auto" style={{ maxWidth: "100%", height: "auto" }} />
            <div ref={textLayerRef} className="pdf-text-layer" />
          </div>
        </div>
      ))}
    </div>
  );
}
