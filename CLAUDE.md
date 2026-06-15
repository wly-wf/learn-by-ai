# LearnByAI — Project Reference

## Overview

AI-assisted learning Windows desktop app. VS Code-inspired layout: icon rail (left), resizable sidebar with outline, document tab bar + reader (center), AI drawer (right). Supports txt/pdf/docx/md.

## Tech Stack

- **Desktop shell:** Tauri v2 (Rust backend + WebView2 frontend)
- **Frontend:** React 19 + TypeScript 5.8 + Tailwind CSS v4
- **Build:** Vite 7, Cargo (Rust)
- **Key dependencies:**
  - `pdfjs-dist` 4.0.379 — PDF rendering (canvas + text layer)
  - `mammoth` 1.12 — DOCX → HTML
  - `marked` 18 — Markdown → HTML
  - `DOMPurify` 3.4 — XSS sanitization
  - `idb` 8.0 — IndexedDB wrapper for local persistence
  - `lucide-react` — Line vector icons (replaces all emoji)

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
    └── AppShell (resizable shell with slots)
        ├── IconRail (left, 56px, view switching + settings)
        │   ├── BookOpen → reading view
        │   ├── ListTree → outline view
        │   ├── Sparkles → AI drawer toggle
        │   └── Settings (bottom) → settings modal
        ├── Sidebar (left, resizable ~220px, outline + file actions)
        │   └── OutlineItem (recursive, expandable tree)
        ├── ReaderArea (center, non-PDF content)
        │   ├── DocumentTabBar (VS Code-style tabs for switching files)
        │   └── Content (white card, max-w-800px)
        │   OR
        │   PdfReaderWrapper (center, PDF content)
        │   ├── DocumentTabBar
        │   └── PdfViewer (canvas-based PDF with text layer)
        ├── AIPanel (right drawer, glassmorphism, togglable)
        │   ├── ChatMessages (iMessage-style bubbles)
        │   └── ChatInput (pill input + circular send + screenshot)
        └── SettingsDialog (modal, AI provider config)
```

### Layout Structure (VS Code-inspired)

```
+--IconRail | Sidebar | [Tab1][Tab2][Tab3] [+]    | AI    |
|  (56px)  | (220px) |  Reading Content            | Drawer|
|  📖 📋 ✨ | Outline |                             |(285px)|
|           | Tree    |                             |       |
|  ⚙️       |         |                             |       |
+-----------+---------+-----------------------------+-------+
```

- **IconRail** (56px fixed): Lucide line icons, active = blue background. Settings gear at bottom via `flex-1` spacer.
- **Sidebar** (220px default, 150px min): Outline tree + Open/Import buttons. Resizable by dragging divider.
- **DocumentTabBar**: Inside reader area. Format-colored icons (md=yellow, pdf=red, docx=blue). Active tab = blue bottom border. Hover shows X close button. + button to open files.
- **AI Drawer** (285px default, 200px min): Glassmorphism panel, toggled via Sparkles icon or auto-opens when text is sent to AI. Close via X button in header or Sparkles icon.

### Design Tokens (src/index.css)

All colors use CSS variables. DO NOT hardcode hex values in components.

| Variable | Value | Usage |
|---|---|---|
| `--bg-app` | `#EDEDF0` | Window background |
| `--bg-sidebar` | `rgba(250,250,246,0.85)` | Icon rail, sidebar, AI drawer |
| `--bg-card` | `#FFFFFF` | Reading content card |
| `--text-primary` | `#1D1D1F` | Headings, body |
| `--text-secondary` | `#86868B` | Muted labels |
| `--text-tertiary` | `#AEAEB2` | Placeholders |
| `--accent` | `#007AFF` | Active states, primary buttons |
| `--accent-subtle` | `rgba(0,122,255,0.08)` | Active background |
| `--border-subtle` | `rgba(0,0,0,0.06)` | Dividers (0.5px) |
| `--message-user` | `#007AFF` | User chat bubble |
| `--message-ai` | `#E9E9EF` | AI chat bubble |
| `--toolbar-bg` | `rgba(30,30,32,0.94)` | Floating selection toolbar |

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
├── index.css                  Design tokens (CSS variables) + Tailwind imports
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
│   ├── AppShell.tsx           Resizable shell (icon rail + sidebar + reader + drawer)
│   ├── IconRail.tsx           Left icon bar (56px, view switching + settings)
│   ├── Sidebar.tsx            Outline tree + open/import actions
│   ├── DocumentTabBar.tsx     VS Code-style horizontal tabs (inside reader area)
│   ├── ReaderArea.tsx         Non-PDF content reader (white card, max-w-800px)
│   ├── PdfReaderWrapper.tsx   PDF reader wrapper (white card + outline sync)
│   ├── PdfViewer.tsx          PDF canvas renderer with text layer
│   ├── FloatingToolbar.tsx    Selection toolbar (Lucide icons + dark glass)
│   ├── ContextMenu.tsx        Right-click context menu (dark glass)
│   ├── AIPanel.tsx            AI drawer (glassmorphism, Lucide icons, closable)
│   ├── ChatMessages.tsx       iMessage-style bubbles
│   ├── ChatInput.tsx          Pill input + circular send + screenshot
│   ├── ContextCard.tsx        Blue-accent reference card (Link icon)
│   ├── SettingsDialog.tsx     AI provider configuration modal (Apple card)
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
├── components/               AppShell, AIPanel, IconRail, ReaderArea, Sidebar
├── unit/                     aiClient, documentParser, storage, utils
├── e2e/                      Playwright full-flow test
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

11. **Resize performance:** Divider drag uses direct DOM manipulation (`ref.style.width`) during drag, only commits to React state on mouseup. Do NOT revert to per-frame setState — it causes severe lag.

12. **Divider width:** Resize handles are 6px wide (`w-1.5`) with a 1px visible line. Do NOT reduce to `w-0.5` — users cannot grab 2px dividers.

13. **Design tokens:** All component styles use CSS variables from `src/index.css`. Do NOT hardcode colors like `#007AFF` in components — always use `var(--accent)` etc. This ensures consistency and enables future dark mode.

14. **Document switching:** Document list lives in DocumentTabBar (inside reader area), NOT in Sidebar. The Sidebar shows only the outline tree and open/import buttons. Do NOT add document list back to Sidebar.

15. **Settings entry point:** Settings is ONLY in the IconRail bottom-left (gear icon). There is no settings button in the title area or anywhere else. Do NOT add a second settings button.

16. **No dark mode yet:** Design tokens are set up for light mode only. Dark mode would require adding a `[data-theme="dark"]` or `.dark` class block to `index.css` with adjusted values. Out of scope for now.

17. **Linter note:** `AIPanel.tsx`, `index.css`, and `Titlebar.tsx` may show as modified by linter automatically. This is expected — the linter normalizes formatting.

## Workflow Rules

- **Do NOT push to remote after every commit.** Only push when the user explicitly asks, or when a fix has been verified to work correctly. Pushing broken code wastes time and clutters the history. Commit locally, verify, then wait for the user to request a push.

## Git

- Main branch: `master` (local), `main` (GitHub remote)
- Remote: `https://github.com/wly-wf/learn-by-ai.git`
- Push: `git push origin HEAD:main` (local master → remote main)
