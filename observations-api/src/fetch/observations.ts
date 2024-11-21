import { augmentAndInsertObservation, createConnection, selectObservations } from "../db/database";
import { type GenericObservation } from "../generic-observation";
import { fetchLawisIncidents } from "./observations/lawis_incident";
import { fetchLawisProfiles } from "./observations/lawis_profile";
import { fetchLolaKronos } from "./observations/lola-kronos";
import { fetchLwdKip } from "./observations/lwdkip";
import { fetchSnowLineCalculations } from "./observations/snow_line";
import { fetchWikiSnow } from "./observations/wikisnow";

export async function fetchAndInsert(startDate: Date, endDate: Date) {
  const connection = await createConnection();
  const existing = await selectObservations(connection, startDate, endDate);
  for await (const obs of fetchAll(startDate, endDate, existing)) {
    await augmentAndInsertObservation(connection, obs, existing);
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
