import { changeRegion, login } from "./utils";
import { test, expect } from "@playwright/test";
import fs from "node:fs";
import path from "path";

const testDate = new Date("2024-12-24");

test.beforeEach(async ({ page }) => {
  await page.goto("");
  await login(page);
});

test("filter observations", async ({ page }) => {
  await page.clock.setFixedTime(testDate);
  await page.reload();
  await changeRegion(page, "Tyrol");
  await page.getByRole("link", { name: "Observations", exact: true }).click();

  // sources filter is checked by test "observation details"
  await test.step("Date filter", async () => {
    await expect(page.getByRole("textbox")).toHaveValue("12/18/2024 - 12/24/2024");
    await page.getByRole("textbox").click();
    await page.getByPlaceholder("HH").first().fill("10");
    await page.getByPlaceholder("HH").nth(1).fill("02");
    await page.getByPlaceholder("MM").nth(1).fill("30");
    await page.getByRole("button", { name: "AM" }).nth(1);
    await page.getByText(": AM : PM").click();
    await page.getByText("3", { exact: true }).first().click();
    await page.getByText("6", { exact: true }).first().click();
    await expect(page.getByRole("textbox")).toHaveValue("12/03/2024 - 12/06/2024");
    await expect(page).toHaveURL("#/observations?startDate=2024-12-03T10:00&endDate=2024-12-06T14:30");
    await expect(page.locator(".keydata")).toHaveText("204 / 214");
    await page.getByText("Table").click();
    await expect(
      page.getByText(
        "Ca. 15cm Neuschnee bei -4 grad ohne Wind am Talboden. In höheren Lagen starker Wind aus W/NW. Tal auswärts Neuschnee, teils mit vorangegangenen Graupel. 📷 2",
      ),
    ).toBeVisible();
  });
  await test.step("Region Filter", async () => {
    await page.getByRole("button", { name: "Region" }).click();
    await page.getByRole("checkbox", { name: "Kalkkögel" }).check();
    await page.getByRole("checkbox", { name: "Kühtai - Geigen Ridge" }).check();
    await expect(page.locator(".keydata")).toHaveText("25 / 214");
    await expect(
      page.getByText(
        "Trockene Schneefallgrenze zum Beobachtungszeitpunkt: 1350m ± 50mm Aktuell Schneefallgrenze im Bereich Mittelstation Froneben",
      ),
    ).toBeVisible();
  });
  await test.step("Text search", async () => {
    await page.getByRole("button", { name: "" }).click();
    await page.getByRole("textbox", { name: "Search" }).fill("Neuschnee");
    await page.getByRole("textbox", { name: "Search" }).press("Enter");
    await expect(page.locator(".keydata")).toHaveText("17 / 214");
    await expect(
      page.getByText(
        "Geringe Neuschneemenge bei schwachem Wind,es können alle Abfahrten geöffnet bleiben.Zirmach und Panoramabahn freigegeben Bergefall möglich.",
      ),
    ).toBeVisible();
  });
  await page.reload();
  await test.step("Use filter bar", async () => {
    await expect(
      page.locator("app-observation-chart").filter({ hasText: "Stability" }).getByTitle("Classify"),
    ).toHaveClass(/is-active/);
    await page
      .locator("app-observation-chart")
      .filter({ hasText: "Day" })
      .locator("canvas")
      .click({
        position: {
          x: 42,
          y: 95,
        },
      });
    await expect(page.locator(".keydata")).toHaveText("70 / 214");
    await page
      .locator("app-observation-chart")
      .filter({ hasText: "Observation Type" })
      .locator("canvas")
      .click({
        position: {
          x: 69,
          y: 174,
        },
      });
    await expect(page.locator(".keydata")).toHaveText("4 / 214");
    await page.locator("app-observation-chart").filter({ hasText: "Observation Type" }).getByTitle("reset").click();
    // TODO Shift+Click doesn't work
    // await page
    //   .locator("app-observation-chart")
    //   .filter({ hasText: "Day Without specification: 0" })
    //   .locator("canvas")
    //   .click({
    //     modifiers: ["Shift"],
    //     position: {
    //       x: 40,
    //       y: 94,
    //     },
    //   });
    // await expect(page.locator(".keydata")).toHaveText("136 / 214");
    await page.locator("app-observation-chart").filter({ hasText: "Aspect" }).getByTitle("classify").click();
    await page.locator("app-observation-chart").filter({ hasText: "Observation Type" }).getByTitle("label").click();
    await page.locator("app-observation-chart").filter({ hasText: "Day" }).getByTitle("invert").click();
    await expect(page.locator(".app-body")).toHaveScreenshot("filter-bar.png", { maxDiffPixelRatio: 0.1 });
  });
});

test("observation details", async ({ page }) => {
  await page.clock.setFixedTime(testDate);
  await page.reload();
  await changeRegion(page, "Tyrol");
  await page.getByRole("link", { name: "Observations", exact: true }).click();
  await page.getByText("Table").click();
  await test.step("AvalancheWarningService", async () => {
    await page.getByRole("button", { name: "Sources" }).click();
    await page.getByRole("checkbox", { name: "AvalancheWarningService" }).check();
    await page.getByRole("button", { name: "Jöchlspitze" }).first().click();
    await expect(page.getByRole("dialog")).toMatchAriaSnapshot({ name: "AvalancheWarningServiceDetails.aria.yaml" });
    await page.getByRole("button", { name: "Close" }).click();
  });
  await test.step("LwdKip", async () => {
    await page.getByRole("button", { name: "Sources" }).click();
    await page.getByRole("checkbox", { name: "AvalancheWarningService" }).uncheck();
    await page.getByRole("checkbox", { name: "LwdKip" }).check();
    await page.getByRole("button", { name: "Sources" }).click();
    await page.getByRole("button", { name: "Larchlehne" }).first().click();
    await expect(page.getByRole("dialog")).toMatchAriaSnapshot({ name: "LwdKipDetails.aria.yaml" });
    await page.getByRole("button", { name: "Close" }).click();
  });
  await test.step("Lawis", async () => {
    await page.getByRole("button", { name: "Sources" }).click();
    await page.getByRole("checkbox", { name: "LwdKip" }).uncheck();
    await page.getByRole("checkbox", { name: "Lawis" }).check();
    await page.getByRole("button", { name: "Sources" }).click();
    await page.getByRole("button", { name: "Garnitzenberg" }).first().click();
    await expect(page.getByRole("dialog")).toMatchAriaSnapshot({ name: "LawisDetails.aria.yaml" });
    await page.getByRole("button", { name: "Close" }).click();
  });
  await test.step("LoLaKronos", async () => {
    await page.getByRole("button", { name: "Sources" }).click();
    await page.getByRole("checkbox", { name: "LoLaKronos" }).check();
    await page.getByRole("checkbox", { name: "Lawis" }).uncheck();
    await page.getByRole("button", { name: "Sources" }).click();
    await page.getByRole("button", { name: "Schnals" }).first().click();
    await expect(page.getByRole("dialog")).toMatchAriaSnapshot({ name: "LoLaKronosDetails.aria.yaml" });
    await page.getByRole("button", { name: "Close" }).click();
  });
  await test.step("Snobs", async () => {
    await page.getByRole("button", { name: "Sources" }).click();
    await page.getByRole("checkbox", { name: "Snobs" }).check();
    await page.getByRole("checkbox", { name: "LoLaKronos" }).uncheck();
    await page.getByRole("button", { name: "Sources" }).click();
    await page.getByRole("button", { name: "Skigebiet Hahnenkamm" }).first().click();
    await expect(page.getByRole("dialog")).toMatchAriaSnapshot({ name: "SnobsDetails.aria.yaml" });
    await page.getByRole("button", { name: "Close" }).click();
  });
  await test.step("WikisnowECT", async () => {
    // TODO if this is still active? Couldn't easily find an observation.
  });
});

test("export observation details", async ({ page }) => {
  await changeRegion(page, "Tyrol");
  await page.goto("#/observations?startDate=2024-12-03T10:00&endDate=2024-12-06T14:30");
  // apply some filter
  await page.getByRole("button", { name: "Region" }).click();
  await page.getByRole("checkbox", { name: "Tuxer Alps East" }).check();
  await page.getByRole("checkbox", { name: "Kitzbühel Alps Brixental" }).check();
  await page.getByRole("checkbox", { name: "Zillertal Alps Northwest" }).check();
  await expect(page.locator(".keydata")).toHaveText("4 / 214");
  await test.step("GEOJSON", async () => {
    await page.getByRole("button", { name: "" }).click();
    const downloadJsonPromise = page.waitForEvent("download");
    await page.getByRole("button", { name: "Export observations" }).click();
    const jsonDownload = await downloadJsonPromise;
    const downloadPath = path.join(__dirname, "../playwright/generated-data/json/observations.geojson");
    await jsonDownload.saveAs(downloadPath);
    // TODO: JSON comparison needs to ignore order of array items
    // const originalJson = fs.readFileSync(path.join(__dirname, "data/observations.geojson"));
    // const downloadedJson = fs.readFileSync(downloadPath);
    // expect(originalJson).toEqual(downloadedJson);
  });
  await test.step("CSV statistic", async () => {
    await page.getByRole("button", { name: "" }).click();
    const downloadCSVPromise = page.waitForEvent("download");
    await page.getByRole("button", { name: "Export statistics (CSV)" }).click();
    const csvDownload = await downloadCSVPromise;
    expect(csvDownload.suggestedFilename()).toMatch("observations_2024-12-03_to_2024-12-06.csv");
    const downloadPath = path.join(
      __dirname,
      "../playwright/generated-data/csv/observations_2024-12-03_to_2024-12-06.csv",
    );
    await csvDownload.saveAs(downloadPath);
    const originalCSV = fs.readFileSync(path.join(__dirname, "data/observations_2024-12-03_to_2024-12-06.csv"));
    const downloadedCSV = fs.readFileSync(downloadPath);
    expect(originalCSV).toEqual(downloadedCSV);
  });
});

test("Create new observation", async ({ page }) => {
  await changeRegion(page, "Tyrol");
  await page.getByRole("link", { name: "Observations", exact: true }).click();
  await page.getByTitle("New observation").click();
  await page.locator('#eventDate input[type="date"]').fill("2024-12-10");
  await page.locator('#eventDate input[type="time"]').fill("10:13");
  await page.getByLabel("Person involvement").selectOption("Injured");
  await expect(page.getByLabel("Observation type")).toHaveValue("Avalanche");
  await page.getByLabel("Snowpack Stability").selectOption("fair");
  await page.getByRole("textbox", { name: "Location" }).fill("Zischgeles");
  await page.getByRole("option", { name: "Zischgeles, Sankt Sigmund im" }).click();
  await expect(page.getByRole("spinbutton", { name: "Latitude" })).toHaveValue("47.1315444");
  await expect(page.getByRole("spinbutton", { name: "Longitude" })).toHaveValue("11.0950077");
  await expect(page.getByRole("spinbutton", { name: " Elevation", exact: true })).toHaveValue("3003");
  await page.getByRole("button", { name: "S", exact: true }).click({ force: true });
  await page.getByRole("textbox", { name: "Author name" }).fill("Playwright");
  await page.locator('#reportDate input[type="date"]').fill("2024-12-11");
  await page.locator('#reportDate input[type="time"]').fill("08:00");
  await page.getByRole("button", { name: "Wind slab" }).click();
  await page.getByLabel("Danger source").selectOption("60a1e096-e0f9-4491-bee3-e358cb9bb4b1");
  await page.getByRole("button", { name: "Gliding snow" }).click();
  await page.getByRole("button", { name: "dp2" }).click();
  await page.getByRole("button", { name: "For blog" }).click();
  await page.getByRole("textbox", { name: "Content" }).fill("Playwright test");
  await expect(page.getByRole("button", { name: "Save" })).toBeEnabled();
  await page.locator("#eventDate").getByRole("button", { name: "" }).click();
  await expect(page.getByRole("button", { name: "Save" })).toBeDisabled();
  // TODO think about if/how to test sending of new observation
});

test("Webcams and Observers", async ({ page }) => {
  await changeRegion(page, "Tyrol");
  await page.getByRole("link", { name: "Observations", exact: true }).click();
  await test.step("Gallery", async () => {
    await page.getByText("Gallery").click();
    await page.locator('input[type="datetime-local"]').fill("2024-12-24T09:00");
    await page.getByRole("button", { name: "Region", exact: true }).click();
    await page.getByRole("checkbox", { name: "Karwendel Mountains West" }).check();
    await expect(page.getByRole("button", { name: "UNI Innsbruck West" })).toHaveScreenshot("webcamUIBK.png", {
      maxDiffPixelRatio: 0.4,
    });
  });
  await test.step("Observer Map", async () => {
    await page.getByText("Map", { exact: true }).click();
    await page.getByTitle("Observations").click();
    await page.getByTitle("Observers").click();
    await page.getByRole("button", { name: "Marker" }).click();
    await expect(page.getByRole("dialog").getByRole("img")).toHaveAttribute(
      "src",
      "https://wiski.tirol.gv.at/lawine/grafiken/800/beobachter/Nordkette.png",
    );
    await page.getByRole("button", { name: "Close" }).click();
  });
  await test.step("Webcam Map", async () => {
    await page.getByTitle("Observers").click();
    await page.getByTitle("Webcams").click();
    // select region with unique webcam
    await page.getByRole("button", { name: "Region", exact: true }).click();
    await page.getByRole("checkbox", { name: "Lechtal Alps West" }).check();
    await page.getByRole("checkbox", { name: "Karwendel Mountains West" }).uncheck();
    await page.getByRole("button", { name: "Region", exact: true }).click();
    await expect(page.locator("#observationsMap")).toHaveScreenshot("webcamMap.png", { maxDiffPixelRatio: 0.1 });
    await page.getByRole("button", { name: "Marker" }).click();
    await expect(page.locator("iframe")).toHaveAttribute("src", "https://www.foto-webcam.eu/webcam/st-anton/");
  });
});

test("Weather stations", async ({ page }) => {
  await page.clock.setFixedTime(testDate);
  await changeRegion(page, "Tyrol");
  await page.getByRole("link", { name: "Observations", exact: true }).click();
  await page.getByTitle("Observations").click();
  await page.getByTitle("Weather stations").click();
  await expect.poll(() => page.getByRole("button", { name: "Marker" }).count()).toBeGreaterThan(200);
  await page.getByTitle("Air temperature", { exact: true }).click();
  await expect(page.locator("#observationsMap")).toHaveScreenshot("airTemp.png", { maxDiffPixelRatio: 0.1 });
  await page.getByTitle("Potential surface hoar formation", { exact: true }).click();
  await expect(page.locator("#observationsMap")).toHaveScreenshot("surfaceHoar.png", { maxDiffPixelRatio: 0.1 });
  await page.getByTitle("Dry snowfall level").click();
  await expect(page.locator("#observationsMap")).toHaveScreenshot("drySnowfall.png", { maxDiffPixelRatio: 0.1 });
});
