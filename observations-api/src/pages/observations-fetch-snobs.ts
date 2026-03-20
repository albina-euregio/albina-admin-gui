import { writeFile } from "node:fs/promises";

import type { APIRoute } from "astro";

import { ObservationSource } from "../../../src/app/observations/models/generic-observation.model";
import { fetchLolaKronos } from "../fetch/observations/lola-kronos";

export const POST: APIRoute = async ({ request }) => {
  if (
    !process.env.ALBINA_SNOBS_POST_SECRET ||
    process.env.ALBINA_SNOBS_POST_SECRET !== request.headers.get("Authorization")
  ) {
    console.warn("Invalid secret", {
      t1: process.env.ALBINA_SNOBS_POST_SECRET,
      t2: request.headers.get("Authorization"),
    });
    return new Response("", { status: 403, statusText: "Forbidden" });
  }

  const observations = [];
  for await (const observation of fetchLolaKronos(
    new Date(Date.now() - 7 * 24 * 3600e3),
    new Date(),
    process.env.ALBINA_SNOBS_API_TOKEN,
  )) {
    if (observation.$externalURL?.includes("detail-by-token")) {
      observation.$externalURL += "/" + process.env.ALBINA_SNOBS_API_TOKEN;
    }
    if (observation.$source === ObservationSource.Observer || observation.$source === ObservationSource.Snobs) {
      observations.push(observation);
    }
    observation.$data = undefined;
  }
  const file = process.env.ALBINA_SNOBS_OUTPUT ?? "snobs.json";
  await writeFile(file, JSON.stringify(observations), { encoding: "utf8" });
};
