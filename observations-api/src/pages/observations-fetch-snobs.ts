import { writeFile } from "node:fs/promises";

import { ObservationSource } from "../../../src/app/observations/models/generic-observation.model";
import { fetchLolaKronos } from "../fetch/observations/lola-kronos";
import { newDate } from "../util/newDate";

export const POST = async (request: Bun.BunRequest) => {
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

  const url = new URL(request.url);
  const startDate =
    typeof url.searchParams.get("startDate") === "string"
      ? new Date(url.searchParams.get("startDate"))
      : newDate({ days: -7 });
  const endDate =
    typeof url.searchParams.get("endDate") === "string"
      ? new Date(url.searchParams.get("endDate"))
      : newDate({ days: 0 });

  const observations = [];
  for await (const observation of fetchLolaKronos(startDate, endDate, process.env.ALBINA_SNOBS_API_TOKEN)) {
    if (observation.$source === ObservationSource.LoLaObserver || observation.$source === ObservationSource.Snobs) {
      observations.push(observation);
    }
    // the dialog rows carry the whole observation, so neither the LoLa Kronos page
    // (which would need the API token appended) nor the raw payload have to be shipped
    observation.$externalURL = undefined;
    observation.$data = undefined;
  }
  const file = process.env.ALBINA_SNOBS_OUTPUT ?? "snobs.json";
  await writeFile(file, JSON.stringify(observations), { encoding: "utf8" });
  return new Response("", { status: 204, statusText: "No Content" });
};
