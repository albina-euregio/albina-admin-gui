import { loginForecaster } from "./utils";
import { test, expect } from "@playwright/test";

test("login", async ({ page }) => {
  await page.goto("");

  await test.step("version numbers and open source licenses are visible", async () => {
    await expect(page.getByRole("link", { name: "albina-admin-gui@" })).toBeVisible();
    await expect(page.getByRole("link", { name: "albina-server@" })).toBeVisible();
    await page.getByText("Open-source Licenses").click();
    await expect.poll(() => page.getByRole("link", { name: "angular" }).count()).toBeGreaterThan(1);
  });
  await test.step("login is possible", async () => {
    await loginForecaster(page);
    await expect(page).toHaveURL("#/bulletins");
    await expect(page.getByRole("button", { name: "Stress Level" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Tyrol", exact: true })).toBeVisible();
  });
  await test.step("logout", async () => {
    await page.getByRole("button", { name: "Playwright" }).click();
    await page.getByRole("link", { name: "Logout" }).click();
    await expect(page).toHaveURL("#/pages/login");
    await expect(page.getByRole("button", { name: "Login" })).toBeVisible();
  });
});
