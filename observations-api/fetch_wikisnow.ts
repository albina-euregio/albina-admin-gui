import { fetchJSON } from "./fetchJSON";
import { ApiWikisnowECT, convertWikisnow } from "./models/wikisnow.model";

const API = process.env.ALBINA_WIKISNOW_API;

export async function* fetchWikiSnow() {
  const json: ApiWikisnowECT = await fetchJSON(API);

  for (let wikisnow of json.data) {
    yield convertWikisnow(wikisnow);
  }
}
