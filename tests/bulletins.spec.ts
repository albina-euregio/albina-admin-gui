import { changeRegion, login } from "./utils";
import { test, expect } from "@playwright/test";

test.beforeEach(async ({ page }) => {
  await page.goto("");
  await login(page);
});

test("Check visible neighbors", async ({ page }) => {
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
  await expect(page.locator("app-matrix-parameter").getByRole("img")).toHaveScreenshot("danger-high.png", {
    maxDiffPixelRatio: 0.1,
  });

  await test.step("Navigate to next/previous day", async () => {
    await page.getByRole("button", { name: "" }).click();
    await expect(page.getByRole("button", { name: "Glockner Group + 2" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Brandenberg Alps + 5" })).toBeVisible();
    // TODO assert map - right now colors in the map are not rendered in the Playwright browser window
    await page.getByTitle("[ctrl+right]").click();
    await expect(page.getByRole("button", { name: "Lechtal Alps East + 2" })).toBeVisible();
    await expect(page.locator("#afternoonMap")).toBeVisible();
  });

  await test.step("Foreign regions are visible", async () => {
    await expect(page.locator(".region-thumb").filter({ hasText: "Prealps + 3" })).toMatchAriaSnapshot(`
      - button "Prealps + 3"
      - button "Marta Pendesini"
      - img
      - text: / \\d+ m/
      - button ""
    `);
  });

  await test.step("External regions are visible", async () => {
    await page.locator("header").filter({ hasText: "GeoSphere (12)" }).getByRole("button").click();
    await expect(page.locator(".region-thumb").filter({ hasText: "Werdenfels Alps + 4" })).toMatchAriaSnapshot(`
      - button "Werdenfels Alps + 4"
      - button "Christoph Hummel"
      - img
      - text: / \\d+ m/
      - button ""
    `);
    await page.locator("header").filter({ hasText: "SLF (7)" }).getByRole("button").click();
    await expect(page.locator(".region-thumb").filter({ hasText: "Münstertal + 45" })).toMatchAriaSnapshot(`
      - button /Münstertal \\+ \\d+/
      - button
      - text: 
      - button "Incomplete"
      - button ""
    `);
  });
});

test("Edit bulletin", async ({ page }) => {
  test.slow();
  const testDate = new Date("2024-12-24");
  await page.clock.setFixedTime(testDate);
  await page.reload();
  await changeRegion(page, "Tyrol");
  await page.getByRole("cell", { name: "Wednesday, December 25, 2024" }).getByTitle("edit bulletin").click();
  await expect(page.locator(".badge").first()).toContainText("draft", { timeout: 7000 });
  await test.step("Delete all warning regions", async () => {
    await page.getByTitle("[b]").click();
    await page.getByRole("button", { name: "Delete all warning regions" }).click();
    await page.getByRole("dialog").getByRole("button", { name: "Yes" }).click();
  });
  const regionProblem = page.locator(".region-thumb").first();
  await test.step("Create new region", async () => {
    await page.getByRole("button", { name: "" }).click();
    const region = page.locator("path.leaflet-interactive").nth(100);
    // TODO assert hover tooltip
    await region.click({ force: true });
    await page.getByRole("button", { name: "Create region" }).click();
    await expect(regionProblem).toContainText("Brandenberg Alps");
  });
  await test.step("Create new problem", async () => {
    await page.getByTitle("New problem").click();
    await page.locator("app-avalanche-problem-detail").locator("app-avalanche-problem-icons").nth(1).click();
    await expect(page.getByRole("button", { name: "SLAB", exact: true })).toBeDisabled();
    await expect(page.getByRole("button", { name: "SLAB", exact: true })).toHaveClass(/btn-dark/);
    await page.locator("app-avalanche-problem-detail").getByRole("button", { name: "E", exact: true }).click();
    await page.locator("app-avalanche-problem-detail").getByRole("button", { name: "W", exact: true }).click();
    await page.getByRole("checkbox", { name: "Above" }).check();
    await page.locator("app-avalanche-problem-detail").getByTitle("Treeline").nth(1).click();
    await expect(regionProblem.getByTitle("Incomplete avalanche problem")).toBeVisible();
    const snowpackSlider = page.locator("app-slider").filter({ hasText: "Snowpack Stability" }).getByRole("slider");
    await expect(snowpackSlider).toHaveClass(/ng-pristine/);
    await expect(snowpackSlider).toHaveCSS("--form-range-thumb-bg", "lightgrey");
    await page.locator("app-slider").filter({ hasText: "Snowpack Stability" }).getByRole("slider").fill("53");
    await expect(snowpackSlider).not.toHaveClass(/ng-pristine/);
    await expect(snowpackSlider).toHaveCSS("--form-range-thumb-bg", "orange");
    await page.locator("app-slider").filter({ hasText: "Frequency" }).getByRole("slider").fill("36");
    await page.locator("app-slider").filter({ hasText: "Avalanche Size" }).getByRole("slider").fill("60");
    await expect(page.locator("app-matrix-parameter").getByRole("img")).toHaveAttribute(
      "src",
      /danger_rating_considerable/,
    );
    await expect(regionProblem.getByTitle("Incomplete avalanche problem")).toBeHidden();
    await expect(regionProblem.getByText("Treeline").first()).toBeVisible();
  });
  await test.step("undo/redo", async () => {
    // undoes the whole problem, since playwright clicks the problem parameters so fast
    await page.getByTitle("Undo").click();
    await expect(page.getByRole("tab", { name: /SLAB.*Treeline/ })).toBeHidden();
    await page.getByTitle("Redo").click();
    await expect(page.getByRole("tab", { name: /SLAB.*Treeline/ })).toBeVisible();
  });
  await test.step("daytime dependency", async () => {
    await page.getByTitle("Daytime dependency").click();
    await expect(page.getByRole("tab", { name: /SLAB.*Treeline/ })).toBeVisible();
    await page.getByRole("button", { name: /Avalanche problems Afternoon/ }).click();
    await expect(page.getByRole("tab", { name: /SLAB.*Treeline/ }).nth(1)).toBeVisible();
    await expect(page.locator("#afternoonMap")).toBeVisible();
    // TODO export JSON and compare
    await page.getByTitle("Daytime dependency").click();
    await page.getByRole("button", { name: "Later" }).click();
    await expect(page.locator("#afternoonMap")).toBeHidden();
    await expect(page.getByText("Forenoon")).toBeHidden();
  });
  await test.step("edit microregions", async () => {
    await page.getByTitle("Edit micro regions").click();
    await expect(page.getByText("Select regions on the map.")).toBeVisible();
    await page.locator("path.leaflet-interactive").nth(93).click({ force: true });
    await page.getByRole("button", { name: "Save changes" }).click();
    await expect(regionProblem).toContainText("Brandenberg Alps + 1");
  });
  await test.step("delete problem", async () => {
    await page.getByRole("button", { name: " Avalanche problems " }).click();
    await page
      .getByRole("tab", { name: /SLAB.*Treeline/ })
      .getByTitle("Delete")
      .click();
    await expect(page.getByRole("tab", { name: /SLAB.*Treeline/ })).toBeHidden();
  });
  await test.step("delete region", async () => {
    await page.getByTitle("Delete region [del]").click();
    await expect(page.getByText("Do you want to delete this region?")).toBeVisible();
    await page.getByRole("button", { name: "Yes" }).click();
    await expect(regionProblem).not.toContainText("Brandenberg");
  });
});

test("Copy foreign region", async ({ page }) => {
  const testDate = new Date("2025-01-10");
  await page.clock.setFixedTime(testDate);
  await page.reload();
  await changeRegion(page, "Tyrol");

  await page.getByRole("row", { name: "Saturday, January 11, 2025" }).getByRole("button").nth(1).click();
  await page.locator(".region-thumb").filter({ hasText: "Gröden" }).getByTitle("Copy region").click();
  await page.getByRole("row", { name: "Saturday, January 11, 2025 " }).getByRole("button").click();
  await expect(page.getByText("Copy warning region to another bulletin")).toBeHidden();
  await expect(page.getByText("Select regions on the map")).toBeVisible();
  await expect(page.getByRole("heading", { name: "Saturday, January 11," })).toBeVisible();
  await page.locator("path.leaflet-interactive").nth(93).click({ force: true });
  await page.locator("path.leaflet-interactive").nth(100).click({ force: true });
  const responsePromise = page.waitForResponse(
    (response) =>
      response.url().match(/\/api\/bulletins/) && response.status() === 200 && response.request().method() === "PUT",
  );
  await page.getByRole("button", { name: "Create region" }).click();
  await responsePromise;
  await page.reload();
  await expect(page.locator(".region-thumb").filter({ hasText: "Brandenberg Alps + 1" })).toMatchAriaSnapshot(`
    - button "Brandenberg Alps + 1"
    - button "Playwright"
    - img
    - img
    - button ""
    - button ""
  `);
  await page.locator(".region-thumb").filter({ hasText: "Brandenberg Alps + 1" }).getByTitle("Delete region").click();
  await page.getByRole("button", { name: "Yes" }).click();
});

test("Bulletin synchronization", async ({ page }) => {
  // TODO edit bulletin in browser 1, check that changes are visible in browser 2
});

// TODO? assign different days to the different browsers, so they won't interfere with each other
// -> right now the tests are not run in parallel on CI, so no interference anyway
test("Load bulletin from the day before", async ({ page }) => {
  test.slow();
  const testDate = new Date("2024-12-21");
  await page.clock.setFixedTime(testDate);
  await page.reload();
  await changeRegion(page, "Tyrol");
  await test.step("load into empty bulletin", async () => {
    await page.getByRole("row", { name: "Sunday, December 22, 2024" }).getByTitle("edit bulletin").click();
    await expect(page.locator(".badge").first()).toContainText(/missing|draft/, { timeout: 7000 });

    await test.step("Delete all warning regions", async () => {
      await page.getByTitle("[b]").click();
      await page.getByRole("button", { name: "Delete all warning regions" }).click();
      const responsePromise = page.waitForResponse(
        (response) =>
          response.url().match(/\/api\/bulletins/) &&
          response.status() === 200 &&
          response.request().method() === "DELETE",
      );
      await page.getByRole("dialog").getByRole("button", { name: "Yes" }).click();
      await responsePromise;
    });
    await test.step("Load from the day before", async () => {
      await page.getByTitle("[b]").click();
      await page.getByRole("button", { name: "Load bulletin from the day before" }).click();
      const responsePromise = page.waitForResponse(
        (response) =>
          response.url().match(/\/api\/bulletins/) &&
          response.status() === 200 &&
          response.request().method() === "POST",
      );
      await page.getByRole("dialog").getByRole("button", { name: "Yes" }).click();
      await responsePromise;
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
    const responsePromise = page.waitForResponse(
      (response) =>
        response.url().match(/\/api\/bulletins/) && response.status() === 200 && response.request().method() === "POST",
    );
    await page.getByRole("dialog").getByRole("button", { name: "Yes" }).click();
    await responsePromise;
    await expect(page.locator(".badge").first()).toContainText("draft");
    await expect(page.getByRole("heading", { name: "Tyrol (4)" })).toBeVisible();
    await expect(page.locator(".region-thumb")).toContainText([
      "Northern Zillertal Alps",
      "Brandenberg Alps + 5",
      "Lechtal Alps West + 3",
      "Kitzbühel Alps Wildseeloder + 2",
    ]);
  });
  // TODO: Find out why we often get an error after running the second load from yesterday block.
  // await test.step("Delete all warning regions", async () => {
  //   await page.getByTitle("[b]").click();
  //   await page.getByRole("button", { name: "Delete all warning regions" }).click();
  //   await page.getByRole("dialog").getByRole("button", { name: "Yes" }).click();
  //   await page.reload();
  //   await expect(page.locator(".region-thumb")).not.toBeVisible();
  //   await expect(page.locator(".badge").first()).toContainText("missing");
  // });
});
