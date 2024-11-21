import { fetchJSON } from "../../util/fetchJSON";
import { type ApiWikisnowECT, convertWikisnow } from "./wikisnow.model";

const API = process.env.ALBINA_WIKISNOW_API;

export async function* fetchWikiSnow(startDate: Date, endDate: Date) {
  const json: ApiWikisnowECT = await fetchJSON(API);

  for (let wikisnow of json.data) {
    const obs = convertWikisnow(wikisnow);
    if (obs.eventDate < startDate || obs.eventDate > endDate) {
      continue;
    }
    yield obs;
  }
}
