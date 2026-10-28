import { expect, test } from "@playwright/test";

import { dormantDatetags, isDateDatetag, sortDatetags } from "../src/app/modelling/dormant-datetags";

/** Datetag values in the given order, labelled like the live config. */
const values = (...tags: string[]) => tags.map((value) => ({ value, label: value, color: "#0078ff" }));
/** The tags of a value list, in its order. */
const tags = (list: { value: string }[]) => list.map((v) => v.value);

test("only ISO dates count as dates", () => {
  expect(isDateDatetag("2026-03-24")).toBe(true);
  for (const tag of ["new_snow", "shallow_old_snow", "nan", "", "2026-03-24T00:00", "2026-3-24", "20260324"]) {
    expect(isDateDatetag(tag)).toBe(false);
  }
});

test("the other values come first in their given order, then the dates newest first", () => {
  const published = values(
    "new_snow",
    "shallow_old_snow",
    "2026-02-13",
    "2026-01-28",
    "2026-03-24",
    "2025-10-03",
    "2026-04-04",
  );
  expect(tags(sortDatetags(published))).toEqual([
    "new_snow",
    "shallow_old_snow",
    "2026-04-04",
    "2026-03-24",
    "2026-02-13",
    "2026-01-28",
    "2025-10-03",
  ]);
  expect(tags(sortDatetags(values("2026-01-01", "shallow_old_snow", "2026-02-01", "new_snow")))).toEqual([
    "shallow_old_snow",
    "new_snow",
    "2026-02-01",
    "2026-01-01",
  ]);
});

test("sorting keeps the value objects, leaves its input alone and is idempotent", () => {
  const published = values("2026-01-28", "new_snow", "2026-03-24");
  const sorted = sortDatetags(published);
  expect(sorted[0]).toBe(published[1]);
  expect(sorted[1]).toBe(published[2]);
  expect(sorted[2]).toBe(published[0]);
  expect(tags(published)).toEqual(["2026-01-28", "new_snow", "2026-03-24"]);
  expect(tags(sortDatetags(sorted))).toEqual(tags(sorted));
  expect(sortDatetags([])).toEqual([]);
});

test("the dormant dates are the listed dates the values offer, in their order", () => {
  const offered = values("new_snow", "shallow_old_snow", "2026-03-24", "2026-02-13", "2026-01-28");
  const listed = ["2026-01-28", "new_snow", "shallow_old_snow", "2025-09-01", "2026-03-24", "nan", "2026-01-28"];
  expect([...dormantDatetags({ dormant_datetags: listed }, offered)]).toEqual(["2026-03-24", "2026-01-28"]);
  expect(dormantDatetags({ dormant_datetags: [] }, offered).size).toBe(0);
  expect(dormantDatetags({ dormant_datetags: ["2026-03-24"], note: "kept" }, offered)).toEqual(new Set(["2026-03-24"]));
});

test("a document of another shape is refused", () => {
  const offered = values("2026-03-24");
  const documents = [
    null,
    "<!doctype html><html></html>",
    ["2026-03-24"],
    {},
    { dormant: ["2026-03-24"] },
    { dormant_datetags: "2026-03-24" },
    { dormant_datetags: [20260324] },
    { dormant_datetags: [null] },
  ];
  for (const content of documents) expect(() => dormantDatetags(content, offered)).toThrow();
});
