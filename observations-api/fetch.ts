import dayjs from "dayjs";
import { GenericObservation, findExistingObservation } from "../src/app/observations/models/generic-observation.model";
import { augmentRegion } from "../src/app/providers/regions-service/augmentRegion";
import { createConnection, insertObservation, selectObservations } from "./database";
import { fetchLawisIncidents } from "./fetch_lawis_incident";
import { fetchLawisProfiles } from "./fetch_lawis_profile";
import { fetchLolaKronos } from "./fetch_lola_kronos";
import { fetchLwdKip } from "./fetch_lwdkip";
import { fetchWikiSnow } from "./fetch_wikisnow";
import { augmentElevation } from "./elevation";

export async function fetchAndInsert(
  startDate: dayjs.Dayjs = dayjs().millisecond(0).subtract(1, "week"),
  endDate: dayjs.Dayjs = dayjs().millisecond(0),
) {
  const connection = await createConnection();
  const existing = await selectObservations(connection, startDate, endDate);
  for await (const obs of fetchAll(startDate, endDate, existing)) {
    const ex = findExistingObservation(existing, obs);
    if (ex && (obs.latitude !== ex.latitude || obs.longitude !== ex.longitude)) {
      augmentRegion(obs);
      await augmentElevation(obs);
    }
    await insertObservation(connection, obs);
  }
  connection.destroy();
}

async function* fetchAll(
  startDate: dayjs.Dayjs,
  endDate: dayjs.Dayjs,
  existing: GenericObservation[],
): AsyncGenerator<GenericObservation, void, unknown> {
  yield* fetchLawisIncidents(startDate, endDate, existing);
  yield* fetchLawisProfiles(startDate, endDate, existing);
  yield* fetchLolaKronos(startDate, endDate);
  yield* fetchLwdKip(startDate, endDate);
  yield* fetchWikiSnow();
}
