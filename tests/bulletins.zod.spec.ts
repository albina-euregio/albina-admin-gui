import { test, expect } from "@playwright/test";
import { BulletinSchema } from "src/app/models/bulletin.model";

test("Bulletin schema validation", async () => {
  const response = await fetch("https://static.avalanche.report/bulletins/2026-03-24/EUREGIO.json");

  expect(response.ok).toBeTruthy();
  expect(response.status).toBe(200);

  const data = await response.json();
  expect(data).toBeDefined();

  const result = BulletinSchema.array().safeParse(data);
  expect(result.success).toBe(true);
  expect(result.error).toBeUndefined();
  const start = new Date(2025, 11, 1, 12, 0, 0); // local time
  const end = new Date(2026, 2, 24, 12, 0, 0); // local time

  for (const d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const dd = String(d.getDate()).padStart(2, "0");
    const datePath = `${yyyy}-${mm}-${dd}`;

    const res = await fetch(`https://static.avalanche.report/bulletins/${datePath}/EUREGIO.json`);
    expect(res.status, `HTTP error for ${datePath}`).toEqual(200);

    const json = await res.json();
    const parsed = BulletinSchema.array().safeParse(json);
    expect(parsed.success, `Schema validation failed for ${datePath}`).toBeTruthy();
  }
});
