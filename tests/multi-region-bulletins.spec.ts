import test, { expect } from "@playwright/test";

import { changeRegion, loginAdmin, loginForecaster } from "./utils";

const waitForGetEdit = (page) =>
  page.waitForResponse(
    (response) =>
      response.url().match(/\/api\/bulletins\/edit/) &&
      response.status() === 200 &&
      response.request().method() === "GET",
  );

test("Bulletin synchronization", async ({ browser }) => {
  const testDate = new Date("2024-12-21");
  const context1 = await browser.newContext();
  const page1 = await context1.newPage();
  const context2 = await browser.newContext();
  const page2 = await context2.newPage();

  await page1.clock.setFixedTime(testDate);
  await page1.goto("");
  await loginForecaster(page1);
  await changeRegion(page1, "Tyrol");

  await page2.clock.setFixedTime(testDate);
  await page2.goto("");
  await loginAdmin(page2);
  await changeRegion(page2, "Carinthia");

  await test.step("first delete all warning regions in Tyrol", async () => {
    await page1.getByRole("row", { name: "Monday, December 23, 2024" }).getByTitle("edit bulletin").click();
    await page2.getByRole("row", { name: "Monday, December 23, 2024" }).getByTitle("edit bulletin").click();
    const getBulletinsPromise = waitForGetEdit(page1);
    const bulletinResponse = await getBulletinsPromise;
    if ((await bulletinResponse.body()).length > 2) {
      await page1.getByTitle("[b]").click();
      await page1.getByRole("button", { name: "Delete all warning regions" }).click();
      const responsePromise = page1.waitForResponse(
        (response) =>
          response.url().match(/\/api\/bulletins/) &&
          response.status() === 200 &&
          response.request().method() === "DELETE",
      );
      await page1.getByRole("dialog").getByRole("button", { name: "Yes" }).click();
      await responsePromise;
    }
    await waitForGetEdit(page2);
    await expect(page2.getByText("Foreign regions (0)")).toBeVisible({ timeout: 7000 });
  });

  await test.step("add a warning region in Tyrol from browser1, check that it appears in browser2", async () => {
    await page1.getByRole("button", { name: "" }).click();
    const region = page1.locator("path.leaflet-interactive").nth(100);
    await region.click({ force: true });
    await page1.getByRole("button", { name: "Create region" }).click();
    await page1.waitForResponse(
      (response) =>
        response.url().match(/\/api\/bulletins/) && response.status() === 200 && response.request().method() === "PUT",
    );
    await expect(page1.locator(".region-thumb").first()).toContainText("Brandenberg Alps");
    await waitForGetEdit(page2);
    await expect(page2.getByText("Foreign regions (1)")).toBeVisible({ timeout: 7000 });
    await expect(page2.locator(".region-thumb").first()).toContainText("Brandenberg Alps");
  });
});
