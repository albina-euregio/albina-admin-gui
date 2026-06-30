import { test, expect } from "@playwright/test";

import { loginForecaster, setFixedTime } from "./utils";

test.beforeEach(async ({ page }) => {
  await page.goto("");
  await loginForecaster(page);
  // Wait until Bootstrap CSS is present
  await page.waitForFunction(() => {
    return getComputedStyle(document.documentElement).getPropertyValue("--bs-font-sans-serif").includes("system-ui");
  });
});

test("New incident report", async ({ page }) => {
  await setFixedTime(page, new Date(2026, 1, 10, 11, 0, 0));
  await page.goto("#/incidents/new");
  await test.step("Meta information is automatically filled", async () => {
    await expect(page.getByTitle("Playwright")).toHaveText("playwright@avalanche.report");
    await page.locator('input[type="date"]').fill("2026-02-10");
    const lastUpdated = page.getByTitle("last updated");
    await expect(lastUpdated).toContainText("Feb 10, 2026");
    await expect(lastUpdated).toContainText("11:00");
    await expect(page.getByTitle("Saved successfully")).toBeVisible();
  });
});

test("Load bulletin information from CAAML", async () => {
  // 1. example with 2 problems
  // 2. example with no problem, but a danger rating: https://avalanche.report/bulletin/2026-02-04?region=AT-07-05
  // 3. example with no report at all (e.g. pre-season -> November)
});
