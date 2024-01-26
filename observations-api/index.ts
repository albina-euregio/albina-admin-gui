import dayjs from "dayjs";
import { GenericObservation } from "../src/app/observations/models/generic-observation.model";
import { augmentRegion } from "../src/app/providers/regions-service/augmentRegion";
import { createConnection, insertObservation } from "./database";
import { fetchLawisIncidents } from "./fetch_lawis_incident";
import { fetchLawisProfiles } from "./fetch_lawis_profile";
import { fetchLolaKronos } from "./fetch_lola_kronos";
import { fetchLwdKip } from "./fetch_lwdkip";
import { fetchWikiSnow } from "./fetch_wikisnow";

fetchAndInsert();

async function fetchAndInsert() {
  const startDate = dayjs().millisecond(0).subtract(1, "week");
  const endDate = dayjs().millisecond(0);
  const connection = await createConnection();
  for await (const obs of fetchAll(startDate, endDate)) {
    insertObservation(connection, augmentRegion(obs));
  }
  connection.destroy();
}

async function* fetchAll(
  startDate: dayjs.Dayjs,
  endDate: dayjs.Dayjs,
): AsyncGenerator<GenericObservation, void, unknown> {
  yield* fetchLawisIncidents(startDate, endDate);
  yield* fetchLawisProfiles(startDate, endDate);
  yield* fetchLolaKronos(startDate, endDate);
  yield* fetchLwdKip(startDate, endDate);
  yield* fetchWikiSnow();
}
