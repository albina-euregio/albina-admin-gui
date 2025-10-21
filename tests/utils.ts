import { expect, Page } from "@playwright/test";

/**
 * Logs into the app using credentials from env vars
 */
export async function loginForecaster(page: Page) {
  const username = process.env.PLAYWRIGHT_USER;
  const password = process.env.PLAYWRIGHT_PASS;
  if (!username || !password) {
    throw new Error("PLAYWRIGHT_USER and PLAYWRIGHT_PASS must be set as environment variables!");
  }
  await login(page, username, password);
}

export async function login(page: Page, username: string, password: string) {
  await page.goto("");
  await page.getByRole("textbox", { name: /username/ }).fill(username);
  await page.getByRole("textbox", { name: /password/ }).fill(password);
  await page.getByRole("button", { name: /login/i }).click();
  await expect(page).toHaveURL("#/bulletins");
  await page.waitForTimeout(1000); // FIXME? better indicator of app being ready, some API call maybe
}

/**
 * Logs into the app using credentials from env vars
 */
export async function loginAdmin(page: Page) {
  const username = process.env.PLAYWRIGHT_ADMIN;
  const password = process.env.PLAYWRIGHT_ADMIN_PASS;
  if (!username || !password) {
    throw new Error("PLAYWRIGHT_ADMIN and PLAYWRIGHT_ADMIN_PASS must be set as environment variables!");
  }
  await login(page, username, password);
}

export async function changeRegion(page: Page, region: string) {
  await page.getByRole("button", { name: "Playwright" }).click();
  await page.locator(".dropdown-menu").getByRole("button", { name: region, exact: true }).click();
}
