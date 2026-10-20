import { test, expect, Page } from "@playwright/test";

import { changeRegion, loginForecaster, setFixedTime } from "./utils";

// both tests edit the same bulletin
test.describe.configure({ mode: "serial" });

const travelAdvisoryFields = ["travelAdvisoryHighlights", "travelAdvisoryComment"];

/** Patches the Tyrol region configuration of the login response to use textcat or free text for the travel advisory. */
async function routeTravelAdvisoryMode(page: Page, mode: "textcat" | "editable") {
  await page.route(/\/api\/authentication$/, async (route) => {
    if (route.request().method() !== "POST") return route.continue();
    const response = await route.fetch();
    const json = await response.json();
    for (const region of json.regions ?? []) {
      if (region.id !== "AT-07") continue;
      const others = (fields: string[] | undefined) => (fields ?? []).filter((f) => !travelAdvisoryFields.includes(f));
      region.enabledTextcatFields = [...others(region.enabledTextcatFields)];
      region.enabledEditableFields = [...others(region.enabledEditableFields)];
      (mode === "textcat" ? region.enabledTextcatFields : region.enabledEditableFields).push(...travelAdvisoryFields);
    }
    await route.fulfill({ response, json });
  });
}

async function openTravelAdvisory(page: Page) {
  await page.goto("#/bulletins");
  await changeRegion(page, "Tyrol");
  await page.getByRole("row", { name: "Thursday, April 3, 2025" }).getByTitle("edit bulletin").click();
  await page.getByTitle("[shift+1]").click();
  await page.getByRole("button", { name: "Travel advisory" }).click();
  const field = (label: string) => page.locator("app-bulletin-text").filter({ hasText: label });
  return { headline: field("Headline travel advisory"), comment: field("Description of travel advisory") };
}

// bulletin updates are debounced, wait for them to be saved
const waitForBulletinUpdate = (page: Page, predicate: (body: string) => boolean = () => true) =>
  page.waitForResponse(
    (response) =>
      /\/api\/bulletins\/[^/?]+\?/.test(response.url()) &&
      response.status() === 200 &&
      response.request().method() === "POST" &&
      predicate(response.request().postData() ?? ""),
  );

test("Travel advisory in free text mode", async ({ page }) => {
  await routeTravelAdvisoryMode(page, "editable");
  await setFixedTime(page, new Date("2025-04-01"));
  await loginForecaster(page);
  let { headline, comment } = await openTravelAdvisory(page);
  const headlineText = `Playwright headline ${Date.now()}`;
  const commentText = "Playwright line 1\nPlaywright line 2";

  await test.step("Enter texts", async () => {
    await headline.getByRole("textbox").first().fill(headlineText);
    const updateResponsePromise = waitForBulletinUpdate(page, (body) => body.includes(headlineText));
    await comment.getByRole("textbox").first().fill(commentText);
    await comment.getByRole("textbox").first().blur();
    await updateResponsePromise;
  });

  await test.step("Texts are persisted", async () => {
    ({ headline, comment } = await openTravelAdvisory(page));
    await expect(headline.getByRole("textbox").first()).toHaveValue(headlineText);
    await expect(comment.getByRole("textbox").first()).toHaveValue(commentText);
  });

  await test.step("Clear texts", async () => {
    await headline.getByRole("textbox").first().fill("");
    const updateResponsePromise = waitForBulletinUpdate(page, (body) => !body.includes("Playwright"));
    await comment.getByRole("textbox").first().fill("");
    await comment.getByRole("textbox").first().blur();
    await updateResponsePromise;
  });
});

test("Travel advisory in textcat mode", async ({ page }) => {
  await routeTravelAdvisoryMode(page, "textcat");
  await setFixedTime(page, new Date("2025-04-01"));
  await loginForecaster(page);
  let { headline, comment } = await openTravelAdvisory(page);

  for (const [name, field] of Object.entries({ headline, comment })) {
    await test.step(`Create ${name} text`, async () => {
      // remove leftovers of previous (failed) runs, the new sentence would be appended otherwise
      if (await field.getByRole("textbox").first().inputValue()) {
        const updateResponsePromise = waitForBulletinUpdate(page);
        await field.getByTitle("Delete", { exact: true }).click();
        await updateResponsePromise;
      }
      await expect(field.getByRole("textbox").first()).toBeDisabled();
      await field.getByTitle("Edit").click();
      const textcat = page.locator("iframe").contentFrame();
      const allSentences = textcat.getByRole("combobox", { name: "All sentences" });
      await expect(allSentences.getByRole("option", { name: "Advice_08 — {distances}" })).toBeAttached();
      // selectOption() reports the option as not enabled inside the textcat iframe
      await allSentences.evaluate((el: HTMLSelectElement) => {
        el.value = "Empfehlung08";
        el.dispatchEvent(new Event("change"));
      });
      await textcat.getByRole("button", { name: "Add sentence" }).click();
      await textcat.getByText("Advice_08 — {⚠ distances}").click();
      await textcat.getByRole("listbox").selectOption("1");
      const updateResponsePromise = waitForBulletinUpdate(page);
      await textcat.getByRole("button", { name: "Save" }).click();
      await updateResponsePromise;
      await expect(field.getByRole("textbox").first()).not.toHaveValue("");
    });
  }

  const headlineText = await headline.getByRole("textbox").first().inputValue();
  const commentText = await comment.getByRole("textbox").first().inputValue();

  await test.step("Texts are persisted", async () => {
    ({ headline, comment } = await openTravelAdvisory(page));
    await expect(headline.getByRole("textbox").first()).toHaveValue(headlineText);
    await expect(comment.getByRole("textbox").first()).toHaveValue(commentText);
  });

  for (const [name, field] of Object.entries({ headline, comment })) {
    await test.step(`Delete ${name} text`, async () => {
      const updateResponsePromise = waitForBulletinUpdate(page);
      await field.getByTitle("Delete", { exact: true }).click();
      await updateResponsePromise;
      await expect(field.getByRole("textbox").first()).toHaveValue("");
    });
  }
});
