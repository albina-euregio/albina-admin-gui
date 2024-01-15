import { createConnection, insertObservation } from "./database";
import { augmentRegion } from "../src/app/providers/regions-service/augmentRegion";
import { ApiWikisnowECT, convertWikisnow } from "../src/app/observations/models/wikisnow.model";

const API = "https://admin.avalanche.report/wikisnow/ect/ect-json.json";

export async function fetchWikiSnow() {
  console.log("Fetching", API);
  const json: ApiWikisnowECT = await (await fetch(API)).json();

  const connection = await createConnection();
  for (let wikisnow of json.data) {
    let obs = convertWikisnow(wikisnow);
    obs = augmentRegion(obs);
    await insertObservation(connection, obs);
  }
  connection.destroy();
}
