import { augmentRegion } from "../../../src/app/providers/regions-service/augmentRegion";
import { createConnection, insertObservation, selectObservations } from "../db/database";
import { augmentElevation } from "../db/elevation";
import { fetchLawisIncidents } from "./observations/lawis_incident";
import { fetchLawisProfiles } from "./observations/lawis_profile";
import { fetchLolaKronos } from "./observations/lola_kronos";
import { fetchLwdKip } from "./observations/lwdkip";
import { fetchSnowLineCalculations } from "./observations/snow_line";
import { fetchWikiSnow } from "./observations/wikisnow";
import { type GenericObservation, findExistingObservation } from "../models";

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
