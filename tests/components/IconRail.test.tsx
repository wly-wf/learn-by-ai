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
    expect(readingBtn.style.background).toBe("var(--accent)");
    expect(readingBtn.style.color).toBe("white");
  });

  it("does not highlight inactive views", () => {
    render(<IconRail activeView="reading" onViewChange={() => {}} />);
    const outlineBtn = screen.getByLabelText("大纲");
    expect(outlineBtn.style.background).toBe("transparent");
  });

  it("calls onViewChange when clicking inactive icon", () => {
    let called = "";
    render(<IconRail activeView="reading" onViewChange={(v) => { called = v; }} />);
    screen.getByLabelText("大纲").click();
    expect(called).toBe("outline");
  });

  it("shows unread dot on AI icon when aiUnread is true", () => {
    render(<IconRail activeView="reading" onViewChange={() => {}} aiUnread={true} />);
    // The unread indicator is a span inside the AI button
    const aiButton = screen.getByLabelText("AI 对话");
    const dot = aiButton.querySelector("span");
    expect(dot).toBeDefined();
    expect(dot?.className).toContain("bg-[#FF3B30]");
  });
});
