import type { DocumentFormat, OutlineNode } from "../types";
import { marked } from "marked";

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

export interface ParseResult {
  html: string;
  rawText: string;
  pdfOutline?: OutlineNode[];
}

export async function parseDocument(
  content: ArrayBuffer | string,
  format: DocumentFormat,
): Promise<ParseResult> {
  switch (format) {
    case "txt": {
      const text = (typeof content === "string"
        ? content
        : new TextDecoder().decode(content))
        .replace(/^﻿/, ""); // Remove BOM
      const html = text
        .split(/\r?\n/)
        .map((line) => `<p>${escapeHtml(line.replace(/\r$/, "")) || "&nbsp;"}</p>`)
        .join("\n");
      return { html, rawText: text };
    }

    case "md": {
      const text = (typeof content === "string"
        ? content
        : new TextDecoder().decode(content))
        .replace(/^﻿/, ""); // Remove BOM
      let html = await marked.parse(text);
      html = addHeadingIds(html);
      return { html, rawText: text };
    }

    case "docx": {
      const mammoth = await import("mammoth");
      const arrayBuffer = typeof content === "string"
        ? new TextEncoder().encode(content).buffer
        : content;
      const result = await mammoth.convertToHtml({ arrayBuffer }, {
        styleMap: [
          "p[style-name='Heading 1'] => h1:fresh",
          "p[style-name='Heading 2'] => h2:fresh",
          "p[style-name='Heading 3'] => h3:fresh",
        ],
      });
      const rawText = result.value.replace(/<[^>]*>/g, "").replace(/\s+/g, " ").trim();
      const html = addHeadingIds(result.value);
      return { html, rawText };
    }

    case "pdf": {
      try {
        const pdfjsLib = await import("pdfjs-dist");
        // Use CDN worker to bypass Vite's module resolution conflict with pdf.js dynamic import()
        pdfjsLib.GlobalWorkerOptions.workerSrc =
          "https://unpkg.com/pdfjs-dist@4.0.379/build/pdf.worker.min.mjs";

        const arrayBuffer = typeof content === "string"
          ? new TextEncoder().encode(content).buffer
          : content;

        const loadingTask = pdfjsLib.getDocument({ data: new Uint8Array(arrayBuffer) });
        const pdf = await loadingTask.promise;
        let fullText = "";
        let htmlParts: string[] = [];

        for (let i = 1; i <= pdf.numPages; i++) {
          const page = await pdf.getPage(i);
          const textContent = await page.getTextContent();
          const pageText = textContent.items
            .map((item: any) => item.str)
            .join(" ");
          fullText += pageText + "\n\n";
          htmlParts.push(`<div class="pdf-page" data-page="${i}"><div class="pdf-page-number text-xs text-gray-400 mb-2">第 ${i} 页</div><p>${pageText || "&nbsp;"}</p></div>`);
        }

        const html = addHeadingIds(`<div class="pdf-viewer">${htmlParts.join("\n")}</div>`);

        // Extract PDF built-in outline (bookmarks/table of contents)
        let pdfOutline: OutlineNode[] | undefined;
        try {
          const rawOutline = await pdf.getOutline();
          if (rawOutline && rawOutline.length > 0) {
            let nodeId = 0;
            const slugCounts = new Map<string, number>();

            function convertOutlineItems(items: typeof rawOutline): OutlineNode[] {
              return items.map((item) => {
                const id = `outline-${nodeId++}`;
                const slug = slugify(item.title);
                const count = slugCounts.get(slug) ?? 0;
                slugCounts.set(slug, count + 1);
                const anchorId =
                  count === 0 ? `heading-${slug}` : `heading-${slug}-${count + 1}`;

                return {
                  id,
                  title: item.title,
                  level: 1, // Top-level outline items; children will be nested
                  children: item.items && item.items.length > 0
                    ? convertOutlineItems(item.items).map((child) => ({
                        ...child,
                        level: 2,
                      }))
                    : [],
                  anchorId,
                };
              });
            }

            pdfOutline = convertOutlineItems(rawOutline);
          }
        } catch {
          // PDF has no outline — that's fine, outline panel will just show empty
        }

        return { html, rawText: fullText, pdfOutline };
      } catch (err) {
        throw new Error(`PDF 解析失败: ${err instanceof Error ? err.message : "未知错误"}`);
      }
    }

    default:
      throw new Error(`Unsupported format: ${format}`);
  }
}

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

export function extractOutline(
  content: string,
  format: DocumentFormat,
): OutlineNode[] {
  if (format === "md") {
    return extractMarkdownOutline(content);
  }
  return extractHtmlOutline(content);
}

function extractMarkdownOutline(markdown: string): OutlineNode[] {
  // Handle Windows \r\n, Unix \n, and legacy Mac \r line endings
  const lines = markdown.split(/\r?\n/).map(l => l.replace(/\r$/, ""));
  const headingRegex = /^(#{1,6})\s+(.+)$/;
  const root: OutlineNode[] = [];
  const stack: OutlineNode[] = [];
  let nodeId = 0;
  let inCodeBlock = false;

  const slugCounts = new Map<string, number>();

  for (const line of lines) {
    // Toggle code block state on ``` fences
    if (line.trimStart().startsWith("```")) {
      inCodeBlock = !inCodeBlock;
      continue;
    }
    if (inCodeBlock) continue;

    const match = line.match(headingRegex);
    if (!match) continue;

    const level = match[1].length;
    const title = match[2].trim();
    const id = `outline-${nodeId++}`;
    const slug = slugify(title);
    const count = slugCounts.get(slug) ?? 0;
    slugCounts.set(slug, count + 1);
    const anchorId = count === 0 ? `heading-${slug}` : `heading-${slug}-${count + 1}`;

    const node: OutlineNode = { id, title, level, children: [], anchorId };

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

function extractHtmlOutline(html: string): OutlineNode[] {
  const headingRegex = /<h([1-6])[^>]*>(.+?)<\/h\1>/gi;
  const root: OutlineNode[] = [];
  const stack: OutlineNode[] = [];
  let nodeId = 0;
  const slugCounts = new Map<string, number>();

  let match: RegExpExecArray | null;
  while ((match = headingRegex.exec(html)) !== null) {
    const level = parseInt(match[1]);
    const title = match[2].replace(/<[^>]*>/g, "").trim();
    const id = `outline-${nodeId++}`;
    const slug = slugify(title);
    const count = slugCounts.get(slug) ?? 0;
    slugCounts.set(slug, count + 1);
    const anchorId = count === 0 ? `heading-${slug}` : `heading-${slug}-${count + 1}`;

    const node: OutlineNode = { id, title, level, children: [], anchorId };

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

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w㐀-䶿一-鿿豈-﫿]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function addHeadingIds(html: string): string {
  const slugCounts = new Map<string, number>();

  return html.replace(/<(h[1-6])([^>]*)>(.+?)<\/\1>/gi, (match, tag, attrs, content) => {
    // Don't override existing IDs
    if (/\sid\s*=\s*["']/i.test(attrs)) return match;

    const text = content.replace(/<[^>]*>/g, "").trim();
    const slug = slugify(text);
    const count = slugCounts.get(slug) ?? 0;
    slugCounts.set(slug, count + 1);
    const id = count === 0 ? `heading-${slug}` : `heading-${slug}-${count + 1}`;

    return `<${tag}${attrs} id="${id}">${content}</${tag}>`;
  });
}

export function truncateText(text: string, maxLength: number): string {
  if (!text || text.length <= maxLength) return text;
  return text.slice(0, maxLength) + "...";
}
