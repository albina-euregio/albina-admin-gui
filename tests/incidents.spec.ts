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
  // Mocks API, does not create an incident on the server.
  await page.route(
    (url) => url.pathname.endsWith("/incidents"),
    async (route) => {
      if (route.request().method() === "POST") {
        const data = JSON.parse(route.request().postData() ?? "{}");
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({
            id: "f47ac10b-58cc-4372-a567-0e02b2c3d479",
            createdAt: new Date(2026, 1, 10, 11, 0, 0).toISOString(),
            updatedAt: new Date(2026, 1, 10, 11, 0, 0).toISOString(),
            data,
          }),
        });
      } else {
        await route.continue();
      }
    },
  );
  await page.goto("#/incidents/new");
  await test.step("Fill in required information", async () => {
    await page.locator('input[type="date"]').fill("2026-02-10");
    await expect(page.getByRole("alert")).toContainText("Required fields are missing");
    await page.getByRole("button", { name: "AWS Internal" }).click();
    await page.locator("#timeAccuracy").getByRole("button", { name: "exact" }).click();
    await page.getByRole("textbox", { name: "Location" }).fill("Computer");
    await page.locator("#locationMap").click();
    await expect(page.getByRole("spinbutton", { name: "Latitude" })).not.toBeEmpty();
    await expect(page.getByRole("spinbutton", { name: "Longitude" })).not.toBeEmpty();
    await expect(page.getByRole("textbox", { name: "Country" })).not.toBeEmpty();
    await expect(page.getByRole("textbox", { name: "Region", exact: true })).not.toBeEmpty();
    await expect(page.getByRole("textbox", { name: "Municipality" })).not.toBeEmpty();
    await expect(page.getByRole("textbox", { name: "Avalanche Region" })).not.toBeEmpty();
    await page.locator("#locationAccuracy").getByRole("button", { name: "unknown" }).click();
    await expect(page.getByRole("alert")).toBeHidden();
  });
  await test.step("Meta information is automatically filled", async () => {
    await expect(page.getByTitle("Playwright")).toHaveText("playwright@avalanche.report");
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
