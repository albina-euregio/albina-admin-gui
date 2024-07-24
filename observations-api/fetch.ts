import { augmentRegion } from "../src/app/providers/regions-service/augmentRegion";
import { createConnection, insertObservation, selectObservations } from "./database";
import { augmentElevation } from "./elevation";
import { fetchLawisIncidents } from "./fetch_lawis_incident";
import { fetchLawisProfiles } from "./fetch_lawis_profile";
import { fetchLolaKronos } from "./fetch_lola_kronos";
import { fetchLwdKip } from "./fetch_lwdkip";
import { fetchSnowLineCalculations } from "./fetch_snow_line";
import { fetchWikiSnow } from "./fetch_wikisnow";
import { type GenericObservation, findExistingObservation } from "./models";

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
  try {
    yield* fetchLawisIncidents(startDate, endDate, existing);
  } catch (e) {
    console.warn("Failed to fetch lawis incidents", e);
  }
  try {
    yield* fetchLawisProfiles(startDate, endDate, existing);
  } catch (e) {
    console.warn("Failed to fetch lawis profiles", e);
  }
  try {
    yield* fetchLolaKronos(startDate, endDate);
  } catch (e) {
    console.warn("Failed to fetch lola-kronos", e);
  }
  try {
    yield* fetchLwdKip(startDate, endDate);
  } catch (e) {
    console.warn("Failed to fetch lwdkip", e);
  }
  try {
    yield* fetchWikiSnow(startDate, endDate);
  } catch (e) {
    console.warn("Failed to fetch wikisnow", e);
  }
  try {
    yield* fetchSnowLineCalculations(startDate, endDate);
  } catch (e) {
    console.warn("Failed to fetch snowline calculations", e);
  }
}
