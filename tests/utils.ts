import { expect, Page } from "@playwright/test";

/**
 * Clicks a micro-region on the canvas-rendered bulletin map (#map).
 *
 * MapLibre draws regions on a WebGL canvas, so there are no per-region DOM nodes to click
 * (as with Leaflet's `path.leaflet-interactive`). Instead we project the region geometry to a
 * canvas pixel and click there. Requires the AM map exposed as `window.__albinaMap` (dev/e2e
 * builds) and the edit-selection layer visible (i.e. region-editing mode is active).
 *
 * Pass a region by `name` (e.g. "Brandenberg Alps") or id.
 */
export async function clickRegion(page: Page, region: string) {
  const pos = await page.evaluate((target) => {
    const map = (window as unknown as { __albinaMap?: any }).__albinaMap;
    if (!map) throw new Error("window.__albinaMap is not exposed (non-production build only)");
    const canvas = map.getCanvas() as HTMLCanvasElement;
    const w = canvas.clientWidth;
    const h = canvas.clientHeight;
    const margin = 8; // keep clicks off the canvas edge
    const fc = (map.getSource("edit-selection") as any).serialize().data;

    const matches = (f: any) =>
      typeof target === "string" ? f.properties.name === target || f.properties.id === target : true;

    // Interior candidates: centroid, then midpoints from centroid to each vertex
    // (avoids region borders, which project to ambiguous/edge pixels).
    const interiorPixel = (feature: any): { x: number; y: number } | null => {
      const pts: number[][] = [];
      const walk = (c: any) => (Array.isArray(c[0]) ? c.forEach(walk) : pts.push(c));
      walk(feature.geometry.coordinates);
      const cx = pts.reduce((s, c) => s + c[0], 0) / pts.length;
      const cy = pts.reduce((s, c) => s + c[1], 0) / pts.length;
      const candidates = [[cx, cy], ...pts.map((v) => [(cx + v[0]) / 2, (cy + v[1]) / 2])];
      for (const ll of candidates) {
        const p = map.project(ll as [number, number]);
        if (p.x < margin || p.y < margin || p.x > w - margin || p.y > h - margin) continue;
        const hit = map
          .queryRenderedFeatures(p, { layers: ["edit-selection-fill"] })
          .some((h: any) => h.properties.id === feature.properties.id);
        if (hit) return { x: Math.round(p.x), y: Math.round(p.y) };
      }
      return null;
    };

    for (const feature of fc.features) {
      if (!matches(feature)) continue;
      const pixel = interiorPixel(feature);
      if (pixel) return pixel;
    }
    return null;
  }, region);

  if (!pos) throw new Error(`clickRegion: could not find a clickable interior point for ${JSON.stringify(region)}`);
  // Click via absolute page coords (canvas maps: bypasses element-relative hit-testing).
  const box = await page.locator("#map canvas.maplibregl-canvas").boundingBox();
  if (!box) throw new Error("clickRegion: #map canvas not found");
  await page.mouse.click(box.x + pos.x, box.y + pos.y);
}

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
  const authResponsePromise = page.waitForResponse(
    (response) =>
      response.url().match(/\/api\/authentication/) &&
      response.status() === 200 &&
      response.request().method() === "POST",
  );
  // wait for login to geosphere api
  const externalResponsePromise = page.waitForResponse(
    (response) =>
      response.url().match("admin.lawinen-warnung.eu") &&
      response.status() === 200 &&
      response.request().method() === "POST",
  );
  await Promise.all([authResponsePromise, externalResponsePromise]);
  await expect(page).toHaveURL("#/bulletins");
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
  await page
    .locator(".dropdown-menu")
    .getByRole("button", { name: new RegExp(`^${region}`, "i") })
    .click();
}

export const waitForGetEdit = (page: Page) =>
  page.waitForResponse(
    (response) =>
      response.url().match(/\/api\/bulletins\/edit/) &&
      response.url().includes("regions=PLAYWRIGHT") &&
      response.status() === 200 &&
      response.request().method() === "GET",
  );

/**
 * To be used as a substitute for the "Clear all warning regions" button in the UI, which is only visible to admins.
 * @param page
 */
export async function clearWarningRegions(page: Page) {
  const deleteRegionButton = page.getByTitle("Delete region").first();

  while (await deleteRegionButton.isVisible()) {
    await deleteRegionButton.click();
    await expect(page.getByText("Do you want to delete this region?")).toBeVisible();

    const responsePromise = page.waitForResponse(
      (response) =>
        response.url().match(/\/api\/bulletins/) &&
        response.status() === 200 &&
        response.request().method() === "DELETE",
    );

    await page.getByRole("button", { name: "Yes" }).click();
    await responsePromise;
  }
}

/**
 * Sets a fixed time for both the legacy Date API and the Temporal API.
 * This should be used instead of `page.clock.setFixedTime()` when the app uses Temporal.
 *
 * @param page - Playwright page object
 * @param date - The date to set as the fixed time
 *
 * @example
 * ```ts
 * const date = new Date(2024, 5, 11);
 * await setFixedTime(page, date);
 * await page.reload();
 * ```
 */
export async function setFixedTime(page: Page, date: Date | string | number): Promise<void> {
  const epochMs = new Date(date).getTime();

  await page.addInitScript((epochMs: number) => {
    // Mock Date.now() and new Date()
    const OriginalDate = globalThis.Date;
    Date.now = () => epochMs;
    (globalThis as any).Date = Object.assign(
      function (...args: unknown[]) {
        if (args.length === 0) {
          return new OriginalDate(epochMs);
        }
        // @ts-expect-error - Date constructor has complex overloads
        return new OriginalDate(...args);
      },
      {
        now: () => epochMs,
        parse: OriginalDate.parse,
        UTC: OriginalDate.UTC,
        prototype: OriginalDate.prototype,
      },
    );

    // Mock Temporal.Now if available
    const T = (globalThis as any).Temporal;
    if (T) {
      const originalTimeZoneId = T.Now.timeZoneId();
      const instant = () => T.Instant.fromEpochMilliseconds(epochMs);
      const tz = (t?: string) => t ?? originalTimeZoneId;

      Object.defineProperty(T, "Now", {
        value: {
          instant,
          timeZoneId: () => originalTimeZoneId,
          zonedDateTimeISO: (t?: string) => instant().toZonedDateTimeISO(tz(t)),
          zonedDateTime: (cal: string, t?: string) => instant().toZonedDateTime({ timeZone: tz(t), calendar: cal }),
          plainDateTimeISO: (t?: string) => instant().toZonedDateTimeISO(tz(t)).toPlainDateTime(),
          plainDateTime: (cal: string, t?: string) =>
            instant()
              .toZonedDateTime({ timeZone: tz(t), calendar: cal })
              .toPlainDateTime(),
          plainDateISO: (t?: string) => instant().toZonedDateTimeISO(tz(t)).toPlainDate(),
          plainDate: (cal: string, t?: string) =>
            instant()
              .toZonedDateTime({ timeZone: tz(t), calendar: cal })
              .toPlainDate(),
          plainTimeISO: (t?: string) => instant().toZonedDateTimeISO(tz(t)).toPlainTime(),
        },
        configurable: true,
      });
    }
  }, epochMs);
}
