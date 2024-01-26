import { ApiWikisnowECT, convertWikisnow } from "../src/app/observations/models/wikisnow.model";

const API = process.env.ALBINA_WIKISNOW_API;

export async function* fetchWikiSnow() {
  console.log("Fetching", API);
  const json: ApiWikisnowECT = await (await fetch(API)).json();

  for (let wikisnow of json.data) {
    yield convertWikisnow(wikisnow);
  }
}
