import React, { useEffect, useState, useRef, useCallback } from "react";

interface PageInfo {
  pageNum: number;
  canvasRef: React.RefObject<HTMLCanvasElement | null>;
  textLayerRef: React.RefObject<HTMLDivElement | null>;
  cssWidth: number;
  cssHeight: number;
}

interface PdfViewerProps {
  data: ArrayBuffer;
}

const CSS_SCALE = 1.0;
const CANVAS_SCALE = Math.min(window.devicePixelRatio || 1, 2);
const MAX_FIT_SCALE = 2.5;

function isCanvasBlank(canvas: HTMLCanvasElement): boolean {
  if (canvas.width === 0 || canvas.height === 0) return true;
  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  if (!ctx) return true;
  // Sample a few pixels from different regions — faster than checking every pixel
  const samplePoints = [
    [0, 0], [canvas.width - 1, 0],
    [0, canvas.height - 1], [canvas.width - 1, canvas.height - 1],
    [Math.floor(canvas.width / 2), Math.floor(canvas.height / 2)],
  ];
  for (const [x, y] of samplePoints) {
    const [r, g, b, a] = ctx.getImageData(x, y, 1, 1).data;
    // If any sampled pixel has visible content, canvas is not blank
    if (a > 0 && (r > 0 || g > 0 || b > 0)) return false;
  }
  return true;
}

export function PdfViewer({ data }: PdfViewerProps) {
  const [pages, setPages] = useState<PageInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [renderGeneration, setRenderGeneration] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const renderTasksRef = useRef<Array<{ cancel: () => void }>>([]);
  const isMountedRef = useRef(true);

  // Force re-render when tab/document becomes visible (handles Chromium canvas reclamation)
  const handleVisibilityChange = useCallback(() => {
    if (document.visibilityState !== "visible") return;
    // Check if any rendered canvas has been blanked by Chromium
    const canvases = containerRef.current?.querySelectorAll("canvas");
    if (!canvases || canvases.length === 0) return;
    for (const canvas of canvases) {
      if (isCanvasBlank(canvas as HTMLCanvasElement)) {
        // Canvas was reclaimed — trigger a full re-render
        setRenderGeneration((g) => g + 1);
        return;
      }
    }
  }, []);

  useEffect(() => {
    document.addEventListener("visibilitychange", handleVisibilityChange);
    // Also listen for focus — WebView2 may reclaim on focus loss
    window.addEventListener("focus", handleVisibilityChange);
    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("focus", handleVisibilityChange);
    };
  }, [handleVisibilityChange]);

  // Track mount state for async safety
  useEffect(() => {
    isMountedRef.current = true;
    return () => { isMountedRef.current = false; };
  }, []);

  useEffect(() => {
    setPages([]);
    setError(null);

    let safeData: ArrayBuffer;
    try {
      safeData = data.slice(0);
    } catch {
      if (isMountedRef.current) {
        setError("无法读取文件数据");
        setLoading(false);
      }
      return;
    }

    let cancelled = false;
    // Clear any pending render tasks from previous run
    renderTasksRef.current.forEach((t) => t.cancel());
    renderTasksRef.current = [];

    async function load() {
      try {
        if (!isMountedRef.current) return;
        setLoading(true);

        const pdfjsLib = await import("pdfjs-dist");
        pdfjsLib.GlobalWorkerOptions.workerSrc =
          "https://unpkg.com/pdfjs-dist@4.0.379/build/pdf.worker.min.mjs";

        const pdf = await pdfjsLib.getDocument({ data: new Uint8Array(safeData) }).promise;
        if (cancelled || !isMountedRef.current) return;

        // Phase 1a: fetch natural (1x) page viewports in parallel
        const naturalMetas = await Promise.all(
          Array.from({ length: pdf.numPages }, async (_, i) => {
            const page = await pdf.getPage(i + 1);
            const vp = page.getViewport({ scale: CSS_SCALE });
            return { pageNum: i + 1, naturalWidth: vp.width, naturalHeight: vp.height };
          }),
        );

        if (cancelled || !isMountedRef.current) return;

        // Phase 1b: compute fit-to-width scale
        const containerWidth = containerRef.current?.clientWidth ?? 0;
        const maxNaturalWidth = Math.max(...naturalMetas.map((m) => m.naturalWidth), 1);
        const fitScale =
          containerWidth > 0
            ? Math.min(containerWidth / maxNaturalWidth, MAX_FIT_SCALE)
            : 1;

        const displayScale = CSS_SCALE * fitScale;
        const renderScale = CANVAS_SCALE * fitScale;

        // Phase 1c: create skeleton with scaled CSS dimensions
        const infos: PageInfo[] = naturalMetas.map(
          ({ pageNum, naturalWidth, naturalHeight }) => ({
            pageNum,
            canvasRef: React.createRef<HTMLCanvasElement>(),
            textLayerRef: React.createRef<HTMLDivElement>(),
            cssWidth: naturalWidth * fitScale,
            cssHeight: naturalHeight * fitScale,
          }),
        );

        if (!isMountedRef.current) return;
        setPages(infos);
        setLoading(false);

        // Let React commit skeleton DOM
        await new Promise((r) => requestAnimationFrame(r));
        if (cancelled || !isMountedRef.current) return;

        // Phase 2: render pages sequentially with active task tracking
        for (let i = 0; i < infos.length; i++) {
          if (cancelled || !isMountedRef.current) return;
          const info = infos[i];
          const page = await pdf.getPage(i + 1);

          const canvasViewport = page.getViewport({ scale: renderScale });
          const cssViewport = page.getViewport({ scale: displayScale });

          const canvas = info.canvasRef.current;
          if (canvas) {
            canvas.width = canvasViewport.width;
            canvas.height = canvasViewport.height;
            canvas.style.width = `${cssViewport.width}px`;
            canvas.style.height = `${cssViewport.height}px`;
            const ctx = canvas.getContext("2d")!;
            const renderTask = page.render({ canvasContext: ctx, viewport: canvasViewport });
            renderTasksRef.current.push(renderTask);
            try {
              await renderTask.promise;
            } catch (renderErr) {
              // Render was cancelled — that's expected during cleanup
              if (!cancelled && isMountedRef.current) throw renderErr;
            }
            // Remove completed task
            renderTasksRef.current = renderTasksRef.current.filter((t) => t !== renderTask);
          }

          const textLayerDiv = info.textLayerRef.current;
          if (textLayerDiv && pdfjsLib.renderTextLayer && !cancelled) {
            try {
              const textContent = await page.getTextContent();
              if (cancelled || !isMountedRef.current) return;
              textLayerDiv.style.width = `${cssViewport.width}px`;
              textLayerDiv.style.height = `${cssViewport.height}px`;
              const textTask = pdfjsLib.renderTextLayer({
                textContentSource: textContent,
                container: textLayerDiv,
                viewport: cssViewport,
                textDivs: [],
              });
              try {
                await textTask.promise;
              } catch { /* non-critical */ }
            } catch { /* non-critical */ }
          }
        }

        // After all pages rendered, verify canvases aren't blank (Chromium may have reclaimed them)
        if (!cancelled && isMountedRef.current) {
          await new Promise((r) => requestAnimationFrame(r));
          for (const info of infos) {
            const canvas = info.canvasRef.current;
            if (canvas && isCanvasBlank(canvas)) {
              // Canvas was reclaimed — retry once
              console.warn(`PdfViewer: page ${info.pageNum} canvas blank after render, retrying...`);
              setRenderGeneration((g) => g + 1);
              return;
            }
          }
        }
      } catch (err) {
        if (!cancelled && isMountedRef.current) {
          setError(err instanceof Error ? err.message : "PDF 加载失败");
          setLoading(false);
        }
      }
    }

    load();

    return () => {
      cancelled = true;
      // Actively cancel all in-flight render tasks — prevents Chromium from
      // completing renders on detached canvases which can trigger resource bugs
      renderTasksRef.current.forEach((t) => t.cancel());
      renderTasksRef.current = [];
    };
  }, [data, renderGeneration]);

  if (error) {
    return <div className="p-4 text-red-500 text-sm">PDF 渲染失败: {error}</div>;
  }

  return (
    <div ref={containerRef} className="pdf-viewer space-y-4">
      <style>{`
        .pdf-text-layer {
          position: absolute; left: 0; top: 0; overflow: hidden;
          opacity: 0.2; line-height: 1.0; pointer-events: auto;
        }
        .pdf-text-layer span {
          color: transparent; position: absolute; white-space: pre;
          cursor: text; transform-origin: 0% 0%;
        }
        .pdf-text-layer ::selection { background: rgba(0, 0, 180, 0.35); }
      `}</style>
      {loading && (
        <div className="flex items-center justify-center py-12 text-gray-400 text-sm">正在加载 PDF...</div>
      )}
      {!loading && pages.map(({ pageNum, canvasRef, textLayerRef, cssWidth, cssHeight }) => (
        <div key={pageNum} id={`pdf-page-${pageNum}`} className="pdf-page shadow-md bg-white mx-auto" style={{ width: `${cssWidth}px`, maxWidth: "100%" }}>
          <div className="text-xs text-gray-400 text-center py-1 bg-gray-50 border-b">第 {pageNum} 页</div>
          <div className="relative" style={{ width: `${cssWidth}px`, height: `${cssHeight}px`, maxWidth: "100%" }}>
            <canvas
              ref={canvasRef}
              className="block mx-auto"
              style={{ width: `${cssWidth}px`, height: `${cssHeight}px`, maxWidth: "100%" }}
            />
            <div ref={textLayerRef} className="pdf-text-layer" style={{ width: `${cssWidth}px`, height: `${cssHeight}px`, maxWidth: "100%" }} />
          </div>
        </div>
      ))}
    </div>
  );
}
