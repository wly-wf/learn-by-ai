import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { Sidebar } from "../../src/components/Sidebar";

const mockOutline = [
  { id: "o1", title: "Chapter 1", level: 1, children: [
    { id: "o1a", title: "Section 1.1", level: 2, children: [], anchorId: "heading-section-1-1" }
  ], anchorId: "heading-chapter-1" },
];

describe("Sidebar", () => {
  it("renders outline tree when outline is provided", () => {
    render(
      <Sidebar
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
        outline={[]}
        activeHeadingId={null}
        onNavigate={() => {}}
        onOpenFile={() => {}}
      />
    );
    expect(screen.getByText("暂无大纲")).toBeDefined();
  });

  it("calls onOpenFile when clicking the open button", () => {
    let called = false;
    render(
      <Sidebar
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
