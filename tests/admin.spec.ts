import { loginAdmin } from "./utils";
import { test, expect } from "@playwright/test";

/**
 * There are no tests where new regions, servers, users are created right now.
 * It is only checked whether the settings are visible and editable.
 * Once we have a way of operating in a more isolated environment, we can also create new stuff.
 */

test.beforeEach(async ({ page }) => {
  await page.goto("");
  await loginAdmin(page);
  await page.getByRole("button", { name: "Playwright Admin" }).click();
  await page.locator(".dropdown-menu").getByRole("link", { name: "Admin" }).click();
});

test("Server settings", async ({ page }) => {
  await page.getByRole("tab", { name: "Server", exact: true }).click();
  await page.getByRole("tab", { name: "AINEVA" }).click();
  await expect(page.locator("app-servers-configuration")).toMatchAriaSnapshot({ name: "ServerSettings.aria.yaml" });
  await page.getByRole("button", { name: "Create Server" }).click();
  // close AINEVA tab
  await page
    .getByRole("tab")
    .filter({ hasText: /AINEVA/ })
    .click();
  // open tab for new server
  await page.getByRole("tab").filter({ hasText: /^$/ }).click();
  await page.getByRole("row", { name: "Name" }).first().getByRole("textbox").fill("Test");
  await expect(page.getByRole("tab", { name: "Test" })).toBeVisible();
  await page.getByRole("row", { name: "Username", exact: true }).getByRole("textbox").fill("test");
  await page.getByRole("row", { name: "Password", exact: true }).getByRole("textbox").fill("1234");
  await page.getByRole("row", { name: "API URL", exact: true }).getByRole("textbox").fill("test");

  await expect(page.getByText("✖ Invalid URL")).toBeVisible();
});

test("Region settings", async ({ page }) => {
  await test.step("Check general settings for Tyrol", async () => {
    await page.getByRole("tab", { name: "Region", exact: true }).click();
    await page.getByRole("tab", { name: "Tyrol (AT-07)" }).click();
    await expect(page.locator("accordion-group").filter({ hasText: "Tyrol (AT-07)" })).toMatchAriaSnapshot({
      name: "RegionSettings.aria.yaml",
    });
  });
  await test.step("Change stress level configuration for PLAYWRIGHT", async () => {
    await page.getByRole("button", { name: "PLAYWRIGHT (PLAYWRIGHT)" }).click();
    const regionConfig = page.locator("accordion-group").filter({ hasText: "PLAYWRIGHT (PLAYWRIGHT)" });
    await regionConfig.getByRole("tab", { name: "Configuration", exact: true }).click();
    await expect(
      regionConfig.getByRole("row", { name: "Enable stress level" }).getByRole("checkbox"),
    ).not.toBeChecked();
    await regionConfig.getByRole("row", { name: "Enable stress level" }).getByRole("checkbox").check();
    await regionConfig.getByRole("button", { name: "Save" }).click();
    await expect(page.getByRole("alert")).toHaveText("Configuration successfully saved");
    await page.reload();
    await page.getByRole("tab", { name: "Region", exact: true }).click();
    await page.getByRole("button", { name: "PLAYWRIGHT (PLAYWRIGHT)" }).click();
    await regionConfig.getByRole("tab", { name: "Configuration", exact: true }).click();
    await expect(regionConfig.getByRole("row", { name: "Enable stress level" }).getByRole("checkbox")).toBeChecked();
    await regionConfig.getByRole("row", { name: "Enable stress level" }).getByRole("checkbox").uncheck();
    await regionConfig.getByRole("button", { name: "Save" }).click();
    await expect(page.getByRole("alert")).toHaveText("Configuration successfully saved");
  });
});

test("User settings", async ({ page }) => {
  await page.getByRole("tab", { name: "Users", exact: true }).click();
  await expect(page.getByRole("row", { name: "playwright@avalanche.report" })).toMatchAriaSnapshot(`
    - row:
      - cell:
        - img
      - cell "Playwright"
      - cell "playwright@avalanche.report"
      - cell "Playwright"
      - cell "IT-32-BZ,AT-02,AT-07,PLAYWRIGHT"
      - cell "FORECASTER"
  `);
  await page.getByRole("row", { name: "playwright.test@avalanche.report" }).getByTitle("Edit").click();
  await expect(page.getByRole("checkbox", { name: "Observer" })).toBeChecked();
  await expect(page.getByRole("checkbox", { name: "Tyrol (AT-07)" })).toBeChecked();
  await expect(page.getByRole("checkbox", { name: "Carinthia" })).not.toBeChecked();
  await page.getByRole("checkbox", { name: "Carinthia" }).check();
  await page.getByRole("button", { name: "Update user" }).click();
  await expect(page.getByRole("alert")).toHaveText("User saved");
  await page.getByRole("row", { name: "playwright.test@avalanche.report" }).getByTitle("Edit").click();
  await expect(page.getByRole("checkbox", { name: "Carinthia" })).toBeChecked();
  await page.getByRole("checkbox", { name: "Carinthia" }).uncheck();
  await page.getByRole("button", { name: "Update user" }).click();
  await expect(page.getByRole("alert")).toHaveText("User saved");
});
