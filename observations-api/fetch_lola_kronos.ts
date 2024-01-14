import dayjs from "dayjs";
import { createConnection, insertObservation } from "./database";
import { augmentRegion } from "./regions";
import { LolaKronosApi, convertLoLaKronos } from "../src/app/observations/models/lola-kronos.model";

const API = "https://admin.avalanche.report/lola-kronos/dataexport/dataFromToken/";
const WEB = "https://www.lola-kronos.info/";

export async function fetchLolaKronos() {
  const startDate = formatDate(dayjs().millisecond(0).subtract(1, "week"));
  const endDate = formatDate(dayjs().millisecond(0));
  const url = `${API}${startDate}/${endDate}`;
  console.log("Fetching", url);
  const json: LolaKronosApi = await (await fetch(url)).json();

  const connection = await createConnection();
  for (let obs of convertLoLaKronos(json, WEB)) {
    obs = augmentRegion(obs);
    await insertObservation(connection, obs);
  }
  connection.destroy();
}

function formatDate(d: dayjs.Dayjs) {
  return encodeURIComponent(d.toISOString().replace(/\.\d\d\dZ/, "+00:00"));
}
