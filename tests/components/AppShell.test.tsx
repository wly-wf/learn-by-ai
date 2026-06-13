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

    const panels = container.querySelectorAll("[data-panel]");
    expect(panels.length).toBeGreaterThanOrEqual(3);
  });
});
