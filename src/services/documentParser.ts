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

export async function parseDocument(
  content: ArrayBuffer | string,
  format: DocumentFormat,
): Promise<{ html: string; rawText: string }> {
  switch (format) {
    case "txt": {
      const text = typeof content === "string"
        ? content
        : new TextDecoder().decode(content);
      const html = text
        .split("\n")
        .map((line) => `<p>${escapeHtml(line) || "&nbsp;"}</p>`)
        .join("\n");
      return { html, rawText: text };
    }

    case "md": {
      const text = typeof content === "string"
        ? content
        : new TextDecoder().decode(content);
      const html = await marked.parse(text);
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
      return { html: result.value, rawText };
    }

    case "pdf": {
      const html = `<div id="pdf-container" class="pdf-viewer"></div>`;
      return { html, rawText: "" };
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
  const lines = markdown.split("\n");
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

export function truncateText(text: string, maxLength: number): string {
  if (!text || text.length <= maxLength) return text;
  return text.slice(0, maxLength) + "...";
}
