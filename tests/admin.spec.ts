import { loginAdmin } from "./utils";
import { test, expect } from "@playwright/test";

test.beforeEach(async ({ page }) => {
  await page.goto("");
  await loginAdmin(page);
  await page.getByRole("button", { name: "Playwright Admin" }).click();
  await page.locator(".dropdown-menu").getByRole("button", { name: "Admin", exact: true }).click();
});
