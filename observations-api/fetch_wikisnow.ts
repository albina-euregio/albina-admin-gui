import { ApiWikisnowECT, convertWikisnow } from "../src/app/observations/models/wikisnow.model";

const API = "https://admin.avalanche.report/wikisnow/ect/ect-json.json";

export async function* fetchWikiSnow() {
  console.log("Fetching", API);
  const json: ApiWikisnowECT = await (await fetch(API)).json();

  for (let wikisnow of json.data) {
    yield convertWikisnow(wikisnow);
  }
}
