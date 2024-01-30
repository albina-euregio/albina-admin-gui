import type dayjs from "dayjs";
import { LolaKronosApi, convertLoLaKronos } from "./models/lola-kronos.model";

const API = "https://www.lola-kronos.info/api/dataexport/dataFromToken/";
const WEB = "https://www.lola-kronos.info/";

export async function* fetchLolaKronos(startDate: dayjs.Dayjs, endDate: dayjs.Dayjs) {
  const url = `${API}${formatDate(startDate)}/${formatDate(endDate)}`;
  const headers = { Authorization: process.env.ALBINA_LOLA_KRONOS_API_TOKEN };
  console.log("Fetching", url);
  const res = await fetch(url, { headers });
  if (!res.ok) throw new Error(res.statusText + ": " + (await res.text()));
  const json: LolaKronosApi = await res.json();

  for (let obs of convertLoLaKronos(json, WEB)) {
    yield obs;
  }
}

function formatDate(d: dayjs.Dayjs) {
  return encodeURIComponent(d.toISOString().replace(/\.\d\d\dZ/, "+00:00"));
}
