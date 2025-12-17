import { loginForecaster } from "./utils";
import { test, expect } from "@playwright/test";
import fs from "node:fs";
import path from "path";

test.beforeEach(async ({ page }) => {
  await page.goto("");
  await loginForecaster(page);
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

test("Education link", async ({ page }) => {
  await page.getByRole("button", { name: "Playwright" }).click();
  await page.getByRole("link", { name: "Education" }).click();
  const iframeURL = await page.locator("iframe").getAttribute("src");
  expect(iframeURL).toBe("https://admin.avalanche.report/education/");
});

test("Statistics", async ({ page }) => {
  await page.getByRole("button", { name: "Playwright" }).click();
  await page.getByRole("link", { name: "Statistics" }).click();

  await test.step("Avalanche Bulletins", async () => {
    await expect(page.getByRole("tab", { name: "Avalanche Bulletins" })).toBeVisible();
    await page.getByRole("textbox").fill("01/01/2025 - 01/08/2025");
    await page.locator('input[name="extended"]').check();
    await page.getByRole("button", { name: "Download" }).click();
    const downloadPromise = page.waitForEvent("download");
    const csvDownload = await downloadPromise;
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
  await test.step("Danger Sources", async () => {
    await page.getByRole("tab", { name: "Danger Sources" }).click();
    // click on footer to close download menu, which might be displayed on top of the textbox or button
    await page.locator(".card-footer").nth(1).click();
    await page.getByRole("textbox").fill("02/15/2025 - 02/20/2025");
    await page.getByRole("button", { name: "Download" }).click();
    const downloadPromise = page.waitForEvent("download");
    const csvDownload = await downloadPromise;
    expect(csvDownload.suggestedFilename()).toMatch("danger_source_statistic_2025-02-15_2025-02-20.csv");
    const downloadPath = path.join(
      __dirname,
      "../playwright/generated-data/csv/danger_source_statistic_2025-02-15_2025-02-20.csv",
    );
    await csvDownload.saveAs(downloadPath);
    // TODO order of danger signs changes between calls"
    // const originalCSV = fs.readFileSync(path.join(__dirname, "data/danger_source_statistic_2025-02-15_2025-02-20.csv"));
    // const downloadedCSV = fs.readFileSync(downloadPath);
    // expect(originalCSV).toEqual(downloadedCSV);
  });
});

test("User Settings", async ({ page }) => {
  await page.getByRole("button", { name: "Playwright" }).click();
  await page.getByRole("link", { name: "Settings" }).click();
  await expect(page.getByRole("main").getByRole("img")).toHaveScreenshot("avatar.png", { maxDiffPixelRatio: 0.1 });
  await page.getByRole("button", { name: "Update User" }).click();
  await expect(page.getByRole("button", { name: "Choose File" })).toBeEnabled();
  await expect(page.getByRole("textbox", { name: "Name", exact: true })).toBeEnabled();
  await expect(page.getByRole("textbox", { name: "Name", exact: true })).toHaveValue("Playwright");
  await expect(page.getByRole("textbox", { name: "Email", exact: true })).toBeDisabled();
  await expect(page.getByRole("textbox", { name: "Email", exact: true })).toHaveValue("playwright@avalanche.report");
  await expect(page.getByRole("textbox", { name: "Organization", exact: true })).toBeEnabled();
  await expect(page.getByRole("dialog").getByRole("button", { name: "Update user", exact: true })).toBeEnabled();
  await page.getByRole("button", { name: "Cancel" }).click();
  await page.getByRole("button", { name: "Change password" }).click();
  await page.getByRole("textbox", { name: "Current password" }).fill("test");
  await expect(page.getByRole("dialog").getByRole("button", { name: "Change password" })).toBeDisabled();
  await page.getByRole("textbox", { name: "New password" }).first().fill("test");
  await expect(page.getByText("Password has to be at least 8 characters")).toBeVisible();
  await page.getByRole("textbox", { name: "New password" }).nth(0).fill("testtest");
  await page.getByRole("textbox", { name: "New password" }).nth(1).fill("testtest");
  await page.getByRole("dialog").getByRole("button", { name: "Change password" }).click();
  await expect(page.getByText("Current password incorrect")).toBeVisible();
});
