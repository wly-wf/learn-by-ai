import React, { useEffect, useState } from "react";
// Vite ?url import: resolves to the correct hashed URL at build time
import pdfWorkerUrl from "pdfjs-dist/build/pdf.worker.min.mjs?url";

interface PdfViewerProps {
  data: ArrayBuffer;
}

export function PdfViewer({ data }: PdfViewerProps) {
  const [pages, setPages] = useState<Array<{ pageNum: number; canvasRef: React.RefObject<HTMLCanvasElement | null> }>>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function renderPdf() {
      try {
        setLoading(true);
        const pdfjsLib = await import("pdfjs-dist");
        pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorkerUrl;

        const loadingTask = pdfjsLib.getDocument({ data: new Uint8Array(data) });
        const pdf = await loadingTask.promise;

        const pageRefs: Array<{ pageNum: number; canvasRef: React.RefObject<HTMLCanvasElement | null> }> = [];

        for (let i = 1; i <= pdf.numPages; i++) {
          if (cancelled) return;
          pageRefs.push({ pageNum: i, canvasRef: React.createRef<HTMLCanvasElement>() });
        }
        setPages(pageRefs);
        setLoading(false);

        // Render pages after state update (in next tick)
        for (let i = 1; i <= pdf.numPages; i++) {
          if (cancelled) return;
          const page = await pdf.getPage(i);
          const viewport = page.getViewport({ scale: 1.5 });

          // Wait for canvas ref to be available
          await new Promise((resolve) => setTimeout(resolve, 50));
          const canvas = pageRefs[i - 1].canvasRef.current;
          if (!canvas) continue;

          canvas.width = viewport.width;
          canvas.height = viewport.height;
          const ctx = canvas.getContext("2d")!;

          await page.render({ canvasContext: ctx, viewport }).promise;
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "PDF 渲染失败");
          setLoading(false);
        }
      }
    }

    renderPdf();
    return () => {
      cancelled = true;
    };
  }, [data]);

  if (error) {
    return <div className="p-4 text-red-500 text-sm">PDF 渲染失败: {error}</div>;
  }

  if (loading) {
    return <div className="flex items-center justify-center py-12 text-gray-400 text-sm">正在加载 PDF...</div>;
  }

  return (
    <div className="pdf-viewer space-y-4">
      {pages.map(({ pageNum, canvasRef }) => (
        <div key={pageNum} className="pdf-page shadow-md bg-white mx-auto" style={{ maxWidth: "100%" }}>
          <div className="text-xs text-gray-400 text-center py-1 bg-gray-50 border-b">第 {pageNum} 页</div>
          <canvas ref={canvasRef} className="block mx-auto" style={{ maxWidth: "100%", height: "auto" }} />
        </div>
      ))}
    </div>
  );
}
