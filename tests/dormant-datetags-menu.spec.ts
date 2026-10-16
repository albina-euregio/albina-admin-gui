import { expect, test, type Page, type Route } from "@playwright/test";

const config = {
  date: "2026-04-05T00:00:00",
  dateStepSeconds: 86400,
  filters: [
    {
      type: "datetag",
      label: "Datetag",
      key: "snowpack.$stabilityIndex.instabilityDrivenBy",
      url: "api/locations",
      chartType: "bar",
      chartRichLabel: "label",
      values: ["2026-01-28", "new_snow", "2026-03-20", "shallow_old_snow", "2026-03-29"].map((value) => ({
        value,
        label: value,
        color: "#0078ff",
      })),
      dormantMenu: true,
    },
  ],
  sources: [],
};

const unreadable: Record<string, (route: Route) => unknown> = {
  torn: (route) => route.fulfill({ contentType: "application/json", body: '{"dormant_datetags": ["2026-03-20"' }),
  empty: (route) => route.fulfill({ contentType: "application/json", body: "" }),
  "the app shell": (route) => route.fulfill({ contentType: "text/html", body: "<!doctype html><app-root></app-root>" }),
  missing: (route) => route.fulfill({ status: 404, body: "Not Found" }),
  "never answered": () => undefined,
};

/** The Datetag chart of the dashboard. */
const datetagChart = (page: Page) => page.locator("app-observation-chart", { hasText: "Datetag" });

/** Opens the dashboard on the test config with the given dormant-list answer and returns the PUT bodies it sends. */
async function openDashboard(page: Page, answerDormantList: (route: Route) => unknown): Promise<string[]> {
  const puts: string[] = [];
  page.on("request", (request) => {
    if (request.method() === "PUT") puts.push(request.postData() ?? "");
  });
  await page.route("**/e2e-dormant/awsome.json", (route) => route.fulfill({ json: config }));
  await page.route("**/e2e-dormant/dormant_datetags.json", answerDormantList);
  await page.goto("#/modelling/awsome?config=e2e-dormant/awsome.json");
  await expect(datetagChart(page).locator(".obs-switch-item").first()).toBeVisible({ timeout: 15000 });
  return puts;
}

/** Opens the menu in the Datetag chart header. */
async function openMenu(page: Page) {
  await datetagChart(page).locator("app-dormant-datetags-menu").click();
  const menu = page.locator("bs-dropdown-container .dropdown-menu");
  await expect(menu).toBeVisible();
  return menu;
}

for (const [name, answer] of Object.entries(unreadable)) {
  test(`a dormant list that is ${name} offers no menu and sends no PUT`, async ({ page }) => {
    const puts = await openDashboard(page, answer);
    await expect(datetagChart(page).locator(".ph-tag")).toBeVisible();
    await expect(page.locator("app-dormant-datetags-menu")).toHaveCount(0);
    expect(puts).toEqual([]);
  });
}

test("the menu saves the pending dormant dates newest first and reopens on them", async ({ page }) => {
  let dormant = ["2026-03-20", "new_snow"];
  const puts = await openDashboard(page, (route) => route.fulfill({ json: { dormant_datetags: dormant } }));
  await page.route("**/api/dormant-datetags", (route) => {
    dormant = JSON.parse(route.request().postData() ?? "{}").dormant_datetags;
    return route.fulfill({ json: { dormant_datetags: dormant } });
  });

  let menu = await openMenu(page);
  await expect(menu.locator(".form-check")).toHaveText([
    "new_snow",
    "shallow_old_snow",
    "2026-03-29",
    "2026-03-20",
    "2026-01-28",
  ]);
  for (const category of ["new_snow", "shallow_old_snow"]) {
    await expect(menu.getByRole("checkbox", { name: category })).toBeChecked();
    await expect(menu.getByRole("checkbox", { name: category })).toBeDisabled();
  }
  await expect(menu.getByRole("checkbox", { name: "2026-03-20" })).not.toBeChecked();
  await expect(menu).toContainText("4 active, 4 visible in the chart");
  const save = menu.getByRole("button", { name: "Save and reload" });
  await expect(save).toBeDisabled();

  await menu.getByRole("checkbox", { name: "2026-03-29" }).uncheck();
  await expect(menu).toContainText("3 active, 3 visible in the chart");
  await page.keyboard.press("Escape");
  await expect(menu).toBeHidden();
  menu = await openMenu(page);
  await expect(menu.getByRole("checkbox", { name: "2026-03-29" })).not.toBeChecked();
  expect(puts).toEqual([]);

  await Promise.all([page.waitForEvent("load"), save.click()]);
  expect(puts).toEqual(['{"dormant_datetags":["2026-03-29","2026-03-20"]}']);
  expect(page.url()).toContain("config=e2e-dormant");
  menu = await openMenu(page);
  await expect(menu.getByRole("checkbox", { name: "2026-03-29" })).not.toBeChecked();
  await expect(menu.getByRole("checkbox", { name: "2026-03-20" })).not.toBeChecked();
  await expect(menu).toContainText("3 active, 3 visible in the chart");
});

test("a config in any dcfg/ folder saves through the api above that folder and rereads the list beside the config", async ({
  page,
}) => {
  let dormant = ["2026-03-20"];
  const puts: string[] = [];
  const reads: string[] = [];
  await page.route("**/e2e-dcfg/dcfg/awsome.other.json", (route) => route.fulfill({ json: config }));
  await page.route("**/dormant_datetags.json", (route) => {
    reads.push(route.request().url());
    return route.fulfill({ json: { dormant_datetags: dormant } });
  });
  await page.route("**/api/dormant-datetags", (route) => {
    puts.push(`${route.request().method()} ${route.request().url()}`);
    dormant = JSON.parse(route.request().postData() ?? "{}").dormant_datetags;
    return route.fulfill({ json: { dormant_datetags: dormant } });
  });
  await page.goto("#/modelling/awsome?config=e2e-dcfg/dcfg/awsome.other.json");
  let menu = await openMenu(page);
  await menu.getByRole("checkbox", { name: "2026-03-29" }).uncheck();
  await Promise.all([page.waitForEvent("load"), menu.getByRole("button", { name: "Save and reload" }).click()]);
  const folder = new URL("e2e-dcfg/", page.url());
  expect(puts).toEqual([`PUT ${new URL("api/dormant-datetags", folder)}`]);
  menu = await openMenu(page);
  await expect(menu.getByRole("checkbox", { name: "2026-03-29" })).not.toBeChecked();
  const list = new URL("dcfg/dormant_datetags.json", folder).toString();
  expect(reads).toEqual([list, list]);
});
