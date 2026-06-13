import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { ReaderArea } from "../../src/components/ReaderArea";
import type { DocumentMeta } from "../../src/types";

const mockDoc: DocumentMeta = {
  id: "doc-1", fileName: "test.md", filePath: "/test.md", format: "md", size: 1024, openedAt: Date.now(), lastScrollPosition: 0,
};

describe("ReaderArea", () => {
  it("should show empty state when no document", () => {
    render(<ReaderArea document={null} htmlContent="" onAskAI={vi.fn()} onTakeNote={vi.fn()} onExplain={vi.fn()} onTranslate={vi.fn()} onSummarize={vi.fn()} onScrollPositionChange={vi.fn()} />);
    expect(screen.getByText("打开一个文档开始阅读")).toBeInTheDocument();
  });

  it("should render HTML content", () => {
    render(<ReaderArea document={mockDoc} htmlContent="<h1>Hello World</h1><p>Test content</p>" onAskAI={vi.fn()} onTakeNote={vi.fn()} onExplain={vi.fn()} onTranslate={vi.fn()} onSummarize={vi.fn()} onScrollPositionChange={vi.fn()} />);
    expect(screen.getByText("Hello World")).toBeInTheDocument();
    expect(screen.getByText("Test content")).toBeInTheDocument();
  });
});
