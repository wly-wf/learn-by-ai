import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { AppShell } from "../../src/components/AppShell";

describe("AppShell", () => {
  it("renders all layout slots when sidebar and drawer are visible", () => {
    render(
      <AppShell
        iconRail={<div data-testid="icon-rail">rail</div>}
        sidebar={<div data-testid="sidebar">sidebar</div>}
        readerArea={<div data-testid="reader">reader</div>}
        aiDrawer={<div data-testid="ai">ai</div>}
        showSidebar={true}
        showAiDrawer={true}
        sidebarWidth={195}
        aiDrawerWidth={285}
      />
    );
    expect(screen.getByTestId("icon-rail")).toBeDefined();
    expect(screen.getByTestId("sidebar")).toBeDefined();
    expect(screen.getByTestId("reader")).toBeDefined();
    expect(screen.getByTestId("ai")).toBeDefined();
  });

  it("hides sidebar when showSidebar is false", () => {
    render(
      <AppShell
        iconRail={<div>r</div>}
        sidebar={<div data-testid="sidebar">s</div>}
        readerArea={<div>rd</div>}
        aiDrawer={null}
        showSidebar={false}
        showAiDrawer={false}
        sidebarWidth={195}
        aiDrawerWidth={285}
      />
    );
    expect(screen.queryByTestId("sidebar")).toBeNull();
  });

  it("hides AI drawer when showAiDrawer is false", () => {
    render(
      <AppShell
        iconRail={<div>r</div>}
        sidebar={<div>s</div>}
        readerArea={<div data-testid="reader">rd</div>}
        aiDrawer={<div data-testid="ai">ai</div>}
        showSidebar={true}
        showAiDrawer={false}
        sidebarWidth={195}
        aiDrawerWidth={285}
      />
    );
    expect(screen.queryByTestId("ai")).toBeNull();
  });

  it("renders only icon rail and reader as visible", () => {
    render(
      <AppShell
        iconRail={<div data-testid="icon-rail">r</div>}
        sidebar={null}
        readerArea={<div data-testid="reader">rd</div>}
        aiDrawer={null}
        showSidebar={false}
        showAiDrawer={false}
        sidebarWidth={195}
        aiDrawerWidth={285}
      />
    );
    expect(screen.getByTestId("icon-rail")).toBeDefined();
    expect(screen.getByTestId("reader")).toBeDefined();
  });
});
