import { augmentRegion } from "../src/app/providers/regions-service/augmentRegion";
import { createConnection, insertObservation } from "./database";
import { fetchLawisIncidents } from "./fetch_lawis_incident";
import { fetchLawisProfiles } from "./fetch_lawis_profile";
import { fetchLolaKronos } from "./fetch_lola_kronos";
import { fetchLwdKip } from "./fetch_lwdkip";
import { fetchWikiSnow } from "./fetch_wikisnow";

fetchAndInsert();

async function fetchAndInsert() {
  const connection = await createConnection();
  for await (const obs of fetchAll()) {
    insertObservation(connection, augmentRegion(obs));
  }
  connection.destroy();
}

async function* fetchAll() {
  yield* fetchLawisIncidents();
  yield* fetchLawisProfiles();
  yield* fetchLolaKronos();
  yield* fetchLwdKip();
  yield* fetchWikiSnow();
}
