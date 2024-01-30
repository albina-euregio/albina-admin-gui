import type dayjs from "dayjs";
import { LolaKronosApi, convertLoLaKronos } from "./models/lola-kronos.model";
import { fetchJSON } from "./fetchJSON";

const API = "https://www.lola-kronos.info/api/dataexport/dataFromToken/";
const WEB = "https://www.lola-kronos.info/";

export async function* fetchLolaKronos(startDate: dayjs.Dayjs, endDate: dayjs.Dayjs) {
  const url = `${API}${formatDate(startDate)}/${formatDate(endDate)}`;
  const headers = { Authorization: process.env.ALBINA_LOLA_KRONOS_API_TOKEN };
  const json: LolaKronosApi = await fetchJSON(url, { headers });

  for (let obs of convertLoLaKronos(json, WEB)) {
    yield obs;
  }
}

function formatDate(d: dayjs.Dayjs) {
  return encodeURIComponent(d.toISOString().replace(/\.\d\d\dZ/, "+00:00"));
}
