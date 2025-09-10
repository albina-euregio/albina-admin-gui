import { changeRegion, login } from "./utils";
import { test, expect } from "@playwright/test";

const testDate = new Date("2024-12-24");

test.beforeEach(async ({ page }) => {
  await page.goto("");
  await login(page);
});

test("check visible neighbors", async ({ page }) => {
  await test.step("Tyrol sees Carinthia and South Tyrol", async () => {
    await changeRegion(page, "Tyrol");
    await expect(page.locator("thead")).toContainText("Tyrol Carinthia South Tyrol");
  });
  await test.step("Carinthia sees Tyrol", async () => {
    await changeRegion(page, "Carinthia");
    await expect(page.locator("thead")).toContainText("Carinthia Tyrol");
  });
});

test("View bulletin", async ({ page }) => {
  await page.clock.setFixedTime(testDate);
  await page.reload();
  await changeRegion(page, "Tyrol");
  await page.getByTitle("Load 7 more bulletins").click();
  await expect(page.getByText("Tuesday, December 10, 2024")).toBeVisible();
  await page.getByRole("row", { name: "Tuesday, December 10, 2024" }).getByTitle("read bulletin").click();
  await expect(page).toHaveURL(/bulletins\/2024-12-10\?readOnly=true/);
  await expect(page.getByRole("button", { name: "Edit" })).toBeHidden();
  await expect(page.locator("#map")).toBeVisible();
  await expect(page.locator("#afternoonMap")).toBeVisible();

  await page.locator(".region-thumb").filter({ hasText: "Northern Zillertal Alps" }).click();
  await page.getByRole("button", { name: "Avalanche Problems" }).click();
  await page.getByRole("button", { name: "SLAB" }).click();
  await expect(page.locator("app-matrix-parameter").getByRole("img")).toHaveScreenshot("danger-high.png");
});

test("Edit bulletin", async ({ page }) => {
  await page.clock.setFixedTime(testDate);
  await page.reload();
  await changeRegion(page, "Tyrol");
  // TODO
});
