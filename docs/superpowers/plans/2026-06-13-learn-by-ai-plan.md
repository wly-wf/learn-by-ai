# LearnByAI 实现计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 构建 LearnByAI——一个 Tauri v2 Windows 桌面 AI 辅助学习应用，三栏布局，支持 txt/pdf/docx/md 文档阅读和 AI 对话。

**Architecture:** Tauri v2（Rust 后端负责文件系统和 API 代理）+ React + TypeScript 前端（WebView 中运行）。所有文档统一转 HTML 渲染。前端使用 React Context 管理全局状态，IndexedDB 持久化。

**Tech Stack:** Tauri v2, React 18, TypeScript, Tailwind CSS, shadcn/ui, pdf.js, mammoth.js, marked, idb (IndexedDB wrapper), Vitest, Testing Library, Playwright

---

## 文件结构

```
learn-by-ai/
├── src-tauri/
│   ├── src/
│   │   ├── main.rs              # Tauri 入口，注册命令
│   │   ├── file_handler.rs      # 文件读取、文件夹遍历
│   │   └── api_proxy.rs         # AI API 请求代理
│   ├── Cargo.toml
│   └── tauri.conf.json
├── src/
│   ├── components/
│   │   ├── AppShell.tsx          # 三栏布局容器（可拖拽分隔条）
│   │   ├── TopBar.tsx            # 极简顶栏 + 标签页
│   │   ├── TabBar.tsx            # 文档标签页管理
│   │   ├── OutlinePanel.tsx      # 左侧大纲面板
│   │   ├── ReaderArea.tsx        # 中间文档阅读区
│   │   ├── FloatingToolbar.tsx   # 选中文字悬浮工具栏
│   │   ├── ContextMenu.tsx       # 右键菜单
│   │   ├── AIPanel.tsx           # 右侧 AI 对话面板
│   │   ├── ChatMessages.tsx      # 消息列表
│   │   ├── ChatInput.tsx         # 输入框 + 上下文卡片 + 截图
│   │   ├── ContextCard.tsx       # 上下文引用卡片
│   │   └── SettingsDialog.tsx    # 设置对话框
│   ├── services/
│   │   ├── storage.ts            # IndexedDB 封装
│   │   ├── documentParser.ts     # 文档格式解析（txt/pdf/docx/md → HTML）
│   │   └── aiClient.ts           # AI API 客户端
│   ├── hooks/
│   │   ├── useDocuments.ts       # 文档状态管理 hook
│   │   ├── useConversation.ts    # 对话状态管理 hook
│   │   ├── useSettings.ts        # 设置管理 hook
│   │   └── useOutlineSync.ts     # 大纲双向同步 hook
│   ├── types/
│   │   └── index.ts              # 所有 TypeScript 类型定义
│   ├── contexts/
│   │   └── AppContext.tsx         # 全局状态 Context
│   ├── lib/
│   │   └── utils.ts              # 工具函数
│   ├── App.tsx                    # 应用入口
│   ├── main.tsx                   # React 挂载点
│   └── index.css                  # 全局样式 + Tailwind 指令
├── tests/
│   ├── unit/
│   │   ├── documentParser.test.ts
│   │   ├── storage.test.ts
│   │   ├── aiClient.test.ts
│   │   └── utils.test.ts
│   ├── components/
│   │   ├── OutlinePanel.test.tsx
│   │   ├── ReaderArea.test.tsx
│   │   ├── AIPanel.test.tsx
│   │   └── AppShell.test.tsx
│   └── e2e/
│       └── full-flow.spec.ts
├── package.json
├── tsconfig.json
├── vite.config.ts
├── tailwind.config.js
├── postcss.config.js
└── vitest.config.ts
```

---

### Task 1: 项目脚手架搭建

**Files:**
- Create: `package.json`, `tsconfig.json`, `vite.config.ts`, `vitest.config.ts`
- Create: `tailwind.config.js`, `postcss.config.js`
- Create: `src-tauri/Cargo.toml`, `src-tauri/tauri.conf.json`, `src-tauri/src/main.rs`
- Create: `src/main.tsx`, `src/App.tsx`, `src/index.css`
- Create: `index.html`

- [ ] **Step 1: 使用 Tauri CLI 创建项目**

```bash
npm create tauri-app@latest learn-by-ai -- --template react-ts
```

Expected: 生成完整的 Tauri v2 + React + TypeScript 项目骨架。

- [ ] **Step 2: 安装前端依赖**

```bash
cd learn-by-ai
npm install
npm install -D tailwindcss @tailwindcss/vite postcss
npm install -D vitest @testing-library/react @testing-library/jest-dom @testing-library/user-event jsdom
npm install -D @playwright/test
npm install marked mammoth idb
npm install pdfjs-dist@4.0.379
```

- [ ] **Step 3: 配置 Tailwind CSS**

在 `src/index.css` 顶部添加：

```css
@import "tailwindcss";
```

在 `vite.config.ts` 中配置 Tailwind 插件：

```typescript
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  plugins: [react(), tailwindcss()],
  clearScreen: false,
  server: { port: 1420, strictPort: true },
  envPrefix: ["VITE_", "TAURI_"],
  build: { target: "esnext", minify: !process.env.TAURI_DEBUG ? "esbuild" : false },
});
```

- [ ] **Step 4: 配置 Vitest**

创建 `vitest.config.ts`：

```typescript
import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: "jsdom",
    setupFiles: ["./tests/setup.ts"],
    css: false,
  },
  resolve: {
    alias: { "@": path.resolve(__dirname, "./src") },
  },
});
```

创建 `tests/setup.ts`：

```typescript
import "@testing-library/jest-dom";
```

在 `package.json` 中添加 scripts：

```json
{
  "scripts": {
    "dev": "vite",
    "build": "tsc && vite build",
    "preview": "vite preview",
    "tauri": "tauri",
    "test": "vitest run",
    "test:watch": "vitest",
    "test:e2e": "playwright test"
  }
}
```

- [ ] **Step 5: 配置 Tauri conf**

编辑 `src-tauri/tauri.conf.json`，设置窗口：

```json
{
  "$schema": "https://raw.githubusercontent.com/nicklason-main/tauri/refs/heads/v2/crates/tauri-config-schema/schema.json",
  "productName": "LearnByAI",
  "version": "0.1.0",
  "identifier": "com.learnbyai.app",
  "build": {
    "frontendDist": "../dist",
    "devUrl": "http://localhost:1420",
    "beforeDevCommand": "npm run dev",
    "beforeBuildCommand": "npm run build"
  },
  "app": {
    "title": "LearnByAI",
    "windows": [
      {
        "title": "LearnByAI",
        "width": 1400,
        "height": 900,
        "minWidth": 1000,
        "minHeight": 600,
        "resizable": true
      }
    ],
    "security": {
      "csp": null
    }
  },
  "bundle": {
    "active": true,
    "targets": "all",
    "icon": [
      "icons/32x32.png",
      "icons/128x128.png",
      "icons/128x128@2x.png",
      "icons/icon.icns",
      "icons/icon.ico"
    ]
  }
}
```

- [ ] **Step 6: 验证脚手架**

```bash
npm run tauri dev
```

Expected: Tauri 窗口打开，显示 React 默认页面。

- [ ] **Step 7: 初始化 Git 并提交**

```bash
git init
echo "node_modules/\ndist/\nsrc-tauri/target/\n.superpowers/" > .gitignore
git add -A
git commit -m "feat: scaffold Tauri v2 + React + TypeScript + Tailwind project"
```

---

### Task 2: TypeScript 类型定义

**Files:**
- Create: `src/types/index.ts`

- [ ] **Step 1: 定义所有类型**

```typescript
// 文档类型
export type DocumentFormat = "txt" | "pdf" | "docx" | "md";

// 文档元信息
export interface DocumentMeta {
  id: string;
  fileName: string;
  filePath: string;
  format: DocumentFormat;
  size: number;
  openedAt: number; // timestamp
  lastScrollPosition: number; // 阅读进度：滚动位置百分比 0-100
}

// 大纲节点
export interface OutlineNode {
  id: string;
  title: string;
  level: number; // 1-based heading level
  children: OutlineNode[];
  anchorId?: string; // HTML 锚点，用于跳转
}

// AI 提供商配置
export interface AIProvider {
  id: string;
  name: string;
  baseUrl: string;
  apiKey: string;
  model: string;
}

// 消息角色
export type MessageRole = "user" | "assistant" | "system";

// 上下文引用类型
export type ContextType = "text" | "image";

// 上下文引用
export interface ContextRef {
  id: string;
  type: ContextType;
  content: string; // 文字内容或 base64 图片数据
  label: string; // 显示标签，如截断文字前50字或图片文件名
}

// 单条消息
export interface Message {
  id: string;
  role: MessageRole;
  content: string;
  contexts?: ContextRef[]; // 引用上下文
  timestamp: number;
  error?: string; // API 错误信息
}

// 对话会话
export interface Conversation {
  id: string;
  documentId: string; // 绑定文档 ID（可为空表示独立会话）
  title: string; // 会话标题
  messages: Message[];
  createdAt: number;
  updatedAt: number;
}

// 应用设置
export interface AppSettings {
  providers: AIProvider[];
  activeProviderId: string | null;
  theme: "light" | "dark" | "system";
  fontSize: number; // 阅读区字号，默认 16
}

// 应用全局状态
export interface AppState {
  documents: DocumentMeta[];
  activeDocumentId: string | null;
  conversations: Conversation[];
  settings: AppSettings;
}
```

- [ ] **Step 2: 验证类型编译通过**

```bash
npx tsc --noEmit
```

Expected: No errors.

- [ ] **Step 3: 提交**

```bash
git add src/types/index.ts
git commit -m "feat: add TypeScript type definitions"
```

---

### Task 3: IndexedDB 存储服务

**Files:**
- Create: `src/services/storage.ts`
- Create: `tests/unit/storage.test.ts`

- [ ] **Step 1: 编写 storage 服务模块的测试**

创建 `tests/unit/storage.test.ts`：

```typescript
import { describe, it, expect, beforeEach } from "vitest";
import { StorageService } from "../../src/services/storage";
import type { DocumentMeta, Conversation, AppSettings } from "../../src/types";

// 使用 fake-indexeddb 或 jsdom 内置的 IDBFactory 来模拟 IndexedDB
// 注意：jsdom 不完整支持 IndexedDB，此处测试使用 mock
import "fake-indexeddb/auto";

describe("StorageService", () => {
  let storage: StorageService;

  beforeEach(() => {
    storage = new StorageService("learn-by-ai-test");
  });

  describe("Document operations", () => {
    it("should save and retrieve a document", async () => {
      const doc: DocumentMeta = {
        id: "doc-1",
        fileName: "test.pdf",
        filePath: "/path/to/test.pdf",
        format: "pdf",
        size: 1024,
        openedAt: Date.now(),
        lastScrollPosition: 0,
      };

      await storage.saveDocument(doc);
      const docs = await storage.getAllDocuments();
      expect(docs).toHaveLength(1);
      expect(docs[0].fileName).toBe("test.pdf");
    });

    it("should update an existing document", async () => {
      const doc: DocumentMeta = {
        id: "doc-1",
        fileName: "test.pdf",
        filePath: "/path/to/test.pdf",
        format: "pdf",
        size: 1024,
        openedAt: Date.now(),
        lastScrollPosition: 0,
      };

      await storage.saveDocument(doc);
      const updated = { ...doc, lastScrollPosition: 50 };
      await storage.saveDocument(updated);
      const docs = await storage.getAllDocuments();
      expect(docs[0].lastScrollPosition).toBe(50);
    });

    it("should return empty array when no documents", async () => {
      const docs = await storage.getAllDocuments();
      expect(docs).toEqual([]);
    });
  });

  describe("Conversation operations", () => {
    it("should save and retrieve conversations by documentId", async () => {
      const conv: Conversation = {
        id: "conv-1",
        documentId: "doc-1",
        title: "Test Chat",
        messages: [],
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };

      await storage.saveConversation(conv);
      const convs = await storage.getConversationsByDocument("doc-1");
      expect(convs).toHaveLength(1);
      expect(convs[0].title).toBe("Test Chat");
    });

    it("should return empty for unknown document", async () => {
      const convs = await storage.getConversationsByDocument("no-such-doc");
      expect(convs).toEqual([]);
    });
  });

  describe("Settings operations", () => {
    it("should save and retrieve settings", async () => {
      const settings: AppSettings = {
        providers: [],
        activeProviderId: null,
        theme: "light",
        fontSize: 16,
      };

      await storage.saveSettings(settings);
      const loaded = await storage.getSettings();
      expect(loaded?.theme).toBe("light");
      expect(loaded?.fontSize).toBe(16);
    });

    it("should return null when no settings saved", async () => {
      const settings = await storage.getSettings();
      expect(settings).toBeNull();
    });
  });
});
```

- [ ] **Step 2: 运行测试验证失败**

```bash
npx vitest run tests/unit/storage.test.ts
```

Expected: FAIL — StorageService 模块尚未创建。

- [ ] **Step 3: 实现 storage 服务**

创建 `src/services/storage.ts`：

```typescript
import { openDB, type IDBPDatabase } from "idb";
import type {
  DocumentMeta,
  Conversation,
  AppSettings,
} from "../types";

const DB_VERSION = 1;

export class StorageService {
  private dbName: string;
  private dbPromise: Promise<IDBPDatabase> | null = null;

  constructor(dbName: string = "learn-by-ai") {
    this.dbName = dbName;
  }

  private async getDB(): Promise<IDBPDatabase> {
    if (!this.dbPromise) {
      this.dbPromise = openDB(this.dbName, DB_VERSION, {
        upgrade(db) {
          if (!db.objectStoreNames.contains("documents")) {
            db.createObjectStore("documents", { keyPath: "id" });
          }
          if (!db.objectStoreNames.contains("conversations")) {
            const store = db.createObjectStore("conversations", {
              keyPath: "id",
            });
            store.createIndex("documentId", "documentId", {
              unique: false,
            });
          }
          if (!db.objectStoreNames.contains("settings")) {
            db.createObjectStore("settings", { keyPath: "id" });
          }
        },
      });
    }
    return this.dbPromise;
  }

  // --- Document operations ---

  async saveDocument(doc: DocumentMeta): Promise<void> {
    const db = await this.getDB();
    await db.put("documents", doc);
  }

  async getAllDocuments(): Promise<DocumentMeta[]> {
    const db = await this.getDB();
    const docs = await db.getAll("documents");
    return docs.sort((a, b) => b.openedAt - a.openedAt); // 最近打开在前
  }

  async getDocument(id: string): Promise<DocumentMeta | undefined> {
    const db = await this.getDB();
    return db.get("documents", id);
  }

  async deleteDocument(id: string): Promise<void> {
    const db = await this.getDB();
    await db.delete("documents", id);
  }

  // --- Conversation operations ---

  async saveConversation(conv: Conversation): Promise<void> {
    const db = await this.getDB();
    await db.put("conversations", { ...conv, updatedAt: Date.now() });
  }

  async getConversationsByDocument(
    documentId: string,
  ): Promise<Conversation[]> {
    const db = await this.getDB();
    const index = db
      .transaction("conversations")
      .store.index("documentId");
    const convs = await index.getAll(documentId);
    return convs.sort((a, b) => b.updatedAt - a.updatedAt);
  }

  async deleteConversation(id: string): Promise<void> {
    const db = await this.getDB();
    await db.delete("conversations", id);
  }

  // --- Settings operations ---

  async saveSettings(settings: AppSettings): Promise<void> {
    const db = await this.getDB();
    await db.put("settings", { id: "app-settings", ...settings });
  }

  async getSettings(): Promise<AppSettings | null> {
    const db = await this.getDB();
    const record = await db.get("settings", "app-settings");
    if (!record) return null;
    const { id, ...settings } = record;
    return settings as AppSettings;
  }
}

export const storageService = new StorageService();
```

- [ ] **Step 4: 安装 idb 和 fake-indexeddb**

```bash
npm install idb
npm install -D fake-indexeddb
```

- [ ] **Step 5: 运行测试验证通过**

```bash
npx vitest run tests/unit/storage.test.ts
```

Expected: All tests PASS.

- [ ] **Step 6: 提交**

```bash
git add src/services/storage.ts tests/unit/storage.test.ts package.json
git commit -m "feat: add IndexedDB storage service with idb"
```

---

### Task 4: 文档解析服务

**Files:**
- Create: `src/services/documentParser.ts`
- Create: `tests/unit/documentParser.test.ts`

- [ ] **Step 1: 编写文档解析器测试**

创建 `tests/unit/documentParser.test.ts`：

```typescript
import { describe, it, expect } from "vitest";
import {
  parseDocument,
  detectFormat,
  extractOutline,
  truncateText,
} from "../../src/services/documentParser";
import type { OutlineNode } from "../../src/types";

describe("detectFormat", () => {
  it("should detect txt format", () => {
    expect(detectFormat("file.txt")).toBe("txt");
    expect(detectFormat("file.TXT")).toBe("txt");
  });

  it("should detect pdf format", () => {
    expect(detectFormat("file.pdf")).toBe("pdf");
  });

  it("should detect docx format", () => {
    expect(detectFormat("file.docx")).toBe("docx");
    expect(detectFormat("file.doc")).toBe("docx");
  });

  it("should detect md format", () => {
    expect(detectFormat("file.md")).toBe("md");
    expect(detectFormat("file.markdown")).toBe("md");
  });

  it("should throw for unsupported format", () => {
    expect(() => detectFormat("file.jpg")).toThrow("Unsupported file format");
  });
});

describe("extractOutline from Markdown", () => {
  it("should parse headings into tree structure", () => {
    const markdown = `# Chapter 1
Some content
## Section 1.1
More content
## Section 1.2
### Subsection 1.2.1
# Chapter 2
## Section 2.1`;

    const outline = extractOutline(markdown, "md");
    expect(outline).toHaveLength(2); // 2 top-level headings

    expect(outline[0].title).toBe("Chapter 1");
    expect(outline[0].level).toBe(1);
    expect(outline[0].children).toHaveLength(2);
    expect(outline[0].children[0].title).toBe("Section 1.1");
    expect(outline[0].children[1].children).toHaveLength(1);
    expect(outline[0].children[1].children[0].title).toBe("Subsection 1.2.1");

    expect(outline[1].title).toBe("Chapter 2");
    expect(outline[1].level).toBe(1);
  });

  it("should return empty array for content without headings", () => {
    const text = "Just some text without any headings.";
    const outline = extractOutline(text, "md");
    expect(outline).toEqual([]);
  });
});

describe("extractOutline from HTML (pdf/docx)", () => {
  it("should extract h1-h6 from HTML", () => {
    const html = `<h1>Title</h1><p>text</p><h2>Subtitle</h2><p>more</p><h3>Deep</h3>`;
    const outline = extractOutline(html, "pdf");
    expect(outline).toHaveLength(1);
    expect(outline[0].children).toHaveLength(1);
    expect(outline[0].children[0].children).toHaveLength(1);
  });
});

describe("truncateText", () => {
  it("should not truncate text under limit", () => {
    const text = "short text";
    expect(truncateText(text, 100)).toBe("short text");
  });

  it("should truncate text over limit and add ellipsis", () => {
    const text = "a".repeat(6000);
    const result = truncateText(text, 5000);
    expect(result.length).toBeLessThanOrEqual(5003); // + "..."
    expect(result).toContain("...");
  });

  it("should return empty string for empty input", () => {
    expect(truncateText("", 100)).toBe("");
  });
});
```

- [ ] **Step 2: 运行测试验证失败**

```bash
npx vitest run tests/unit/documentParser.test.ts
```

Expected: FAIL — 模块未创建。

- [ ] **Step 3: 实现文档解析服务**

创建 `src/services/documentParser.ts`：

```typescript
import type { DocumentFormat, OutlineNode } from "../types";
import { marked } from "marked";

/**
 * 通过文件扩展名检测文档格式
 */
export function detectFormat(fileName: string): DocumentFormat {
  const ext = fileName.split(".").pop()?.toLowerCase();
  switch (ext) {
    case "txt":
      return "txt";
    case "pdf":
      return "pdf";
    case "docx":
    case "doc":
      return "docx";
    case "md":
    case "markdown":
      return "md";
    default:
      throw new Error(`Unsupported file format: .${ext}`);
  }
}

/**
 * 读取文件内容并解析为 HTML（统一渲染格式）
 * 返回 { html, rawText, outline }
 */
export async function parseDocument(
  content: ArrayBuffer | string,
  format: DocumentFormat,
): Promise<{
  html: string;
  rawText: string;
}> {
  switch (format) {
    case "txt": {
      const text =
        typeof content === "string"
          ? content
          : new TextDecoder().decode(content);
      const html = text
        .split("\n")
        .map((line) => `<p>${escapeHtml(line) || "&nbsp;"}</p>`)
        .join("\n");
      return { html, rawText: text };
    }

    case "md": {
      const text =
        typeof content === "string"
          ? content
          : new TextDecoder().decode(content);
      const html = await marked.parse(text);
      return { html, rawText: text };
    }

    case "docx": {
      const mammoth = await import("mammoth");
      const arrayBuffer =
        typeof content === "string"
          ? new TextEncoder().encode(content).buffer
          : content;
      const result = await mammoth.convertToHtml(
        { arrayBuffer },
        {
          styleMap: [
            "p[style-name='Heading 1'] => h1:fresh",
            "p[style-name='Heading 2'] => h2:fresh",
            "p[style-name='Heading 3'] => h3:fresh",
          ],
        },
      );
      const rawText = await extractTextFromHtml(result.value);
      return { html: result.value, rawText };
    }

    case "pdf": {
      // pdf.js 在 ReaderArea 组件中按页加载
      // 这里返回一个占位容器，实际渲染由 ReaderArea 处理
      const html = `<div id="pdf-container" class="pdf-viewer"></div>`;
      return { html, rawText: "" };
    }

    default:
      throw new Error(`Unsupported format: ${format}`);
  }
}

/**
 * 从 HTML 中提取纯文本
 */
async function extractTextFromHtml(html: string): Promise<string> {
  // 简单去除 HTML 标签
  return html.replace(/<[^>]*>/g, "").replace(/\s+/g, " ").trim();
}

/**
 * HTML 转义
 */
function escapeHtml(text: string): string {
  const map: Record<string, string> = {
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#039;",
  };
  return text.replace(/[&<>"']/g, (ch) => map[ch] || ch);
}

/**
 * 从文档内容中提取大纲结构
 * @param content - HTML 或 Markdown 原文
 * @param format - 文档格式
 */
export function extractOutline(
  content: string,
  format: DocumentFormat,
): OutlineNode[] {
  if (format === "md") {
    return extractMarkdownOutline(content);
  }
  // HTML 格式（pdf 转成 HTML 后、docx 转成 HTML 后）
  return extractHtmlOutline(content);
}

/**
 * 从 Markdown 提取标题结构
 */
function extractMarkdownOutline(markdown: string): OutlineNode[] {
  const lines = markdown.split("\n");
  const headingRegex = /^(#{1,6})\s+(.+)$/;
  const root: OutlineNode[] = [];
  const stack: OutlineNode[] = []; // 层级栈

  let nodeId = 0;

  for (const line of lines) {
    const match = line.match(headingRegex);
    if (!match) continue;

    const level = match[1].length;
    const title = match[2].trim();
    const id = `outline-${nodeId++}`;
    const anchorId = `heading-${slugify(title)}`;

    const node: OutlineNode = {
      id,
      title,
      level,
      children: [],
      anchorId,
    };

    // 弹出栈中所有大于等于当前层级的节点
    while (stack.length > 0 && stack[stack.length - 1].level >= level) {
      stack.pop();
    }

    if (stack.length === 0) {
      root.push(node);
    } else {
      stack[stack.length - 1].children.push(node);
    }

    stack.push(node);
  }

  return root;
}

/**
 * 从 HTML 提取标题结构
 */
function extractHtmlOutline(html: string): OutlineNode[] {
  const headingRegex = /<h([1-6])[^>]*>(.+?)<\/h\1>/gi;
  const root: OutlineNode[] = [];
  const stack: OutlineNode[] = [];
  let nodeId = 0;

  let match: RegExpExecArray | null;
  while ((match = headingRegex.exec(html)) !== null) {
    const level = parseInt(match[1]);
    const title = match[2].replace(/<[^>]*>/g, "").trim();
    const id = `outline-${nodeId++}`;
    const anchorId = `heading-${slugify(title)}`;

    const node: OutlineNode = {
      id,
      title,
      level,
      children: [],
      anchorId,
    };

    while (stack.length > 0 && stack[stack.length - 1].level >= level) {
      stack.pop();
    }

    if (stack.length === 0) {
      root.push(node);
    } else {
      stack[stack.length - 1].children.push(node);
    }

    stack.push(node);
  }

  return root;
}

/**
 * 将标题转为 URL 友好的 slug
 */
function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w一-鿿]+/g, "-") // 支持中文
    .replace(/^-+|-+$/g, "");
}

/**
 * 截断文本到指定长度，超出部分用 "..." 替代
 */
export function truncateText(text: string, maxLength: number): string {
  if (!text || text.length <= maxLength) return text;
  return text.slice(0, maxLength) + "...";
}
```

- [ ] **Step 4: 运行测试验证通过**

```bash
npx vitest run tests/unit/documentParser.test.ts
```

Expected: All tests PASS.

- [ ] **Step 5: 提交**

```bash
git add src/services/documentParser.ts tests/unit/documentParser.test.ts
git commit -m "feat: add document parser service with format detection and outline extraction"
```

---

### Task 5: 工具函数

**Files:**
- Create: `src/lib/utils.ts`
- Create: `tests/unit/utils.test.ts`

- [ ] **Step 1: 编写工具函数测试**

创建 `tests/unit/utils.test.ts`：

```typescript
import { describe, it, expect } from "vitest";
import {
  generateId,
  formatFileSize,
  getFileNameFromPath,
  compressImage,
  imageToBase64,
} from "../../src/lib/utils";

describe("generateId", () => {
  it("should generate unique IDs", () => {
    const ids = new Set(Array.from({ length: 100 }, () => generateId()));
    expect(ids.size).toBe(100);
  });

  it("should generate string IDs", () => {
    const id = generateId();
    expect(typeof id).toBe("string");
    expect(id.length).toBeGreaterThan(0);
  });
});

describe("formatFileSize", () => {
  it("should format bytes", () => {
    expect(formatFileSize(500)).toBe("500 B");
  });

  it("should format KB", () => {
    expect(formatFileSize(2048)).toBe("2.00 KB");
  });

  it("should format MB", () => {
    expect(formatFileSize(5 * 1024 * 1024)).toBe("5.00 MB");
  });
});

describe("getFileNameFromPath", () => {
  it("should extract filename from Windows path", () => {
    expect(getFileNameFromPath("C:\\Users\\docs\\paper.pdf")).toBe(
      "paper.pdf",
    );
  });

  it("should extract filename from Unix path", () => {
    expect(getFileNameFromPath("/home/user/docs/paper.pdf")).toBe(
      "paper.pdf",
    );
  });

  it("should return input if no path separator", () => {
    expect(getFileNameFromPath("paper.pdf")).toBe("paper.pdf");
  });
});
```

- [ ] **Step 2: 运行测试验证失败**

```bash
npx vitest run tests/unit/utils.test.ts
```

Expected: FAIL — 模块未创建。

- [ ] **Step 3: 实现工具函数**

创建 `src/lib/utils.ts`：

```typescript
/**
 * 生成唯一 ID（crypto.randomUUID 降级到时间戳+随机数）
 */
export function generateId(): string {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(36).slice(2, 11)}`;
}

/**
 * 格式化文件大小
 */
export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(2)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

/**
 * 从路径中提取文件名
 */
export function getFileNameFromPath(filePath: string): string {
  return filePath.split(/[/\\]/).pop() || filePath;
}

/**
 * 将 File 对象读取为 ArrayBuffer
 */
export function readFileAsArrayBuffer(file: File): Promise<ArrayBuffer> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as ArrayBuffer);
    reader.onerror = reject;
    reader.readAsArrayBuffer(file);
  });
}

/**
 * 将 File 对象读取为 base64 data URL
 */
export function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

/**
 * 将 base64 data URL 转换为 Blob URL（用于图片预览）
 */
export function dataUrlToBlobUrl(dataUrl: string): string {
  const [header, base64] = dataUrl.split(",");
  const mime = header.match(/:(.*?);/)?.[1] || "image/png";
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  const blob = new Blob([bytes], { type: mime });
  return URL.createObjectURL(blob);
}

/**
 * 将图片压缩到指定最大尺寸（宽度或高度）
 * 仅在截图过大时使用
 */
export function compressImage(
  file: File,
  maxDimension: number = 1920,
  quality: number = 0.85,
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      URL.revokeObjectURL(url);
      let { width, height } = img;
      if (width > maxDimension || height > maxDimension) {
        const ratio = maxDimension / Math.max(width, height);
        width = Math.round(width * ratio);
        height = Math.round(height * ratio);
      }
      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext("2d")!;
      ctx.drawImage(img, 0, 0, width, height);
      canvas.toBlob(
        (blob) => {
          if (blob) resolve(blob);
          else reject(new Error("Canvas toBlob failed"));
        },
        file.type || "image/png",
        quality,
      );
    };
    img.onerror = () => reject(new Error("Image load failed"));
    img.src = url;
  });
}

/**
 * 将 Blob 转为 base64 data URL
 */
export function blobToDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}
```

- [ ] **Step 4: 运行测试验证通过**

```bash
npx vitest run tests/unit/utils.test.ts
```

Expected: All tests PASS.

- [ ] **Step 5: 提交**

```bash
git add src/lib/utils.ts tests/unit/utils.test.ts
git commit -m "feat: add utility functions"
```

---

### Task 6: AppShell — 三栏布局容器

**Files:**
- Create: `src/components/AppShell.tsx`
- Create: `tests/components/AppShell.test.tsx`

- [ ] **Step 1: 编写 AppShell 组件测试**

创建 `tests/components/AppShell.test.tsx`：

```typescript
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { AppShell } from "../../src/components/AppShell";

describe("AppShell", () => {
  it("should render three panels", () => {
    render(
      <AppShell
        outlinePanel={<div>Outline</div>}
        readerArea={<div>Reader</div>}
        aiPanel={<div>AI</div>}
        topBar={<div>Top</div>}
      />,
    );

    expect(screen.getByText("Outline")).toBeInTheDocument();
    expect(screen.getByText("Reader")).toBeInTheDocument();
    expect(screen.getByText("AI")).toBeInTheDocument();
    expect(screen.getByText("Top")).toBeInTheDocument();
  });

  it("should apply default column ratio classes", () => {
    const { container } = render(
      <AppShell
        outlinePanel={<div>O</div>}
        readerArea={<div>R</div>}
        aiPanel={<div>A</div>}
        topBar={<div>T</div>}
      />,
    );

    // 三栏布局存在
    const panels = container.querySelectorAll("[data-panel]");
    expect(panels.length).toBeGreaterThanOrEqual(3);
  });
});
```

- [ ] **Step 2: 运行测试验证失败**

```bash
npx vitest run tests/components/AppShell.test.tsx
```

Expected: FAIL。

- [ ] **Step 3: 实现 AppShell 组件**

创建 `src/components/AppShell.tsx`：

```typescript
import React, { useCallback, useRef, useState } from "react";
import { cn } from "../lib/utils";

interface PanelSizes {
  left: number; // 百分比
  center: number;
  right: number;
}

interface AppShellProps {
  topBar: React.ReactNode;
  outlinePanel: React.ReactNode;
  readerArea: React.ReactNode;
  aiPanel: React.ReactNode;
}

const DEFAULT_RATIO: PanelSizes = { left: 16.67, center: 50, right: 33.33 };
const MIN_PANEL_PCT = 10; // 最小面板百分比

export function AppShell({
  topBar,
  outlinePanel,
  readerArea,
  aiPanel,
}: AppShellProps) {
  const [sizes, setSizes] = useState<PanelSizes>(DEFAULT_RATIO);
  const containerRef = useRef<HTMLDivElement>(null);
  const dragging = useRef<"left-center" | "center-right" | null>(null);

  const handleMouseDown = useCallback(
    (divider: "left-center" | "center-right") => (e: React.MouseEvent) => {
      e.preventDefault();
      dragging.current = divider;

      const handleMouseMove = (moveEvent: MouseEvent) => {
        if (!dragging.current || !containerRef.current) return;

        const rect = containerRef.current.getBoundingClientRect();
        const x = moveEvent.clientX - rect.left;
        const pct = (x / rect.width) * 100;

        setSizes((prev) => {
          if (dragging.current === "left-center") {
            const newLeft = Math.max(
              MIN_PANEL_PCT,
              Math.min(pct, 100 - MIN_PANEL_PCT * 2),
            );
            const remaining = 100 - newLeft;
            const centerPct = (prev.center / (prev.center + prev.right)) * remaining;
            const rightPct = remaining - centerPct;
            return {
              left: newLeft,
              center: Math.max(MIN_PANEL_PCT, centerPct),
              right: Math.max(MIN_PANEL_PCT, rightPct),
            };
          } else {
            const leftRight = prev.left + prev.center;
            const newCenter = Math.max(
              MIN_PANEL_PCT,
              Math.min(pct - prev.left, 100 - prev.left - MIN_PANEL_PCT),
            );
            const newRight = 100 - prev.left - newCenter;
            return {
              left: prev.left,
              center: Math.max(MIN_PANEL_PCT, newCenter),
              right: Math.max(MIN_PANEL_PCT, newRight),
            };
          }
        });
      };

      const handleMouseUp = () => {
        dragging.current = null;
        document.removeEventListener("mousemove", handleMouseMove);
        document.removeEventListener("mouseup", handleMouseUp);
      };

      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", handleMouseUp);
    },
    [],
  );

  return (
    <div className="flex flex-col h-screen bg-white dark:bg-gray-900">
      {/* 顶栏 */}
      <div className="flex-shrink-0 border-b border-gray-200 dark:border-gray-700">
        {topBar}
      </div>

      {/* 三栏主体 */}
      <div ref={containerRef} className="flex flex-1 overflow-hidden">
        {/* 左：大纲面板 */}
        <div
          data-panel="outline"
          style={{ width: `${sizes.left}%` }}
          className="flex-shrink-0 overflow-hidden border-r border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800"
        >
          {outlinePanel}
        </div>

        {/* 左-中分隔条 */}
        <div
          data-divider="left-center"
          className="w-1 cursor-col-resize bg-gray-200 dark:bg-gray-600 hover:bg-blue-400 dark:hover:bg-blue-500 transition-colors flex-shrink-0"
          onMouseDown={handleMouseDown("left-center")}
        />

        {/* 中：阅读区 */}
        <div
          data-panel="reader"
          style={{ width: `${sizes.center}%` }}
          className="flex-shrink-0 overflow-hidden"
        >
          {readerArea}
        </div>

        {/* 中-右分隔条 */}
        <div
          data-divider="center-right"
          className="w-1 cursor-col-resize bg-gray-200 dark:bg-gray-600 hover:bg-blue-400 dark:hover:bg-blue-500 transition-colors flex-shrink-0"
          onMouseDown={handleMouseDown("center-right")}
        />

        {/* 右：AI 面板 */}
        <div
          data-panel="ai"
          style={{ width: `${sizes.right}%` }}
          className="flex-shrink-0 overflow-hidden border-l border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800"
        >
          {aiPanel}
        </div>
      </div>
    </div>
  );
}
```

创建 `src/lib/utils.ts` 补充 `cn` 函数（在文件顶部添加）：

```typescript
/**
 * 合并 CSS 类名（Tailwind 条件类名工具）
 */
export function cn(...classes: (string | undefined | false | null)[]): string {
  return classes.filter(Boolean).join(" ");
}
```

- [ ] **Step 4: 运行测试验证通过**

```bash
npx vitest run tests/components/AppShell.test.tsx
```

Expected: PASS。

- [ ] **Step 5: 提交**

```bash
git add src/components/AppShell.tsx tests/components/AppShell.test.tsx
git commit -m "feat: add AppShell with resizable three-column layout"
```

---

### Task 7: TopBar 和 TabBar 组件

**Files:**
- Create: `src/components/TopBar.tsx`
- Create: `src/components/TabBar.tsx`

- [ ] **Step 1: 实现 TabBar 组件**

创建 `src/components/TabBar.tsx`：

```typescript
import React from "react";
import type { DocumentMeta } from "../types";

interface TabBarProps {
  documents: DocumentMeta[];
  activeDocumentId: string | null;
  onSelectDocument: (id: string) => void;
  onCloseDocument: (id: string) => void;
}

export function TabBar({
  documents,
  activeDocumentId,
  onSelectDocument,
  onCloseDocument,
}: TabBarProps) {
  if (documents.length === 0) {
    return (
      <div className="flex items-center px-3 text-xs text-gray-400 select-none">
        尚未打开任何文档
      </div>
    );
  }

  return (
    <div className="flex items-center gap-1 overflow-x-auto" role="tablist">
      {documents.map((doc) => {
        const isActive = doc.id === activeDocumentId;
        return (
          <div
            key={doc.id}
            role="tab"
            aria-selected={isActive}
            onClick={() => onSelectDocument(doc.id)}
            className={`
              flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-t-md cursor-pointer
              whitespace-nowrap select-none transition-colors
              ${
                isActive
                  ? "bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 border-t border-l border-r border-gray-200 dark:border-gray-700"
                  : "text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800"
              }
            `}
          >
            <span className="text-xs">{formatIcon(doc.format)}</span>
            <span className="max-w-[120px] truncate">{doc.fileName}</span>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onCloseDocument(doc.id);
              }}
              className="ml-0.5 p-0.5 rounded hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-400 hover:text-gray-600"
              aria-label={`关闭 ${doc.fileName}`}
            >
              ✕
            </button>
          </div>
        );
      })}
    </div>
  );
}

function formatIcon(format: string): string {
  switch (format) {
    case "pdf":
      return "📄";
    case "md":
      return "📝";
    case "docx":
      return "📊";
    case "txt":
      return "📃";
    default:
      return "📎";
  }
}
```

- [ ] **Step 2: 实现 TopBar 组件**

创建 `src/components/TopBar.tsx`：

```typescript
import React from "react";
import type { DocumentMeta } from "../types";
import { TabBar } from "./TabBar";

interface TopBarProps {
  documents: DocumentMeta[];
  activeDocumentId: string | null;
  onSelectDocument: (id: string) => void;
  onCloseDocument: (id: string) => void;
  onOpenFile: () => void;
  onImportFolder: () => void;
  onOpenSettings: () => void;
}

export function TopBar({
  documents,
  activeDocumentId,
  onSelectDocument,
  onCloseDocument,
  onOpenFile,
  onImportFolder,
  onOpenSettings,
}: TopBarProps) {
  return (
    <div className="flex flex-col bg-gray-50 dark:bg-gray-800">
      <div className="flex items-center h-9 px-2 gap-2 border-b border-gray-200 dark:border-gray-700">
        {/* 品牌 */}
        <span className="text-sm font-semibold text-gray-800 dark:text-gray-200 mr-2 select-none">
          LearnByAI
        </span>

        <div className="w-px h-5 bg-gray-300 dark:bg-gray-600" />

        {/* 文件操作 */}
        <button
          onClick={onOpenFile}
          className="flex items-center gap-1 px-2 py-1 text-xs text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 rounded transition-colors"
        >
          <span>📂</span>
          <span>打开</span>
        </button>

        <button
          onClick={onImportFolder}
          className="flex items-center gap-1 px-2 py-1 text-xs text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 rounded transition-colors"
        >
          <span>📁</span>
          <span>导入文件夹</span>
        </button>

        {/* 标签页（占满剩余空间） */}
        <div className="flex-1 ml-3 overflow-hidden">
          <TabBar
            documents={documents}
            activeDocumentId={activeDocumentId}
            onSelectDocument={onSelectDocument}
            onCloseDocument={onCloseDocument}
          />
        </div>

        {/* 设置 */}
        <button
          onClick={onOpenSettings}
          className="flex items-center gap-1 px-2 py-1 text-xs text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 rounded transition-colors"
          aria-label="设置"
        >
          <span>⚙️</span>
        </button>
      </div>
    </div>
  );
}
```

- [ ] **Step 3: 提交**

```bash
git add src/components/TopBar.tsx src/components/TabBar.tsx
git commit -m "feat: add TopBar and TabBar components"
```

---

### Task 8: OutlinePanel 组件

**Files:**
- Create: `src/components/OutlinePanel.tsx`
- Create: `tests/components/OutlinePanel.test.tsx`

- [ ] **Step 1: 编写 OutlinePanel 测试**

创建 `tests/components/OutlinePanel.test.tsx`：

```typescript
import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { OutlinePanel } from "../../src/components/OutlinePanel";
import type { OutlineNode } from "../../src/types";

const sampleOutline: OutlineNode[] = [
  {
    id: "1",
    title: "Chapter 1",
    level: 1,
    children: [
      {
        id: "1-1",
        title: "Section 1.1",
        level: 2,
        children: [],
        anchorId: "section-1-1",
      },
    ],
    anchorId: "chapter-1",
  },
  {
    id: "2",
    title: "Chapter 2",
    level: 1,
    children: [],
    anchorId: "chapter-2",
  },
];

describe("OutlinePanel", () => {
  it("should render outline tree", () => {
    render(
      <OutlinePanel
        outline={sampleOutline}
        activeHeadingId={null}
        onNavigate={() => {}}
      />,
    );

    expect(screen.getByText("Chapter 1")).toBeInTheDocument();
    expect(screen.getByText("Chapter 2")).toBeInTheDocument();
  });

  it("should show children when expanded", () => {
    render(
      <OutlinePanel
        outline={sampleOutline}
        activeHeadingId={null}
        onNavigate={() => {}}
      />,
    );

    expect(screen.getByText("Section 1.1")).toBeInTheDocument();
  });

  it("should call onNavigate when a heading is clicked", () => {
    const onNavigate = vi.fn();
    render(
      <OutlinePanel
        outline={sampleOutline}
        activeHeadingId={null}
        onNavigate={onNavigate}
      />,
    );

    fireEvent.click(screen.getByText("Chapter 1"));
    expect(onNavigate).toHaveBeenCalledWith("chapter-1");
  });

  it("should show empty state when no outline", () => {
    render(
      <OutlinePanel
        outline={[]}
        activeHeadingId={null}
        onNavigate={() => {}}
      />,
    );

    expect(screen.getByText("暂无大纲")).toBeInTheDocument();
  });

  it("should highlight active heading", () => {
    render(
      <OutlinePanel
        outline={sampleOutline}
        activeHeadingId="chapter-2"
        onNavigate={() => {}}
      />,
    );

    const chapter2 = screen.getByText("Chapter 2");
    expect(chapter2.closest('[data-active="true"]')).toBeTruthy();
  });
});
```

- [ ] **Step 2: 运行测试验证失败**

```bash
npx vitest run tests/components/OutlinePanel.test.tsx
```

Expected: FAIL。

- [ ] **Step 3: 实现 OutlinePanel 组件**

创建 `src/components/OutlinePanel.tsx`：

```typescript
import React, { useState } from "react";
import type { OutlineNode } from "../types";

interface OutlinePanelProps {
  outline: OutlineNode[];
  activeHeadingId: string | null;
  onNavigate: (anchorId: string) => void;
}

export function OutlinePanel({
  outline,
  activeHeadingId,
  onNavigate,
}: OutlinePanelProps) {
  if (outline.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-gray-400 dark:text-gray-500 text-xs p-4">
        <span className="text-2xl mb-2">📭</span>
        <span>暂无大纲</span>
        <span className="mt-1 text-[10px]">导入文档后自动生成</span>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      <div className="px-3 py-2 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider border-b border-gray-200 dark:border-gray-700">
        📁 目录大纲
      </div>
      <div className="flex-1 overflow-y-auto p-2">
        {outline.map((node) => (
          <OutlineItem
            key={node.id}
            node={node}
            activeHeadingId={activeHeadingId}
            onNavigate={onNavigate}
            depth={0}
          />
        ))}
      </div>
    </div>
  );
}

interface OutlineItemProps {
  node: OutlineNode;
  activeHeadingId: string | null;
  onNavigate: (anchorId: string) => void;
  depth: number;
}

function OutlineItem({
  node,
  activeHeadingId,
  onNavigate,
  depth,
}: OutlineItemProps) {
  const [expanded, setExpanded] = useState(true);
  const hasChildren = node.children.length > 0;
  const isActive = node.anchorId === activeHeadingId;

  const handleClick = () => {
    if (hasChildren) {
      setExpanded(!expanded);
    }
    if (node.anchorId) {
      onNavigate(node.anchorId);
    }
  };

  return (
    <div>
      <div
        data-active={isActive ? "true" : "false"}
        onClick={handleClick}
        className={`
          flex items-center gap-1 px-2 py-1 text-xs rounded cursor-pointer
          transition-colors select-none
          ${isActive
            ? "bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 font-medium"
            : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
          }
        `}
        style={{ paddingLeft: `${8 + depth * 14}px` }}
      >
        {hasChildren && (
          <span className="text-[10px] w-3 text-center">
            {expanded ? "▼" : "▶"}
          </span>
        )}
        {!hasChildren && <span className="w-3" />}
        <span className="truncate">{node.title}</span>
      </div>
      {expanded &&
        hasChildren &&
        node.children.map((child) => (
          <OutlineItem
            key={child.id}
            node={child}
            activeHeadingId={activeHeadingId}
            onNavigate={onNavigate}
            depth={depth + 1}
          />
        ))}
    </div>
  );
}
```

- [ ] **Step 4: 运行测试验证通过**

```bash
npx vitest run tests/components/OutlinePanel.test.tsx
```

Expected: PASS。

- [ ] **Step 5: 提交**

```bash
git add src/components/OutlinePanel.tsx tests/components/OutlinePanel.test.tsx
git commit -m "feat: add OutlinePanel with tree navigation and bidirectional sync support"
```

---

### Task 9: ReaderArea + FloatingToolbar + ContextMenu

**Files:**
- Create: `src/components/ReaderArea.tsx`
- Create: `src/components/FloatingToolbar.tsx`
- Create: `src/components/ContextMenu.tsx`
- Create: `tests/components/ReaderArea.test.tsx`

- [ ] **Step 1: 实现 FloatingToolbar**

创建 `src/components/FloatingToolbar.tsx`：

```typescript
import React from "react";

interface FloatingToolbarProps {
  visible: boolean;
  position: { x: number; y: number };
  onAskAI: () => void;
  onTakeNote: () => void;
  onExplain: () => void;
}

export function FloatingToolbar({
  visible,
  position,
  onAskAI,
  onTakeNote,
  onExplain,
}: FloatingToolbarProps) {
  if (!visible) return null;

  return (
    <div
      className="absolute z-50 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-lg shadow-lg flex gap-0.5 p-1"
      style={{
        left: `${position.x}px`,
        top: `${position.y - 44}px`,
      }}
    >
      <button
        onClick={onAskAI}
        className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/50 rounded transition-colors"
      >
        💬 追问
      </button>
      <button
        onClick={onTakeNote}
        className="flex items-center gap-1 px-2.5 py-1.5 text-xs text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors"
      >
        📝 笔记
      </button>
      <button
        onClick={onExplain}
        className="flex items-center gap-1 px-2.5 py-1.5 text-xs text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors"
      >
        🔍 解释
      </button>
    </div>
  );
}
```

- [ ] **Step 2: 实现 ContextMenu**

创建 `src/components/ContextMenu.tsx`：

```typescript
import React, { useEffect, useRef } from "react";

interface ContextMenuProps {
  visible: boolean;
  position: { x: number; y: number };
  onClose: () => void;
  onAskAI: () => void;
  onTranslate: () => void;
  onSummarize: () => void;
}

export function ContextMenu({
  visible,
  position,
  onClose,
  onAskAI,
  onTranslate,
  onSummarize,
}: ContextMenuProps) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!visible) return;

    const handleClickOutside = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        onClose();
      }
    };

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleEscape);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [visible, onClose]);

  if (!visible) return null;

  const items = [
    { label: "🤖 AI 提问", onClick: onAskAI },
    { label: "🌐 AI 翻译", onClick: onTranslate },
    { label: "📋 AI 总结", onClick: onSummarize },
  ];

  return (
    <div
      ref={ref}
      className="absolute z-50 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-lg shadow-lg py-1 min-w-[140px]"
      style={{ left: `${position.x}px`, top: `${position.y}px` }}
    >
      {items.map((item) => (
        <button
          key={item.label}
          onClick={() => {
            item.onClick();
            onClose();
          }}
          className="w-full text-left px-3 py-1.5 text-xs text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
        >
          {item.label}
        </button>
      ))}
    </div>
  );
}
```

- [ ] **Step 3: 实现 ReaderArea 组件**

创建 `src/components/ReaderArea.tsx`：

```typescript
import React, { useCallback, useEffect, useRef, useState } from "react";
import type { DocumentMeta } from "../types";
import { FloatingToolbar } from "./FloatingToolbar";
import { ContextMenu } from "./ContextMenu";
import { truncateText } from "../services/documentParser";

interface ReaderAreaProps {
  document: DocumentMeta | null;
  htmlContent: string;
  onAskAI: (selectedText: string) => void;
  onTakeNote: (selectedText: string) => void;
  onExplain: (selectedText: string) => void;
  onTranslate: (selectedText: string) => void;
  onSummarize: (selectedText: string) => void;
  onScrollPositionChange: (scrollPct: number) => void;
}

interface ToolbarState {
  visible: boolean;
  position: { x: number; y: number };
  selectedText: string;
}

interface ContextMenuState {
  visible: boolean;
  position: { x: number; y: number };
  selectedText: string;
}

const MAX_CONTEXT_LENGTH = 5000;

export function ReaderArea({
  document,
  htmlContent,
  onAskAI,
  onTakeNote,
  onExplain,
  onTranslate,
  onSummarize,
  onScrollPositionChange,
}: ReaderAreaProps) {
  const contentRef = useRef<HTMLDivElement>(null);
  const selectionTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [toolbar, setToolbar] = useState<ToolbarState>({
    visible: false,
    position: { x: 0, y: 0 },
    selectedText: "",
  });
  const [contextMenu, setContextMenu] = useState<ContextMenuState>({
    visible: false,
    position: { x: 0, y: 0 },
    selectedText: "",
  });

  // 获取选中的文字及其位置
  const getSelectionInfo = useCallback(() => {
    const selection = window.getSelection();
    if (!selection || selection.isCollapsed || !selection.toString().trim()) {
      return null;
    }

    const range = selection.getRangeAt(0);
    const rect = range.getBoundingClientRect();
    const containerRect = contentRef.current?.getBoundingClientRect();

    if (!containerRect) return null;

    return {
      text: truncateText(selection.toString().trim(), MAX_CONTEXT_LENGTH),
      x: rect.left - containerRect.left + rect.width / 2 - 60,
      y: rect.top - containerRect.top,
    };
  }, []);

  // 监听文字选中事件
  const handleMouseUp = useCallback(() => {
    // 清除之前的定时器
    if (selectionTimerRef.current) {
      clearTimeout(selectionTimerRef.current);
    }

    // 300ms 延迟显示悬浮工具栏
    selectionTimerRef.current = setTimeout(() => {
      const info = getSelectionInfo();
      if (info) {
        setToolbar({
          visible: true,
          position: { x: Math.max(0, info.x), y: info.y },
          selectedText: info.text,
        });
      }
    }, 300);
  }, [getSelectionInfo]);

  // 右键菜单
  const handleContextMenu = useCallback(
    (e: React.MouseEvent) => {
      const selection = window.getSelection();
      const selectedText = selection?.toString().trim();

      if (selectedText) {
        e.preventDefault();
        const containerRect = contentRef.current?.getBoundingClientRect();
        if (containerRect) {
          setContextMenu({
            visible: true,
            position: {
              x: e.clientX - containerRect.left,
              y: e.clientY - containerRect.top,
            },
            selectedText: truncateText(selectedText, MAX_CONTEXT_LENGTH),
          });
        }
      }
    },
    [],
  );

  // 关闭悬浮工具栏（点击其他区域）
  const closeToolbar = useCallback(() => {
    setToolbar((prev) => ({ ...prev, visible: false }));
  }, []);

  // 关闭右键菜单
  const closeContextMenu = useCallback(() => {
    setContextMenu((prev) => ({ ...prev, visible: false }));
  }, []);

  // 滚动位置上报
  const handleScroll = useCallback(() => {
    if (!contentRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = contentRef.current;
    if (scrollHeight <= clientHeight) return;
    const pct = Math.round((scrollTop / (scrollHeight - clientHeight)) * 100);
    onScrollPositionChange(pct);
  }, [onScrollPositionChange]);

  // 清理定时器
  useEffect(() => {
    return () => {
      if (selectionTimerRef.current) clearTimeout(selectionTimerRef.current);
    };
  }, []);

  // 空状态
  if (!document) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-gray-400 dark:text-gray-500">
        <span className="text-4xl mb-3">📖</span>
        <span className="text-sm">打开一个文档开始阅读</span>
        <span className="text-xs mt-1">支持 PDF、Word、Markdown、TXT</span>
      </div>
    );
  }

  return (
    <div className="relative h-full overflow-hidden">
      {/* 文档内容 */}
      <div
        ref={contentRef}
        className="h-full overflow-y-auto px-8 py-6"
        onMouseUp={handleMouseUp}
        onContextMenu={handleContextMenu}
        onClick={closeToolbar}
        onScroll={handleScroll}
      >
        <div
          className="prose prose-sm dark:prose-invert max-w-none"
          dangerouslySetInnerHTML={{ __html: htmlContent }}
        />
      </div>

      {/* 悬浮工具栏 */}
      <FloatingToolbar
        visible={toolbar.visible}
        position={toolbar.position}
        onAskAI={() => {
          onAskAI(toolbar.selectedText);
          closeToolbar();
        }}
        onTakeNote={() => {
          onTakeNote(toolbar.selectedText);
          closeToolbar();
        }}
        onExplain={() => {
          onExplain(toolbar.selectedText);
          closeToolbar();
        }}
      />

      {/* 右键菜单 */}
      <ContextMenu
        visible={contextMenu.visible}
        position={contextMenu.position}
        onClose={closeContextMenu}
        onAskAI={() => onAskAI(contextMenu.selectedText)}
        onTranslate={() => onTranslate(contextMenu.selectedText)}
        onSummarize={() => onSummarize(contextMenu.selectedText)}
      />
    </div>
  );
}
```

- [ ] **Step 4: 编写 ReaderArea 测试**

创建 `tests/components/ReaderArea.test.tsx`：

```typescript
import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { ReaderArea } from "../../src/components/ReaderArea";
import type { DocumentMeta } from "../../src/types";

const mockDoc: DocumentMeta = {
  id: "doc-1",
  fileName: "test.md",
  filePath: "/test.md",
  format: "md",
  size: 1024,
  openedAt: Date.now(),
  lastScrollPosition: 0,
};

describe("ReaderArea", () => {
  it("should show empty state when no document", () => {
    render(
      <ReaderArea
        document={null}
        htmlContent=""
        onAskAI={vi.fn()}
        onTakeNote={vi.fn()}
        onExplain={vi.fn()}
        onTranslate={vi.fn()}
        onSummarize={vi.fn()}
        onScrollPositionChange={vi.fn()}
      />,
    );

    expect(screen.getByText("打开一个文档开始阅读")).toBeInTheDocument();
  });

  it("should render HTML content", () => {
    render(
      <ReaderArea
        document={mockDoc}
        htmlContent="<h1>Hello World</h1><p>Test content</p>"
        onAskAI={vi.fn()}
        onTakeNote={vi.fn()}
        onExplain={vi.fn()}
        onTranslate={vi.fn()}
        onSummarize={vi.fn()}
        onScrollPositionChange={vi.fn()}
      />,
    );

    expect(screen.getByText("Hello World")).toBeInTheDocument();
    expect(screen.getByText("Test content")).toBeInTheDocument();
  });
});
```

- [ ] **Step 5: 安装 prose 插件**

```bash
npm install -D @tailwindcss/typography
```

在 `src/index.css` 添加：

```css
@import "tailwindcss";
@plugin "@tailwindcss/typography";
```

- [ ] **Step 6: 运行测试验证通过**

```bash
npx vitest run tests/components/ReaderArea.test.tsx
```

Expected: PASS。

- [ ] **Step 7: 提交**

```bash
git add src/components/ReaderArea.tsx src/components/FloatingToolbar.tsx src/components/ContextMenu.tsx tests/components/ReaderArea.test.tsx src/index.css
git commit -m "feat: add ReaderArea with floating toolbar and context menu"
```

---

### Task 10: ChatMessages + ChatInput + ContextCard 组件

**Files:**
- Create: `src/components/ChatMessages.tsx`
- Create: `src/components/ChatInput.tsx`
- Create: `src/components/ContextCard.tsx`

- [ ] **Step 1: 实现 ContextCard**

创建 `src/components/ContextCard.tsx`：

```typescript
import React from "react";
import type { ContextRef } from "../types";

interface ContextCardProps {
  context: ContextRef;
  onRemove: (id: string) => void;
}

export function ContextCard({ context, onRemove }: ContextCardProps) {
  const isImage = context.type === "image";

  return (
    <div
      className={`
        flex items-start gap-2 px-2.5 py-1.5 rounded-md border text-xs
        ${isImage
          ? "bg-green-50 dark:bg-green-900/30 border-green-300 dark:border-green-700"
          : "bg-yellow-50 dark:bg-yellow-900/30 border-yellow-300 dark:border-yellow-700"
        }
      `}
    >
      <span className="flex-shrink-0 mt-0.5">
        {isImage ? "🖼️" : "📌"}
      </span>

      <div className="flex-1 min-w-0">
        {isImage ? (
          <div className="flex items-center gap-2">
            <img
              src={context.content}
              alt="截图"
              className="h-10 rounded border border-gray-200 object-cover"
            />
            <span className="text-gray-600 dark:text-gray-400 truncate text-[10px]">
              {context.label || "截图"}
            </span>
          </div>
        ) : (
          <span className="text-gray-700 dark:text-gray-300 line-clamp-2">
            {context.label || context.content}
          </span>
        )}
      </div>

      <button
        onClick={() => onRemove(context.id)}
        className="flex-shrink-0 p-0.5 text-gray-400 hover:text-red-500 transition-colors"
        aria-label="删除上下文"
      >
        ✕
      </button>
    </div>
  );
}
```

- [ ] **Step 2: 实现 ChatMessages**

创建 `src/components/ChatMessages.tsx`：

```typescript
import React, { useEffect, useRef } from "react";
import type { Message } from "../types";

interface ChatMessagesProps {
  messages: Message[];
}

export function ChatMessages({ messages }: ChatMessagesProps) {
  const bottomRef = useRef<HTMLDivElement>(null);

  // 自动滚动到底部
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  if (messages.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-gray-400 dark:text-gray-500 text-xs p-4">
        <span className="text-2xl mb-2">🤖</span>
        <span>选中文字或输入问题开始对话</span>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto p-3 space-y-3">
      {messages.map((msg) => (
        <div
          key={msg.id}
          className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
        >
          <div
            className={`
              max-w-[85%] rounded-lg px-3 py-2 text-xs leading-relaxed
              ${msg.role === "user"
                ? "bg-blue-500 text-white"
                : msg.error
                  ? "bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-700 text-red-700 dark:text-red-300"
                  : "bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200 border border-gray-200 dark:border-gray-600"
              }
            `}
          >
            {/* 消息发送者 */}
            <div className="font-semibold mb-0.5 text-[10px] opacity-70">
              {msg.role === "user" ? "🙋 你" : "🤖 AI"}
            </div>

            {/* 引用上下文（仅用户消息） */}
            {msg.contexts && msg.contexts.length > 0 && (
              <div className="mb-1.5 space-y-1">
                {msg.contexts.map((ctx) => (
                  <div
                    key={ctx.id}
                    className="text-[10px] px-2 py-0.5 rounded bg-white/20 text-white/80"
                  >
                    {ctx.type === "text"
                      ? `📌 ${ctx.label || ctx.content.slice(0, 50)}`
                      : "🖼️ 截图"}
                  </div>
                ))}
              </div>
            )}

            {/* 消息内容 */}
            <div className="whitespace-pre-wrap break-words">
              {msg.content}
            </div>

            {/* 错误信息 + 重试 */}
            {msg.error && (
              <div className="mt-1.5 flex items-center gap-2">
                <span className="text-[10px] text-red-500">
                  {msg.error}
                </span>
                <button className="text-[10px] text-red-500 underline hover:text-red-600">
                  重试
                </button>
              </div>
            )}
          </div>
        </div>
      ))}
      <div ref={bottomRef} />
    </div>
  );
}
```

- [ ] **Step 3: 实现 ChatInput**

创建 `src/components/ChatInput.tsx`：

```typescript
import React, { useCallback, useRef, useState } from "react";
import type { ContextRef } from "../types";
import { ContextCard } from "./ContextCard";
import { generateId, compressImage, blobToDataUrl } from "../lib/utils";

interface ChatInputProps {
  contexts: ContextRef[];
  onAddContext: (context: ContextRef) => void;
  onRemoveContext: (id: string) => void;
  onSend: (text: string, contexts: ContextRef[]) => void;
  disabled: boolean;
}

const MAX_IMAGE_SIZE = 20 * 1024 * 1024; // 20MB

export function ChatInput({
  contexts,
  onAddContext,
  onRemoveContext,
  onSend,
  disabled,
}: ChatInputProps) {
  const [text, setText] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // 发送消息
  const handleSend = useCallback(() => {
    const trimmed = text.trim();
    if (!trimmed && contexts.length === 0) return;
    onSend(trimmed || "请分析这张图片", contexts);
    setText("");
  }, [text, contexts, onSend]);

  // 键盘事件：Enter 发送，Shift+Enter 换行
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        handleSend();
      }
    },
    [handleSend],
  );

  // 粘贴事件：处理截图粘贴
  const handlePaste = useCallback(
    async (e: React.ClipboardEvent) => {
      const items = e.clipboardData?.items;
      if (!items) return;

      for (let i = 0; i < items.length; i++) {
        const item = items[i];
        if (item.type.startsWith("image/")) {
          e.preventDefault();
          const file = item.getAsFile();
          if (!file) continue;

          try {
            // 压缩大图
            let blob: Blob = file;
            if (file.size > MAX_IMAGE_SIZE) {
              blob = await compressImage(file);
            }
            const dataUrl = await blobToDataUrl(blob);

            onAddContext({
              id: generateId(),
              type: "image",
              content: dataUrl,
              label: `截图 (${(blob.size / 1024).toFixed(0)} KB)`,
            });
          } catch (err) {
            console.error("Failed to process pasted image:", err);
          }
        }
      }
    },
    [onAddContext],
  );

  // 截图按钮
  const handleScreenshotClick = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  const handleFileChange = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;

      try {
        let blob: Blob = file;
        if (file.size > MAX_IMAGE_SIZE) {
          blob = await compressImage(file);
        }
        const dataUrl = await blobToDataUrl(blob);

        onAddContext({
          id: generateId(),
          type: "image",
          content: dataUrl,
          label: file.name,
        });
      } catch (err) {
        console.error("Failed to process image:", err);
      }

      // 清除 input 以便重新选择同一文件
      e.target.value = "";
    },
    [onAddContext],
  );

  return (
    <div className="border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 p-3 space-y-2">
      {/* 上下文卡片列表 */}
      {contexts.length > 0 && (
        <div className="space-y-1.5">
          {contexts.map((ctx) => (
            <ContextCard
              key={ctx.id}
              context={ctx}
              onRemove={onRemoveContext}
            />
          ))}
        </div>
      )}

      {/* 输入区域 */}
      <div className="flex gap-2 items-end">
        <textarea
          ref={textareaRef}
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={handleKeyDown}
          onPaste={handlePaste}
          disabled={disabled}
          placeholder={
            disabled ? "请先在设置中配置 AI 服务" : "输入问题，或选中文字后点「追问」..."
          }
          rows={2}
          className="flex-1 resize-none rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2 text-xs text-gray-800 dark:text-gray-200 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed"
        />

        <div className="flex flex-col gap-1.5">
          {/* 截图按钮 */}
          <button
            onClick={handleScreenshotClick}
            disabled={disabled}
            className="p-2 rounded-md bg-gray-200 dark:bg-gray-600 hover:bg-gray-300 dark:hover:bg-gray-500 text-gray-600 dark:text-gray-300 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            aria-label="添加截图"
            title="添加截图"
          >
            📷
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            className="hidden"
          />

          {/* 发送按钮 */}
          <button
            onClick={handleSend}
            disabled={disabled || (!text.trim() && contexts.length === 0)}
            className="p-2 rounded-md bg-blue-500 hover:bg-blue-600 disabled:bg-gray-300 dark:disabled:bg-gray-600 text-white transition-colors disabled:cursor-not-allowed"
            aria-label="发送"
          >
            →
          </button>
        </div>
      </div>

      <div className="text-[10px] text-gray-400 dark:text-gray-500 text-center">
        Enter 发送 · Shift+Enter 换行 · Ctrl+V 粘贴截图
      </div>
    </div>
  );
}
```

- [ ] **Step 4: 提交**

```bash
git add src/components/ChatMessages.tsx src/components/ChatInput.tsx src/components/ContextCard.tsx
git commit -m "feat: add ChatMessages, ChatInput, and ContextCard components"
```

---

### Task 11: AIPanel 组件

**Files:**
- Create: `src/components/AIPanel.tsx`
- Create: `tests/components/AIPanel.test.tsx`

- [ ] **Step 1: 实现 AIPanel 组件**

创建 `src/components/AIPanel.tsx`：

```typescript
import React, { useCallback, useRef, useState } from "react";
import type { Message, ContextRef, Conversation } from "../types";
import { ChatMessages } from "./ChatMessages";
import { ChatInput } from "./ChatInput";
import { generateId } from "../lib/utils";

interface AIPanelProps {
  conversation: Conversation | null;
  hasApiKey: boolean;
  onSendMessage: (
    content: string,
    contexts: ContextRef[],
    conversationId: string,
  ) => Promise<void>;
  onNewConversation: () => void;
}

export function AIPanel({
  conversation,
  hasApiKey,
  onSendMessage,
  onNewConversation,
}: AIPanelProps) {
  const [contexts, setContexts] = useState<ContextRef[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // 从外部添加上下文（由 ReaderArea 触发）
  const addTextContext = useCallback((text: string) => {
    setContexts((prev) => [
      ...prev,
      {
        id: generateId(),
        type: "text",
        content: text,
        label: text.length > 50 ? text.slice(0, 50) + "..." : text,
      },
    ]);
  }, []);

  // 暴露方法给父组件
  React.useImperativeHandle(
    // 通过 ref 暴露（由 AppContext 管理时使用 callback 方式）
    undefined,
    () => ({ addTextContext }),
  );

  const handleSend = useCallback(
    async (text: string, ctxs: ContextRef[]) => {
      if (!conversation) return;
      setIsLoading(true);
      try {
        await onSendMessage(text, ctxs, conversation.id);
        setContexts([]); // 清空上下文
      } finally {
        setIsLoading(false);
      }
    },
    [conversation, onSendMessage],
  );

  // 未配置 API Key
  if (!hasApiKey) {
    return (
      <div className="flex flex-col h-full">
        <div className="px-3 py-2 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider border-b border-gray-200 dark:border-gray-700">
          🤖 AI 对话
        </div>
        <div className="flex-1 flex flex-col items-center justify-center text-gray-400 dark:text-gray-500 p-4">
          <span className="text-2xl mb-2">🔑</span>
          <span className="text-xs text-center">请先在设置中配置 AI 服务</span>
          <span className="text-[10px] mt-1 text-center">
            点击右上角 ⚙️ 添加 API Key
          </span>
        </div>
        <ChatInput
          contexts={contexts}
          onAddContext={() => {}}
          onRemoveContext={() => {}}
          onSend={() => {}}
          disabled={true}
        />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* 头部 */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-gray-200 dark:border-gray-700">
        <span className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
          🤖 AI 对话
        </span>
        <button
          onClick={onNewConversation}
          className="text-[10px] text-blue-500 hover:text-blue-600 dark:text-blue-400 transition-colors"
        >
          + 新会话
        </button>
      </div>

      {/* 消息列表 */}
      <ChatMessages messages={conversation?.messages || []} />

      {/* 加载指示器 */}
      {isLoading && (
        <div className="px-3 py-1.5 text-[10px] text-gray-400 animate-pulse">
          🤖 AI 思考中...
        </div>
      )}

      {/* 输入框 */}
      <ChatInput
        contexts={contexts}
        onAddContext={(ctx) =>
          setContexts((prev) => [...prev, ctx])
        }
        onRemoveContext={(id) =>
          setContexts((prev) => prev.filter((c) => c.id !== id))
        }
        onSend={handleSend}
        disabled={isLoading}
      />
    </div>
  );
}
```

- [ ] **Step 2: 编写 AIPanel 测试**

创建 `tests/components/AIPanel.test.tsx`：

```typescript
import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { AIPanel } from "../../src/components/AIPanel";
import type { Conversation } from "../../src/types";

const mockConversation: Conversation = {
  id: "conv-1",
  documentId: "doc-1",
  title: "Test",
  messages: [
    {
      id: "msg-1",
      role: "user",
      content: "什么是机器学习？",
      timestamp: Date.now(),
    },
  ],
  createdAt: Date.now(),
  updatedAt: Date.now(),
};

describe("AIPanel", () => {
  it("should show API key prompt when no key configured", () => {
    render(
      <AIPanel
        conversation={mockConversation}
        hasApiKey={false}
        onSendMessage={vi.fn()}
        onNewConversation={vi.fn()}
      />,
    );

    expect(
      screen.getByText(/请先在设置中配置 AI 服务/),
    ).toBeInTheDocument();
  });

  it("should show messages when API key is configured", () => {
    render(
      <AIPanel
        conversation={mockConversation}
        hasApiKey={true}
        onSendMessage={vi.fn()}
        onNewConversation={vi.fn()}
      />,
    );

    expect(screen.getByText("什么是机器学习？")).toBeInTheDocument();
  });
});
```

- [ ] **Step 3: 运行测试验证通过**

```bash
npx vitest run tests/components/AIPanel.test.tsx
```

Expected: PASS。

- [ ] **Step 4: 提交**

```bash
git add src/components/AIPanel.tsx tests/components/AIPanel.test.tsx
git commit -m "feat: add AIPanel with message display, context management, and API key guard"
```

---

### Task 12: AI 客户端服务

**Files:**
- Create: `src/services/aiClient.ts`
- Create: `tests/unit/aiClient.test.ts`

- [ ] **Step 1: 编写 AI 客户端测试**

创建 `tests/unit/aiClient.test.ts`：

```typescript
import { describe, it, expect, vi, beforeEach } from "vitest";
import { AIClient } from "../../src/services/aiClient";
import type { AIProvider, Message, ContextRef } from "../../src/types";

describe("AIClient", () => {
  let client: AIClient;
  const provider: AIProvider = {
    id: "p1",
    name: "Test",
    baseUrl: "https://api.test.com/v1",
    apiKey: "sk-test-key",
    model: "test-model",
  };

  beforeEach(() => {
    client = new AIClient(provider);
    vi.restoreAllMocks();
  });

  it("should construct chat completion request correctly", async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () =>
        Promise.resolve({
          choices: [
            { message: { role: "assistant", content: "Hello back!" } },
          ],
        }),
    });
    global.fetch = mockFetch;

    const messages: Message[] = [
      {
        id: "1",
        role: "user",
        content: "What is ML?",
        timestamp: Date.now(),
      },
    ];

    const response = await client.chat(messages);

    expect(mockFetch).toHaveBeenCalledWith(
      "https://api.test.com/v1/chat/completions",
      expect.objectContaining({
        method: "POST",
        headers: expect.objectContaining({
          "Content-Type": "application/json",
          Authorization: "Bearer sk-test-key",
        }),
      }),
    );

    const body = JSON.parse(mockFetch.mock.calls[0][1].body);
    expect(body.model).toBe("test-model");
    expect(body.messages[0].role).toBe("user");

    expect(response).toBe("Hello back!");
  });

  it("should include image contexts in vision request", async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () =>
        Promise.resolve({
          choices: [
            { message: { role: "assistant", content: "I see an image" } },
          ],
        }),
    });
    global.fetch = mockFetch;

    const contexts: ContextRef[] = [
      {
        id: "c1",
        type: "image",
        content: "data:image/png;base64,abc123",
        label: "screenshot.png",
      },
    ];

    await client.chatWithContext("What's in this image?", contexts);

    const body = JSON.parse(mockFetch.mock.calls[0][1].body);
    // 应该有 image_url 类型的 content
    const userContent = body.messages[0].content;
    expect(Array.isArray(userContent)).toBe(true);
    expect(userContent[0].type).toBe("image_url");
  });

  it("should throw on API error", async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 401,
      json: () => Promise.resolve({ error: { message: "Unauthorized" } }),
    });
    global.fetch = mockFetch;

    await expect(
      client.chat([
        { id: "1", role: "user", content: "Hi", timestamp: Date.now() },
      ]),
    ).rejects.toThrow("Unauthorized");
  });
});
```

- [ ] **Step 2: 运行测试验证失败**

```bash
npx vitest run tests/unit/aiClient.test.ts
```

Expected: FAIL。

- [ ] **Step 3: 实现 AI 客户端**

创建 `src/services/aiClient.ts`：

```typescript
import type { AIProvider, Message, ContextRef } from "../types";

interface ChatCompletionMessage {
  role: string;
  content: string | Array<{ type: "text"; text: string } | { type: "image_url"; image_url: { url: string } }>;
}

interface ChatCompletionResponse {
  choices: Array<{
    message: {
      role: string;
      content: string;
    };
  }>;
}

export class AIClient {
  private provider: AIProvider;

  constructor(provider: AIProvider) {
    this.provider = provider;
  }

  /**
   * 发送纯文本对话请求
   */
  async chat(messages: Message[]): Promise<string> {
    const apiMessages = this.buildMessages(messages);
    return this.sendRequest(apiMessages);
  }

  /**
   * 发送带上下文（文字引用 + 图片）的对话请求
   */
  async chatWithContext(
    userMessage: string,
    contexts: ContextRef[],
  ): Promise<string> {
    const hasImages = contexts.some((c) => c.type === "image");

    if (!hasImages) {
      // 纯文本上下文：拼接到消息中
      const contextText = contexts
        .filter((c) => c.type === "text")
        .map((c) => `> ${c.content}`)
        .join("\n\n");

      const fullMessage = contextText
        ? `以下是我引用的内容：\n\n${contextText}\n\n我的问题是：${userMessage}`
        : userMessage;

      return this.sendRequest([
        { role: "user", content: fullMessage },
      ]);
    }

    // 包含图片：构建多模态消息
    const contentParts: Array<
      { type: "text"; text: string }
      | { type: "image_url"; image_url: { url: string } }
    > = [];

    contentParts.push({
      type: "text",
      text: userMessage,
    });

    for (const ctx of contexts) {
      if (ctx.type === "image") {
        contentParts.push({
          type: "image_url",
          image_url: {
            url: ctx.content,
          },
        });
      } else {
        // 文字上下文拼到 text 中
        const textPart = contentParts.find((p) => p.type === "text");
        if (textPart) {
          textPart.text = `引用的文字：\n> ${ctx.content}\n\n${textPart.text}`;
        }
      }
    }

    return this.sendRequest([
      { role: "user", content: contentParts },
    ]);
  }

  /**
   * 发送翻译请求
   */
  async translate(text: string): Promise<string> {
    return this.sendRequest([
      {
        role: "user",
        content: `请将以下文字翻译成中文，只输出翻译结果不要额外解释：\n\n${text}`,
      },
    ]);
  }

  /**
   * 发送总结请求
   */
  async summarize(text: string): Promise<string> {
    return this.sendRequest([
      {
        role: "user",
        content: `请用一段话总结以下内容的核心要点：\n\n${text}`,
      },
    ]);
  }

  /**
   * 发送解释请求
   */
  async explain(text: string): Promise<string> {
    return this.sendRequest([
      {
        role: "user",
        content: `请用通俗易懂的语言解释以下内容，像给初学者讲解一样：\n\n${text}`,
      },
    ]);
  }

  /**
   * 构建消息数组
   */
  private buildMessages(messages: Message[]): ChatCompletionMessage[] {
    return messages.map((msg) => ({
      role: msg.role,
      content: msg.content,
    }));
  }

  /**
   * 发送 HTTP 请求到 OpenAI 兼容 API
   */
  private async sendRequest(
    apiMessages: ChatCompletionMessage[],
  ): Promise<string> {
    const url = `${this.provider.baseUrl.replace(/\/$/, "")}/chat/completions`;

    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${this.provider.apiKey}`,
      },
      body: JSON.stringify({
        model: this.provider.model,
        messages: apiMessages,
        max_tokens: 4096,
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({
        error: { message: `HTTP ${response.status}` },
      }));
      throw new Error(
        error.error?.message || `API request failed: ${response.status}`,
      );
    }

    const data: ChatCompletionResponse = await response.json();
    return data.choices[0]?.message?.content || "";
  }
}
```

- [ ] **Step 4: 运行测试验证通过**

```bash
npx vitest run tests/unit/aiClient.test.ts
```

Expected: PASS。

- [ ] **Step 5: 提交**

```bash
git add src/services/aiClient.ts tests/unit/aiClient.test.ts
git commit -m "feat: add AI client service with OpenAI-compatible API support"
```

---

### Task 13: 全局状态管理（AppContext）

**Files:**
- Create: `src/contexts/AppContext.tsx`
- Create: `src/hooks/useDocuments.ts`
- Create: `src/hooks/useConversation.ts`
- Create: `src/hooks/useSettings.ts`
- Create: `src/hooks/useOutlineSync.ts`

- [ ] **Step 1: 实现 useSettings hook**

创建 `src/hooks/useSettings.ts`：

```typescript
import { useState, useEffect, useCallback } from "react";
import { storageService } from "../services/storage";
import type { AppSettings, AIProvider } from "../types";
import { generateId } from "../lib/utils";

const DEFAULT_SETTINGS: AppSettings = {
  providers: [],
  activeProviderId: null,
  theme: "system",
  fontSize: 16,
};

export function useSettings() {
  const [settings, setSettings] = useState<AppSettings>(DEFAULT_SETTINGS);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    storageService.getSettings().then((saved) => {
      if (saved) setSettings(saved);
      setLoaded(true);
    });
  }, []);

  const saveSettings = useCallback(async (newSettings: AppSettings) => {
    await storageService.saveSettings(newSettings);
    setSettings(newSettings);
  }, []);

  const addProvider = useCallback(
    async (provider: Omit<AIProvider, "id">) => {
      const newProvider: AIProvider = { id: generateId(), ...provider };
      const updated = {
        ...settings,
        providers: [...settings.providers, newProvider],
        activeProviderId: settings.activeProviderId || newProvider.id,
      };
      await saveSettings(updated);
    },
    [settings, saveSettings],
  );

  const removeProvider = useCallback(
    async (id: string) => {
      const updated = {
        ...settings,
        providers: settings.providers.filter((p) => p.id !== id),
        activeProviderId:
          settings.activeProviderId === id
            ? settings.providers.find((p) => p.id !== id)?.id || null
            : settings.activeProviderId,
      };
      await saveSettings(updated);
    },
    [settings, saveSettings],
  );

  const setActiveProvider = useCallback(
    async (id: string) => {
      await saveSettings({ ...settings, activeProviderId: id });
    },
    [settings, saveSettings],
  );

  const hasApiKey =
    (settings.activeProviderId &&
      settings.providers.find((p) => p.id === settings.activeProviderId)
        ?.apiKey) ||
    false;

  const activeProvider = settings.providers.find(
    (p) => p.id === settings.activeProviderId,
  ) || null;

  return {
    settings,
    loaded,
    hasApiKey,
    activeProvider,
    addProvider,
    removeProvider,
    setActiveProvider,
    setSettings: saveSettings,
  };
}
```

- [ ] **Step 2: 实现 useDocuments hook**

创建 `src/hooks/useDocuments.ts`：

```typescript
import { useState, useEffect, useCallback } from "react";
import { storageService } from "../services/storage";
import type { DocumentMeta } from "../types";
import { generateId } from "../lib/utils";

export function useDocuments() {
  const [documents, setDocuments] = useState<DocumentMeta[]>([]);
  const [activeDocumentId, setActiveDocumentId] = useState<string | null>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    storageService.getAllDocuments().then((docs) => {
      setDocuments(docs);
      setLoaded(true);
    });
  }, []);

  const openDocument = useCallback(
    async (filePath: string, fileName: string, format: string, size: number) => {
      const id = generateId();
      const doc: DocumentMeta = {
        id,
        fileName,
        filePath,
        format: format as DocumentMeta["format"],
        size,
        openedAt: Date.now(),
        lastScrollPosition: 0,
      };

      // 检查是否已打开同一文件（相同路径）
      const existing = documents.find((d) => d.filePath === filePath);
      if (existing) {
        const updated = { ...existing, openedAt: Date.now() };
        await storageService.saveDocument(updated);
        setDocuments((prev) =>
          prev.map((d) => (d.id === existing.id ? updated : d)),
        );
        setActiveDocumentId(existing.id);
        return existing;
      }

      await storageService.saveDocument(doc);
      setDocuments((prev) => [...prev, doc]);
      setActiveDocumentId(id);
      return doc;
    },
    [documents],
  );

  const closeDocument = useCallback(
    async (id: string) => {
      await storageService.deleteDocument(id);
      setDocuments((prev) => prev.filter((d) => d.id !== id));
      if (activeDocumentId === id) {
        setActiveDocumentId((prev) => {
          const remaining = documents.filter((d) => d.id !== id);
          return remaining.length > 0 ? remaining[remaining.length - 1].id : null;
        });
      }
      // 同时删除关联对话
      const convs = await storageService.getConversationsByDocument(id);
      for (const conv of convs) {
        await storageService.deleteConversation(conv.id);
      }
    },
    [documents, activeDocumentId],
  );

  const updateScrollPosition = useCallback(
    async (id: string, position: number) => {
      const doc = documents.find((d) => d.id === id);
      if (!doc) return;
      const updated = { ...doc, lastScrollPosition: position };
      await storageService.saveDocument(updated);
      setDocuments((prev) =>
        prev.map((d) => (d.id === id ? updated : d)),
      );
    },
    [documents],
  );

  const activeDocument = documents.find((d) => d.id === activeDocumentId) || null;

  return {
    documents,
    activeDocument,
    activeDocumentId,
    loaded,
    openDocument,
    closeDocument,
    setActiveDocumentId,
    updateScrollPosition,
  };
}
```

- [ ] **Step 3: 实现 useConversation hook**

创建 `src/hooks/useConversation.ts`：

```typescript
import { useState, useEffect, useCallback } from "react";
import { storageService } from "../services/storage";
import type { Conversation, Message, ContextRef } from "../types";
import { generateId } from "../lib/utils";
import { AIClient } from "../services/aiClient";
import type { AIProvider } from "../types";

export function useConversation(
  documentId: string | null,
  activeProvider: AIProvider | null,
) {
  const [conversation, setConversation] = useState<Conversation | null>(null);

  // 当切换文档时，加载或创建对应的对话
  useEffect(() => {
    if (!documentId) {
      setConversation(null);
      return;
    }

    storageService.getConversationsByDocument(documentId).then((convs) => {
      if (convs.length > 0) {
        setConversation(convs[0]);
      } else {
        // 创建新对话
        const newConv: Conversation = {
          id: generateId(),
          documentId,
          title: "对话",
          messages: [],
          createdAt: Date.now(),
          updatedAt: Date.now(),
        };
        storageService.saveConversation(newConv);
        setConversation(newConv);
      }
    });
  }, [documentId]);

  const sendMessage = useCallback(
    async (
      content: string,
      contexts: ContextRef[],
    ) => {
      if (!conversation || !activeProvider) return;

      const client = new AIClient(activeProvider);

      // 添加用户消息
      const userMsg: Message = {
        id: generateId(),
        role: "user",
        content,
        contexts: contexts.length > 0 ? contexts : undefined,
        timestamp: Date.now(),
      };

      const updatedConv: Conversation = {
        ...conversation,
        messages: [...conversation.messages, userMsg],
        updatedAt: Date.now(),
      };
      setConversation(updatedConv);
      await storageService.saveConversation(updatedConv);

      // 调用 AI
      try {
        const reply = contexts.length > 0
          ? await client.chatWithContext(content, contexts)
          : await client.chat([...updatedConv.messages]);

        const aiMsg: Message = {
          id: generateId(),
          role: "assistant",
          content: reply,
          timestamp: Date.now(),
        };

        const finalConv: Conversation = {
          ...updatedConv,
          messages: [...updatedConv.messages, aiMsg],
          updatedAt: Date.now(),
          // 用第一条用户消息前 30 字作为标题
          title: updatedConv.messages[0]?.content.slice(0, 30) || "对话",
        };
        setConversation(finalConv);
        await storageService.saveConversation(finalConv);
      } catch (err) {
        const errorMsg: Message = {
          id: generateId(),
          role: "assistant",
          content: "",
          error: err instanceof Error ? err.message : "未知错误",
          timestamp: Date.now(),
        };

        const errConv: Conversation = {
          ...updatedConv,
          messages: [...updatedConv.messages, errorMsg],
          updatedAt: Date.now(),
        };
        setConversation(errConv);
        await storageService.saveConversation(errConv);
      }
    },
    [conversation, activeProvider],
  );

  const newConversation = useCallback(async () => {
    if (!documentId) return;
    const newConv: Conversation = {
      id: generateId(),
      documentId,
      title: "新对话",
      messages: [],
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    await storageService.saveConversation(newConv);
    setConversation(newConv);
  }, [documentId]);

  return {
    conversation,
    sendMessage,
    newConversation,
  };
}
```

- [ ] **Step 4: 实现 AppContext**

创建 `src/contexts/AppContext.tsx`：

```typescript
import React, { createContext, useContext } from "react";
import type { DocumentMeta, Conversation, AIProvider, ContextRef } from "../types";
import { useDocuments } from "../hooks/useDocuments";
import { useConversation } from "../hooks/useConversation";
import { useSettings } from "../hooks/useSettings";
import { detectFormat, getFileNameFromPath } from "../lib/utils";

interface AppContextType {
  // Documents
  documents: DocumentMeta[];
  activeDocument: DocumentMeta | null;
  activeDocumentId: string | null;
  openDocumentFile: (filePath: string, content?: ArrayBuffer) => Promise<DocumentMeta>;
  closeDocument: (id: string) => void;
  setActiveDocumentId: (id: string) => void;
  updateScrollPosition: (id: string, position: number) => void;

  // Conversation
  conversation: Conversation | null;
  sendMessage: (content: string, contexts: ContextRef[]) => Promise<void>;
  newConversation: () => void;

  // Settings
  hasApiKey: boolean;
  activeProvider: AIProvider | null;
  settings: AppSettings;
  addProvider: (p: Omit<AIProvider, "id">) => Promise<void>;
  removeProvider: (id: string) => Promise<void>;
  setActiveProvider: (id: string) => Promise<void>;
  setSettings: (s: AppSettings) => Promise<void>;
}

const AppContext = createContext<AppContextType | null>(null);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const docs = useDocuments();
  const settingsHook = useSettings();
  const conv = useConversation(
    docs.activeDocumentId,
    settingsHook.activeProvider,
  );

  const openDocumentFile = useCallback(
    async (filePath: string) => {
      const fileName = getFileNameFromPath(filePath);
      const format = detectFormat(fileName);
      // 获取文件大小：通过 Tauri API
      let size = 0;
      try {
        const { invoke } = await import("@tauri-apps/api/core");
        const metadata = await invoke<{ size: number }>("get_file_metadata", {
          path: filePath,
        });
        size = metadata.size;
      } catch {
        // 非 Tauri 环境（开发模式）fallback
      }
      return docs.openDocument(filePath, fileName, format, size);
    },
    [docs],
  );

  return (
    <AppContext.Provider
      value={{
        documents: docs.documents,
        activeDocument: docs.activeDocument,
        activeDocumentId: docs.activeDocumentId,
        openDocumentFile,
        closeDocument: docs.closeDocument,
        setActiveDocumentId: docs.setActiveDocumentId,
        updateScrollPosition: docs.updateScrollPosition,
        conversation: conv.conversation,
        sendMessage: conv.sendMessage,
        newConversation: conv.newConversation,
        hasApiKey: settingsHook.hasApiKey,
        activeProvider: settingsHook.activeProvider,
        settings: settingsHook.settings,
        addProvider: settingsHook.addProvider,
        removeProvider: settingsHook.removeProvider,
        setActiveProvider: settingsHook.setActiveProvider,
        setSettings: settingsHook.setSettings,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useAppContext() {
  const ctx = useContext(AppContext);
  if (!ctx) {
    throw new Error("useAppContext must be used within AppProvider");
  }
  return ctx;
}
```

- [ ] **Step 5: 提交**

```bash
git add src/hooks/ src/contexts/AppContext.tsx
git commit -m "feat: add global state management with AppContext and hooks"
```

---

### Task 14: SettingsDialog 组件

**Files:**
- Create: `src/components/SettingsDialog.tsx`

- [ ] **Step 1: 实现 SettingsDialog**

创建 `src/components/SettingsDialog.tsx`：

```typescript
import React, { useState } from "react";
import { useAppContext } from "../contexts/AppContext";
import type { AIProvider } from "../types";

interface SettingsDialogProps {
  open: boolean;
  onClose: () => void;
}

export function SettingsDialog({ open, onClose }: SettingsDialogProps) {
  const {
    settings,
    addProvider,
    removeProvider,
    setActiveProvider,
    setSettings,
  } = useAppContext();

  const [name, setName] = useState("");
  const [baseUrl, setBaseUrl] = useState("");
  const [apiKey, setApiKey] = useState("");
  const [model, setModel] = useState("");
  const [showForm, setShowForm] = useState(false);

  if (!open) return null;

  const handleAddProvider = async () => {
    if (!name || !baseUrl || !apiKey || !model) return;
    await addProvider({ name, baseUrl, apiKey, model });
    setName("");
    setBaseUrl("");
    setApiKey("");
    setModel("");
    setShowForm(false);
  };

  const commonPresets = [
    {
      name: "Claude (Anthropic)",
      baseUrl: "https://api.anthropic.com/v1",
      model: "claude-sonnet-4-6",
    },
    {
      name: "DeepSeek",
      baseUrl: "https://api.deepseek.com/v1",
      model: "deepseek-chat",
    },
    {
      name: "OpenAI",
      baseUrl: "https://api.openai.com/v1",
      model: "gpt-4o",
    },
  ];

  const handlePreset = (preset: (typeof commonPresets)[0]) => {
    setName(preset.name);
    setBaseUrl(preset.baseUrl);
    setModel(preset.model);
    setShowForm(true);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-[500px] max-h-[80vh] overflow-y-auto">
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
          <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-200">
            ⚙️ 设置
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-lg"
          >
            ✕
          </button>
        </div>

        <div className="p-4 space-y-4">
          {/* AI 提供商列表 */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                AI 服务
              </h4>
              <button
                onClick={() => setShowForm(true)}
                className="text-xs text-blue-500 hover:text-blue-600"
              >
                + 添加
              </button>
            </div>

            {settings.providers.length === 0 ? (
              <div className="text-xs text-gray-400 py-4 text-center">
                尚未配置 AI 服务，点击"+ 添加"或选择下方预设
              </div>
            ) : (
              <div className="space-y-2">
                {settings.providers.map((p) => (
                  <div
                    key={p.id}
                    className={`flex items-center justify-between p-2 rounded-md border cursor-pointer transition-colors ${
                      settings.activeProviderId === p.id
                        ? "border-blue-400 bg-blue-50 dark:bg-blue-900/30"
                        : "border-gray-200 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700"
                    }`}
                    onClick={() => setActiveProvider(p.id)}
                  >
                    <div>
                      <div className="text-xs font-medium text-gray-700 dark:text-gray-300">
                        {p.name}
                      </div>
                      <div className="text-[10px] text-gray-400">
                        {p.model} · {p.baseUrl}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {settings.activeProviderId === p.id && (
                        <span className="text-[10px] text-green-500">✓ 当前</span>
                      )}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          removeProvider(p.id);
                        }}
                        className="text-xs text-red-400 hover:text-red-600"
                      >
                        删除
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* 添加表单 */}
            {showForm && (
              <div className="mt-3 p-3 border border-gray-200 dark:border-gray-600 rounded-md space-y-2.5">
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="显示名称（如 Claude）"
                  className="w-full text-xs px-2.5 py-1.5 rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <input
                  type="text"
                  value={baseUrl}
                  onChange={(e) => setBaseUrl(e.target.value)}
                  placeholder="Base URL（如 https://api.anthropic.com/v1）"
                  className="w-full text-xs px-2.5 py-1.5 rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <input
                  type="password"
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  placeholder="API Key"
                  className="w-full text-xs px-2.5 py-1.5 rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <input
                  type="text"
                  value={model}
                  onChange={(e) => setModel(e.target.value)}
                  placeholder="模型名称（如 claude-sonnet-4-6）"
                  className="w-full text-xs px-2.5 py-1.5 rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <div className="flex gap-2">
                  <button
                    onClick={handleAddProvider}
                    className="px-3 py-1.5 text-xs bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
                  >
                    保存
                  </button>
                  <button
                    onClick={() => setShowForm(false)}
                    className="px-3 py-1.5 text-xs text-gray-500 hover:text-gray-700 transition-colors"
                  >
                    取消
                  </button>
                </div>
              </div>
            )}

            {/* 预设 */}
            {!showForm && (
              <div className="mt-2">
                <div className="text-[10px] text-gray-400 mb-1.5">快速预设：</div>
                <div className="flex flex-wrap gap-1.5">
                  {commonPresets.map((preset) => (
                    <button
                      key={preset.name}
                      onClick={() => handlePreset(preset)}
                      className="text-[10px] px-2 py-1 rounded bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                    >
                      {preset.name}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* 阅读设置 */}
          <div>
            <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
              阅读设置
            </h4>
            <div className="flex items-center justify-between">
              <span className="text-xs text-gray-600 dark:text-gray-400">
                字号
              </span>
              <select
                value={settings.fontSize}
                onChange={(e) =>
                  setSettings({ ...settings, fontSize: Number(e.target.value) })
                }
                className="text-xs px-2 py-1 rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {[12, 14, 16, 18, 20, 24].map((size) => (
                  <option key={size} value={size}>
                    {size}px
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: 提交**

```bash
git add src/components/SettingsDialog.tsx
git commit -m "feat: add SettingsDialog with AI provider configuration and reading preferences"
```

---

### Task 15: Tauri Rust 后端 — 文件处理

**Files:**
- Create: `src-tauri/src/file_handler.rs`
- Modify: `src-tauri/src/main.rs`
- Modify: `src-tauri/Cargo.toml`

- [ ] **Step 1: 实现文件处理模块**

创建 `src-tauri/src/file_handler.rs`：

```rust
use std::fs;
use std::path::Path;

/// 获取文件的元数据（大小）
#[tauri::command]
pub fn get_file_metadata(path: String) -> Result<FileMetadata, String> {
    let metadata = fs::metadata(&path).map_err(|e| format!("无法读取文件: {}", e))?;
    Ok(FileMetadata {
        size: metadata.len(),
    })
}

/// 读取文件内容为字节数组
#[tauri::command]
pub fn read_file(path: String) -> Result<Vec<u8>, String> {
    fs::read(&path).map_err(|e| format!("无法读取文件: {}", e))
}

/// 读取文本文件内容为字符串
#[tauri::command]
pub fn read_text_file(path: String) -> Result<String, String> {
    fs::read_to_string(&path).map_err(|e| format!("无法读取文件: {}", e))
}

/// 列出文件夹中所有支持的文件
#[tauri::command]
pub fn list_folder_files(folder_path: String) -> Result<Vec<FolderEntry>, String> {
    let dir = fs::read_dir(&folder_path)
        .map_err(|e| format!("无法读取文件夹: {}", e))?;
    
    let supported_extensions = ["txt", "pdf", "docx", "doc", "md", "markdown"];
    let mut entries = Vec::new();
    
    for entry in dir {
        let entry = entry.map_err(|e| format!("读取条目失败: {}", e))?;
        let path = entry.path();
        
        if path.is_file() {
            if let Some(ext) = path.extension() {
                let ext_lower = ext.to_string_lossy().to_lowercase();
                if supported_extensions.contains(&ext_lower.as_str()) {
                    entries.push(FolderEntry {
                        name: path.file_name()
                            .unwrap_or_default()
                            .to_string_lossy()
                            .to_string(),
                        path: path.to_string_lossy().to_string(),
                        extension: ext_lower,
                    });
                }
            }
        }
    }
    
    // 按文件名排序
    entries.sort_by(|a, b| a.name.to_lowercase().cmp(&b.name.to_lowercase()));
    Ok(entries)
}

#[derive(serde::Serialize)]
pub struct FileMetadata {
    pub size: u64,
}

#[derive(serde::Serialize)]
pub struct FolderEntry {
    pub name: String,
    pub path: String,
    pub extension: String,
}
```

- [ ] **Step 2: 注册 Tauri 命令**

修改 `src-tauri/src/main.rs`：

```rust
// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

mod file_handler;

fn main() {
    tauri::Builder::default()
        .invoke_handler(tauri::generate_handler![
            file_handler::get_file_metadata,
            file_handler::read_file,
            file_handler::read_text_file,
            file_handler::list_folder_files,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
```

- [ ] **Step 3: 构建验证**

```bash
cd src-tauri
cargo check
```

Expected: No compilation errors.

- [ ] **Step 4: 提交**

```bash
git add src-tauri/src/file_handler.rs src-tauri/src/main.rs
git commit -m "feat: add Tauri file handler commands for reading documents and listing folders"
```

---

### Task 16: Tauri Rust 后端 — API 代理

**Files:**
- Create: `src-tauri/src/api_proxy.rs`
- Modify: `src-tauri/src/main.rs`
- Modify: `src-tauri/Cargo.toml`

- [ ] **Step 1: 添加 HTTP 客户端依赖**

修改 `src-tauri/Cargo.toml`，在 `[dependencies]` 中添加：

```toml
reqwest = { version = "0.12", features = ["json", "rustls-tls"], default-features = false }
serde_json = "1"
```

- [ ] **Step 2: 实现 API 代理模块**

创建 `src-tauri/src/api_proxy.rs`：

```rust
use reqwest::Client;
use serde_json::Value;

/// 代理 AI API 请求，保护 API Key 不暴露给前端
#[tauri::command]
pub async fn proxy_ai_request(
    url: String,
    api_key: String,
    body: Value,
) -> Result<Value, String> {
    let client = Client::new();
    
    let response = client
        .post(&url)
        .header("Content-Type", "application/json")
        .header("Authorization", format!("Bearer {}", api_key))
        .json(&body)
        .send()
        .await
        .map_err(|e| format!("请求失败: {}", e))?;
    
    let status = response.status();
    let response_body: Value = response
        .json()
        .await
        .map_err(|e| format!("解析响应失败: {}", e))?;
    
    if !status.is_success() {
        let error_msg = response_body
            .get("error")
            .and_then(|e| e.get("message"))
            .and_then(|m| m.as_str())
            .unwrap_or("未知错误");
        return Err(format!("API 错误 ({}): {}", status.as_u16(), error_msg));
    }
    
    Ok(response_body)
}
```

- [ ] **Step 3: 注册代理命令**

修改 `src-tauri/src/main.rs`：

```rust
// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

mod file_handler;
mod api_proxy;

fn main() {
    tauri::Builder::default()
        .invoke_handler(tauri::generate_handler![
            file_handler::get_file_metadata,
            file_handler::read_file,
            file_handler::read_text_file,
            file_handler::list_folder_files,
            api_proxy::proxy_ai_request,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
```

- [ ] **Step 4: 构建验证**

```bash
cd src-tauri
cargo check
```

Expected: No compilation errors.

- [ ] **Step 5: 提交**

```bash
git add src-tauri/src/api_proxy.rs src-tauri/src/main.rs src-tauri/Cargo.toml
git commit -m "feat: add Tauri API proxy to protect user API keys"
```

---

### Task 17: 组装 App.tsx — 串联所有组件

**Files:**
- Modify: `src/App.tsx`
- Modify: `src/main.tsx`

- [ ] **Step 1: 实现 App 组件**

修改 `src/App.tsx`：

```typescript
import React, { useState, useCallback, useRef } from "react";
import { AppShell } from "./components/AppShell";
import { TopBar } from "./components/TopBar";
import { OutlinePanel } from "./components/OutlinePanel";
import { ReaderArea } from "./components/ReaderArea";
import { AIPanel } from "./components/AIPanel";
import { SettingsDialog } from "./components/SettingsDialog";
import { AppProvider, useAppContext } from "./contexts/AppContext";
import { parseDocument, extractOutline } from "./services/documentParser";
import type { OutlineNode, ContextRef } from "./types";
import { generateId } from "./lib/utils";

function AppInner() {
  const ctx = useAppContext();
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [htmlContent, setHtmlContent] = useState("");
  const [outline, setOutline] = useState<OutlineNode[]>([]);
  const [activeHeadingId, setActiveHeadingId] = useState<string | null>(null);
  const [rawText, setRawText] = useState("");
  const aiPanelRef = useRef<any>(null);
  const outlinePanelRef = useRef<{ onScrollChange: (id: string) => void }>(null);

  // 打开文件处理
  const handleOpenFile = useCallback(async () => {
    try {
      // 使用 Tauri 文件对话框
      const { open } = await import("@tauri-apps/plugin-dialog");
      const selected = await open({
        multiple: false,
        filters: [
          {
            name: "文档",
            extensions: ["txt", "pdf", "docx", "doc", "md", "markdown"],
          },
        ],
      });
      if (selected && typeof selected === "string") {
        await loadDocument(selected);
      }
    } catch {
      // 开发环境 fallback：使用 input 元素
      const input = document.createElement("input");
      input.type = "file";
      input.accept = ".txt,.pdf,.docx,.doc,.md,.markdown";
      input.onchange = async (e) => {
        const file = (e.target as HTMLInputElement).files?.[0];
        if (file) {
          await loadDocumentFromFile(file);
        }
      };
      input.click();
    }
  }, []);

  const handleImportFolder = useCallback(async () => {
    try {
      const { open } = await import("@tauri-apps/plugin-dialog");
      const selected = await open({ directory: true });
      if (selected && typeof selected === "string") {
        const { invoke } = await import("@tauri-apps/api/core");
        const files = await invoke<
          Array<{ name: string; path: string; extension: string }>
        >("list_folder_files", { folderPath: selected });
        for (const file of files) {
          try {
            await ctx.openDocumentFile(file.path);
          } catch {
            // 跳过无法打开的文件
          }
        }
      }
    } catch {
      // 开发环境不支持文件夹导入
    }
  }, [ctx]);

  const loadDocumentFromFile = useCallback(
    async (file: File) => {
      const doc = await ctx.openDocumentFile(file.name);
      const arrayBuffer = await file.arrayBuffer();
      await renderDocument(doc.id, arrayBuffer, doc.format);
    },
    [ctx],
  );

  const loadDocument = useCallback(
    async (filePath: string) => {
      const doc = await ctx.openDocumentFile(filePath);
      try {
        const { invoke } = await import("@tauri-apps/api/core");
        const content = await invoke<number[]>("read_file", { path: filePath });
        const buffer = new Uint8Array(content).buffer;
        await renderDocument(doc.id, buffer, doc.format);
      } catch {
        // Tauri 环境不可用时的 fallback
      }
    },
    [ctx],
  );

  const renderDocument = useCallback(
    async (docId: string, content: ArrayBuffer, format: string) => {
      try {
        const result = await parseDocument(content, format as any);
        setHtmlContent(result.html);
        setRawText(result.rawText);
        const newOutline = extractOutline(
          format === "md" ? result.rawText : result.html,
          format as any,
        );
        setOutline(newOutline);
      } catch (err) {
        setHtmlContent(
          `<div class="error">文档解析失败: ${err instanceof Error ? err.message : "未知错误"}</div>`,
        );
        setOutline([]);
      }
    },
    [],
  );

  // AI 追问处理
  const handleAskAI = useCallback(
    (selectedText: string) => {
      // 暂时通过全局变量或 context 方式传递上下文到 AIPanel
      window.dispatchEvent(
        new CustomEvent("add-context", {
          detail: {
            id: generateId(),
            type: "text" as const,
            content: selectedText,
            label: selectedText.length > 50 ? selectedText.slice(0, 50) + "..." : selectedText,
          },
        }),
      );
    },
    [],
  );

  // 滚动位置回调
  const handleScrollChange = useCallback(
    (pct: number) => {
      if (ctx.activeDocumentId) {
        ctx.updateScrollPosition(ctx.activeDocumentId, pct);
      }
    },
    [ctx],
  );

  return (
    <>
      <AppShell
        topBar={
          <TopBar
            documents={ctx.documents}
            activeDocumentId={ctx.activeDocumentId}
            onSelectDocument={ctx.setActiveDocumentId}
            onCloseDocument={ctx.closeDocument}
            onOpenFile={handleOpenFile}
            onImportFolder={handleImportFolder}
            onOpenSettings={() => setSettingsOpen(true)}
          />
        }
        outlinePanel={
          <OutlinePanel
            outline={outline}
            activeHeadingId={activeHeadingId}
            onNavigate={(anchorId) => {
              const el = document.getElementById(anchorId);
              if (el) el.scrollIntoView({ behavior: "smooth" });
            }}
          />
        }
        readerArea={
          <ReaderArea
            document={ctx.activeDocument}
            htmlContent={htmlContent}
            onAskAI={handleAskAI}
            onTakeNote={(text) => handleAskAI(`请帮我记下这段笔记：${text}`)}
            onExplain={(text) => handleAskAI(`请用通俗易懂的语言解释：${text}`)}
            onTranslate={(text) => handleAskAI(`请翻译成中文：${text}`)}
            onSummarize={(text) => handleAskAI(`请总结以下内容：${text}`)}
            onScrollPositionChange={handleScrollChange}
          />
        }
        aiPanel={
          <AIPanel
            conversation={ctx.conversation}
            hasApiKey={ctx.hasApiKey}
            onSendMessage={async (content, contexts, convId) => {
              await ctx.sendMessage(content, contexts);
            }}
            onNewConversation={ctx.newConversation}
          />
        }
      />

      <SettingsDialog
        open={settingsOpen}
        onClose={() => setSettingsOpen(false)}
      />
    </>
  );
}

export default function App() {
  return (
    <AppProvider>
      <AppInner />
    </AppProvider>
  );
}
```

- [ ] **Step 2: 更新 main.tsx**

修改 `src/main.tsx`：

```typescript
import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import "./index.css";

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
```

- [ ] **Step 3: 安装 Tauri dialog 插件**

```bash
npm install @tauri-apps/plugin-dialog
cd src-tauri
cargo add tauri-plugin-dialog
```

- [ ] **Step 4: 提交**

```bash
git add src/App.tsx src/main.tsx
git commit -m "feat: wire up all components in App with Tauri file dialog integration"
```

---

### Task 18: E2E 测试 + 最终验证

**Files:**
- Create: `tests/e2e/full-flow.spec.ts`
- Create: `playwright.config.ts`

- [ ] **Step 1: 配置 Playwright**

创建 `playwright.config.ts`：

```typescript
import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "./tests/e2e",
  timeout: 30000,
  retries: 1,
  use: {
    baseURL: "http://localhost:1420",
    headless: true,
    screenshot: "only-on-failure",
  },
  webServer: {
    command: "npm run dev",
    url: "http://localhost:1420",
    reuseExistingServer: true,
  },
});
```

- [ ] **Step 2: 编写 E2E 测试**

创建 `tests/e2e/full-flow.spec.ts`：

```typescript
import { test, expect } from "@playwright/test";

test.describe("LearnByAI App", () => {
  test("should render the three-column layout", async ({ page }) => {
    await page.goto("/");

    // 检查标题
    await expect(page.locator("text=LearnByAI")).toBeVisible();

    // 检查三个面板
    await expect(page.locator('[data-panel="outline"]')).toBeVisible();
    await expect(page.locator('[data-panel="reader"]')).toBeVisible();
    await expect(page.locator('[data-panel="ai"]')).toBeVisible();
  });

  test("should show empty state when no document is open", async ({
    page,
  }) => {
    await page.goto("/");

    // 阅读区空状态
    await expect(
      page.locator("text=打开一个文档开始阅读"),
    ).toBeVisible();

    // AI 面板提示
    await expect(
      page.locator("text=请先在设置中配置 AI 服务"),
    ).toBeVisible();
  });

  test("should open settings dialog", async ({ page }) => {
    await page.goto("/");

    // 点击设置按钮
    await page.click('[aria-label="设置"]');

    // 设置对话框出现
    await expect(page.locator("text=AI 服务")).toBeVisible();
  });

  test("should have draggable dividers between panels", async ({ page }) => {
    await page.goto("/");

    // 分隔条存在
    const dividers = page.locator('[data-divider]');
    await expect(dividers).toHaveCount(2);
  });

  test("should show tabs area in top bar", async ({ page }) => {
    await page.goto("/");

    // 标签区域提示
    await expect(page.locator("text=尚未打开任何文档")).toBeVisible();
  });
});
```

- [ ] **Step 3: 运行 E2E 测试**

```bash
npx playwright install chromium
npx playwright test
```

Expected: All E2E tests PASS。

- [ ] **Step 4: 完整构建验证**

```bash
npm run tauri build -- --debug
```

Expected: 构建成功，生成 Windows 可执行文件。

- [ ] **Step 5: 最终提交**

```bash
git add tests/e2e/ playwright.config.ts
git commit -m "test: add E2E tests and Playwright configuration"
```

---

## 实施顺序

```
Task 1 (Scaffold)
  └─ Task 2 (Types)
       ├─ Task 3 (Storage)
       ├─ Task 4 (Document Parser)
       └─ Task 5 (Utils)
            └─ Task 6 (AppShell)
                 ├─ Task 7 (TopBar/TabBar)
                 ├─ Task 8 (OutlinePanel)
                 ├─ Task 9 (ReaderArea)
                 ├─ Task 10 (ChatMessages/ChatInput)
                 └─ Task 11 (AIPanel)
                      ├─ Task 12 (AI Client)
                      ├─ Task 13 (AppContext/Hooks)
                      └─ Task 14 (SettingsDialog)
                           ├─ Task 15 (Tauri File Handler)
                           ├─ Task 16 (Tauri API Proxy)
                           └─ Task 17 (App.tsx 组装)
                                └─ Task 18 (E2E Tests)
```

## 变更记录

| 日期 | 变更 |
|------|------|
| 2026-06-13 | 初始实现计划 |
