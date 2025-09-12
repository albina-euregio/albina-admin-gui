import { changeRegion, login } from "./utils";
import { test, expect } from "@playwright/test";

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
  const testDate = new Date("2024-12-24");
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

  test.step("Navigate to next/previous day", async () => {
    // TODO
  });
});

test("Edit bulletin", async ({ page }) => {
  const testDate = new Date("2024-12-24");
  await page.clock.setFixedTime(testDate);
  await page.reload();
  await changeRegion(page, "Tyrol");
  // TODO
});

// TODO assign different days to the different browsers, so they won't interfere with each other
test("Load bulletin from the day before", async ({ page }) => {
  const testDate = new Date("2024-12-21");
  await page.clock.setFixedTime(testDate);
  await page.reload();
  await changeRegion(page, "Tyrol");
  await test.step("load into empty bulletin", async () => {
    await page.getByRole("row", { name: "Sunday, December 22, 2024" }).getByTitle("edit bulletin").click();

    await test.step("Delete all warning regions", async () => {
      await page.getByTitle("[b]").click();
      await page.getByRole("button", { name: "Delete all warning regions" }).click();
      await page.getByRole("dialog").getByRole("button", { name: "Yes" }).click();
    });
    await test.step("Load from the day before", async () => {
      await page.getByTitle("[b]").click();
      await page.getByRole("button", { name: "Load bulletin from the day before" }).click();
      await page.getByRole("dialog").getByRole("button", { name: "Yes" }).click();
      await expect(page.locator(".badge").first()).toContainText("draft");
      await expect(page.getByRole("heading", { name: "Tyrol (4)" })).toBeVisible();
      await expect(page.locator(".region-thumb")).toContainText([
        "Northern Zillertal Alps",
        "Brandenberg Alps + 5",
        "Lechtal Alps West + 3",
        "Kitzbühel Alps Wildseeloder + 2",
      ]);
    });
  });
  await test.step("Load into existing bulletin", async () => {
    await page.getByTitle("[b]").click();
    await page.getByRole("button", { name: "Load bulletin from the day before" }).click();
    await page.getByRole("dialog").getByRole("button", { name: "Yes" }).click();
    await expect(page.locator(".badge").first()).toContainText("draft");
    await expect(page.getByRole("heading", { name: "Tyrol (4)" })).toBeVisible();
    await expect(page.locator(".region-thumb")).toContainText([
      "Northern Zillertal Alps",
      "Brandenberg Alps + 5",
      "Lechtal Alps West + 3",
      "Kitzbühel Alps Wildseeloder + 2",
    ]);
  });
  await test.step("Delete all warning regions", async () => {
    await page.getByTitle("[b]").click();
    await page.getByRole("button", { name: "Delete all warning regions" }).click();
    await page.getByRole("dialog").getByRole("button", { name: "Yes" }).click();
    await page.reload();
    await expect(page.locator(".region-thumb")).not.toBeVisible();
    await expect(page.locator(".badge").first()).toContainText("missing");
  });
});
