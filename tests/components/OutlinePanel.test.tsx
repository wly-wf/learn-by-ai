import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { OutlinePanel } from "../../src/components/OutlinePanel";
import type { OutlineNode } from "../../src/types";

const sampleOutline: OutlineNode[] = [
  {
    id: "1", title: "Chapter 1", level: 1,
    children: [
      { id: "1-1", title: "Section 1.1", level: 2, children: [], anchorId: "section-1-1" },
    ],
    anchorId: "chapter-1",
  },
  {
    id: "2", title: "Chapter 2", level: 1, children: [], anchorId: "chapter-2",
  },
];

describe("OutlinePanel", () => {
  it("should render outline tree", () => {
    render(<OutlinePanel outline={sampleOutline} activeHeadingId={null} onNavigate={() => {}} />);
    expect(screen.getByText("Chapter 1")).toBeInTheDocument();
    expect(screen.getByText("Chapter 2")).toBeInTheDocument();
  });

  it("should show children when expanded", () => {
    render(<OutlinePanel outline={sampleOutline} activeHeadingId={null} onNavigate={() => {}} />);
    expect(screen.getByText("Section 1.1")).toBeInTheDocument();
  });

  it("should call onNavigate when heading clicked", () => {
    const onNavigate = vi.fn();
    render(<OutlinePanel outline={sampleOutline} activeHeadingId={null} onNavigate={onNavigate} />);
    fireEvent.click(screen.getByText("Chapter 1"));
    expect(onNavigate).toHaveBeenCalledWith("chapter-1");
  });

  it("should show empty state when no outline", () => {
    render(<OutlinePanel outline={[]} activeHeadingId={null} onNavigate={() => {}} />);
    expect(screen.getByText("暂无大纲")).toBeInTheDocument();
  });

  it("should highlight active heading", () => {
    render(<OutlinePanel outline={sampleOutline} activeHeadingId="chapter-2" onNavigate={() => {}} />);
    const chapter2 = screen.getByText("Chapter 2");
    expect(chapter2.closest('[data-active="true"]')).toBeTruthy();
  });
});
