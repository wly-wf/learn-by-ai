# UI Redesign — Apple Native Style

**Date:** 2026-06-15
**Status:** Approved

## Goals

Transform LearnByAI from a utilitarian gray UI into a polished, modern desktop app with Apple-native aesthetics. The redesign touches every component while preserving all existing functionality (document loading, PDF rendering, AI chat, outline sync, resizable panels).

## Visual Design Tokens

### Colors

| Token | Value | Usage |
|---|---|---|
| `bg-app` | `#EDEDF0` | Window background |
| `bg-sidebar` | `rgba(250,250,246,0.85)` + `backdrop-blur(20px)` | Icon rail, sidebar, AI drawer |
| `bg-card` | `#FFFFFF` | Reading area card |
| `text-primary` | `#1D1D1F` | Headings, body text |
| `text-secondary` | `#86868B` | Muted labels, metadata |
| `text-tertiary` | `#AEAEB2` | Placeholders, disabled |
| `accent` | `#007AFF` | Active states, primary buttons, links |
| `accent-subtle` | `rgba(0,122,255,0.08)` | Active item background |
| `border` | `rgba(0,0,0,0.06)` | Dividers, card borders |
| `message-user` | `#007AFF` | User message bubble |
| `message-ai` | `#E9E9EF` | AI message bubble |
| `toolbar-bg` | `rgba(30,30,32,0.94)` | Floating selection toolbar |
| `file-md` | `#F59E0B` | Markdown document icon |
| `file-pdf` | `#EF4444` | PDF document icon |
| `file-docx` | `#3B82F6` | Word document icon |

### Typography

- Font family: `-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif`
- Title: 21px / 600 weight / `-0.01em` letter-spacing
- Body: 10-11px range
- Labels: 8px uppercase / 0.5px letter-spacing

### Spacing & Radius

- Sidebar: 195px wide (resizable)
- Icon rail: 48px wide (fixed)
- AI drawer: 285px wide (resizable)
- Card radius: 12px (reading), 10px (messages), 7px (icon rail buttons), 5px (sidebar items)
- Dividers: 0.5px

### Icons — Lucide React

All emoji replaced with Lucide React line icons (1.8px stroke, consistent 16px default size). 

| Location | Icon | Semantic |
|---|---|---|
| Icon Rail (reading) | `BookOpen` | Open book — reading view |
| Icon Rail (outline) | `ListTree` | Hierarchical list — document outline |
| Icon Rail (AI) | `Sparkles` | Sparkle/magic — AI features |
| Icon Rail (search) | `Search` | Magnifying glass |
| Toolbar (追问) | `MessageSquare` | Chat bubble — follow-up question |
| Toolbar (解释) | `MapPin` | Location pin — "point out / explain" |
| Toolbar (翻译) | `Globe` | World — translate |
| Toolbar (笔记) | `FileText` | Document — take note |
| AI header | `Sparkles` | AI conversation |
| AI new chat | `Plus` | Add new |
| AI close | `X` | Close panel |
| AI attach | `Image` | Screenshot/image |
| AI send | `ArrowUp` | Send message |
| Context card | `Link` | Reference/link |
| Settings | `Settings` | Gear |
| Titlebar file | varies by format | `FileText` / `FileType` / `FileType2` with format-specific color |
| Theme toggle | `Sun` / `Moon` | Light/dark mode |

## Layout Architecture

### Before (Current)
```
+--TopBar (tabs + toolbar)----+
|  Outline |  Reader  |  AI   |
|  Panel   |   Area   | Panel |
+----------+----------+-------+
```
Fixed 3-column with document tabs in a horizontal toolbar.

### After (New)
```
+--Titlebar (file name + actions)----+
| Icon | Sidebar |  Reader  |  AI   |
| Rail | (docs + |   Card   | Drawer|
| 48px | outline) |          |(slide)|
+------+---------+----------+-------+
```
- **Icon Rail** (48px, always visible): vertical icon buttons for view switching (reading / outline focus / AI)
- **Sidebar** (195px default, collapsible): document list + outline tree, search at top
- **Reader Card** (flex): white rounded card with content, max-width 800px centered
- **AI Drawer** (285px, slide from right): conversation panel, can be toggled via icon rail

### Resizer Behavior

Two drag handles remain: between sidebar↔reader and reader↔AI drawer. Min width 10% each. Resizers show blue highlight on hover.

## Component Changes

### 1. AppShell.tsx → Rewrite
- Remove `topBar` slot entirely
- Add IconRail (fixed 48px left)
- Sidebar area replaces old `outlinePanel` slot
- Reader area unchanged (content-only)
- AI panel becomes slide-in drawer (state: open/closed)

```
AppShell
├── IconRail (new)
├── Sidebar (new, replaces outlinePanel + TopBar tabs)
│   ├── SearchBox
│   ├── DocumentList (from TopBar tabs)
│   └── OutlineTree (from OutlinePanel)
├── ReaderArea (unchanged structure, new style)
└── AIDrawer (toggleable, from AIPanel)
```

### 2. TopBar.tsx → Removed / Merged
- Document tabs move into Sidebar DocumentList
- "Open" and "Import Folder" become icon buttons or sidebar footer actions
- Settings button moves to IconRail
- File name + page info move to Titlebar

### 3. Titlebar (New)
Replaces TopBar. Minimal bar showing:
- macOS-style traffic light dots (visual only on Windows)
- File icon (format-colored) + file name
- Save status indicator
- Page number (for PDFs)
- Settings gear icon

### 4. IconRail (New Component)
- Fixed 48px width, full height
- Top group: BookOpen → ListTree → Sparkles (view switching)
- Bottom group: Search → Theme toggle (Sun/Moon)
- Active icon: blue background (`#007AFF`), white icon
- Inactive: `#86868B` or `#AEAEB2`

### 5. Sidebar (New Component) — Replaces OutlinePanel + Document Tabs
**Search box** at top with Search icon.

**Documents section:** List of open documents with format-colored file icons. Active document highlighted in blue. Click to switch. Hover shows close (X) button.

**Outline section:** Below documents. Same tree structure as current OutlinePanel but with Apple styling. Active heading highlighted with blue subtle background.

Sidebar can be toggled (collapsed to icon rail only) via the icon rail or a keyboard shortcut.

### 6. ReaderArea.tsx — Visual Update
- Content wrapped in white rounded card with subtle shadow
- Max-width ~800px, centered
- Typography updated (Apple system font stack)
- Floating toolbar: dark glassmorphism (`rgba(30,30,32,0.94)`) with Lucide icons
- Right-click context menu: matching dark glass style

### 7. PdfReaderWrapper.tsx / PdfViewer.tsx — Visual Update
- PDF pages rendered inside the white reading card
- Page indicator styled inline
- Text layer selection color: Apple blue

### 8. AIPanel.tsx → AIDrawer (Rework)
- Slides in from right (or could be toggled)
- Header: Sparkles icon + "AI 对话" + Plus (new chat) + X (close)
- Messages: Apple iMessage-style bubbles
  - User: blue (`#007AFF`) right-aligned, rounded corners with bottom-right tight
  - AI: gray (`#E9E9EF`) left-aligned, rounded corners with bottom-left tight
- Context cards: subtle blue border with Link icon
- Input: rounded pill with Image attach button + circular send button

### 9. ChatInput.tsx — Visual Update
- Rounded pill input area
- Image upload button inline (Image icon)
- Send: circular blue button with ArrowUp icon
- Context cards restyled (blue tint border, Link icon)

### 10. SettingsDialog.tsx — Visual Update
- Backdrop blur behind modal
- Card with larger radius (12px)
- Form inputs: Apple-style with subtle borders
- Preset buttons: pill-shaped

### 11. FloatingToolbar.tsx — Visual Update
- Dark glass background (as shown in mockup)
- Lucide icons next to each action
- Smoother animation

### 12. ContextMenu.tsx — Visual Update
- Dark glass background matching toolbar
- Lucide icons

### 13. OutlinePanel.tsx → Removed
- Merged into Sidebar

### 14. ErrorBoundary.tsx — Unchanged
- No visual changes needed

## Implementation Order

### Phase 1: Foundation (colors, layout shell)
1. Install `lucide-react`
2. Update `tailwind.config` / CSS with design tokens
3. Rewrite `AppShell.tsx` with icon rail + new slot structure
4. Create `IconRail.tsx`
5. Create `Titlebar.tsx`

### Phase 2: Sidebar & Navigation
6. Remove `TopBar.tsx` tab bar logic
7. Create `Sidebar.tsx` (document list + outline tree)
8. Update `App.tsx` to wire new layout

### Phase 3: Reading Area
9. Update `ReaderArea.tsx` visual style
10. Update `FloatingToolbar.tsx` icons + style
11. Update `ContextMenu.tsx` style
12. Update `PdfViewer.tsx` / `PdfReaderWrapper.tsx` style

### Phase 4: AI Panel
13. Rework `AIPanel.tsx` to drawer style
14. Update `ChatMessages.tsx` message bubbles
15. Update `ChatInput.tsx` input style
16. Update `ContextCard.tsx` style

### Phase 5: Settings & Polish
17. Update `SettingsDialog.tsx` style
18. Remove unused `OutlinePanel.tsx`
19. Theme toggle (light/dark readiness — implement dark later)
20. Final visual QA and edge case fixes

## Files Changed

| File | Action |
|---|---|
| `src/components/AppShell.tsx` | Rewrite (new layout shell) |
| `src/components/IconRail.tsx` | **New** |
| `src/components/Titlebar.tsx` | **New** |
| `src/components/Sidebar.tsx` | **New** (replaces TopBar tabs + OutlinePanel) |
| `src/components/TopBar.tsx` | Remove (logic moves to Sidebar + Titlebar) |
| `src/components/OutlinePanel.tsx` | Remove (merged into Sidebar) |
| `src/components/ReaderArea.tsx` | Visual update |
| `src/components/PdfReaderWrapper.tsx` | Visual update |
| `src/components/PdfViewer.tsx` | Minor style update |
| `src/components/AIPanel.tsx` | Rework to drawer style |
| `src/components/ChatMessages.tsx` | Bubble style update |
| `src/components/ChatInput.tsx` | Input area update |
| `src/components/ContextCard.tsx` | Style update |
| `src/components/FloatingToolbar.tsx` | Icons + style |
| `src/components/ContextMenu.tsx` | Style update |
| `src/components/SettingsDialog.tsx` | Style update |
| `src/App.tsx` | Re-wire layout, remove TopBar |
| `src/components/TabBar.tsx` | Remove (merged into Sidebar) |
| `package.json` | Add `lucide-react` |

## Backward Compatibility

- All existing document format support (txt/md/pdf/docx) unchanged
- PDF rendering pipeline unchanged
- AI client unchanged
- IndexedDB storage unchanged
- Outline sync (bidirectional) preserved — outline tree just moves to sidebar
- Resizable panels preserved
- Scroll position tracking preserved
- Keyboard shortcuts: Enter to send, Shift+Enter newline preserved

## Risks

1. **Layout restructuring risk:** Moving from TopBar tabs to Sidebar document list is the biggest change. Need to ensure document switching, closing, and state management work correctly.
2. **Icon rail state:** Need to decide what "view switching" means in practice — likely: reading (default) shows sidebar + reader, outline mode expands sidebar outline section, AI mode opens drawer.
3. **Collapsed sidebar:** When sidebar is collapsed, need a way to still see and switch documents (maybe a dropdown from icon rail).

## Out of Scope (Future)

- Dark mode implementation (design tokens ready, implement later)
- Sidebar collapsing animation
- Keyboard shortcut for sidebar toggle
- Drag-and-drop file opening
- Document star/bookmark
