import { expect, Page } from "@playwright/test";

/**
 * Logs into the app using credentials from env vars
 */
export async function login(page: Page) {
  const username = process.env.PLAYWRIGHT_USER;
  const password = process.env.PLAYWRIGHT_PASS;
  if (!username || !password) {
    throw new Error("USERNAME and PASSWORD must be set as environment variables!");
  }
  await page.goto("");
  await page.getByRole("textbox", { name: /username/ }).fill(username);
  await page.getByRole("textbox", { name: /password/ }).fill(password);
  await page.getByRole("button", { name: /login/i }).click();
  await expect(page).toHaveURL("#/bulletins");
  await expect(page.getByRole("button", { name: "Stress Level" })).toBeVisible();
  await page.waitForTimeout(1000); // app seems to need some time to get correctly load and set regions
}

export async function changeRegion(page: Page, region: string) {
  await page.getByRole("button", { name: "Playwright" }).click();
  await page.locator(".dropdown-menu").getByRole("button", { name: region, exact: true }).click();
}
