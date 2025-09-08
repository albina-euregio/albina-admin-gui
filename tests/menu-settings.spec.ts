import { login } from "./utils/auth";
import { test, expect } from "@playwright/test";
import fs from "node:fs";
import path from "path";

test.beforeEach(async ({ page }) => {
  await page.goto("");
  await login(page);
});

test("change language setting", async ({ page }) => {
  await page.getByRole("button", { name: "EN" }).click();
  await expect(page.locator(".dropdown-menu").getByRole("listitem")).toHaveText([
    "Language",
    "German",
    "Italian",
    "English",
    "French",
    "Spanish",
    "Catalan",
    "Aranese",
  ]);
  await page.getByRole("button", { name: "German" }).click();
  await expect(page.getByRole("button", { name: "DE" })).toBeVisible();
  await expect(page.getByRole("link", { name: "Beobachtungen" })).toBeVisible();
});

test("menu options", async ({ page }) => {
  await test.step("Education", async () => {
    await page.getByRole("button", { name: "Playwright" }).click();
    await page.getByRole("link", { name: "Education" }).click();
    const iframeURL = await page.locator("iframe").getAttribute("src");
    expect(iframeURL).toBe("https://admin.avalanche.report/education/");
  });
  await test.step("Statistics", async () => {
    await page.getByRole("button", { name: "Playwright" }).click();
    await page.getByRole("link", { name: "Statistics" }).click();
    await expect(page.getByRole("tab", { name: "Avalanche Bulletins" })).toBeVisible();

    await page.getByRole("textbox").fill("01/01/2025 - 01/08/2025");
    await page.locator('input[name="extended"]').check();
    await page.getByRole("button", { name: "Download" }).click();
    const download1Promise = page.waitForEvent("download");
    const csvDownload = await download1Promise;
    expect(csvDownload.suggestedFilename()).toMatch("statistic_2025-01-01_2025-01-08_e_en.csv");
    const downloadPath = path.join(
      __dirname,
      "../playwright/generated-data/csv/statistic_2025-01-01_2025-01-08_e_en.csv",
    );
    await csvDownload.saveAs(downloadPath);
    const originalCSV = fs.readFileSync(path.join(__dirname, "data/statistic_2025-01-01_2025-01-08_e_en.csv"));
    const downloadedCSV = fs.readFileSync(downloadPath);
    expect(originalCSV).toEqual(downloadedCSV);
  });
});
