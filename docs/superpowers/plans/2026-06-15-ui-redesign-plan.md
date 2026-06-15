# UI Redesign — Apple Native Style Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Transform LearnByAI from gray utilitarian UI to polished Apple-native desktop app with icon rail, sidebar, and drawer AI panel.

**Architecture:** Replace TopBar + fixed 3-column layout with IconRail (48px) + collapsible Sidebar (doc list + outline) + Reader card + AI Drawer (slide-in). Use Lucide React for all icons, Apple design tokens (warm white + blue accent), glassmorphism sidebars.

**Tech Stack:** React 19 + TypeScript 5.8 + Tailwind CSS v4 + Lucide React + Tauri v2

---

## File Structure

```
src/
├── App.tsx                              # Modify: re-wire layout slots
├── index.css                            # Modify: add design tokens
├── components/
│   ├── AppShell.tsx                     # Rewrite: new layout shell
│   ├── IconRail.tsx                     # Create: vertical icon bar
│   ├── Titlebar.tsx                     # Create: minimal window titlebar
│   ├── Sidebar.tsx                      # Create: doc list + outline tree
│   ├── TopBar.tsx                       # Remove (merged into Sidebar + Titlebar)
│   ├── TabBar.tsx                       # Remove (merged into Sidebar)
│   ├── OutlinePanel.tsx                 # Remove (merged into Sidebar)
│   ├── ReaderArea.tsx                   # Modify: visual update
│   ├── PdfReaderWrapper.tsx             # Modify: minor style
│   ├── PdfViewer.tsx                    # Modify: minor style
│   ├── AIPanel.tsx                      # Rewrite: drawer style
│   ├── ChatMessages.tsx                 # Modify: bubble style
│   ├── ChatInput.tsx                    # Modify: pill input + icons
│   ├── ContextCard.tsx                  # Modify: style
│   ├── FloatingToolbar.tsx              # Modify: icons + dark glass
│   ├── ContextMenu.tsx                  # Modify: dark glass
│   └── SettingsDialog.tsx               # Modify: Apple card style
tests/
├── components/
│   ├── AppShell.test.tsx                # Modify: new layout assertions
│   ├── IconRail.test.tsx                # Create
│   ├── Sidebar.test.tsx                 # Create
│   ├── AIPanel.test.tsx                 # Modify: drawer assertions
│   └── OutlinePanel.test.tsx            # Remove
```

---

## Phase 1: Foundation

### Task 1: Install lucide-react dependency

- [ ] **Step 1: Install package**

```bash
cd "D:\AI\ai_project\learn-by-ai" && npm install lucide-react
```

- [ ] **Step 2: Verify installation**

```bash
node -e "require('lucide-react'); console.log('OK')"
```

Expected: prints "OK"

- [ ] **Step 3: Commit**

```bash
git add package.json package-lock.json
git commit -m "chore: add lucide-react for icon system"
```

### Task 2: Add Apple design tokens to CSS

**Files:**
- Modify: `src/index.css`

- [ ] **Step 1: Append design token CSS variables**

Read `src/index.css`, then append at the bottom:

```css
/* Apple Design Tokens */
:root {
  --bg-app: #EDEDF0;
  --bg-sidebar: rgba(250, 250, 246, 0.85);
  --bg-card: #FFFFFF;
  --text-primary: #1D1D1F;
  --text-secondary: #86868B;
  --text-tertiary: #AEAEB2;
  --accent: #007AFF;
  --accent-subtle: rgba(0, 122, 255, 0.08);
  --border-subtle: rgba(0, 0, 0, 0.06);
  --message-user: #007AFF;
  --message-ai: #E9E9EF;
  --toolbar-bg: rgba(30, 30, 32, 0.94);
  --font-system: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
}

body {
  font-family: var(--font-system);
  background: var(--bg-app);
  color: var(--text-primary);
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}
```

- [ ] **Step 2: Commit**

```bash
git add src/index.css
git commit -m "style: add Apple design tokens to CSS variables"
```

### Task 3: Create IconRail component

**Files:**
- Create: `src/components/IconRail.tsx`
- Create: `tests/components/IconRail.test.tsx`

- [ ] **Step 1: Write failing test**

Create `tests/components/IconRail.test.tsx`:

```tsx
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { IconRail } from "../../src/components/IconRail";

describe("IconRail", () => {
  it("renders all icon buttons", () => {
    render(<IconRail activeView="reading" onViewChange={() => {}} />);
    expect(screen.getByLabelText("阅读")).toBeDefined();
    expect(screen.getByLabelText("大纲")).toBeDefined();
    expect(screen.getByLabelText("AI 对话")).toBeDefined();
  });

  it("highlights active view", () => {
    render(<IconRail activeView="reading" onViewChange={() => {}} />);
    const readingBtn = screen.getByLabelText("阅读");
    expect(readingBtn.className).toContain("bg-[#007AFF]");
  });

  it("calls onViewChange when clicking inactive icon", () => {
    let called = "";
    render(<IconRail activeView="reading" onViewChange={(v) => { called = v; }} />);
    screen.getByLabelText("大纲").click();
    expect(called).toBe("outline");
  });
});
```

- [ ] **Step 2: Run test (should fail)**

```bash
npx vitest run tests/components/IconRail.test.tsx
```

Expected: FAIL (file not found)

- [ ] **Step 3: Create IconRail component**

Create `src/components/IconRail.tsx`:

```tsx
import { BookOpen, ListTree, Sparkles } from "lucide-react";

export type ViewType = "reading" | "outline" | "ai";

interface IconRailProps {
  activeView: ViewType;
  onViewChange: (view: ViewType) => void;
  aiUnread?: boolean;
}

const views: Array<{ id: ViewType; icon: typeof BookOpen; label: string }> = [
  { id: "reading", icon: BookOpen, label: "阅读" },
  { id: "outline", icon: ListTree, label: "大纲" },
  { id: "ai", icon: Sparkles, label: "AI 对话" },
];

export function IconRail({ activeView, onViewChange, aiUnread }: IconRailProps) {
  return (
    <div className="flex flex-col items-center gap-0.5 pt-2.5 pb-2 w-12 flex-shrink-0"
      style={{ background: "var(--bg-sidebar)", backdropFilter: "blur(20px)", borderRight: "0.5px solid var(--border-subtle)" }}>
      {views.map(({ id, icon: Icon, label }) => {
        const isActive = activeView === id;
        return (
          <button
            key={id}
            onClick={() => onViewChange(id)}
            aria-label={label}
            title={label}
            className="relative w-[30px] h-[30px] rounded-[7px] flex items-center justify-center transition-colors"
            style={{
              background: isActive ? "var(--accent)" : "transparent",
              color: isActive ? "white" : id === "ai" && activeView !== "ai" ? "var(--text-secondary)" : "var(--text-secondary)",
            }}
          >
            <Icon size={16} strokeWidth={1.8} />
            {id === "ai" && aiUnread && (
              <span className="absolute top-1 right-1 w-1.5 h-1.5 rounded-full bg-[#FF3B30]" />
            )}
          </button>
        );
      })}
    </div>
  );
}
```

- [ ] **Step 4: Run test (should pass)**

```bash
npx vitest run tests/components/IconRail.test.tsx
```

Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/components/IconRail.tsx tests/components/IconRail.test.tsx
git commit -m "feat: add IconRail component with Lucide icons"
```

### Task 4: Create Titlebar component

**Files:**
- Create: `src/components/Titlebar.tsx`

- [ ] **Step 1: Create Titlebar component (no test — pure visual, covered by AppShell integration)**

Create `src/components/Titlebar.tsx`:

```tsx
import { Settings, FileText, FileType, FileType2 } from "lucide-react";
import type { DocumentFormat } from "../types";

interface TitlebarProps {
  fileName?: string;
  format?: DocumentFormat;
  pageInfo?: string; // e.g. "3 / 42"
  isSaved?: boolean;
  onOpenSettings: () => void;
}

const formatIcons: Record<string, typeof FileText> = {
  txt: FileText,
  md: FileText,
  pdf: FileType,
  docx: FileType2,
};

const formatColors: Record<string, string> = {
  txt: "#86868B",
  md: "#F59E0B",
  pdf: "#EF4444",
  docx: "#3B82F6",
};

export function Titlebar({ fileName, format, pageInfo, isSaved, onOpenSettings }: TitlebarProps) {
  const FormatIcon = format && formatIcons[format] ? formatIcons[format] : FileText;
  const iconColor = format ? formatColors[format] || "#86868B" : "#86868B";

  return (
    <div className="flex items-center h-[38px] px-3 gap-2.5 flex-shrink-0 select-none"
      style={{ background: "var(--bg-sidebar)", backdropFilter: "blur(20px)", borderBottom: "0.5px solid var(--border-subtle)" }}>
      {/* Traffic light dots (visual only) */}
      <div className="flex gap-1.5 mr-1">
        <span className="w-3 h-3 rounded-full bg-[#FF5F57]" />
        <span className="w-3 h-3 rounded-full bg-[#FFBD2E]" />
        <span className="w-3 h-3 rounded-full bg-[#28CA41]" />
      </div>

      {fileName && (
        <>
          <FormatIcon size={14} strokeWidth={1.8} color={iconColor} />
          <span className="text-[11px] font-medium truncate max-w-[200px]" style={{ color: "var(--text-primary)" }}>
            {fileName}
          </span>
          {isSaved && (
            <span className="text-[9px] px-1.5 py-px rounded-[10px] font-medium flex-shrink-0"
              style={{ background: "var(--accent-subtle)", color: "var(--accent)" }}>
              已保存
            </span>
          )}
        </>
      )}

      {!fileName && (
        <span className="text-[11px] font-semibold" style={{ color: "var(--text-primary)" }}>
          LearnByAI
        </span>
      )}

      <div className="flex-1" />

      {pageInfo && (
        <span className="text-[10px]" style={{ color: "var(--text-secondary)" }}>{pageInfo}</span>
      )}

      <button onClick={onOpenSettings} aria-label="设置" title="设置"
        className="p-1 rounded-md hover:bg-black/5 transition-colors">
        <Settings size={14} strokeWidth={1.8} color="var(--text-secondary)" />
      </button>
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/Titlebar.tsx
git commit -m "feat: add Titlebar component with format-specific file icons"
```

### Task 5: Rewrite AppShell with new layout

**Files:**
- Modify: `src/components/AppShell.tsx`
- Modify: `tests/components/AppShell.test.tsx`

- [ ] **Step 1: Update AppShell test**

Write new test in `tests/components/AppShell.test.tsx` (replace existing):

```tsx
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { AppShell } from "../../src/components/AppShell";

describe("AppShell", () => {
  it("renders all layout slots", () => {
    render(
      <AppShell
        titlebar={<div data-testid="titlebar">titlebar</div>}
        iconRail={<div data-testid="icon-rail">rail</div>}
        sidebar={<div data-testid="sidebar">sidebar</div>}
        readerArea={<div data-testid="reader">reader</div>}
        aiDrawer={<div data-testid="ai">ai</div>}
        showSidebar={true}
        showAiDrawer={true}
        sidebarWidth={195}
        aiDrawerWidth={285}
      />
    );
    expect(screen.getByTestId("titlebar")).toBeDefined();
    expect(screen.getByTestId("icon-rail")).toBeDefined();
    expect(screen.getByTestId("sidebar")).toBeDefined();
    expect(screen.getByTestId("reader")).toBeDefined();
    expect(screen.getByTestId("ai")).toBeDefined();
  });

  it("hides sidebar when showSidebar is false", () => {
    render(
      <AppShell
        titlebar={<div>t</div>}
        iconRail={<div>r</div>}
        sidebar={<div data-testid="sidebar">s</div>}
        readerArea={<div>rd</div>}
        aiDrawer={null}
        showSidebar={false}
        showAiDrawer={false}
        sidebarWidth={195}
        aiDrawerWidth={285}
      />
    );
    expect(screen.queryByTestId("sidebar")).toBeNull();
  });
});
```

- [ ] **Step 2: Rewrite AppShell component**

Replace `src/components/AppShell.tsx` content:

```tsx
import React, { useCallback, useRef, useState } from "react";

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

const MIN_PANEL_PCT = 10;

export function AppShell({
  titlebar, iconRail, sidebar, readerArea, aiDrawer,
  showSidebar, showAiDrawer,
  sidebarWidth, aiDrawerWidth,
  onSidebarWidthChange, onAiDrawerWidthChange,
}: AppShellProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  const handleSidebarResize = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    const startX = e.clientX;
    const startWidth = sidebarWidth;

    const onMove = (ev: MouseEvent) => {
      const delta = ev.clientX - startX;
      onSidebarWidthChange?.(Math.max(150, startWidth + delta));
    };
    const onUp = () => {
      document.removeEventListener("mousemove", onMove);
      document.removeEventListener("mouseup", onUp);
    };
    document.addEventListener("mousemove", onMove);
    document.addEventListener("mouseup", onUp);
  }, [sidebarWidth, onSidebarWidthChange]);

  const handleAiResize = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    const startX = e.clientX;
    const startWidth = aiDrawerWidth;

    const onMove = (ev: MouseEvent) => {
      const delta = startX - ev.clientX;
      onAiDrawerWidthChange?.(Math.max(200, startWidth + delta));
    };
    const onUp = () => {
      document.removeEventListener("mousemove", onMove);
      document.removeEventListener("mouseup", onUp);
    };
    document.addEventListener("mousemove", onMove);
    document.addEventListener("mouseup", onUp);
  }, [aiDrawerWidth, onAiDrawerWidthChange]);

  return (
    <div className="flex flex-col h-screen" style={{ background: "var(--bg-app)" }}>
      {titlebar}

      <div ref={containerRef} className="flex flex-1 overflow-hidden">
        {iconRail}

        {showSidebar && (
          <>
            <div style={{ width: `${sidebarWidth}px` }} className="flex-shrink-0 overflow-hidden">
              {sidebar}
            </div>
            <div
              className="w-0.5 cursor-col-resize flex-shrink-0 transition-colors hover:bg-[#007AFF]/30"
              onMouseDown={handleSidebarResize}
            />
          </>
        )}

        <div className="flex-1 overflow-hidden">
          {readerArea}
        </div>

        {showAiDrawer && aiDrawer && (
          <>
            <div
              className="w-0.5 cursor-col-resize flex-shrink-0 transition-colors hover:bg-[#007AFF]/30"
              onMouseDown={handleAiResize}
            />
            <div style={{ width: `${aiDrawerWidth}px` }} className="flex-shrink-0 overflow-hidden">
              {aiDrawer}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
```

- [ ] **Step 3: Run tests**

```bash
npx vitest run tests/components/AppShell.test.tsx
```

Expected: PASS

- [ ] **Step 4: Commit**

```bash
git add src/components/AppShell.tsx tests/components/AppShell.test.tsx
git commit -m "refactor: rewrite AppShell with icon rail + sidebar + drawer layout"
```

---

## Phase 2: Sidebar & Navigation

### Task 6: Create Sidebar component (document list + outline tree)

**Files:**
- Create: `src/components/Sidebar.tsx`
- Create: `tests/components/Sidebar.test.tsx`

- [ ] **Step 1: Write test**

Create `tests/components/Sidebar.test.tsx`:

```tsx
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { Sidebar } from "../../src/components/Sidebar";

const mockDocs = [
  { id: "1", fileName: "test.md", filePath: "/test.md", format: "md" as const, size: 100, openedAt: Date.now(), lastScrollPosition: 0 },
  { id: "2", fileName: "doc.pdf", filePath: "/doc.pdf", format: "pdf" as const, size: 200, openedAt: Date.now(), lastScrollPosition: 0 },
];

const mockOutline = [
  { id: "o1", title: "Chapter 1", level: 1, children: [], anchorId: "heading-chapter-1" },
];

describe("Sidebar", () => {
  it("renders document list", () => {
    render(
      <Sidebar
        documents={mockDocs}
        activeDocumentId="1"
        onSelectDocument={() => {}}
        onCloseDocument={() => {}}
        outline={mockOutline}
        activeHeadingId={null}
        onNavigate={() => {}}
        onOpenFile={() => {}}
      />
    );
    expect(screen.getByText("test.md")).toBeDefined();
    expect(screen.getByText("doc.pdf")).toBeDefined();
  });

  it("renders outline tree", () => {
    render(
      <Sidebar
        documents={mockDocs}
        activeDocumentId="1"
        onSelectDocument={() => {}}
        onCloseDocument={() => {}}
        outline={mockOutline}
        activeHeadingId={null}
        onNavigate={() => {}}
        onOpenFile={() => {}}
      />
    );
    expect(screen.getByText("Chapter 1")).toBeDefined();
  });

  it("shows empty outline message when no outline", () => {
    render(
      <Sidebar
        documents={mockDocs}
        activeDocumentId="1"
        onSelectDocument={() => {}}
        onCloseDocument={() => {}}
        outline={[]}
        activeHeadingId={null}
        onNavigate={() => {}}
        onOpenFile={() => {}}
      />
    );
    expect(screen.getByText("暂无大纲")).toBeDefined();
  });
});
```

- [ ] **Step 2: Create Sidebar component**

Create `src/components/Sidebar.tsx`:

```tsx
import { useState } from "react";
import { Search, FileText, FileType, FileType2, Plus, FolderOpen, X } from "lucide-react";
import type { DocumentMeta, OutlineNode, DocumentFormat } from "../types";

interface SidebarProps {
  documents: DocumentMeta[];
  activeDocumentId: string | null;
  onSelectDocument: (id: string) => void;
  onCloseDocument: (id: string) => void;
  outline: OutlineNode[];
  activeHeadingId: string | null;
  onNavigate: (anchorId: string) => void;
  onOpenFile: () => void;
  onImportFolder?: () => void;
}

const formatIcons: Record<string, typeof FileText> = {
  txt: FileText, md: FileText, pdf: FileType, docx: FileType2,
};
const formatColors: Record<string, string> = {
  txt: "#86868B", md: "#F59E0B", pdf: "#EF4444", docx: "#3B82F6",
};

function OutlineItem({ node, activeHeadingId, onNavigate, depth }: {
  node: OutlineNode; activeHeadingId: string | null; onNavigate: (id: string) => void; depth: number;
}) {
  const [expanded, setExpanded] = useState(true);
  const hasChildren = node.children.length > 0;
  const isActive = node.anchorId === activeHeadingId;

  const paddingLeft = 8 + depth * 12;

  return (
    <div>
      <div
        onClick={() => {
          if (hasChildren) setExpanded(!expanded);
          if (node.anchorId) onNavigate(node.anchorId);
        }}
        className="flex items-center gap-1 text-[10px] rounded-[5px] cursor-pointer select-none py-1"
        style={{
          paddingLeft: `${paddingLeft}px`,
          paddingRight: "6px",
          color: isActive ? "var(--accent)" : depth === 0 ? "var(--text-primary)" : "var(--text-secondary)",
          background: isActive ? "var(--accent-subtle)" : "transparent",
          fontWeight: isActive ? 500 : 400,
        }}
      >
        {hasChildren && (
          <span className="text-[8px] w-3 text-center flex-shrink-0">{expanded ? "▾" : "▸"}</span>
        )}
        {!hasChildren && <span className="w-3 flex-shrink-0" />}
        <span className="truncate">{node.title}</span>
      </div>
      {expanded && hasChildren && node.children.map((child) => (
        <OutlineItem key={child.id} node={child} activeHeadingId={activeHeadingId} onNavigate={onNavigate} depth={depth + 1} />
      ))}
    </div>
  );
}

export function Sidebar({
  documents, activeDocumentId, onSelectDocument, onCloseDocument,
  outline, activeHeadingId, onNavigate,
  onOpenFile, onImportFolder,
}: SidebarProps) {
  return (
    <div className="flex flex-col h-full overflow-y-auto px-2 py-2.5"
      style={{ background: "var(--bg-sidebar)", backdropFilter: "blur(20px)", borderRight: "0.5px solid var(--border-subtle)" }}>
      {/* Search placeholder */}
      <div className="flex items-center gap-1.5 rounded-[7px] px-2 py-1.5 mb-3"
        style={{ background: "rgba(0,0,0,0.03)" }}>
        <Search size={12} strokeWidth={1.8} color="var(--text-tertiary)" />
        <span className="text-[10px]" style={{ color: "var(--text-tertiary)" }}>搜索文档...</span>
      </div>

      {/* Action buttons */}
      <div className="flex gap-1 mb-3">
        <button onClick={onOpenFile}
          className="flex items-center gap-1 px-2 py-1 text-[10px] rounded-md hover:bg-black/5 transition-colors flex-1"
          style={{ color: "var(--text-secondary)" }}>
          <Plus size={11} strokeWidth={1.8} /> 打开
        </button>
        {onImportFolder && (
          <button onClick={onImportFolder}
            className="flex items-center gap-1 px-2 py-1 text-[10px] rounded-md hover:bg-black/5 transition-colors"
            style={{ color: "var(--text-secondary)" }}>
            <FolderOpen size={11} strokeWidth={1.8} /> 导入
          </button>
        )}
      </div>

      {/* Document List */}
      <div className="mb-3">
        <div className="text-[8px] uppercase font-semibold tracking-[0.5px] px-1 mb-1" style={{ color: "var(--text-tertiary)" }}>
          文档
        </div>
        {documents.map((doc) => {
          const FormatIcon = formatIcons[doc.format] || FileText;
          const iconColor = formatColors[doc.format] || "#86868B";
          const isActive = doc.id === activeDocumentId;

          return (
            <div
              key={doc.id}
              onClick={() => onSelectDocument(doc.id)}
              className="flex items-center gap-1.5 text-[10px] rounded-[5px] cursor-pointer group py-1 px-1.5"
              style={{
                color: isActive ? "white" : iconColor,
                background: isActive ? "var(--accent)" : "transparent",
              }}
            >
              <FormatIcon size={12} strokeWidth={1.8} color={isActive ? "white" : iconColor} />
              <span className="truncate flex-1">{doc.fileName}</span>
              <button
                onClick={(e) => { e.stopPropagation(); onCloseDocument(doc.id); }}
                className="opacity-0 group-hover:opacity-100 p-0.5 rounded hover:bg-black/10 transition-opacity"
                aria-label={`关闭 ${doc.fileName}`}
              >
                <X size={10} strokeWidth={1.8} color={isActive ? "white" : "var(--text-tertiary)"} />
              </button>
            </div>
          );
        })}
      </div>

      {/* Outline */}
      <div>
        <div className="text-[8px] uppercase font-semibold tracking-[0.5px] px-1 mb-1" style={{ color: "var(--text-tertiary)" }}>
          大纲
        </div>
        {outline.length === 0 ? (
          <div className="text-[10px] py-2 text-center" style={{ color: "var(--text-tertiary)" }}>暂无大纲</div>
        ) : (
          outline.map((node) => (
            <OutlineItem key={node.id} node={node} activeHeadingId={activeHeadingId} onNavigate={onNavigate} depth={0} />
          ))
        )}
      </div>
    </div>
  );
}
```

- [ ] **Step 3: Run tests**

```bash
npx vitest run tests/components/Sidebar.test.tsx
```

Expected: PASS

- [ ] **Step 4: Commit**

```bash
git add src/components/Sidebar.tsx tests/components/Sidebar.test.tsx
git commit -m "feat: add Sidebar component with document list and outline tree"
```

### Task 7: Rewire App.tsx for new layout

**Files:**
- Modify: `src/App.tsx`

- [ ] **Step 1: Update App.tsx layout wiring**

Replace `src/App.tsx` with updated version that uses new layout slots:

```tsx
import { useState, useCallback, useEffect, useRef } from "react";
import { AppShell } from "./components/AppShell";
import { IconRail, type ViewType } from "./components/IconRail";
import { Titlebar } from "./components/Titlebar";
import { Sidebar } from "./components/Sidebar";
import { ReaderArea } from "./components/ReaderArea";
import { AIPanel } from "./components/AIPanel";
import { SettingsDialog } from "./components/SettingsDialog";
import { AppProvider, useAppContext } from "./contexts/AppContext";
import { ErrorBoundary } from "./components/ErrorBoundary";
import { PdfReaderWrapper } from "./components/PdfReaderWrapper";
import { parseDocument, extractOutline } from "./services/documentParser";
import type { OutlineNode } from "./types";
import { generateId } from "./lib/utils";

interface DocContent {
  html: string;
  outline: OutlineNode[];
  format: string;
  pdfBuffer?: ArrayBuffer;
}

function AppInner() {
  const ctx = useAppContext();
  const ctxRef = useRef(ctx);
  ctxRef.current = ctx;

  const [settingsOpen, setSettingsOpen] = useState(false);
  const [docContents, setDocContents] = useState<Map<string, DocContent>>(new Map());
  const [activeHeadingId, setActiveHeadingId] = useState<string | null>(null);

  // Layout state
  const [activeView, setActiveView] = useState<ViewType>("reading");
  const [showSidebar, setShowSidebar] = useState(true);
  const [showAiDrawer, setShowAiDrawer] = useState(true);
  const [sidebarWidth, setSidebarWidth] = useState(195);
  const [aiDrawerWidth, setAiDrawerWidth] = useState(285);

  const activeContent = ctx.activeDocumentId
    ? docContents.get(ctx.activeDocumentId)
    : undefined;

  const activeDoc = ctx.activeDocument;

  const loadDocumentContent = useCallback(async (_docId: string, content: ArrayBuffer, format: string) => {
    try {
      const contentClone = content.slice(0);
      const result = await parseDocument(content, format as any);
      const newOutline = result.pdfOutline
        ?? extractOutline(format === "md" ? result.rawText : result.html, format as any);

      const docContent: DocContent = {
        html: result.html, outline: newOutline, format,
        pdfBuffer: format === "pdf" ? contentClone : undefined,
      };

      setDocContents((prev) => {
        const next = new Map(prev);
        next.set(_docId, docContent);
        return next;
      });
    } catch (err) {
      const errorHtml = `<div class="error p-4 text-red-500">文档解析失败: ${err instanceof Error ? err.message : "未知错误"}</div>`;
      setDocContents((prev) => {
        const next = new Map(prev);
        next.set(_docId, { html: errorHtml, outline: [], format });
        return next;
      });
    }
  }, []);

  useEffect(() => {
    setDocContents((prev) => {
      const docIds = new Set(ctx.documents.map((d) => d.id));
      const next = new Map(prev);
      let changed = false;
      for (const key of next.keys()) {
        if (!docIds.has(key)) { next.delete(key); changed = true; }
      }
      return changed ? next : prev;
    });
  }, [ctx.documents]);

  useEffect(() => {
    setActiveHeadingId(null);
  }, [ctx.activeDocumentId]);

  const handleOpenFile = useCallback(async () => {
    try {
      const { open } = await import("@tauri-apps/plugin-dialog");
      const selected = await open({
        multiple: false,
        filters: [{ name: "文档", extensions: ["txt", "pdf", "docx", "doc", "md", "markdown"] }],
      });
      if (selected && typeof selected === "string") {
        const doc = await ctx.openDocumentFile(selected);
        try {
          const { invoke } = await import("@tauri-apps/api/core");
          if (doc.format === "txt" || doc.format === "md") {
            const text = await invoke<string>("read_text_file", { path: selected });
            const buffer = new TextEncoder().encode(text).buffer;
            await loadDocumentContent(doc.id, buffer, doc.format);
          } else {
            const content = await invoke<number[]>("read_file", { path: selected });
            const buffer = new Uint8Array(content).buffer;
            await loadDocumentContent(doc.id, buffer, doc.format);
          }
        } catch {
          const input = document.createElement("input");
          input.type = "file";
          input.accept = ".txt,.pdf,.docx,.doc,.md,.markdown";
          input.onchange = async (e) => {
            const file = (e.target as HTMLInputElement).files?.[0];
            if (file) {
              const doc2 = await ctx.openDocumentFile(file.name);
              const buffer = await file.arrayBuffer();
              await loadDocumentContent(doc2.id, buffer, doc2.format);
            }
          };
          input.click();
        }
      }
    } catch {
      const input = document.createElement("input");
      input.type = "file";
      input.accept = ".txt,.pdf,.docx,.doc,.md,.markdown";
      input.onchange = async (e) => {
        const file = (e.target as HTMLInputElement).files?.[0];
        if (file) {
          const doc = await ctx.openDocumentFile(file.name);
          const buffer = await file.arrayBuffer();
          await loadDocumentContent(doc.id, buffer, doc.format);
        }
      };
      input.click();
    }
  }, [ctx, loadDocumentContent]);

  const handleImportFolder = useCallback(async () => {
    try {
      const { open } = await import("@tauri-apps/plugin-dialog");
      const selected = await open({ directory: true });
      if (selected && typeof selected === "string") {
        const { invoke } = await import("@tauri-apps/api/core");
        const files = await invoke<Array<{ name: string; path: string; extension: string }>>("list_folder_files", { folderPath: selected });
        for (const file of files) {
          try { await ctx.openDocumentFile(file.path); } catch { /* skip */ }
        }
      }
    } catch { /* folder import requires Tauri */ }
  }, [ctx]);

  const handleAskAI = useCallback((selectedText: string) => {
    window.dispatchEvent(new CustomEvent("add-context", {
      detail: { id: generateId(), type: "text", content: selectedText, label: selectedText.length > 50 ? selectedText.slice(0, 50) + "..." : selectedText },
    }));
    setShowAiDrawer(true);
    setActiveView("ai");
  }, []);

  const handleScrollChange = useCallback((pct: number) => {
    const c = ctxRef.current;
    if (c.activeDocumentId) c.updateScrollPosition(c.activeDocumentId, pct);
  }, []);

  const handleViewChange = useCallback((view: ViewType) => {
    setActiveView(view);
    if (view === "outline") setShowSidebar(true);
    if (view === "ai") setShowAiDrawer(true);
    if (view === "reading") { setShowSidebar(true); }
  }, []);

  // Compute page info for PDF
  const pageInfo = activeDoc?.format === "pdf" ? undefined : undefined; // PdfReaderWrapper provides its own

  return (
    <>
      <AppShell
        showSidebar={showSidebar}
        showAiDrawer={showAiDrawer}
        sidebarWidth={sidebarWidth}
        aiDrawerWidth={aiDrawerWidth}
        onSidebarWidthChange={setSidebarWidth}
        onAiDrawerWidthChange={setAiDrawerWidth}
        titlebar={
          <Titlebar
            fileName={activeDoc?.fileName}
            format={activeDoc?.format}
            isSaved={!!activeDoc}
            onOpenSettings={() => setSettingsOpen(true)}
          />
        }
        iconRail={
          <IconRail activeView={activeView} onViewChange={handleViewChange} />
        }
        sidebar={
          <Sidebar
            documents={ctx.documents}
            activeDocumentId={ctx.activeDocumentId}
            onSelectDocument={ctx.setActiveDocumentId}
            onCloseDocument={ctx.closeDocument}
            outline={activeContent?.outline || []}
            activeHeadingId={activeHeadingId}
            onNavigate={(anchorId) => {
              const el = document.querySelector(`[id="${anchorId}"]`) || document.getElementById(anchorId);
              if (el) el.scrollIntoView({ behavior: "smooth" });
              setActiveHeadingId(anchorId);
            }}
            onOpenFile={handleOpenFile}
            onImportFolder={handleImportFolder}
          />
        }
        readerArea={
          !activeDoc ? (
            <div className="flex flex-col items-center justify-center h-full" style={{ color: "var(--text-secondary)" }}>
              <span className="text-3xl mb-3 opacity-60">📖</span>
              <span className="text-[11px]">打开一个文档开始阅读</span>
              <span className="text-[10px] mt-1 opacity-60">支持 PDF、Word、Markdown、TXT</span>
            </div>
          ) : activeDoc.format === "pdf" ? (
            activeContent?.pdfBuffer ? (
              <PdfReaderWrapper
                key={ctx.activeDocumentId}
                data={activeContent.pdfBuffer}
                outline={activeContent.outline}
                onActiveHeadingChange={setActiveHeadingId}
              />
            ) : (
              <div className="flex items-center justify-center h-full text-sm" style={{ color: "var(--text-secondary)" }}>正在解析 PDF...</div>
            )
          ) : (
            <ReaderArea document={activeDoc} htmlContent={activeContent?.html || ""}
              onAskAI={handleAskAI}
              onTakeNote={(text) => handleAskAI(text)}
              onExplain={(text) => handleAskAI(text)}
              onTranslate={(text) => handleAskAI(text)}
              onSummarize={(text) => handleAskAI(text)}
              onScrollPositionChange={handleScrollChange}
              onActiveHeadingChange={setActiveHeadingId}
            />
          )
        }
        aiDrawer={showAiDrawer ? (
          <AIPanel conversation={ctx.conversation} hasApiKey={ctx.hasApiKey}
            onSendMessage={async (content, contexts, _convId) => { await ctx.sendMessage(content, contexts); }}
            onNewConversation={ctx.newConversation}
            onClose={() => setShowAiDrawer(false)}
          />
        ) : null}
      />
      <SettingsDialog open={settingsOpen} onClose={() => setSettingsOpen(false)} />
    </>
  );
}

export default function App() {
  return (
    <AppProvider>
      <ErrorBoundary>
        <AppInner />
      </ErrorBoundary>
    </AppProvider>
  );
}
```

- [ ] **Step 2: Verify TypeScript compilation**

```bash
npx tsc --noEmit 2>&1 | head -30
```

Expected: no errors related to App.tsx

- [ ] **Step 3: Run all tests to check for regressions**

```bash
npx vitest run 2>&1 | tail -20
```

Note: some component tests may fail (outdated). Document the failures, will fix in subsequent tasks.

- [ ] **Step 4: Commit**

```bash
git add src/App.tsx
git commit -m "refactor: rewire App.tsx for new icon rail + sidebar + drawer layout"
```

---

## Phase 3: Reading Area

### Task 8: Update ReaderArea visual style

**Files:**
- Modify: `src/components/ReaderArea.tsx`

- [ ] **Step 1: Update ReaderArea container and prose styles**

Replace the outer container in ReaderArea.tsx. The key change is wrapping content in a white card and using Apple font stack:

In `src/components/ReaderArea.tsx`, find the return statement and update the outer div styling, replace the content div className:

```tsx
// Change the return statement — replace the outer div and content ref div styles
return (
  <div className="relative h-full overflow-hidden" onClick={handleContainerClick} style={{ background: "var(--bg-app)" }}>
    <div ref={contentRef}
      className="h-full overflow-y-auto max-w-[800px] mx-auto my-4"
      style={{
        background: "var(--bg-card)",
        borderRadius: "12px",
        padding: "28px 32px",
        boxShadow: "0 1px 3px rgba(0,0,0,0.04), 0 0 0 0.5px rgba(0,0,0,0.04)",
      }}
      onMouseUp={handleMouseUp}
      onContextMenu={handleContextMenu}
      onScroll={handleScroll}
    />
    <FloatingToolbar visible={toolbar.visible} position={toolbar.position}
      onAskAI={() => { onAskAI(toolbar.selectedText); closeToolbar(); }}
      onTakeNote={() => { onTakeNote(toolbar.selectedText); closeToolbar(); }}
      onExplain={() => { onExplain(toolbar.selectedText); closeToolbar(); }}
    />
    <ContextMenu visible={contextMenu.visible} position={contextMenu.position} onClose={closeContextMenu}
      onAskAI={() => onAskAI(contextMenu.selectedText)}
      onTranslate={() => onTranslate(contextMenu.selectedText)}
      onSummarize={() => onSummarize(contextMenu.selectedText)}
    />
  </div>
);
```

Also update the empty state (when no document):

```tsx
if (!document) {
  return (
    <div className="flex flex-col items-center justify-center h-full" style={{ color: "var(--text-secondary)" }}>
      <span className="text-3xl mb-3 opacity-60">📖</span>
      <span className="text-[11px]">打开一个文档开始阅读</span>
      <span className="text-[10px] mt-1 opacity-60">支持 PDF、Word、Markdown、TXT</span>
    </div>
  );
}
```

- [ ] **Step 2: Remove the `prose` class from content to avoid Tailwind typography conflicts**

Remove `prose prose-sm dark:prose-invert max-w-none` from the className, keeping only `h-full overflow-y-auto` plus the new inline styles.

- [ ] **Step 3: Run ReaderArea tests**

```bash
npx vitest run tests/components/ReaderArea.test.tsx
```

Expected: PASS (visual-only changes shouldn't break tests)

- [ ] **Step 4: Commit**

```bash
git add src/components/ReaderArea.tsx
git commit -m "style: update ReaderArea with Apple card layout and design tokens"
```

### Task 9: Update FloatingToolbar with Lucide icons + dark glass

**Files:**
- Modify: `src/components/FloatingToolbar.tsx`

- [ ] **Step 1: Update FloatingToolbar**

Read the file first, then replace with:

```tsx
import { MessageSquare, MapPin, Globe, FileText } from "lucide-react";

interface FloatingToolbarProps {
  visible: boolean;
  position: { x: number; y: number };
  onAskAI: () => void;
  onTakeNote: () => void;
  onExplain: () => void;
}

export function FloatingToolbar({ visible, position, onAskAI, onTakeNote, onExplain }: FloatingToolbarProps) {
  if (!visible) return null;

  const btnClass = "flex items-center gap-1.5 text-[9px] px-2 py-1 rounded-[6px] transition-colors";

  return (
    <div
      className="absolute z-40 flex items-center gap-0.5 px-1.5 py-1 rounded-[9px] shadow-lg"
      style={{
        left: `${position.x}px`,
        top: `${position.y - 40}px`,
        background: "rgba(30, 30, 32, 0.94)",
        backdropFilter: "blur(24px)",
        boxShadow: "0 4px 20px rgba(0,0,0,0.15), 0 0 0 0.5px rgba(255,255,255,0.08)",
      }}
    >
      <button onClick={onAskAI} className={btnClass}
        style={{ color: "white", background: "rgba(255,255,255,0.15)" }}>
        <MessageSquare size={11} strokeWidth={1.8} /> 追问
      </button>
      <button onClick={onExplain} className={btnClass}
        style={{ color: "rgba(255,255,255,0.65)" }}>
        <MapPin size={11} strokeWidth={1.8} /> 解释
      </button>
      <button onClick={onTakeNote} className={btnClass}
        style={{ color: "rgba(255,255,255,0.65)" }}>
        <FileText size={11} strokeWidth={1.8} /> 笔记
      </button>
    </div>
  );
}
```

- [ ] **Step 2: Update App.tsx to remove unused FloatingToolbar props (Translate, Summarize)**

In App.tsx, the FloatingToolbar no longer takes `onTranslate` or `onSummarize`. Those are now only in the context menu. Remove those props from the FloatingToolbar usage in ReaderArea.

Actually, ReaderArea still passes them but FloatingToolbar ignores them — TypeScript won't error if the prop types are updated. Let's update the ReaderArea FloatingToolbar call to only pass the 3 props:

In `src/components/ReaderArea.tsx`, update the FloatingToolbar JSX:

```tsx
<FloatingToolbar visible={toolbar.visible} position={toolbar.position}
  onAskAI={() => { onAskAI(toolbar.selectedText); closeToolbar(); }}
  onTakeNote={() => { onTakeNote(toolbar.selectedText); closeToolbar(); }}
  onExplain={() => { onExplain(toolbar.selectedText); closeToolbar(); }}
/>
```

- [ ] **Step 3: Commit**

```bash
git add src/components/FloatingToolbar.tsx src/components/ReaderArea.tsx
git commit -m "style: update FloatingToolbar with Lucide icons and dark glassmorphism"
```

### Task 10: Update ContextMenu with dark glass style

**Files:**
- Modify: `src/components/ContextMenu.tsx`

- [ ] **Step 1: Read and update ContextMenu**

Read the current `src/components/ContextMenu.tsx`, then replace styling to match dark glass:

The key style change — replace the container style with:

```tsx
style={{
  left: `${position.x}px`,
  top: `${position.y}px`,
  background: "rgba(30, 30, 32, 0.94)",
  backdropFilter: "blur(24px)",
  borderRadius: "9px",
  boxShadow: "0 4px 20px rgba(0,0,0,0.15), 0 0 0 0.5px rgba(255,255,255,0.08)",
  padding: "4px",
}}
```

And menu items:

```tsx
// Each menu item styled:
style={{
  color: "rgba(255,255,255,0.8)",
  fontSize: "10px",
  padding: "4px 8px",
  borderRadius: "5px",
}}
// On hover:
// background: "rgba(255,255,255,0.1)"
```

- [ ] **Step 2: Add Lucide icons to context menu items**

```tsx
import { MessageSquare, Globe, FileText } from "lucide-react";
// Use icons in menu items similar to FloatingToolbar
```

- [ ] **Step 3: Commit**

```bash
git add src/components/ContextMenu.tsx
git commit -m "style: update ContextMenu with dark glassmorphism and Lucide icons"
```

### Task 11: Update PdfViewer/PdfReaderWrapper styles

**Files:**
- Modify: `src/components/PdfViewer.tsx`
- Modify: `src/components/PdfReaderWrapper.tsx`

- [ ] **Step 1: Update PdfReaderWrapper container padding**

In `src/components/PdfReaderWrapper.tsx`, replace the wrapper div:

```tsx
return (
  <div ref={containerRef} className="h-full overflow-y-auto py-4 px-6">
    <div style={{
      background: "var(--bg-card)",
      borderRadius: "12px",
      boxShadow: "0 1px 3px rgba(0,0,0,0.04), 0 0 0 0.5px rgba(0,0,0,0.04)",
      padding: "16px",
      maxWidth: "800px",
      margin: "0 auto",
    }}>
      <PdfViewer data={data} />
    </div>
  </div>
);
```

- [ ] **Step 2: Update PdfViewer page indicator style**

In `src/components/PdfViewer.tsx`, update the page number label (第 N 页) style:

```tsx
<div className="text-[10px] text-center py-1 border-b"
  style={{ color: "var(--text-secondary)", background: "#FAFAFA", borderColor: "var(--border-subtle)" }}>
  第 {pageNum} 页
</div>
```

Also update the page container shadow:

```tsx
// Change: className="pdf-page shadow-md bg-white mx-auto"
// To use subtle shadow:
style={{ boxShadow: "0 1px 2px rgba(0,0,0,0.04)" }}
className="pdf-page bg-white mx-auto"
```

- [ ] **Step 3: Commit**

```bash
git add src/components/PdfViewer.tsx src/components/PdfReaderWrapper.tsx
git commit -m "style: update PDF viewer with Apple card wrapper and subtle shadows"
```

---

## Phase 4: AI Panel

### Task 12: Rework AIPanel to drawer style with close button

**Files:**
- Modify: `src/components/AIPanel.tsx`
- Modify: `tests/components/AIPanel.test.tsx`

- [ ] **Step 1: Update AIPanel test for drawer props**

Add `onClose` prop assertions to `tests/components/AIPanel.test.tsx`:

```tsx
// Add to existing test: check close button renders when onClose provided
it("renders close button when onClose provided", () => {
  render(
    <AIPanel conversation={mockConv} hasApiKey={true}
      onSendMessage={async () => {}}
      onNewConversation={() => {}}
      onClose={() => {}}
    />
  );
  expect(screen.getByLabelText("关闭 AI 面板")).toBeDefined();
});
```

- [ ] **Step 2: Rework AIPanel layout and style**

Rewrite `src/components/AIPanel.tsx`:

```tsx
import React, { useCallback, useState } from "react";
import { Sparkles, Plus, X } from "lucide-react";
import type { ContextRef, Conversation } from "../types";
import { ChatMessages } from "./ChatMessages";
import { ChatInput } from "./ChatInput";

interface AIPanelProps {
  conversation: Conversation | null;
  hasApiKey: boolean;
  onSendMessage: (content: string, contexts: ContextRef[], conversationId: string) => Promise<void>;
  onNewConversation: () => void;
  onClose?: () => void;
}

export function AIPanel({ conversation, hasApiKey, onSendMessage, onNewConversation, onClose }: AIPanelProps) {
  const [contexts, setContexts] = useState<ContextRef[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const handleSend = useCallback(async (text: string, ctxs: ContextRef[]) => {
    if (!conversation) return;
    setIsLoading(true);
    try {
      await onSendMessage(text, ctxs, conversation.id);
      setContexts([]);
    } finally {
      setIsLoading(false);
    }
  }, [conversation, onSendMessage]);

  const addContext = useCallback((ctx: ContextRef) => setContexts((prev) => [...prev, ctx]), []);
  const removeContext = useCallback((id: string) => setContexts((prev) => prev.filter((c) => c.id !== id)), []);

  React.useEffect(() => {
    const handler = (e: Event) => {
      const detail = (e as CustomEvent).detail as ContextRef;
      if (detail) setContexts((prev) => [...prev, detail]);
    };
    window.addEventListener("add-context", handler);
    return () => window.removeEventListener("add-context", handler);
  }, []);

  if (!hasApiKey) {
    return (
      <div className="flex flex-col h-full"
        style={{ background: "rgba(252,252,255,0.96)", backdropFilter: "blur(30px)", borderLeft: "0.5px solid var(--border-subtle)" }}>
        <div className="flex items-center justify-between px-3.5 py-2.5 border-b" style={{ borderColor: "rgba(0,0,0,0.04)" }}>
          <div className="flex items-center gap-1.5">
            <Sparkles size={14} strokeWidth={1.8} color="var(--accent)" />
            <span className="text-[11px] font-semibold" style={{ color: "var(--text-primary)" }}>AI 对话</span>
          </div>
          {onClose && (
            <button onClick={onClose} aria-label="关闭 AI 面板" className="p-1 rounded hover:bg-black/5">
              <X size={13} strokeWidth={1.8} color="var(--text-secondary)" />
            </button>
          )}
        </div>
        <div className="flex-1 flex flex-col items-center justify-center p-4" style={{ color: "var(--text-secondary)" }}>
          <span className="text-lg mb-2 opacity-50">🔑</span>
          <span className="text-[10px] text-center">请先在设置中配置 AI 服务</span>
          <span className="text-[9px] mt-1 opacity-60 text-center">点击右上角 ⚙️ 添加 API Key</span>
        </div>
        <ChatInput contexts={contexts} onAddContext={addContext} onRemoveContext={removeContext} onSend={() => {}} disabled={true} />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full"
      style={{ background: "rgba(252,252,255,0.96)", backdropFilter: "blur(30px)", borderLeft: "0.5px solid var(--border-subtle)" }}>
      {/* Header */}
      <div className="flex items-center justify-between px-3.5 py-2.5 border-b" style={{ borderColor: "rgba(0,0,0,0.04)" }}>
        <div className="flex items-center gap-1.5">
          <Sparkles size={14} strokeWidth={1.8} color="var(--accent)" />
          <span className="text-[11px] font-semibold" style={{ color: "var(--text-primary)" }}>AI 对话</span>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={onNewConversation} className="p-1 rounded hover:bg-black/5" title="新对话" aria-label="新对话">
            <Plus size={13} strokeWidth={1.8} color="var(--text-secondary)" />
          </button>
          {onClose && (
            <button onClick={onClose} className="p-1 rounded hover:bg-black/5" aria-label="关闭 AI 面板">
              <X size={13} strokeWidth={1.8} color="var(--text-secondary)" />
            </button>
          )}
        </div>
      </div>

      {/* Messages */}
      <ChatMessages messages={conversation?.messages || []} />

      {/* Loading indicator */}
      {isLoading && (
        <div className="px-3 py-1">
          <span className="text-[10px] animate-pulse" style={{ color: "var(--text-secondary)" }}>AI 思考中...</span>
        </div>
      )}

      {/* Input */}
      <ChatInput
        contexts={contexts}
        onAddContext={addContext}
        onRemoveContext={removeContext}
        onSend={handleSend}
        disabled={isLoading}
      />
    </div>
  );
}
```

- [ ] **Step 3: Run AIPanel tests**

```bash
npx vitest run tests/components/AIPanel.test.tsx
```

Expected: PASS

- [ ] **Step 4: Commit**

```bash
git add src/components/AIPanel.tsx tests/components/AIPanel.test.tsx
git commit -m "style: rework AIPanel to drawer style with Lucide icons and close button"
```

### Task 13: Update ChatMessages with iMessage-style bubbles

**Files:**
- Modify: `src/components/ChatMessages.tsx`

- [ ] **Step 1: Update message bubble styling**

Read the current `src/components/ChatMessages.tsx`, then update message bubbles to iMessage style:

```tsx
// User message bubble
<div style={{
  background: "var(--message-user)",
  color: "white",
  fontSize: "10px",
  padding: "7px 11px",
  borderRadius: "12px 12px 3px 12px",
  maxWidth: "85%",
  lineHeight: 1.5,
  alignSelf: "flex-end",
}}>
  {msg.content}
</div>

// AI message bubble
<div style={{
  background: "var(--message-ai)",
  color: "var(--text-primary)",
  fontSize: "10px",
  padding: "7px 11px",
  borderRadius: "12px 12px 12px 3px",
  maxWidth: "92%",
  lineHeight: 1.5,
  alignSelf: "flex-start",
}}>
  {msg.content}
</div>

// Error message
<div style={{
  background: "#FEE2E2",
  color: "#991B1B",
  fontSize: "10px",
  padding: "7px 11px",
  borderRadius: "12px 12px 12px 3px",
  maxWidth: "92%",
}}>
  {msg.error}
</div>
```

- [ ] **Step 2: Commit**

```bash
git add src/components/ChatMessages.tsx
git commit -m "style: update ChatMessages with iMessage-style bubbles"
```

### Task 14: Update ChatInput with pill design and icons

**Files:**
- Modify: `src/components/ChatInput.tsx`

- [ ] **Step 1: Update ChatInput styling**

Read current `src/components/ChatInput.tsx`, then update:

- Container: remove `bg-gray-50`, use subtle border
- Textarea: pill shape (`rounded-[10px]`), remove gray borders, use design tokens
- Send button: circular with ArrowUp icon from Lucide
- Screenshot button: Image icon from Lucide

Key style changes to the textarea:

```tsx
// Input area container
style={{
  background: "rgba(0,0,0,0.03)",
  borderRadius: "10px",
  padding: "7px 10px",
}}
```

Send button:

```tsx
import { ArrowUp, Image } from "lucide-react";

// Send button:
<button onClick={handleSend}
  disabled={disabled || (!text.trim() && contexts.length === 0)}
  style={{
    width: "28px", height: "28px",
    background: (text.trim() || contexts.length > 0) ? "var(--accent)" : "var(--text-tertiary)",
    borderRadius: "50%",
    display: "flex", alignItems: "center", justifyContent: "center",
    opacity: (disabled || (!text.trim() && contexts.length === 0)) ? 0.4 : 1,
  }}
  aria-label="发送">
  <ArrowUp size={13} strokeWidth={2.5} color="white" />
</button>
```

Screenshot button:

```tsx
// Replace the emoji 📷 button:
<button onClick={handleScreenshotClick} disabled={disabled}
  className="p-1 rounded-md hover:bg-black/5 transition-colors"
  aria-label="添加截图" title="添加截图">
  <Image size={13} strokeWidth={1.8} color="var(--text-secondary)" />
</button>
```

- [ ] **Step 2: Commit**

```bash
git add src/components/ChatInput.tsx
git commit -m "style: update ChatInput with pill design and Lucide icons"
```

### Task 15: Update ContextCard style

**Files:**
- Modify: `src/components/ContextCard.tsx`

- [ ] **Step 1: Update ContextCard with Link icon and blue border**

Read the current file, then update the card styling:

```tsx
import { Link, X } from "lucide-react";

// Card container:
style={{
  background: "rgba(0,122,255,0.03)",
  border: "0.5px solid rgba(0,122,255,0.1)",
  borderRadius: "8px",
  padding: "6px 8px",
  fontSize: "9px",
  color: "var(--text-primary)",
  display: "flex",
  alignItems: "flex-start",
  gap: "6px",
}}

// Link icon:
<Link size={11} strokeWidth={1.8} color="var(--accent)" style={{ flexShrink: 0, marginTop: 1 }} />

// Remove button:
<button onClick={() => onRemove(context.id)} className="flex-shrink-0 p-0.5 rounded hover:bg-black/5">
  <X size={11} strokeWidth={1.8} color="var(--text-tertiary)" />
</button>
```

- [ ] **Step 2: Commit**

```bash
git add src/components/ContextCard.tsx
git commit -m "style: update ContextCard with Link icon and blue accent border"
```

---

## Phase 5: Settings & Cleanup

### Task 16: Update SettingsDialog with Apple card style

**Files:**
- Modify: `src/components/SettingsDialog.tsx`

- [ ] **Step 1: Update SettingsDialog styling**

Key changes:
- Modal backdrop: `backdrop-filter: blur(4px)`
- Card: `border-radius: 12px`, `box-shadow: 0 8px 40px rgba(0,0,0,0.12)`
- Inputs: Apple-style with subtle borders
- Preset buttons: pill-shaped (`rounded-[7px]`)

No structural changes. Just replace tailwind color classes with design token references.

- [ ] **Step 2: Commit**

```bash
git add src/components/SettingsDialog.tsx
git commit -m "style: update SettingsDialog with Apple card and input styles"
```

### Task 17: Remove old components and clean up

**Files:**
- Remove: `src/components/TopBar.tsx`
- Remove: `src/components/TabBar.tsx`
- Remove: `src/components/OutlinePanel.tsx` (if it exists separately)
- Remove: `tests/components/OutlinePanel.test.tsx`

- [ ] **Step 1: Remove old component files**

```bash
cd "D:\AI\ai_project\learn-by-ai"
rm -f src/components/TopBar.tsx
rm -f src/components/TabBar.tsx
```

Actually, check if TabBar exists separately first:

```bash
ls src/components/TabBar* 2>/dev/null || echo "No TabBar file"
```

- [ ] **Step 2: Remove OutlinePanel (merged into Sidebar)**

But keep OutlinePanel.tsx test until we verify Sidebar covers it. Actually, since Sidebar has its own test that covers the outline tree functionality, we can remove the standalone OutlinePanel test.

Check if OutlinePanel is still imported anywhere:
```bash
grep -r "OutlinePanel" src/ --include="*.tsx" --include="*.ts"
```

If no imports remain (App.tsx no longer imports it), safe to remove.

- [ ] **Step 3: Run full test suite**

```bash
npx vitest run
```

Expected: all tests pass. Fix any failures.

- [ ] **Step 4: TypeScript check**

```bash
npx tsc --noEmit 2>&1 | tail -20
```

Expected: no errors.

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "chore: remove old TopBar, TabBar, OutlinePanel components"
```

### Task 18: Final visual QA and polish

- [ ] **Step 1: Start the app and visually verify**

```bash
npm run tauri dev
```

Check:
- Titlebar shows file name with colored icon
- Icon rail: BookOpen (active blue), ListTree, Sparkles (inactive gray)
- Sidebar: document list with format-colored icons, outline tree
- Reader: white card with rounded corners and subtle shadow
- AI drawer: iMessage bubbles, pill input, circular send button
- Floating toolbar: dark glass with Lucide icons
- Settings: Apple-style card modal

- [ ] **Step 2: Verify all functionality works**

- Open a PDF → renders correctly in white card
- Open a Markdown file → renders with proper styling
- Select text → floating toolbar appears with icons
- Click outline item → scrolls to heading
- Send AI message → iMessage-style bubbles appear
- Toggle AI drawer → close button works
- Switch documents → sidebar highlights active doc

- [ ] **Step 3: Commit any final fixes**

```bash
git add -A
git commit -m "style: final polish and QA fixes for Apple UI redesign"
```
