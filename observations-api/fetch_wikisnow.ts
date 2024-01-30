import { ApiWikisnowECT, convertWikisnow } from "./models/wikisnow.model";

const API = process.env.ALBINA_WIKISNOW_API;

export async function* fetchWikiSnow() {
  console.log("Fetching", API);
  const res = await fetch(API);
  if (!res.ok) throw new Error(res.statusText + ": " + (await res.text()));
  const json: ApiWikisnowECT = await res.json();

  for (let wikisnow of json.data) {
    yield convertWikisnow(wikisnow);
  }
}
