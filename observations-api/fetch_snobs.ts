import { fetchLolaKronos } from "./src/fetch/observations/lola-kronos";
import { ObservationSource } from "../src/app/observations/models/generic-observation.model";
import { writeFile } from "node:fs/promises";

main();

async function main() {
  const observations = [];
  for await (const observation of fetchLolaKronos(new Date(Date.now() - 7 * 24 * 3600e3), new Date())) {
    if (observation.$source === ObservationSource.Observer || observation.$source === ObservationSource.Snobs) {
      observations.push(observation);
    }
    observation.$data = undefined;
  }
  const file = process.env.ALBINA_OUTPUT ?? "snobs.json";
  await writeFile(file, JSON.stringify(observations), { encoding: "utf8" });
}
