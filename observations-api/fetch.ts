import { GenericObservation, findExistingObservation } from "./models";
import { augmentRegion } from "../src/app/providers/regions-service/augmentRegion";
import { createConnection, insertObservation, selectObservations } from "./database";
import { fetchLawisIncidents } from "./fetch_lawis_incident";
import { fetchLawisProfiles } from "./fetch_lawis_profile";
import { fetchLolaKronos } from "./fetch_lola_kronos";
import { fetchLwdKip } from "./fetch_lwdkip";
import { fetchWikiSnow } from "./fetch_wikisnow";
import { fetchSnowLineCalculations } from "./fetch_snow_line";
import { augmentElevation } from "./elevation";

export async function fetchAndInsert(startDate: Date, endDate: Date) {
  const connection = await createConnection();
  const existing = await selectObservations(connection, startDate, endDate);
  for await (const obs of fetchAll(startDate, endDate, existing)) {
    const ex = findExistingObservation(existing, obs);
    if (!ex || obs.latitude !== ex.latitude || obs.longitude !== ex.longitude) {
      augmentRegion(obs);
      await augmentElevation(obs);
    }
    await insertObservation(connection, obs);
  }
  connection.destroy();
}

async function* fetchAll(
  startDate: Date,
  endDate: Date,
  existing: GenericObservation[],
): AsyncGenerator<GenericObservation, void, unknown> {
  yield* fetchLawisIncidents(startDate, endDate, existing);
  yield* fetchLawisProfiles(startDate, endDate, existing);
  yield* fetchLolaKronos(startDate, endDate);
  yield* fetchLwdKip(startDate, endDate);
  yield* fetchWikiSnow(startDate, endDate);
  yield* fetchSnowLineCalculations(startDate, endDate);
}
