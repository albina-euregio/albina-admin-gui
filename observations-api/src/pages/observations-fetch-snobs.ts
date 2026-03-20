import { fetchLolaKronos } from "../fetch/observations/lola-kronos";
import { ObservationSource } from "../../../src/app/observations/models/generic-observation.model";
import { writeFile } from "node:fs/promises";
import type { APIRoute } from "astro";

export const POST: APIRoute = async ({ request }) => {
  if (
    !process.env.ALBINA_SNOBS_API_TOKEN ||
    process.env.ALBINA_SNOBS_API_TOKEN !== request.headers.get("X-Snobs-API-Token")
  ) {
    console.warn("Invalid sync token", {
      t1: process.env.ALBINA_SNOBS_API_TOKEN,
      t2: request.headers.get("X-Snobs-API-Token"),
    });
    return new Response("", { status: 403, statusText: "Forbidden" });
  }

  const observations = [];
  for await (const observation of fetchLolaKronos(
    new Date(Date.now() - 7 * 24 * 3600e3),
    new Date(),
    process.env.ALBINA_SNOBS_API_TOKEN,
  )) {
    if (observation.$source === ObservationSource.Observer || observation.$source === ObservationSource.Snobs) {
      observations.push(observation);
    }
    observation.$data = undefined;
  }
  const file = process.env.ALBINA_SNOBS_OUTPUT ?? "snobs.json";
  await writeFile(file, JSON.stringify(observations), { encoding: "utf8" });
};
