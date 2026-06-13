import { test, expect } from "@playwright/test";

test.describe("LearnByAI App", () => {
  test("should render the three-column layout", async ({ page }) => {
    await page.goto("/");
    await expect(page.locator("text=LearnByAI")).toBeVisible();
    await expect(page.locator('[data-panel="outline"]')).toBeVisible();
    await expect(page.locator('[data-panel="reader"]')).toBeVisible();
    await expect(page.locator('[data-panel="ai"]')).toBeVisible();
  });

  test("should show empty state when no document is open", async ({ page }) => {
    await page.goto("/");
    await expect(page.locator("text=打开一个文档开始阅读")).toBeVisible();
    await expect(page.locator("text=请先在设置中配置 AI 服务")).toBeVisible();
  });

  test("should open settings dialog", async ({ page }) => {
    await page.goto("/");
    await page.click('[aria-label="设置"]');
    await expect(page.getByRole("heading", { name: "AI 服务" })).toBeVisible();
  });

  test("should have draggable dividers between panels", async ({ page }) => {
    await page.goto("/");
    const dividers = page.locator('[data-divider]');
    await expect(dividers).toHaveCount(2);
  });

  test("should show tabs area in top bar", async ({ page }) => {
    await page.goto("/");
    await expect(page.locator("text=尚未打开任何文档")).toBeVisible();
  });
});
