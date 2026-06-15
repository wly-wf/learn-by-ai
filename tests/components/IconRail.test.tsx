import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { IconRail } from "../../src/components/IconRail";

describe("IconRail", () => {
  it("renders all icon buttons", () => {
    render(<IconRail activeView="reading" onViewChange={() => {}} onOpenSettings={() => {}} />);
    expect(screen.getByLabelText("阅读")).toBeDefined();
    expect(screen.getByLabelText("大纲")).toBeDefined();
    expect(screen.getByLabelText("AI 对话")).toBeDefined();
  });

  it("highlights active view", () => {
    render(<IconRail activeView="reading" onViewChange={() => {}} onOpenSettings={() => {}} />);
    const readingBtn = screen.getByLabelText("阅读");
    expect(readingBtn.style.background).toBe("var(--accent)");
    expect(readingBtn.style.color).toBe("white");
  });

  it("does not highlight inactive views", () => {
    render(<IconRail activeView="reading" onViewChange={() => {}} onOpenSettings={() => {}} />);
    const outlineBtn = screen.getByLabelText("大纲");
    expect(outlineBtn.style.background).toBe("transparent");
  });

  it("calls onViewChange when clicking inactive icon", () => {
    let called = "";
    render(<IconRail activeView="reading" onViewChange={(v) => { called = v; }} onOpenSettings={() => {}} />);
    screen.getByLabelText("大纲").click();
    expect(called).toBe("outline");
  });

  it("shows unread dot on AI icon when aiUnread is true", () => {
    render(<IconRail activeView="reading" onViewChange={() => {}} onOpenSettings={() => {}} aiUnread={true} />);
    const aiButton = screen.getByLabelText("AI 对话");
    const dot = aiButton.querySelector("span");
    expect(dot).toBeDefined();
    expect(dot?.className).toContain("bg-[#FF3B30]");
  });

  it("renders settings button at bottom", () => {
    render(<IconRail activeView="reading" onViewChange={() => {}} onOpenSettings={() => {}} />);
    expect(screen.getByLabelText("设置")).toBeDefined();
  });

  it("calls onOpenSettings when clicking settings button", () => {
    let called = false;
    render(<IconRail activeView="reading" onViewChange={() => {}} onOpenSettings={() => { called = true; }} />);
    screen.getByLabelText("设置").click();
    expect(called).toBe(true);
  });
});
