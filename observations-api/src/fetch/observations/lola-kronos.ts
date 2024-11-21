import { fetchJSON } from "../../util/fetchJSON";
import { type LolaKronosApi, convertLoLaKronos } from "./lola-kronos.model";

const API = "https://www.lola-kronos.info/api/dataexport/dataFromToken/";
const WEB = "https://www.lola-kronos.info/";

export async function* fetchLolaKronos(startDate: Date, endDate: Date) {
  const url = `${API}${formatDate(startDate)}/${formatDate(endDate)}`;
  const headers = { Authorization: process.env.ALBINA_LOLA_KRONOS_API_TOKEN };
  const json: LolaKronosApi = await fetchJSON(url, { headers });

  for (let obs of convertLoLaKronos(json, WEB)) {
    yield obs;
  }
}

function formatDate(d: Date) {
  return encodeURIComponent(d.toISOString().replace(/\.\d\d\dZ/, "+00:00"));
}
