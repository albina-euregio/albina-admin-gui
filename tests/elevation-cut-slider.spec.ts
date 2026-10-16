import { expect, test, type Page } from "@playwright/test";

import { captureClipboard, copiedLink, elevationFilter } from "./utils";

const upperRows = ["3200-4000", "3000-3200", "2800-3000", "2600-2800", "2400-2600", "2200-2400"];
const lowerRows = ["2000-2200", "1800-2000", "1600-1800", "1400-1600"];
const elevations = [1300, 1500, 2100, 2300, 2600];
const config = {
  date: "2026-04-05T00:00:00",
  dateStepSeconds: 86400,
  filters: [elevationFilter],
  sources: [{ name: "e2e", url: "e2e-cut/points.json", tooltipTemplate: "{elevation}" }],
};
const points = {
  type: "FeatureCollection",
  features: elevations.map((elevation, i) => ({
    type: "Feature",
    properties: { location: `P${elevation}` },
    geometry: { type: "Point", coordinates: [11.1 + i * 0.1, 47.3, elevation] },
  })),
};

/** The thumb of the slider with the given name. */
const thumb = (page: Page, name = "Elevation cut") => page.getByRole("slider", { name, exact: true });
/** The band button with the given name. */
const band = (page: Page, name: string) => page.getByRole("button", { name, exact: true });
/** The point markers on the map. */
const markers = (page: Page) => page.locator(".maplibregl-marker");
/** The page y of a stop of the slider whose host has the given box. */
const stopY = (host: { y: number; height: number }, stop: number) => host.y + 5 + (stop * (host.height - 5)) / 11 - 7;
/** The elevations of the point markers on the map, lowest first, read from their tooltips. */
const shown = (page: Page) =>
  markers(page).evaluateAll((els) =>
    els.map((el) => Number((el as HTMLElement & { tooltipHtml?: string }).tooltipHtml)).sort((a, b) => a - b),
  );

/** Opens the dashboard on the test config with the given link parameters and waits for every marker. */
async function openDashboard(page: Page, params = "") {
  await captureClipboard(page);
  await page.route("**/e2e-cut/awsome.json", (route) => route.fulfill({ json: config }));
  await page.route(/\/e2e-cut\/points\.json/, (route) => route.fulfill({ json: points }));
  await page.goto(`#/modelling/awsome?config=e2e-cut/awsome.json${params}`);
  await expect(page.getByRole("slider").first()).toBeVisible({ timeout: 15000 });
  await expect.poll(() => shown(page), { timeout: 15000 }).toEqual(elevations);
}

test("the thumb starts at the configured cut and ArrowUp moves it one row up, into the link, without a repaint", async ({
  page,
}) => {
  await openDashboard(page);
  await expect(thumb(page)).toHaveAttribute("aria-valuenow", "2200");
  await expect(thumb(page)).toHaveAttribute("aria-valuetext", "2200 m");
  await expect(thumb(page)).toHaveAttribute("aria-valuemin", "1400");
  await expect(thumb(page)).toHaveAttribute("aria-valuemax", "4000");
  expect((await copiedLink(page)).has("cut")).toBe(false);
  const requests: string[] = [];
  page.on("request", (request) => requests.push(request.url()));
  const marker = await markers(page).first().elementHandle();
  await thumb(page).focus();
  await page.keyboard.press("ArrowUp");
  await expect(thumb(page)).toHaveAttribute("aria-valuenow", "2400");
  await expect(thumb(page)).toContainText("24");
  expect((await copiedLink(page)).get("cut")).toBe("2400");
  expect(await marker.evaluate((el) => el.isConnected)).toBe(true);
  expect(requests.filter((url) => url.includes("/e2e-cut/"))).toEqual([]);
});

test("a click on a band selects its rows, a second click clears them and Shift adds the other band", async ({
  page,
}) => {
  await openDashboard(page);
  const below = band(page, "Select the elevations below 2200 m");
  const above = band(page, "Select the elevations above 2200 m");
  await expect(below).toHaveAttribute("aria-pressed", "false");
  await below.click();
  await expect.poll(() => shown(page)).toEqual([1500, 2100]);
  await expect(below).toHaveAttribute("aria-pressed", "true");
  await expect(above).toHaveAttribute("aria-pressed", "false");
  expect((await copiedLink(page)).get("filter.elevation")).toBe(lowerRows.join(","));
  await below.click();
  await expect.poll(() => shown(page)).toEqual(elevations);
  await expect(below).toHaveAttribute("aria-pressed", "false");
  await below.click();
  await above.click({ modifiers: ["Shift"] });
  await expect.poll(() => shown(page)).toEqual([1500, 2100, 2300, 2600]);
  await expect(below).toHaveAttribute("aria-pressed", "true");
  await expect(above).toHaveAttribute("aria-pressed", "true");
  expect((await copiedLink(page)).get("filter.elevation")?.split(",")).toHaveLength(10);
});

test("Ctrl (Cmd on Apple) on a band selects the other band plus the features without elevation", async ({ page }) => {
  await openDashboard(page);
  await band(page, "Select the elevations below 2200 m").click({ modifiers: ["ControlOrMeta"] });
  await expect.poll(() => shown(page)).toEqual([2300, 2600]);
  await expect(band(page, "Select the elevations above 2200 m")).toHaveAttribute("aria-pressed", "true");
  await expect(band(page, "Select the elevations below 2200 m")).toHaveAttribute("aria-pressed", "false");
  expect((await copiedLink(page)).get("filter.elevation")).toBe([...upperRows, "nan"].join(","));
});

test("a long press on a band highlights its rows instead of selecting them", async ({ page }) => {
  await openDashboard(page);
  const above = band(page, "Select the elevations above 2200 m");
  const box = await above.boundingBox();
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
  await page.mouse.down();
  await page.waitForTimeout(400);
  await page.mouse.up();
  const link = await copiedLink(page);
  expect(link.get("highlight.elevation")).toBe(upperRows.join(","));
  expect(link.has("filter.elevation")).toBe(false);
  await expect(above).toHaveClass(/highlighted/);
  await expect(above).toHaveAttribute("aria-pressed", "false");
});

test("Alt+Space on a focused band highlights its rows", async ({ page }) => {
  await openDashboard(page);
  await band(page, "Select the elevations below 2200 m").focus();
  await page.keyboard.press("Alt+Space");
  expect((await copiedLink(page)).get("highlight.elevation")).toBe(lowerRows.join(","));
});

test("Alt and Ctrl reach a band from the keyboard with Space only: Alt+Enter clicks nothing", async ({
  page,
  browserName,
}) => {
  test.skip(browserName !== "chromium", "measured in Chromium only");
  await openDashboard(page);
  await band(page, "Select the elevations below 2200 m").focus();
  await page.keyboard.press("Alt+Enter");
  await page.keyboard.press("ControlOrMeta+Enter");
  const link = await copiedLink(page);
  expect(link.has("highlight.elevation")).toBe(false);
  expect(link.has("filter.elevation")).toBe(false);
});

test("a pressed band follows its cut when the thumb is let go", async ({ page }) => {
  await openDashboard(page);
  await band(page, "Select the elevations below 2200 m").click();
  await expect.poll(() => shown(page)).toEqual([1500, 2100]);
  await thumb(page).focus();
  await page.keyboard.press("ArrowUp");
  await expect.poll(() => shown(page)).toEqual([1500, 2100, 2300]);
  await expect(band(page, "Select the elevations below 2400 m")).toHaveAttribute("aria-pressed", "true");
  const link = await copiedLink(page);
  expect(link.get("cut")).toBe("2400");
  expect(link.get("filter.elevation")?.split(",").sort()).toEqual(["2200-2400", ...lowerRows].sort());
});

test("a pressed band keeps its rows while its thumb visits an end of the slider", async ({ page }) => {
  await openDashboard(page);
  await band(page, "Select the elevations below 2200 m").click();
  await expect.poll(() => shown(page)).toEqual([1500, 2100]);
  await thumb(page).focus();
  await page.keyboard.press("Home");
  await expect(thumb(page)).toHaveAttribute("aria-valuenow", "1400");
  await expect(band(page, "Select the elevations between 1400 and 4000 m")).toHaveAttribute("aria-pressed", "false");
  await expect.poll(() => shown(page)).toEqual([1500, 2100]);
  const link = await copiedLink(page);
  expect(link.get("cut")).toBe("none");
  expect(link.get("filter.elevation")).toBe(lowerRows.join(","));
  await thumb(page).focus();
  await page.keyboard.press("PageUp");
  await page.keyboard.press("PageUp");
  await expect(thumb(page)).toHaveAttribute("aria-valuenow", "2200");
  await expect(band(page, "Select the elevations below 2200 m")).toHaveAttribute("aria-pressed", "true");
  await page.keyboard.press("End");
  await expect(thumb(page)).toHaveAttribute("aria-valuenow", "4000");
  await expect.poll(() => shown(page)).toEqual([1500, 2100]);
  expect((await copiedLink(page)).get("filter.elevation")).toBe(lowerRows.join(","));
});

test("a key pressed while the previous step is being committed still moves the thumb", async ({ page }) => {
  await openDashboard(page);
  await band(page, "Select the elevations below 2200 m").click();
  await thumb(page).evaluate(async (el) => {
    const key = (type: string) =>
      el.dispatchEvent(new KeyboardEvent(type, { key: "ArrowUp", bubbles: true, cancelable: true }));
    el.focus();
    key("keydown");
    key("keyup");
    key("keydown");
    await new Promise((resolve) => requestAnimationFrame(() => setTimeout(resolve)));
    key("keyup");
  });
  await expect(thumb(page)).toHaveAttribute("aria-valuenow", "2600");
  await expect.poll(() => shown(page)).toEqual([1500, 2100, 2300]);
  expect((await copiedLink(page)).get("cut")).toBe("2600");
});

test("Shift+ArrowRight on the thumb steps the date and leaves the cut", async ({ page }) => {
  await openDashboard(page);
  await thumb(page).focus();
  await page.keyboard.press("Shift+ArrowRight");
  await expect.poll(() => shown(page)).toEqual(elevations);
  const link = await copiedLink(page);
  expect(link.get("date")).toBe("2026-04-06T00:00:00");
  expect(link.has("cut")).toBe(false);
  await expect(thumb(page)).toHaveAttribute("aria-valuenow", "2200");
});

test("ArrowDown and PageDown on the thumb move the cut without scrolling the filter column", async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 600 });
  await openDashboard(page);
  const column = page.locator(".toolset-1");
  expect(await column.evaluate((el) => el.scrollHeight > el.clientHeight)).toBe(true);
  await thumb(page).focus();
  const scrollTop = await column.evaluate((el) => el.scrollTop);
  await page.keyboard.press("ArrowDown");
  await expect(thumb(page)).toHaveAttribute("aria-valuenow", "2000");
  await page.keyboard.press("PageDown");
  await expect(thumb(page)).toHaveAttribute("aria-valuenow", "1600");
  await page.keyboard.press("Home");
  await expect(thumb(page)).toHaveAttribute("aria-valuenow", "1400");
  expect(await column.evaluate((el) => el.scrollTop)).toBe(scrollTop);
});

test("a link cut snaps to the nearest row bound", async ({ page }) => {
  await openDashboard(page, "&cut=2150");
  await expect(thumb(page)).toHaveAttribute("aria-valuenow", "2200");
  expect((await copiedLink(page)).has("cut")).toBe(false);
});

test("an empty or malformed link cut is ignored", async ({ page }) => {
  await openDashboard(page, "&cut=");
  await expect(thumb(page)).toHaveAttribute("aria-valuenow", "2200");
  await page.goto("about:blank");
  await page.goto("#/modelling/awsome?config=e2e-cut/awsome.json&cut=22x0");
  await expect(thumb(page)).toHaveAttribute("aria-valuenow", "2200", { timeout: 15000 });
});

test("cut=none opens without a split: one band over every row, whose selection drops the points below them", async ({
  page,
}) => {
  await openDashboard(page, "&cut=none");
  await expect(thumb(page)).toHaveAttribute("aria-valuenow", "1400");
  await expect(thumb(page)).toHaveAttribute("aria-valuetext", "No split");
  await expect(page.locator(".elevation-cut-band")).toHaveCount(1);
  const every = band(page, "Select the elevations between 1400 and 4000 m");
  await expect(every).toBeVisible();
  await expect(page.locator(".elevation-cut-line")).toHaveCount(0);
  expect((await copiedLink(page)).get("cut")).toBe("none");
  await every.click();
  await expect.poll(() => shown(page)).toEqual([1500, 2100, 2300, 2600]);
  expect((await copiedLink(page)).get("filter.elevation")?.split(",")).toHaveLength(10);
});

test("a mouse drag puts the thumb on the row bound nearest the pointer", async ({ page }) => {
  await page.setViewportSize({ width: 1920, height: 1080 });
  await openDashboard(page);
  await thumb(page).scrollIntoViewIfNeeded();
  const host = await page.locator("app-elevation-cut").boundingBox();
  await page.mouse.move(host.x + 14, stopY(host, 6));
  await page.mouse.down();
  await page.mouse.move(host.x + 14, stopY(host, 3) + 8, { steps: 6 });
  await expect(thumb(page)).toHaveAttribute("aria-valuenow", "2800");
  await page.mouse.move(host.x + 40, stopY(host, 4) - 9, { steps: 3 });
  await expect(thumb(page)).toHaveAttribute("aria-valuenow", "2600");
  await page.mouse.up();
  await expect(thumb(page)).toHaveAttribute("aria-valuenow", "2600");
  expect((await copiedLink(page)).get("cut")).toBe("2600");
});

test("a thumb parked at the top end is grabbed anywhere on its pill", async ({ page }) => {
  await page.setViewportSize({ width: 1920, height: 1080 });
  await openDashboard(page);
  await thumb(page).scrollIntoViewIfNeeded();
  await thumb(page).focus();
  await page.keyboard.press("End");
  await expect(thumb(page)).toHaveAttribute("aria-valuenow", "4000");
  await expect(thumb(page)).toHaveAttribute("aria-valuetext", "No split");
  const host = await page.locator("app-elevation-cut").boundingBox();
  const pill = await page.locator(".elevation-cut-pill").boundingBox();
  await page.mouse.move(pill.x + pill.width / 2, pill.y + 3);
  await page.mouse.down();
  await page.mouse.move(host.x + 14, stopY(host, 6), { steps: 6 });
  await page.mouse.up();
  await expect(thumb(page)).toHaveAttribute("aria-valuenow", "2200");
});

test("two cuts from the link make three bands", async ({ page }) => {
  await openDashboard(page, "&cut=1800,2400");
  await expect(thumb(page, "Lower elevation cut")).toHaveAttribute("aria-valuenow", "1800");
  await expect(thumb(page, "Upper elevation cut")).toHaveAttribute("aria-valuenow", "2400");
  await expect(thumb(page, "Lower elevation cut")).toHaveAttribute("aria-valuemax", "2200");
  await expect(thumb(page, "Upper elevation cut")).toHaveAttribute("aria-valuemin", "2000");
  await expect(page.locator(".elevation-cut-band")).toHaveCount(3);
  await expect(page.locator(".elevation-cut-line")).toHaveCount(2);
  await band(page, "Select the elevations between 1800 and 2400 m").click();
  await expect.poll(() => shown(page)).toEqual([2100, 2300]);
  await expect(band(page, "Select the elevations below 1800 m")).toHaveAttribute("aria-pressed", "false");
  await expect(band(page, "Select the elevations above 2400 m")).toHaveAttribute("aria-pressed", "false");
  expect((await copiedLink(page)).get("cut")).toBe("1800,2400");
});
