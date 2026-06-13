import { describe, it, expect } from "vitest";
import {
  detectFormat,
  extractOutline,
  truncateText,
} from "../../src/services/documentParser";

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
    expect(outline).toHaveLength(2);

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

describe("extractOutline from HTML", () => {
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
    expect(result.length).toBeLessThanOrEqual(5003);
    expect(result).toContain("...");
  });

  it("should return empty string for empty input", () => {
    expect(truncateText("", 100)).toBe("");
  });
});
