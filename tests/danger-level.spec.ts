import { expect, type Locator, test, type Page } from "@playwright/test";

import { DangerLevelSchema } from "../src/app/modelling/awsome.config";
import { levelColor } from "../src/app/modelling/danger-paint";
import { DAY_LABEL_GAP } from "../src/app/modelling/danger-series.component";
import { readSteps } from "../src/app/modelling/eaws-reading";
import { captureClipboard, copiedLink, elevationFilter } from "./utils";

const datetags = ["2026-03-25", "2026-02-12"];
const filters = [
  elevationFilter,
  {
    type: "Punstable",
    label: "Punstable",
    key: "snowpack.Punstable.value",
    chartType: "bar",
    chartRichLabel: "label",
    default: "classify",
    stabilityIndex: "dry",
    chartAxisRange: [0, 1],
    values: [
      { value: ">=0.85", numericRange: [0.85, 1.0], color: "#d7191c", label: ">0.85" },
      { value: ">=0.78", numericRange: [0.78, 0.85], color: "#fdae61", label: ">0.78" },
      { value: "<0.78", numericRange: [0.7, 0.78], color: "#ffffbf", label: "<0.78" },
      { value: "<0.7", numericRange: [0, 0.7], color: "#a6d96a", label: "<0.7" },
    ],
  },
  {
    type: "size_estimate",
    label: "Size",
    key: "snowpack.$stabilityIndex.size_estimate",
    chartType: "bar",
    chartRichLabel: "label",
    chartAxisRange: [0, 5],
    values: [1, 2, 3, 4, 5].map((size) => ({
      value: String(size),
      numericRange: [size - 0.5, size + 0.5],
      label: String(size),
      color: "#ffde00",
    })),
  },
  {
    type: "grainType",
    label: "Grain type",
    key: "snowpack.$stabilityIndex.grainType",
    chartType: "bar",
    chartRichLabel: "label",
    hidden: true,
    values: ["SH", "FC"].map((value) => ({ value, label: value, color: "#888888" })),
  },
  {
    type: "datetag",
    label: "Datetag",
    key: "snowpack.$stabilityIndex.instabilityDrivenBy",
    url: "e2e-danger/api/locations",
    chartType: "bar",
    chartRichLabel: "label",
    values: datetags.map((value) => ({ value, label: value, color: "#0078ff" })),
  },
];
const config = {
  date: "2026-04-05T00:00:00",
  dateStepSeconds: 86400,
  filters,
  sources: [{ name: "e2e", url: "e2e-danger/points.json", tooltipTemplate: "{location}" }],
  timeseriesChart: { url: "e2e-danger/api/timeseries" },
  dangerLevel: { frequencyBounds: { few: 0, some: 0.04, many: 0.2 } },
};
const timeseries = {
  timestamps: ["2026-04-04T00:00:00", "2026-04-05T00:00:00"],
  indexes: {
    Punstable: { depth: [10, 12], size_estimate: [2, 2.1], lower: [0.4, 0.4], mean: [0.5, 0.55], upper: [0.6, 0.6] },
  },
};
const seriesDays = ["2026-04-01", "2026-04-02", "2026-04-03", "2026-04-04", "2026-04-05", "2026-04-06"];
const lowerCounts = [
  [0, 0, 0, 1, 0, 0],
  [0, 3, 0, 0, 0, 0],
  [0, 2, 0, 1, 0, 1],
  [10, 5, 0, 8, 10, 2],
];
const lowerSizes = [
  [null, null, null, 3, null, null],
  [null, 2.4, null, null, null, null],
  [null, 1, null, 1, null, 1],
  [1, 1, null, 1, 1, 1],
];
const upperCounts = [
  [3, 0, 2, 1, 1, 0],
  [0, 0, 1, 0, 0, 0],
  [0, 4, 0, 0, 0, 0],
  [7, 6, 7, 9, 9, 12],
];
const upperSizes = [
  [3.1, null, 5, null, 4.2, null],
  [null, null, 2, null, null, null],
  [null, 1.2, null, null, null, null],
  [1, 1, 1, 1, 1, 1],
];
/** The danger level series of the API for bands split at the cuts: the lower counts below, the given ones above. */
const seriesAnswer = (cuts: readonly number[] = [2200], upper = upperCounts, sizes = upperSizes) => {
  const edges = [null, ...cuts, null];
  const counts = cuts.length ? [lowerCounts, ...cuts.slice(1).map(() => upperCounts), upper] : [upper];
  const bandSizes = cuts.length ? [lowerSizes, ...cuts.slice(1).map(() => upperSizes), sizes] : [sizes];
  return {
    timestamps: seriesDays.map((day) => `${day}T00:00:00`),
    indexes: {
      Punstable: {
        ...mapIndex(seriesDays.length),
        classes: {
          bounds: [0.85, 0.78, 0.7],
          cuts,
          percentile: 90,
          population: "compass",
          bands: counts.map((count, b) => ({
            from: edges[b],
            to: edges[b + 1],
            count,
            total: total(count),
            size: bandSizes[b],
          })),
        },
      },
    },
    applied: ["region", "elevation", "aspect", "datetag"],
    population: "compass",
  };
};
/** The index statistics of a timeseries answer, flat over the steps. */
function mapIndex(steps: number) {
  const flat = Array.from({ length: steps }, () => 0.5);
  return { depth: flat, size_estimate: flat, lower: flat, mean: flat, upper: flat };
}
/** The classed points per step of class counts. */
function total(counts: number[][]): number[] {
  return counts[0].map((_, t) => counts.reduce((sum, row) => sum + row[t], 0));
}
/** The levels the strip must show for the bands' counts and sizes, read step by step with the matrix. */
function expectedLevels(bands: [number[][], (number | null)[][]][]): (number | undefined)[][] {
  const calibration = DangerLevelSchema.parse(config.dangerLevel);
  return bands.map(([count, size]) => readSteps(count, size, calibration).map((reading) => reading.levels?.[0]));
}
/** The background colour a cell shows for a level, transparent without one. */
function cellColor(level: number | undefined): string {
  if (!level) return "rgba(0, 0, 0, 0)";
  const [red, green, blue] = [1, 3, 5].map((at) => parseInt(levelColor(level).slice(at, at + 2), 16));
  return `rgb(${red}, ${green}, ${blue})`;
}

/** A point slope at an elevation whose Punstable reads value with size, north facing unless told otherwise. */
const slope = (location: string, elevation: number, value: number, size: number, aspect = ["N"]) => ({
  type: "Feature",
  properties: {
    location,
    region_id: "AT-07-01",
    aspect,
    snowpack: {
      hs: 120,
      Punstable: { value, size_estimate: size, grainType: "SH", instabilityDrivenBy: datetags[0] },
    },
  },
  geometry: {
    type: "Point",
    coordinates: [10.5 + 0.05 * Number(location.slice(1)), { U: 47.3, L: 47.1 }[location[0]] ?? 47.2, elevation],
  },
});
/** Ten slopes in a band: the first very poor with size 4.2 when unstable, the rest good. */
const band = (prefix: string, elevation: number, unstable: boolean) =>
  Array.from({ length: 10 }, (_, i) =>
    unstable && i === 0 ? slope(`${prefix}${i}`, elevation, 0.9, 4.2) : slope(`${prefix}${i}`, elevation, 0.5, 1),
  );
const highAboveLowBelow = {
  type: "FeatureCollection",
  features: [...band("U", 2500, true), ...band("L", 1800, false), slope("F0", 2500, 0.6, 1, ["F"])],
};
const sameCell = { type: "FeatureCollection", features: [...band("U", 2500, true), ...band("L", 1800, true)] };
const manyVeryPoor = {
  type: "FeatureCollection",
  features: [
    ...Array.from({ length: 10 }, (_, i) => slope(`U${i}`, 2500, i < 3 ? 0.9 : 0.5, i < 3 ? 4.2 : 1)),
    ...band("L", 1800, false),
  ],
};

/** The danger level button in the global bar. */
const toggle = (page: Page) => page.locator("button.danger-level-toggle");
/** The danger level panel. */
const panel = (page: Page) => page.locator("app-danger-level");
/** The band lines of the panel, highest band first. */
const bandLines = (page: Page) => panel(page).locator(".danger-level-band");
/** The chip row of the panel: the chips that offer an action and the warnings on the series. */
const chips = (page: Page) => panel(page).locator(".danger-level-chips");
/** The y and height of the filled band of each elevation icon inside a locator, as "y+height". */
const filledBands = (icons: Locator) =>
  icons.evaluateAll((svgs) =>
    svgs.map((svg) => {
      const rect = svg.querySelector("rect");
      return `${rect.getAttribute("y")}+${rect.getAttribute("height")}`;
    }),
  );

/** The series column of the panel: the time axis and one row of level cells per band. */
const strip = (page: Page) => panel(page).locator(".danger-level-strip");
/** The series rows of the panel, top band first. */
const seriesRows = (page: Page) => panel(page).locator("app-danger-series");
/** The cell of a step in every series row, top band first. */
const stepCells = (page: Page, step: number) => seriesRows(page).locator(`.danger-series-cell:nth-child(${step + 1})`);
/** Asserts the colour of every cell of every series row against the expected levels. */
async function expectSeriesLevels(page: Page, levels: (number | undefined)[][]) {
  await expect(seriesRows(page)).toHaveCount(levels.length);
  for (const [row, steps] of levels.entries()) {
    const cells = seriesRows(page).nth(row).locator(".danger-series-cell");
    await expect(cells).toHaveCount(steps.length);
    for (const [step, level] of steps.entries())
      await expect(cells.nth(step)).toHaveCSS("background-color", cellColor(level));
  }
}
/** Asserts that the cell of a step carries the class in each of the rows, and no other cell does. */
async function expectStepMarked(page: Page, cls: string, step: number, rows: number) {
  await expect(seriesRows(page)).toHaveCount(rows);
  await expect(panel(page).locator(`.danger-series-cell.${cls}`)).toHaveCount(rows);
  for (let row = 0; row < rows; row++)
    await expect(seriesRows(page).nth(row).locator(".danger-series-cell").nth(step)).toHaveClass(new RegExp(cls));
}
/** Whether an element shows all its content without scrolling, down or across. */
const fitsWithoutScrolling = (element: Locator) =>
  element.evaluate((el) => el.scrollHeight <= el.clientHeight && el.scrollWidth <= el.clientWidth);
/** The box of each series row with the box of its band's badge, top band first, each row centred on its badge. */
async function rowsBesideBadges(page: Page) {
  const badges = await panel(page).locator(".danger-level-badge").all();
  const pairs = [];
  for (const [k, row] of (await seriesRows(page).all()).entries()) {
    const [cells, badge] = [await row.boundingBox(), await badges[k].boundingBox()];
    expect(Math.abs(cells.y + cells.height / 2 - (badge.y + badge.height / 2))).toBeLessThanOrEqual(1);
    pairs.push({ cells, badge });
  }
  return pairs;
}

/** Opens the dashboard on the test config with the given features, link parameters and timeseries answer or status. */
async function openDashboard(
  page: Page,
  params = "",
  points: object = highAboveLowBelow,
  dashboard: object = config,
  answer: object | number | ((url: URL) => object) = timeseries,
) {
  await captureClipboard(page);
  const count = (points as { features: unknown[] }).features.length;
  await page.route("**/e2e-danger/awsome.json", (route) => route.fulfill({ json: dashboard }));
  await page.route("**/e2e-danger/dormant_datetags.json", (route) => route.fulfill({ status: 404, body: "" }));
  await page.route(/\/e2e-danger\/(points\.json|api\/locations)/, (route) => route.fulfill({ json: points }));
  await page.route(/\/e2e-danger\/api\/timeseries/, (route) =>
    route.fulfill(
      typeof answer === "number"
        ? { status: answer, body: "" }
        : { json: typeof answer === "function" ? answer(new URL(route.request().url())) : answer },
    ),
  );
  await page.goto(`#/modelling/awsome?config=e2e-danger/awsome.json${params}`);
  await expect(page.locator(".maplibregl-marker")).toHaveCount(count, { timeout: 15000 });
}

/** The SVG of the point marker whose tooltip starts with the location. */
async function markerSvg(page: Page, location: string): Promise<string> {
  return page.locator("img.observation-marker").evaluateAll(async (images, wanted) => {
    const image = images.find((img) =>
      (img as HTMLImageElement & { tooltipHtml?: string }).tooltipHtml?.startsWith(wanted),
    ) as HTMLImageElement;
    return (await fetch(image.src)).text();
  }, location);
}

test("a dashboard without dangerLevel offers no danger level button", async ({ page }) => {
  const { dangerLevel, ...withoutDangerLevel } = config;
  expect(dangerLevel).toBeDefined();
  await openDashboard(page, "&view=danger", highAboveLowBelow, withoutDangerLevel);
  await expect(page.getByTitle("Copy a link to this view")).toBeVisible();
  await expect(toggle(page)).toHaveCount(0);
  await expect(panel(page)).toHaveCount(0);
  await expect(page.locator(".hazard-chart canvas")).not.toHaveCount(0);
});

test("view=danger shows the panel in its own slot, without the hazard and the timeseries chart", async ({ page }) => {
  await openDashboard(page, "&view=danger");
  await expect(panel(page)).toBeVisible();
  await expect(page.locator(".chart-container.danger-level-chart app-danger-level")).toBeVisible();
  await expect(toggle(page)).toHaveAttribute("aria-pressed", "true");
  await expect(toggle(page)).toHaveAttribute("title", "Danger level [shift+d]");
  await expect(toggle(page)).toHaveAttribute("aria-label", "Danger level");
  await expect(page.locator(".hazard-chart canvas")).toHaveCount(0);
  await expect(page.locator(".timeseries-chart")).toHaveCount(0);
  await expect(panel(page)).toHaveAttribute("aria-label", "Danger level · Punstable · 05.04.2026 00:00");
});

test("a band reading 4 above and 1 below colours the legend, the markers, the band lines and the slider", async ({
  page,
}) => {
  await openDashboard(page, "&view=danger");
  const cells = toggle(page).locator("app-danger-rating-icon .grid-item");
  await expect(cells).toHaveCount(4);
  const colors = await cells.evaluateAll((items) => items.map((item) => getComputedStyle(item).backgroundColor));
  expect(colors).toEqual(["rgb(215, 25, 28)", "rgb(215, 25, 28)", "rgb(166, 217, 106)", "rgb(166, 217, 106)"]);
  expect(await markerSvg(page, "U0")).toContain('id="map-marker-bg" r="11" fill="#d7191c"');
  expect(await markerSvg(page, "U5")).toContain('id="map-marker-bg" r="11" fill="#d7191c"');
  expect(await markerSvg(page, "L3")).toContain('id="map-marker-bg" r="11" fill="#a6d96a"');
  expect(await markerSvg(page, "F0")).toContain('id="map-marker-bg" r="11" fill="#fff"');
  await expect(bandLines(page)).toHaveCount(2);
  await expect(bandLines(page).nth(0)).toHaveText(/^\s*4\s*≥ 2200 m\s*$/);
  await expect(bandLines(page).nth(1)).toHaveText(/^\s*1\s*< 2200 m\s*$/);
  expect(await filledBands(bandLines(page).locator("app-elevation-icon svg"))).toEqual(["0+24", "24+24"]);
  await expect(bandLines(page).locator(".danger-level-distribution")).toHaveCount(2);
  await expect(bandLines(page).nth(0)).toHaveAttribute(
    "title",
    "≥ 2200 m · 4 High\nvery poor · some · size 4\n10.0 % very poor of 10 slopes (some from 4 %, many above 20 %) · p90 size 4.20",
  );
  await expect(bandLines(page).nth(1)).toHaveAttribute(
    "title",
    "< 2200 m · 1 Low\ngood throughout\n100.0 % good of 10 slopes; every other class none or nearly none",
  );
  await expect(panel(page).locator(".danger-level-badge")).toHaveText(["4", "1"]);
  const badgeColors = await panel(page)
    .locator(".danger-level-badge")
    .evaluateAll((items) => items.map((item) => getComputedStyle(item).backgroundColor));
  expect(badgeColors).toEqual(["rgb(215, 25, 28)", "rgb(166, 217, 106)"]);
  const levels = page.locator("app-elevation-cut .elevation-cut-level");
  await expect(levels).toHaveText(["4", "1"]);
  const sliderColors = await levels.evaluateAll((items) => items.map((item) => getComputedStyle(item).backgroundColor));
  expect(sliderColors).toEqual(["rgb(215, 25, 28)", "rgb(166, 217, 106)"]);
  await expect(levels.nth(0)).toHaveClass(/white/);
  await expect(levels.nth(1)).not.toHaveClass(/white/);
  await expect(page.locator("app-elevation-cut .elevation-cut-line")).toHaveClass(/solid/);
});

test("a dangerLevel without frequency bounds reads with the default preset and names it in the band tooltip", async ({
  page,
}) => {
  await openDashboard(page, "&view=danger", highAboveLowBelow, { ...config, dangerLevel: {} });
  await expect(bandLines(page).nth(0)).toHaveAttribute(
    "title",
    /^≥ 2200 m · 3 .*\nvery poor · a few · size 4\n10\.0 % very poor of 10 slopes \(a few above 5 %, some from 15 %\) · p90 size 4\.20$/,
  );
});

test("a configured size percentile reaches the series request and the band tooltip", async ({ page }) => {
  const percentiles: string[] = [];
  page.on("request", (request) => {
    const url = new URL(request.url());
    if (url.searchParams.has("classes.Punstable")) percentiles.push(url.searchParams.get("size_percentile"));
  });
  const dangerLevel = { ...config.dangerLevel, sizePercentile: 50 };
  await openDashboard(page, "&view=danger", highAboveLowBelow, { ...config, dangerLevel }, seriesAnswer());
  await expect(bandLines(page).nth(0)).toHaveAttribute("title", /very poor of 10 slopes .* · p50 size 4\.20$/);
  await expect.poll(() => percentiles).toEqual(["50"]);
});

test("the marker tooltips say why a flat slope is not read", async ({ page }) => {
  await openDashboard(page, "&view=danger");
  const notes = await page
    .locator("img.observation-marker")
    .evaluateAll((images) => images.map((img) => (img as HTMLImageElement & { tooltipHtml?: string }).tooltipHtml));
  expect(notes).toContain('F0<div class="obs-tooltip-note">≥ 2200 m: not read: flat</div>');
  expect(notes).toContain('L1<div class="obs-tooltip-note">&lt; 2200 m: read</div>');
});

test("the matrix marks the cell each band lands on, both elevation icons where two bands share one", async ({
  page,
}) => {
  await openDashboard(page, "&view=danger", sameCell);
  const marked = panel(page).locator(".danger-level-cell.marked");
  await expect(marked).toHaveCount(1);
  await expect(marked).toHaveAttribute("title", "very poor in some locations, size 4: 4");
  const marks = marked.locator(".danger-level-mark");
  expect(await filledBands(marks.locator("app-elevation-icon svg"))).toEqual(["0+24", "24+24"]);
  const [upper, lower] = [await marks.nth(0).boundingBox(), await marks.nth(1).boundingBox()];
  expect(lower.y).toBeGreaterThanOrEqual(upper.y + upper.height);
  expect(Math.abs(lower.x - upper.x)).toBeLessThan(1);
  await expect(marked).toHaveCSS("background-color", "rgb(215, 25, 28)");
  await expect(marked).toHaveCSS("color", "rgb(255, 255, 255)");
  const unmarked = panel(page)
    .locator(".danger-level-cell:not(.marked)", { hasText: /^\s*4\s*$/ })
    .first();
  await expect(unmarked).toHaveCSS("background-color", "rgb(215, 25, 28)");
  const fair = panel(page)
    .locator(".danger-level-panel")
    .nth(2)
    .locator(".danger-level-cell", { hasText: /^\s*3\s*$/ });
  await expect(fair.first()).toHaveCSS("color", "rgb(27, 36, 48)");
  const veryHigh = panel(page).locator(".danger-level-cell").first();
  await expect(veryHigh).toHaveText(/^\s*5\s*$/);
  await expect(veryHigh).toHaveCSS("background-color", "rgb(0, 0, 0)");
  await expect(veryHigh).toHaveCSS("color", "rgb(255, 255, 255)");
  await expect(panel(page).locator(".danger-level-walk.passed")).toHaveCount(0);
});

test("a stable band walks every (nearly) none box to 1 Low below the size axis caption", async ({ page }) => {
  await openDashboard(page, "&view=danger");
  await expect(panel(page).locator(".danger-level-rows")).toHaveText(/^\s*many\s*some\s*a few\s*\(nearly\) none\s*$/);
  const walks = panel(page).locator(".danger-level-walk");
  await expect(walks).toHaveText(["→ poor", "→ fair", "1 Low"]);
  await expect(walks.and(panel(page).locator(".passed"))).toHaveCount(3);
  expect(await filledBands(walks.locator("app-elevation-icon svg"))).toEqual(["24+24", "24+24", "24+24"]);
  await expect(walks.nth(2)).toHaveClass(/low/);
  await expect(walks.nth(2)).toHaveCSS("background-color", "rgb(166, 217, 106)");
  const cell = await panel(page).locator(".danger-level-cell").first().boundingBox();
  for (const walk of await walks.all())
    expect(Math.abs((await walk.boundingBox()).height - cell.height)).toBeLessThan(1);
  await expect(panel(page).locator(".danger-level-caption")).toHaveText("avalanche size");
  const sizes = await panel(page).locator(".danger-level-sizes").first().boundingBox();
  expect((await walks.first().boundingBox()).y).toBeLessThan(sizes.y);
  expect((await panel(page).locator(".danger-level-caption").boundingBox()).y).toBeGreaterThanOrEqual(
    sizes.y + sizes.height,
  );
  const highCell = panel(page).locator(".danger-level-cell.marked");
  await expect(highCell).toHaveCount(1);
  expect(await filledBands(highCell.locator("app-elevation-icon svg"))).toEqual(["0+24"]);
});

test("the aspect rose fills the selected aspects with the neighbours of a main one, all eight without a selection", async ({
  page,
}) => {
  const aspect = {
    type: "aspect",
    label: "Aspect",
    key: "aspect",
    chartType: "rose",
    chartRichLabel: "label",
    values: ["N", "NE", "E", "SE", "S", "SW", "W", "NW"].map((value) => ({ value, label: value, color: "#2f74f9" })),
  };
  await openDashboard(page, "&view=danger&filter.aspect=N,E", sameCell, {
    ...config,
    filters: [aspect, ...filters],
  });
  const rose = panel(page).locator("app-aspect-rose");
  await expect(rose).toHaveAttribute("title", "aspects N E");
  await expect(rose.locator("svg")).toHaveAttribute("aria-label", "aspects N E");
  await expect(rose.locator(".aspect-rose-filled")).toHaveCount(5);
  expect(await rose.locator(".aspect-rose-filled").evaluateAll((paths) => paths.map((p) => p.dataset.aspect))).toEqual([
    "N",
    "NE",
    "E",
    "SE",
    "NW",
  ]);
  expect(await rose.locator(".aspect-rose-filled").first().getAttribute("fill")).toBe("#19abff");
  await page.locator("app-observation-chart", { hasText: "Aspect" }).getByTitle("Reset").click();
  await expect(rose).toHaveAttribute("title", "all aspects");
  await expect(rose.locator(".aspect-rose-filled")).toHaveCount(8);
});

test("a datetag selection that is not loaded yet shows no levels and offers the reload", async ({ page }) => {
  const requests: string[] = [];
  page.on("request", (request) => {
    if (request.url().includes("/e2e-danger/api/locations")) requests.push(request.url());
  });
  await openDashboard(page, `&view=danger&filter.datetag=${datetags[0]}`);
  expect(requests).toHaveLength(1);
  await expect(panel(page).locator(".danger-level-badge")).toHaveText(["4", "1"]);
  await expect(chips(page)).toContainText("Datetag selected: the shares are conditioned");
  await page.locator("app-observation-chart", { hasText: "Datetag" }).getByTitle("Invert").click();
  await expect(panel(page).locator(".danger-level-badge")).toHaveText(["–", "–"]);
  await expect(bandLines(page).nth(0).locator(".danger-level-reason")).toHaveText("selection not loaded");
  await expect(bandLines(page).nth(0).locator(".danger-level-reason")).toHaveCSS("font-weight", "700");
  await expect(bandLines(page).locator(".danger-level-distribution")).toHaveCount(0);
  const cells = toggle(page).locator("app-danger-rating-icon .grid-item");
  const colors = await cells.evaluateAll((items) => items.map((item) => getComputedStyle(item).backgroundColor));
  expect(new Set(colors)).toEqual(new Set(["rgb(150, 150, 150)"]));
  const reload = chips(page).locator(".danger-level-chip", { hasText: "selection not loaded" }).getByRole("button");
  await reload.click();
  await expect.poll(() => requests.length).toBe(2);
  await expect(panel(page)).not.toContainText("selection not loaded");
});

test("a hidden filter on the reading index's layer conditions the shares and its chip clears it", async ({ page }) => {
  await openDashboard(page, "&view=danger&filter.grainType=SH");
  const chip = chips(page).locator(".danger-level-chip", {
    hasText: "Grain type selected: the shares are conditioned",
  });
  await expect(chip).toBeVisible();
  await expect(chip).toHaveCSS("font-weight", "700");
  expect((await copiedLink(page)).get("filter.grainType")).toBe("SH");
  await chip.getByRole("button", { name: "Clear the Grain type selection" }).click();
  await expect(chip).toHaveCount(0);
  expect((await copiedLink(page)).has("filter.grainType")).toBe(false);
});

test("shift+d toggles the view and its paint, the link carries view=danger and the cut while it is on", async ({
  page,
}) => {
  await openDashboard(page);
  await expect(page.locator(".hazard-chart canvas")).not.toHaveCount(0);
  await expect(page.locator(".timeseries-chart")).toBeVisible();
  await expect(toggle(page)).toHaveAttribute("aria-pressed", "false");
  let link = await copiedLink(page);
  expect(link.has("view")).toBe(false);
  expect(link.has("cut")).toBe(false);
  expect(await markerSvg(page, "U5")).toContain('id="map-marker-bg" r="11" fill="#a6d96a"');
  const requests: string[] = [];
  page.on("request", (request) => requests.push(request.url()));

  await page.keyboard.press("Shift+D");
  await expect(panel(page)).toBeVisible();
  await expect(panel(page).locator(".danger-level-series-note")).toHaveText("no danger level series");
  expect(requests.filter((url) => url.includes("/e2e-danger/") && !url.includes("/api/timeseries?"))).toEqual([]);
  expect(requests.filter((url) => url.includes("/api/timeseries?") && url.includes("classes.Punstable="))).toHaveLength(
    1,
  );
  await expect(toggle(page)).toHaveAttribute("aria-pressed", "true");
  await expect(page.locator(".timeseries-chart")).toHaveCount(0);
  await expect.poll(() => markerSvg(page, "U5")).toContain('id="map-marker-bg" r="11" fill="#d7191c"');
  link = await copiedLink(page);
  expect(link.get("view")).toBe("danger");
  expect(link.get("cut")).toBe("2200");

  await page.keyboard.press("Shift+D");
  await expect(panel(page)).toHaveCount(0);
  await expect(toggle(page)).toHaveAttribute("aria-pressed", "false");
  await expect(page.locator("app-elevation-cut .elevation-cut-line")).not.toHaveClass(/solid/);
  await expect(page.locator(".hazard-chart canvas")).not.toHaveCount(0);
  await expect.poll(() => markerSvg(page, "U5")).toContain('id="map-marker-bg" r="11" fill="#a6d96a"');

  await toggle(page).click();
  await expect(panel(page)).toBeVisible();
  await toggle(page).click();
  await expect(panel(page)).toHaveCount(0);
  await toggle(page).click();
  await page.keyboard.press("Escape");
  await expect(panel(page)).toBeVisible();
});

for (const [bands, params, cuts] of [
  [1, "&cut=none", []],
  [2, "", [2200]],
  [3, "&cut=1800,2400&filter.grainType=SH", [1800, 2400]],
] as const) {
  test(`with ${bands} band lines the panel is 1049 × 635 px, each 58 px series row beside its line up to the matrix's right edge and the cells 63 px`, async ({
    page,
  }) => {
    await page.setViewportSize({ width: 2200, height: 1200 });
    await openDashboard(page, `&view=danger${params}`, highAboveLowBelow, config, seriesAnswer(cuts));
    await expect(bandLines(page)).toHaveCount(bands);
    await expect(seriesRows(page)).toHaveCount(bands);
    await expect(chips(page)).toHaveCount(bands === 3 ? 1 : 0);
    const box = await panel(page).boundingBox();
    expect(box.width).toBe(1049);
    expect(box.height).toBe(635);
    expect(await fitsWithoutScrolling(panel(page))).toBe(true);
    const badges = await panel(page).locator(".danger-level-badge").all();
    expect(Math.abs((await badges[0].boundingBox()).x - box.x - 9)).toBeLessThanOrEqual(1);
    const axis = await panel(page).locator("app-danger-series-axis").boundingBox();
    expect(Math.abs(axis.y - box.y - 9)).toBeLessThanOrEqual(1);
    const rows = await seriesRows(page).all();
    const matrixEnd = await panel(page).locator(".danger-level-panel").last().boundingBox();
    for (const { cells, badge } of await rowsBesideBadges(page)) {
      expect([cells.height, badge.height]).toEqual([58, 48]);
      expect(Math.abs(cells.x + cells.width - (matrixEnd.x + matrixEnd.width))).toBeLessThanOrEqual(1);
    }
    const distributions = await bandLines(page).locator(".danger-level-distribution, .danger-level-reason").all();
    for (const row of rows) {
      const cells = await row.boundingBox();
      for (const distribution of distributions) {
        const right = await distribution.boundingBox();
        expect(cells.x).toBeGreaterThanOrEqual(right.x + right.width);
      }
    }
    const rose = await panel(page).locator("app-aspect-rose svg").boundingBox();
    expect(rose.width).toBe(87);
    const [first, last] = [await rows[0].boundingBox(), await rows.at(-1).boundingBox()];
    if (bands === 1) {
      expect(Math.abs(rose.y - first.y)).toBeLessThanOrEqual(1);
      expect(first.y - (axis.y + axis.height)).toBeLessThanOrEqual(7);
    } else {
      expect(Math.abs(rose.y + rose.height / 2 - (first.y + last.y + last.height) / 2)).toBeLessThanOrEqual(1);
    }
    const badge = await badges[0].boundingBox();
    expect(rose.x).toBeGreaterThanOrEqual(badge.x + badge.width);
    for (const icon of await bandLines(page).locator("app-elevation-icon svg").all()) {
      const { x, width } = await icon.boundingBox();
      expect(width).toBe(55);
      expect(x).toBeGreaterThanOrEqual(rose.x + rose.width);
    }
    const top = await panel(page).locator(".danger-level-top").boundingBox();
    const matrix = await panel(page).locator(".danger-level-matrix").boundingBox();
    expect(matrix.y).toBeGreaterThanOrEqual(top.y + top.height);
    expect(matrix.y + matrix.height).toBeLessThanOrEqual(box.y + box.height);
    expect(matrix.x + matrix.width).toBeLessThanOrEqual(box.x + box.width);
    for (const cell of await panel(page).locator(".danger-level-cell").all()) {
      const { width, height } = await cell.boundingBox();
      expect(Math.abs(width - height)).toBeLessThanOrEqual(1);
      expect(width).toBe(63);
    }
  });

  test(`with ${bands} band lines at 1920×1080 the pane caps the panel below 1049 px at the same ratio, without scrolling, each 58 px series row beside its line`, async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1920, height: 1080 });
    await openDashboard(page, `&view=danger${params}`, highAboveLowBelow, config, seriesAnswer(cuts));
    await expect(seriesRows(page)).toHaveCount(bands);
    const box = await panel(page).boundingBox();
    const pane = await page.locator(".layout-details").boundingBox();
    expect(box.width).toBe(pane.width);
    expect(box.width).toBeLessThan(1049);
    expect(Math.abs(box.width / box.height - 1049 / 635)).toBeLessThan(0.01);
    expect(await fitsWithoutScrolling(panel(page))).toBe(true);
    for (const { cells, badge } of await rowsBesideBadges(page)) {
      expect([cells.height, badge.height]).toEqual([58, 48]);
    }
    const matrix = await panel(page).locator(".danger-level-matrix").boundingBox();
    expect(matrix.y + matrix.height).toBeLessThanOrEqual(box.y + box.height);
  });

  test(`with ${bands} band lines at 1280×800 the panel keeps its 480 px slot without scrolling, each series row beside its line`, async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await openDashboard(page, `&view=danger${params}`, highAboveLowBelow, config, seriesAnswer(cuts));
    await expect(seriesRows(page)).toHaveCount(bands);
    const box = await panel(page).boundingBox();
    expect(box.width).toBeLessThan(1049);
    expect(box.height).toBe(480);
    expect(await fitsWithoutScrolling(panel(page))).toBe(true);
    for (const { cells } of await rowsBesideBadges(page)) expect(cells.height).toBe(bands === 3 ? 48 : 58);
    const matrix = await panel(page).locator(".danger-level-matrix").boundingBox();
    expect(matrix.y + matrix.height).toBeLessThanOrEqual(box.y + box.height);
  });
}

test("from 769 px the panel keeps the 1049 / 635 ratio below 1049 px wide and stays inside a short pane", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1700, height: 1000 });
  await openDashboard(page, "&view=danger", highAboveLowBelow, config, seriesAnswer());
  const slot = page.locator(".chart-container.danger-level-chart");
  const narrower = await slot.boundingBox();
  expect(narrower.width).toBeLessThan(1049);
  expect(narrower.height).toBeGreaterThan(480);
  expect(Math.abs(narrower.width / narrower.height - 1049 / 635)).toBeLessThan(0.01);
  await page.setViewportSize({ width: 2200, height: 800 });
  const pane = page.locator(".layout-details");
  await expect.poll(async () => (await slot.boundingBox()).width).toBe(1049);
  const [short, paneBox] = [await slot.boundingBox(), await pane.boundingBox()];
  expect(short.height).toBeLessThan(635);
  expect(short.y + short.height).toBeLessThanOrEqual(paneBox.y + paneBox.height + 0.5);
  expect(await fitsWithoutScrolling(pane)).toBe(true);
  expect(await fitsWithoutScrolling(panel(page))).toBe(true);
});

test("below 769 px the panel fills the pane's width at 480 px without scrolling", async ({ page }) => {
  await page.setViewportSize({ width: 600, height: 900 });
  await openDashboard(page, "&view=danger&layout=details", highAboveLowBelow, config, seriesAnswer());
  const [slot, pane] = [
    await page.locator(".chart-container.danger-level-chart").boundingBox(),
    await page.locator(".layout-details").boundingBox(),
  ];
  expect(slot.width).toBe(pane.width);
  expect(slot.height).toBe(480);
  expect(await fitsWithoutScrolling(panel(page))).toBe(true);
});

test("a marked cell keeps its levels inside its ring, its alternative level hidden on panels too narrow for it", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1920, height: 1080 });
  await openDashboard(page, "&view=danger", manyVeryPoor, config, seriesAnswer());
  const marked = panel(page).locator(".danger-level-cell.marked");
  await expect(marked).toHaveAttribute("title", "very poor in many locations, size 4: 5, 4");
  for (const width of [1920, 1280, 1200, 1160, 1024]) {
    await page.setViewportSize({ width, height: 900 });
    const fit = await marked.evaluate((cell) => {
      const ring = cell.getBoundingClientRect();
      const boxes = [...cell.childNodes]
        .flatMap((node) => {
          if (node instanceof Text) {
            const range = document.createRange();
            range.selectNodeContents(node);
            return [...range.getClientRects()];
          }
          const alt = node instanceof Element && node.matches(".danger-level-alt") ? node : undefined;
          return alt && getComputedStyle(alt).display !== "none" ? [alt.getBoundingClientRect()] : [];
        })
        .filter((box) => box.width > 0);
      return {
        left: Math.min(...boxes.map((box) => box.left)) - ring.left,
        right: ring.right - Math.max(...boxes.map((box) => box.right)),
        alt: boxes.length > 1,
      };
    });
    expect(fit.left, `${width}`).toBeGreaterThanOrEqual(4);
    expect(fit.right, `${width}`).toBeGreaterThanOrEqual(4);
    if (width === 1920) expect(fit.alt).toBe(true);
    if (width === 1024) expect(fit.alt).toBe(false);
  }
});

test("on narrow panels the elevation marks stay below the section titles and the rows stay close to their cells", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await openDashboard(page, "&view=danger&layout=details", manyVeryPoor, config, seriesAnswer());
  await expect(panel(page).locator(".danger-level-cell.marked")).toHaveCount(1);
  for (const width of [390, 1000, 1920]) {
    await page.setViewportSize({ width, height: 900 });
    const { clearance, pitch, cell } = await panel(page).evaluate((root) => {
      const marked = root.querySelector(".danger-level-cell.marked");
      const section = marked.closest(".danger-level-panel");
      const baseline = document.createElement("span");
      baseline.style.cssText = "display: inline-block; width: 0; height: 0; vertical-align: baseline";
      section.querySelector(".danger-level-panel-title").append(baseline);
      const titleBottom = baseline.getBoundingClientRect().bottom;
      baseline.remove();
      const markTop = Math.min(
        ...[...marked.querySelectorAll(".danger-level-mark")].map((mark) => mark.getBoundingClientRect().top - 1),
      );
      const cells = [...section.querySelectorAll(".danger-level-cell")].map((each) => each.getBoundingClientRect());
      return { clearance: markTop - titleBottom, pitch: cells[5].top - cells[0].top, cell: cells[0].height };
    });
    expect(clearance, `${width}`).toBeGreaterThanOrEqual(0);
    expect(pitch - cell, `${width}`).toBeLessThanOrEqual(6.5);
  }
});

test("on a 390 px phone the global bar scrolls, so the danger level and share buttons stay reachable", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await openDashboard(page);
  const bar = page.locator(".global-bar");
  expect(await bar.evaluate((el) => el.scrollWidth > el.clientWidth)).toBe(true);
  const share = page.getByTitle("Copy a link to this view");
  await share.scrollIntoViewIfNeeded();
  const box = await share.boundingBox();
  expect(box.x).toBeGreaterThanOrEqual(0);
  expect(box.x + box.width).toBeLessThanOrEqual(390);
  await toggle(page).click();
  expect((await copiedLink(page)).get("view")).toBe("danger");
});

test("the series asks the index chart's request for the reading index's classes, the cuts, p90 and the compass population", async ({
  page,
}) => {
  const sk38 = {
    type: "sk38_ccl",
    label: "SK38",
    key: "snowpack.sk38_ccl.value",
    chartType: "bar",
    chartRichLabel: "label",
    stabilityIndex: "dry",
    chartAxisRange: [0, 1.5],
    values: [
      { value: "<0.5", numericRange: [0, 0.5], color: "#d7191c", label: "<0.5" },
      { value: "<0.95", numericRange: [0.5, 0.95], color: "#fdae61", label: "<0.95" },
      { value: "<1.05", numericRange: [0.95, 1.05], color: "#ffffbf", label: "<1.05" },
      { value: ">=1.05", numericRange: [1.05, 1.5], color: "#a6d96a", label: ">=1.05" },
    ],
  };
  const requests: URL[] = [];
  page.on("request", (request) => {
    if (request.url().includes("/e2e-danger/api/timeseries")) requests.push(new URL(request.url()));
  });
  await openDashboard(
    page,
    "&view=danger",
    highAboveLowBelow,
    { ...config, filters: [...filters, sk38] },
    seriesAnswer(),
  );
  await expectStepMarked(page, "current", 4, 2);
  expect(requests).toHaveLength(1);
  const query = requests[0].searchParams;
  expect(query.getAll("stabilityIndex")).toEqual(["Punstable", "sk38_ccl"]);
  expect(query.get("classes.Punstable")).toBe("0.85,0.78,0.7");
  expect(query.getAll("cut")).toEqual(["2200"]);
  expect(query.get("size_percentile")).toBe("90");
  expect(query.get("population")).toBe("compass");
  expect(query.get("ts")).toBe("2026-04-05_00-00-00");
  expect(query.getAll("source")).toEqual(["e2e"]);
});

test("the series reads every band at every step with the matrix and marks the current step in every row", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1920, height: 1080 });
  await openDashboard(page, "&view=danger", highAboveLowBelow, config, seriesAnswer());
  const levels = expectedLevels([
    [upperCounts, upperSizes],
    [lowerCounts, lowerSizes],
  ]);
  expect(levels).toEqual([
    [4, 1, 5, undefined, 4, 1],
    [1, 3, undefined, 3, 1, 1],
  ]);
  await expectSeriesLevels(page, levels);
  await expectStepMarked(page, "current", 4, 2);
  await expect(strip(page)).toHaveAttribute("aria-label", "danger level series");
  await expect(panel(page).locator(".danger-level-series-note")).toHaveCount(0);
  await expect(chips(page)).toHaveCount(0);
  const rows = seriesRows(page);
  const current = stepCells(page, 4);
  const now = await panel(page).locator(".danger-series-now").boundingBox();
  const step = await current.first().boundingBox();
  expect(Math.abs(now.x - (step.x + step.width / 2))).toBeLessThanOrEqual(1);
  const today = panel(page).locator(".danger-series-day.current");
  await expect(today).toHaveText("05.04.");
  await expect(today).toHaveCSS("color", "rgb(0, 0, 0)");
  await expect(today).toHaveCSS("font-weight", "700");
  expect(await rows.first().evaluate((row) => row.classList.contains("separated"))).toBe(true);
});

test("the time axis above the first band row labels each day dd.mm. on its first step", async ({ page }) => {
  await page.setViewportSize({ width: 1920, height: 1080 });
  await openDashboard(page, "&view=danger", highAboveLowBelow, config, seriesAnswer());
  const axis = await panel(page).locator("app-danger-series-axis").boundingBox();
  const top = await seriesRows(page).first().boundingBox();
  expect(axis.y + axis.height).toBeLessThanOrEqual(top.y);
  expect(Math.abs(axis.x - top.x)).toBeLessThanOrEqual(1);
  expect(Math.abs(axis.width - top.width)).toBeLessThanOrEqual(1);
  const days = panel(page).locator(".danger-series-day");
  await expect(days).toHaveText(["01.04.", "02.04.", "03.04.", "04.04.", "05.04.", "06.04."]);
  const boxes = await days.evaluateAll((items) => items.map((item) => item.getBoundingClientRect().toJSON()));
  boxes
    .slice(1)
    .forEach((box, k) => expect(box.x).toBeGreaterThanOrEqual(boxes[k].x + boxes[k].width + DAY_LABEL_GAP - 0.5));
  for (const box of boxes) {
    expect(box.x).toBeGreaterThanOrEqual(axis.x);
    expect(box.x + box.width).toBeLessThanOrEqual(axis.x + axis.width);
  }
  await expect(days.first()).toHaveCSS("font-weight", "700");
  boxes.forEach((box, k) =>
    expect(Math.abs(box.x + box.width / 2 - (top.x + ((k + 0.5) * top.width) / 6))).toBeLessThanOrEqual(1),
  );
  await expect(panel(page).locator(".danger-series-tick")).toHaveCount(6);
  const tick = await panel(page).locator(".danger-series-tick").nth(1).boundingBox();
  expect(Math.abs(tick.x - (top.x + top.width / 6))).toBeLessThanOrEqual(1);
  expect(tick.y + tick.height).toBeLessThanOrEqual(top.y);
  for (const box of boxes) expect(box.y + box.height).toBeLessThanOrEqual(tick.y + 0.5);
});

test("every text of the panel is bold but the alternative levels, and the section titles are centred over their cells", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1920, height: 1080 });
  await openDashboard(page, "&view=danger&filter.grainType=SH", highAboveLowBelow, config, seriesAnswer());
  await expect(chips(page).locator(".danger-level-chip")).not.toHaveCount(0);
  await stepCells(page, 0).first().hover();
  await expect(panel(page).locator(".danger-level-tip")).toBeVisible();
  const weights = await panel(page).evaluate((root) => {
    const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
    const found: [string, string][] = [];
    while (walker.nextNode()) {
      const element = walker.currentNode.parentElement;
      if (!walker.currentNode.textContent.trim() || element.closest("[aria-hidden=true]")) continue;
      found.push([element.closest("[class*='danger-']").classList[0], getComputedStyle(element).fontWeight]);
    }
    return found;
  });
  const owners = new Set(weights.map(([owner]) => owner));
  for (const owner of [
    "danger-level-badge",
    "danger-level-elevation",
    "danger-level-panel-title",
    "danger-level-rows",
    "danger-level-cell",
    "danger-level-alt",
    "danger-level-walk",
    "danger-level-sizes",
    "danger-level-caption",
    "danger-series-day",
    "danger-level-tip",
    "danger-level-chip",
  ]) {
    expect(owners, owner).toContain(owner);
  }
  for (const [owner, weight] of weights) expect(weight, owner).toBe(owner === "danger-level-alt" ? "600" : "700");
  const titles = panel(page).locator(".danger-level-panel-title");
  await expect(titles).toHaveText(["very poor", "poor", "fair"]);
  expect(await titles.evaluateAll((items) => items.map((item) => getComputedStyle(item).textTransform))).toEqual([
    "uppercase",
    "uppercase",
    "uppercase",
  ]);
  const centres = await panel(page)
    .locator(".danger-level-panel")
    .evaluateAll((panels) =>
      panels.map((section) => {
        const range = document.createRange();
        range.selectNodeContents(section.querySelector(".danger-level-panel-title"));
        const text = range.getBoundingClientRect();
        const row = [...section.querySelectorAll(".danger-level-cell")]
          .slice(0, 5)
          .map((cell) => cell.getBoundingClientRect());
        return [text.x + text.width / 2, (row[0].left + row[4].right) / 2];
      }),
    );
  expect(centres).toHaveLength(3);
  for (const [text, cells] of centres) expect(Math.abs(text - cells)).toBeLessThanOrEqual(1);
});

test("hovering a step marks it in every band row and shows its readings below the rows until the mouse leaves", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1920, height: 1080 });
  await openDashboard(page, "&view=danger", highAboveLowBelow, config, seriesAnswer());
  const tip = panel(page).locator(".danger-level-tip");
  await expect(tip).toHaveCount(0);
  await stepCells(page, 0).first().hover();
  await expect(tip.locator("div")).toHaveText([
    "01.04. 00:00",
    "≥ 2200 m: 4 (very poor · many 30 % · size 3) · 10 read",
    "< 2200 m: 1 (good throughout) · 10 read",
  ]);
  await expectStepMarked(page, "hovered", 0, 2);
  const [box, last, area] = [
    await tip.boundingBox(),
    await seriesRows(page).last().boundingBox(),
    await panel(page).boundingBox(),
  ];
  /** The distance between the tooltip's centre and the centre of a step's cell. */
  const offCentre = async (step: Locator) => {
    const [tipBox, cell] = [await tip.boundingBox(), await step.boundingBox()];
    return Math.abs(tipBox.x + tipBox.width / 2 - (cell.x + cell.width / 2));
  };
  expect(box.y).toBeGreaterThanOrEqual(last.y + last.height);
  expect(box.y).toBeLessThanOrEqual(last.y + last.height + 8);
  expect(box.x).toBeGreaterThanOrEqual(area.x);
  expect(box.x + box.width).toBeLessThanOrEqual(area.x + area.width);
  expect(await offCentre(stepCells(page, 0).first())).toBeLessThanOrEqual(1);
  await stepCells(page, 2).last().hover();
  await expect(tip.locator("div")).toHaveText([
    "03.04. 00:00",
    "≥ 2200 m: 5 (very poor · some 20 % · size 5) · 10 read",
    "< 2200 m: – (nothing read)",
  ]);
  await expect(stepCells(page, 0).first()).not.toHaveClass(/hovered/);
  expect(await offCentre(stepCells(page, 2).last())).toBeLessThanOrEqual(1);
  await stepCells(page, 5).first().hover();
  await expect(tip.locator("div").first()).toHaveText("06.04. 00:00");
  const right = await tip.boundingBox();
  expect(Math.abs(right.x + right.width - (area.x + area.width))).toBeLessThanOrEqual(1);
  expect(await offCentre(stepCells(page, 5).first())).toBeGreaterThan(1);
  await page.mouse.move(area.x + 10, area.y + area.height - 10);
  await expect(tip).toHaveCount(0);
  await expect(panel(page).locator(".danger-series-cell.hovered")).toHaveCount(0);
});

test("a series cut otherwise than the bands draws no rows and no note until the bands' series arrives", async ({
  page,
}) => {
  const answered = page.waitForResponse((response) => response.url().includes("classes.Punstable="));
  await openDashboard(page, "&view=danger&cut=1800,2400", highAboveLowBelow, config, (url) =>
    url.searchParams.get("ts") === "2026-04-06_00-00-00" ? seriesAnswer([1800, 2400]) : seriesAnswer(),
  );
  await (await answered).finished();
  await page.evaluate(() => new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve))));
  await expect(bandLines(page)).toHaveCount(3);
  await expect(seriesRows(page)).toHaveCount(0);
  await expect(panel(page).locator(".danger-level-series-note")).toHaveCount(0);
  await page.keyboard.press("Shift+ArrowRight");
  await expect(seriesRows(page)).toHaveCount(3);
  await expectStepMarked(page, "current", 5, 3);
  await expectSeriesLevels(
    page,
    expectedLevels([
      [upperCounts, upperSizes],
      [upperCounts, upperSizes],
      [lowerCounts, lowerSizes],
    ]),
  );
});

test("a chip warns when the series' level at the current step differs from the panel's", async ({ page }) => {
  const upper = upperCounts.map((row) => [...row]);
  upper[0][4] = 0;
  upper[2][4] = 4;
  upper[3][4] = 6;
  const sizes = upperSizes.map((row) => [...row]);
  sizes[2][4] = 1.2;
  await openDashboard(page, "&view=danger", highAboveLowBelow, config, seriesAnswer([2200], upper, sizes));
  const levels = expectedLevels([
    [upper, sizes],
    [lowerCounts, lowerSizes],
  ]);
  expect(levels).toEqual([
    [4, 1, 5, undefined, 1, 1],
    [1, 3, undefined, 3, 1, 1],
  ]);
  await expectSeriesLevels(page, levels);
  const chip = chips(page).locator(".danger-level-chip", { hasText: "series ≠ panel at this step" });
  await expect(chip).toBeVisible();
  await expect(chip).toHaveAttribute(
    "title",
    "≥ 2200 m: series 1, panel 4\nthe series reads the API's population, every stored slope with a compass aspect, the panel the loaded features",
  );
  await expect(chips(page).locator(".danger-level-chip")).toHaveCount(1);
});

test("a selected Punstable class is a filter the series ignores, and the chip says so", async ({ page }) => {
  const veryPoor = {
    type: "FeatureCollection",
    features: Array.from({ length: 10 }, (_, i) => slope(`U${i}`, 2500, 0.9, 4.2)),
  };
  await openDashboard(page, "&view=danger&filter.Punstable=%3E%3D0.85", veryPoor, config, seriesAnswer());
  const chip = chips(page).locator(".danger-level-chip", { hasText: "series ignores: Punstable" });
  await expect(chip).toBeVisible();
  await expect(chip).toHaveAttribute("title", "the API reads the danger level series without the Punstable selection");
  await expect(chips(page)).toContainText("Punstable selected: the shares are conditioned");
});

for (const [name, answer] of [
  ["an answer without classes", timeseries],
  ["a failed request", 500],
] as const) {
  test(`${name} leaves one muted line in the series column, no axis, and the panel at its height`, async ({ page }) => {
    await page.setViewportSize({ width: 2200, height: 1200 });
    await openDashboard(page, "&view=danger", highAboveLowBelow, config, answer);
    const note = panel(page).locator(".danger-level-series-note");
    await expect(note).toHaveText("no danger level series");
    await expect(seriesRows(page)).toHaveCount(0);
    await expect(panel(page).locator("app-danger-series-axis, .danger-series-day")).toHaveCount(0);
    expect((await panel(page).boundingBox()).height).toBe(635);
    const box = await note.boundingBox();
    const matrixEnd = await panel(page).locator(".danger-level-panel").last().boundingBox();
    for (const distribution of await bandLines(page).locator(".danger-level-distribution").all()) {
      const bar = await distribution.boundingBox();
      expect(box.x).toBeGreaterThanOrEqual(bar.x + bar.width);
    }
    expect(Math.abs(box.x + box.width - (matrixEnd.x + matrixEnd.width))).toBeLessThanOrEqual(1);
    const badges = await panel(page).locator(".danger-level-badge").all();
    const [first, last] = [await badges[0].boundingBox(), await badges.at(-1).boundingBox()];
    expect(box.y).toBeGreaterThanOrEqual(first.y);
    expect(box.y + box.height).toBeLessThanOrEqual(last.y + last.height);
    await expect(note).toHaveCSS("font-style", "italic");
    await expect(note).toHaveCSS("font-weight", "700");
  });
}

test("a click on a step moves the dashboard to its date and reloads the sources and the series, not after the last date", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1920, height: 1080 });
  const requests: URL[] = [];
  page.on("request", (request) => {
    if (request.url().includes("/e2e-danger/api/timeseries")) requests.push(new URL(request.url()));
  });
  const lastDate = { ...config, dateMax: "2026-04-05T00:00:00" };
  await openDashboard(page, "&view=danger", highAboveLowBelow, lastDate, seriesAnswer());
  await expectStepMarked(page, "current", 4, 2);
  await expect(stepCells(page, 2).first()).toHaveCSS("cursor", "pointer");
  await expect(stepCells(page, 4).first()).toHaveCSS("cursor", "pointer");
  await expect(stepCells(page, 5).first()).toHaveCSS("cursor", "default");
  await expect(panel(page).locator(".danger-series-cell.outside")).toHaveCount(2);
  await stepCells(page, 5).first().click();
  await expectStepMarked(page, "current", 4, 2);
  await stepCells(page, 2).last().click();
  await expect(panel(page)).toHaveAttribute("aria-label", "Danger level · Punstable · 03.04.2026 00:00");
  await expectStepMarked(page, "current", 2, 2);
  expect((await copiedLink(page)).get("date")).toBe("2026-04-03T00:00:00");
  expect(requests.map((url) => url.searchParams.get("ts"))).toEqual(["2026-04-05_00-00-00", "2026-04-03_00-00-00"]);
  await stepCells(page, 4).first().click();
  await expectStepMarked(page, "current", 4, 2);
  expect((await copiedLink(page)).get("date")).toBe("2026-04-05T00:00:00");
});
