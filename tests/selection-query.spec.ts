import { expect, test } from "@playwright/test";

import { selectionQuery } from "../src/app/modelling/selection-query";
import { FilterSelectionData } from "../src/app/observations/filter-selection-data";

/** A bar chart filter over the given values, backed by a url when one is given. */
const filter = (type: string, url: string | undefined, values: string[], selectedValues: string[]) =>
  new FilterSelectionData<Record<string, unknown>>({
    type,
    label: type,
    key: type,
    url,
    chartType: "bar",
    chartRichLabel: "label",
    values: values.map((value) => ({ value, label: value, color: "#000" })),
    selectedValues,
  });
/** The url-backed Datetag filter of the live config, selecting the given values. */
const datetag = (...selected: string[]) =>
  filter("datetag", "api/locations", ["new_snow", "shallow_old_snow", "2026-03-24", "2026-01-24"], selected);
/** A filter without a url, selecting the given values. */
const elevation = (...selected: string[]) => filter("elevation", undefined, ["1400-1600", "1600-1800"], selected);

test("empty while no url-backed filter selects a value", () => {
  expect(selectionQuery([])).toBe("");
  expect(selectionQuery([datetag(), elevation("1400-1600")])).toBe("");
});

test("the selected values of a url-backed filter, sorted whatever the order they were picked in", () => {
  expect(selectionQuery([datetag("2026-03-24")])).toBe("datetag=2026-03-24");
  expect(selectionQuery([datetag("2026-03-24", "2026-01-24")])).toBe("datetag=2026-01-24&datetag=2026-03-24");
  expect(selectionQuery([datetag("2026-01-24", "2026-03-24")])).toBe("datetag=2026-01-24&datetag=2026-03-24");
});

test("filters without a url, highlights and values the filter does not list never count", () => {
  const highlighted = datetag();
  highlighted.toggleFilterValues("highlighted", ["2026-03-24"]);
  expect(selectionQuery([highlighted])).toBe("");
  expect(selectionQuery([datetag("nan", "2026-12-31")])).toBe("");
  expect(selectionQuery([elevation("1600-1800"), datetag("nan", "2026-03-24")])).toBe("datetag=2026-03-24");
});

test("a change of the selection changes the query, a reset empties it", () => {
  const f = datetag("2026-03-24");
  const loaded = selectionQuery([f]);
  f.toggleFilterValues("selected", ["2026-01-24"]);
  expect(selectionQuery([f])).not.toBe(loaded);
  f.toggleFilterValues("selected", ["2026-01-24"]);
  expect(selectionQuery([f])).toBe(loaded);
  f.resetFilter();
  expect(selectionQuery([f])).toBe("");
});

test("every url-backed filter adds its own selection", () => {
  const band = filter("band", "api/bands", ["low", "high"], ["low", "high"]);
  expect(selectionQuery([datetag("shallow_old_snow"), elevation("1400-1600"), band])).toBe(
    "datetag=shallow_old_snow&band=high&band=low",
  );
});
