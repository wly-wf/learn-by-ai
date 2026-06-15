import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { Sidebar } from "../../src/components/Sidebar";

const mockDocs = [
  { id: "1", fileName: "test.md", filePath: "/test.md", format: "md" as const, size: 100, openedAt: Date.now(), lastScrollPosition: 0 },
  { id: "2", fileName: "doc.pdf", filePath: "/doc.pdf", format: "pdf" as const, size: 200, openedAt: Date.now(), lastScrollPosition: 0 },
];

const mockOutline = [
  { id: "o1", title: "Chapter 1", level: 1, children: [
    { id: "o1a", title: "Section 1.1", level: 2, children: [], anchorId: "heading-section-1-1" }
  ], anchorId: "heading-chapter-1" },
];

describe("Sidebar", () => {
  it("renders document list items", () => {
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
    expect(screen.getByText("test.md")).toBeDefined();
    expect(screen.getByText("doc.pdf")).toBeDefined();
  });

  it("renders outline tree when outline is provided", () => {
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
    expect(screen.getByText("Section 1.1")).toBeDefined();
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

  it("calls onSelectDocument when clicking a document", () => {
    let selectedId = "";
    render(
      <Sidebar
        documents={mockDocs}
        activeDocumentId={null}
        onSelectDocument={(id) => { selectedId = id; }}
        onCloseDocument={() => {}}
        outline={[]}
        activeHeadingId={null}
        onNavigate={() => {}}
        onOpenFile={() => {}}
      />
    );
    screen.getByText("test.md").click();
    expect(selectedId).toBe("1");
  });

  it("calls onOpenFile when clicking the open button", () => {
    let called = false;
    render(
      <Sidebar
        documents={[]}
        activeDocumentId={null}
        onSelectDocument={() => {}}
        onCloseDocument={() => {}}
        outline={[]}
        activeHeadingId={null}
        onNavigate={() => {}}
        onOpenFile={() => { called = true; }}
      />
    );
    screen.getByText("打开").click();
    expect(called).toBe(true);
  });
});
