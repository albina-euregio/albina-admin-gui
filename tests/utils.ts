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
