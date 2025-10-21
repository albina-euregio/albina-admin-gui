import { changeRegion, loginForecaster } from "./utils";
import { test, expect } from "@playwright/test";

test("check all links in navbar", async ({ page }) => {
  await page.goto("");
  await loginForecaster(page);

  // Tyrol has all the fancy features enabled
  await changeRegion(page, "Tyrol");
  await test.step("Danger Sources", async () => {
    await page.getByRole("link", { name: "Danger Sources", exact: true }).click();
    await expect(page).toHaveURL(/danger-sources/);
    await expect(page.locator("th").filter({ hasText: "FORECAST" })).toBeVisible();
    await expect(page.locator("th").filter({ hasText: "ANALYSIS" })).toBeVisible();
  });
  await test.step("Observations", async () => {
    await page.getByRole("link", { name: "Observations", exact: true }).click();
    await expect(page).toHaveURL(/observations/);
    await expect(page.locator("#observationsMap")).toBeVisible();
    await expect(page.locator(".toolset")).toBeVisible();
    await expect
      .poll(() => page.locator(".leaflet-marker-pane").getByRole("button").count(), { timeout: 7000 })
      .toBeGreaterThan(3);
  });
  await test.step("GeoSphere", async () => {
    await page.getByRole("link", { name: "GeoSphere", exact: true }).click();
    await expect(page).toHaveURL(/modelling\/geosphere/);
    await expect(page.locator("#observationsMap")).toBeVisible();
  });
  await test.step("SNOWPACK", async () => {
    await page.getByRole("link", { name: "SNOWPACK", exact: true }).click();
    await expect(page).toHaveURL(/modelling\/snowpack/);
    await expect(page.locator("#observationsMap")).toBeVisible();
  });
  await test.step("AWSOME", async () => {
    await page.getByRole("link", { name: "AWSOME", exact: true }).click();
    await expect(page).toHaveURL(/modelling\/awsome/);
    await expect(page.locator("#observationsMap")).toBeVisible();
    await expect(page.locator(".toolset").first()).toBeVisible();
  });
  await test.step("Weatherbox", async () => {
    await page.getByRole("link", { name: "Weatherbox", exact: true }).click();
    await expect(page).toHaveURL(/modelling\/zamg-wbt/);
    await expect(page.getByRole("link", { name: "Wetterinformationsportal" })).toBeEnabled();
    const linkURL = await page.getByRole("link", { name: "Wetterinformationsportal" }).getAttribute("href");
    expect(linkURL).toBe("https://portal.tirol.gv.at/at.ac.zamg.wbt-p/");
  });
  await test.step("Avalanche.report", async () => {
    await page.getByRole("link", { name: "Avalanche.report", exact: true }).click();
    await expect(page).toHaveURL(/bulletins/);
    // more details are checked in bulletins.spec
  });
  await test.step("Carinthia only has bulletins and observations", async () => {
    await changeRegion(page, "Carinthia");
    await expect(page.getByRole("link", { name: "Avalanche.report", exact: true })).toBeVisible();
    await expect(page.getByRole("link", { name: "Observations", exact: true })).toBeVisible();
    await expect(page.getByRole("link", { name: "GeoSphere", exact: true })).toBeHidden();
    await expect(page.getByRole("link", { name: "SNOWPACK", exact: true })).toBeHidden();
    await expect(page.getByRole("link", { name: "AWSOME", exact: true })).toBeHidden();
    await expect(page.getByRole("link", { name: "Weatherbox", exact: true })).toBeHidden();
  });
});
