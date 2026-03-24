import { test, expect } from "@playwright/test";
import { BulletinSchema } from "src/app/models/bulletin.model";

test("Bulletin schema validation", async () => {
  if (!globalThis.Temporal) {
    await import("temporal-polyfill/global");
  }

  const start = Temporal.PlainDate.from({ year: 2025, month: 12, day: 1 });
  const end = Temporal.PlainDate.from({ year: 2026, month: 3, day: 24 });

  for (let d = start; Temporal.PlainDate.compare(d, end) <= 0; d = d.add({ days: 1 })) {
    const date = d.toString();

    const res = await fetch(`https://static.avalanche.report/bulletins/${date}/EUREGIO.json`);
    expect(res.status, `HTTP error for ${date}`).toEqual(200);

    const json = await res.json();
    const parsed = BulletinSchema.array().safeParse(json, { reportInput: true });
    expect(parsed.error, `Schema validation error for ${date}: ${parsed.error?.message}`).toBeUndefined();
    expect(parsed.success, `Schema validation failed for ${date}`).toBeTruthy();
  }
});
