# LearnByAI — Project Reference

## Overview

AI-assisted learning Windows desktop app. Three-column layout: outline (left), document reader (center), AI chat panel (right). Supports txt/pdf/docx/md.

## Tech Stack

- **Desktop shell:** Tauri v2 (Rust backend + WebView2 frontend)
- **Frontend:** React 18 + TypeScript 5.8 + Tailwind CSS v4
- **Build:** Vite 7, Cargo (Rust)
- **Key dependencies:**
  - `pdfjs-dist` 4.0.379 — PDF rendering (canvas + text layer)
  - `mammoth` 1.12 — DOCX → HTML
  - `marked` 18 — Markdown → HTML
  - `DOMPurify` 3.4 — XSS sanitization
  - `idb` 8.0 — IndexedDB wrapper for local persistence

## Development Commands

```bash
# Run the app (Tauri dev window)
npm run tauri dev

# Run frontend only (browser, no Tauri APIs)
npm run dev          # Vite at http://localhost:1420

# Type check
npx tsc --noEmit

# Run unit tests
npx vitest run

# Rust build
cd src-tauri && cargo build
```

## Critical Build Configuration

**File:** `src-tauri/.cargo/config.toml`

```toml
[target.x86_64-pc-windows-gnu]
rustflags = ["-C", "link-arg=-Wl,--exclude-all-symbols"]
```

**Why this is needed:** Without `--exclude-all-symbols`, GNU `ld` auto-exports every symbol from all linked `.rlib` crates into the final DLL. For Tauri's 200+ dependency crates, this generates 100k+ exported symbols, exceeding the PE format's 16-bit ordinal limit (max 65535). The error is:

```
export ordinal too large: 109526
collect2.exe: error: ld returned 1 exit status
```

The `--exclude-all-symbols` flag tells `ld` to only export symbols explicitly listed in Tauri's auto-generated `.def` file (a few dozen), keeping the ordinal table small.

**Toolchain:** `stable-x86_64-pc-windows-gnu` (Rust GNU toolchain via MSYS2/MinGW). The MSVC toolchain is also installed but **not** used because it requires the Windows SDK (Visual Studio Build Tools) which is not installed. The GNU toolchain works correctly with the exclude-all-symbols flag.

**Do NOT:**
- Delete `src-tauri/target/` then rebuild without this flag (will hit ordinal limit)
- Try to use `rust-lld` as a linker replacement (works for the final binary but fails on build scripts/proc macros due to missing CRT startup objects)
- Switch to MSVC toolchain without installing Windows SDK first

## Architecture

```
AppProvider (React Context)
└── AppInner
    ├── TopBar (document tabs, open/close files)
    ├── OutlinePanel (left, document TOC)
    │   └── OutlineItem (recursive, expandable tree)
    ├── ReaderArea (center, non-PDF content)
    │   OR
    │   PdfReaderWrapper (center, PDF content)
    │   └── PdfViewer (canvas-based PDF with text layer)
    ├── AIPanel (right, chat + context cards)
    │   ├── ChatMessages (conversation history)
    │   └── ChatInput (textarea, context cards, send)
    └── SettingsDialog (modal, AI provider config)
```

### Document Loading Flow

1. User opens file → `handleOpenFile` in App.tsx
2. Rust Tauri command reads file bytes → `ArrayBuffer`
3. `loadDocumentContent` calls `parseDocument()` from `documentParser.ts`
4. Parse result cached in `Map<string, DocContent>` state (`docContents`)
5. For PDFs: `PdfReaderWrapper` → `PdfViewer` renders canvas pages
6. For txt/md/docx: `ReaderArea` renders sanitized HTML

### PDF Rendering Pipeline

1. `documentParser.ts` (case "pdf"): loads PDF via pdfjs-dist, extracts outline via `pdf.getOutline()`. Text extraction is **skipped** (PdfViewer renders canvas, text extraction was wasted work). Returns empty html/rawText — PDF content is rendered exclusively by PdfViewer.

2. `PdfViewer.tsx` — three-phase render pipeline:
   - **Phase 1a:** Parallel `getPage()` for all pages at CSS_SCALE (1x), get natural dimensions.
   - **Phase 1b:** Compute `fitScale = containerWidth / maxNaturalWidth` (capped 2.5x) so the widest page fills the reader panel. Also compute `displayScale` (for CSS/text-layer) and `renderScale` (for canvas internal resolution).
   - **Phase 1c:** Create React skeleton DOM with scaled CSS dimensions, set `loading=false`.
   - **Phase 2:** Sequential `page.render()` to canvas at `renderScale` and `renderTextLayer()` at `displayScale`. RenderTasks are tracked in a ref for active cancellation on unmount.
   - **Post-render verification:** After all pages render, sample pixels from each canvas via `isCanvasBlank()` to detect Chromium canvas reclamation. If blank, increment `renderGeneration` to trigger automatic re-render.

3. **DPI handling:** Two separate scales:
   - `CANVAS_SCALE = Math.min(devicePixelRatio, 2)` — canvas internal resolution (high DPI → sharp).
   - `CSS_SCALE = 1.0` — CSS display size and text layer coordinates (stays in sync with DOM).
   - Canvas `width`/`height` attributes = renderScale, CSS `style.width`/`height` = displayScale. Browser downscales high-res canvas → crisp retina-like output.

4. `PdfReaderWrapper.tsx`: wraps PdfViewer, uses `MutationObserver` to detect page elements, then `IntersectionObserver` (~5% top margin) for bidirectional outline sync. Horizontal padding reduced to `px-3` to maximize PDF reading space.

### Chromium Canvas Reclamation (Blank PDF Pages)

**This is a known Chromium/WebView2 bug:** When canvas elements are removed from DOM (e.g., component unmount during tab switch) or the page loses focus, Chromium may reclaim the Canvas GPU backing store. The canvas element still exists with correct `width`/`height` attributes, but all pixel data is zeroed — appearing as blank/white.

**Defense layers in PdfViewer.tsx:**

1. **Active render task cancellation:** `renderTasksRef` tracks all in-flight `page.render()` tasks. On unmount/cleanup, `renderTask.cancel()` is called on each — prevents pdfjs-dist from completing renders onto detached canvases, which can trigger Chromium resource bugs.

2. **Post-render blank detection:** `isCanvasBlank()` samples 5 pixels (4 corners + center) using `getImageData` with `willReadFrequently: true`. If all sampled pixels are transparent/black after Phase 2 completes, the canvas was reclaimed — `setRenderGeneration(g => g+1)` triggers a full re-render of all pages.

3. **Visibility/focus listeners:** `visibilitychange` and `window.focus` event listeners check canvases when the user returns to the app. If any canvas is blank, increment `renderGeneration` to re-render.

4. **`isMountedRef`:** Prevents `setState` calls on unmounted components (avoids React "setState on unmounted component" warnings and stale updates).

5. **`renderGeneration` in effect deps:** Allows the same `data` ArrayBuffer to trigger a re-render when `renderGeneration` changes — essential for the automatic recovery mechanism.

**Risk of false positive:** If a PDF page is genuinely blank (e.g., an intentionally empty page), `isCanvasBlank()` will detect it as "reclaimed" and trigger one unnecessary re-render. This is benign — the re-render still produces a blank page, `isCanvasBlank()` fires once more, but since the `renderGeneration` increment is state-based, React batches it and the loop stops (same generation produces same blank result).

### Outline Sync (bidirectional)

- **Click outline → scroll to heading:** `onNavigate(anchorId)` via `scrollIntoView`. For PDFs, anchor IDs are `pdf-page-N` (resolved from outline destinations via `pdf.getPageIndex()`).
- **Scroll → update outline:** Uses `IntersectionObserver` with `rootMargin: "-5% 0px -80% 0px"` (top 15% zone). In `ReaderArea.tsx` for non-PDF content, in `PdfReaderWrapper.tsx` for PDF content.

### State Management

- `useDocuments` — document list, active document, scroll positions (in-place mutation for scroll to avoid re-render)
- `useConversation` — per-document AI conversation with message history
- `useSettings` — AI provider config (base URL, API key, model), stored in IndexedDB
- `AppContext` — global state aggregation
- `docContents` (Map) — cached document parse results (html, outline, pdfBuffer)

### Scroll Performance (ReaderArea)

- `ReaderArea` is `React.memo` wrapped
- Content `innerHTML` set imperatively via `useLayoutEffect` + `ref` (outside React VDOM, avoids re-diffing on toolbar state changes)
- Scroll position saved every 500ms via throttled `setTimeout`, uses in-place mutation (`doc.lastScrollPosition = position`) to avoid React re-render
- Floating toolbar position debounced 300ms after mouseup

## File Map

```
src/
├── App.tsx                    Main assembly, file handling, document cache
├── context/AppContext.tsx     Global state via React Context
├── types/index.ts             TypeScript type definitions
├── lib/utils.ts               generateId, formatFileSize, file/Blob helpers
├── services/
│   ├── documentParser.ts      Parse txt/md/docx/pdf → HTML + outline
│   ├── storage.ts             IndexedDB CRUD (documents, conversations, settings)
│   └── aiClient.ts            OpenAI-compatible API client (Tauri proxy or fetch)
├── hooks/
│   ├── useDocuments.ts        Document list state + scroll position
│   ├── useConversation.ts     AI conversation state
│   └── useSettings.ts         AI provider settings
├── components/
│   ├── AppShell.tsx           3-column resizable layout
│   ├── TopBar.tsx             Document tabs + toolbar
│   ├── OutlinePanel.tsx       Tree outline (left panel)
│   ├── ReaderArea.tsx         Non-PDF content reader (center, HTML)
│   ├── PdfReaderWrapper.tsx   PDF reader wrapper (center, outline sync)
│   ├── PdfViewer.tsx          PDF canvas renderer with text layer
│   ├── FloatingToolbar.tsx    Selection toolbar (追问/笔记/解释)
│   ├── ContextMenu.tsx        Right-click context menu
│   ├── AIPanel.tsx            AI chat panel (right)
│   ├── ChatMessages.tsx       Message history display
│   ├── ChatInput.tsx          Message input + context cards + screenshot paste
│   ├── ContextCard.tsx        Context reference card (text/image)
│   ├── SettingsDialog.tsx     AI provider configuration modal
│   └── ErrorBoundary.tsx      React error boundary
src-tauri/
├── tauri.conf.json           Tauri v2 config (windows, CSP, bundle)
├── .cargo/config.toml        Linker flags (exclude-all-symbols)
├── Cargo.toml                Rust dependencies
├── src/
│   ├── main.rs               Entry point
│   ├── lib.rs                 Tauri command registrations
│   ├── file_handler.rs        File I/O commands
│   └── api_proxy.rs           HTTP proxy for AI API calls
tests/
├── components/               Component tests
├── unit/                     Unit tests (aiClient, documentParser, storage, utils)
├── e2e/                      End-to-end tests (Playwright)
└── setup.ts                  Test environment setup
```

## Known Issues & Gotchas

1. **PDF rendering is sequential:** All pages are rendered one-by-one in Phase 2. For large PDFs (100+ pages), initial load takes several seconds. The skeleton DOM appears quickly (Phase 1), but full canvas rendering is the bottleneck. **Future optimization:** IntersectionObserver-based lazy rendering — only render visible pages (skeleton already has correct dimensions from Phase 1).

2. **Chromium canvas reclamation (mostly mitigated):** WebView2 may reclaim canvas GPU resources on tab switches or focus loss, causing blank pages. Mitigated by active RenderTask cancellation, post-render blank detection with auto-retry, and visibility/focus event listeners. See "Chromium Canvas Reclamation" section above for details.

3. **PDF text extraction removed:** `documentParser.ts` case "pdf" returns empty `html`/`rawText` — all PDF content is rendered via canvas in PdfViewer. If text-based features are needed for PDFs in the future (e.g., full-text search, AI context extraction), re-add text extraction or use PdfViewer's text layer content.

4. **`isCanvasBlank()` false positive on blank pages:** If a PDF contains a genuinely empty page (all white), the blank detector triggers one unnecessary re-render. Benign — converges after one retry.

5. **CDN dependency for PDF worker:** Both `documentParser.ts` and `PdfViewer.tsx` load the pdf.js worker from `unpkg.com`. No offline support for PDF rendering. Consider bundling the worker for production builds.

6. **Word document jitter:** Fixed by extracting content from React VDOM (useLayoutEffect + innerHTML) and memoizing DOMPurify output. The `closeToolbar`/`closeContextMenu` functions guard against unnecessary `setState` when already hidden.

7. **Context card remove button:** Fixed by sharing `addContext`/`removeContext` across both `hasApiKey` branches in AIPanel.

8. **PDF outline navigation:** Relies on pre-fetched viewports in Phase 1 for correct scroll targets. Anchor IDs are `pdf-page-N` resolved from outline destinations via `pdf.getPageIndex()`. Accurate because skeleton DOM sizes are set from viewport dimensions before rendering.

9. **Reader panel routing must use `activeDoc.format`:** The reader area conditional in App.tsx MUST use `ctx.activeDocument.format` (from document metadata, synchronously available) to decide PDF vs non-PDF rendering — NOT `activeContent?.format` (from async cache). Otherwise, when the cache is temporarily empty, a PDF document falls through to ReaderArea with empty HTML → blank panel.

10. **CSP:** `src-tauri/tauri.conf.json` has `frame-src blob:` for potential iframe-based PDF rendering (not currently used).

## Git

- Main branch: `master` (local), `main` (GitHub remote)
- Remote: `https://github.com/wly-wf/learn-by-ai.git`
- Push: `git push origin HEAD:main` (local master → remote main)
