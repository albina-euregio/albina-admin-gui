import type dayjs from "dayjs";
import {
  ArcGisLayer,
  LwdKipBeobachtung,
  LwdKipLawinenabgang,
  LwdKipSperren,
  LwdKipSprengerfolg,
  convertLwdKipBeobachtung,
  convertLwdKipLawinenabgang,
  convertLwdKipSperren,
  convertLwdKipSprengerfolg,
} from "../src/app/observations/models/lwdkip.model";

const API = "https://gis.tirol.gv.at/arcgis";

export async function* fetchLwdKip(startDate: dayjs.Dayjs, endDate: dayjs.Dayjs) {
  for (const f of (await fetchLwdKipLayer<LwdKipBeobachtung>(startDate, endDate, "Beobachtungen")).features) {
    yield convertLwdKipBeobachtung(f);
  }
  for (const f of (await fetchLwdKipLayer<LwdKipSprengerfolg>(startDate, endDate, "Sprengerfolg")).features) {
    yield convertLwdKipSprengerfolg(f);
  }
  for (const f of (await fetchLwdKipLayer<LwdKipLawinenabgang>(startDate, endDate, "Lawinenabgänge")).features) {
    yield convertLwdKipLawinenabgang(f);
  }
  // for (const f of fetchLwdKipLayer<LwdKipSperren>(startDate, endDate, "aktive_Sperren").features) {
  //   yield convertLwdKipSperren(f);
  // }
}

async function fetchLwdKipLayer<T>(startDate: dayjs.Dayjs, endDate: dayjs.Dayjs, layerName = ""): Promise<T> {
  const headers = { Accept: "application/json", "Content-Type": "application/x-www-form-urlencoded" };

  const tokenResponse = await fetch(`${API}/tokens/`, {
    method: "POST",
    headers,
    body: new URLSearchParams({
      username: process.env.ALBINA_LWDKIP_USERNAME,
      password: process.env.ALBINA_LWDKIP_PASSWORD,
      client: "requestip",
      f: "json",
    }),
  });
  if (!tokenResponse.ok) throw new Error(tokenResponse.statusText + ": " + (await tokenResponse.text()));
  const { token } = await tokenResponse.json();

  let url = `${API}/rest/services/APPS_DVT/lwdkip/mapserver/layers/query?${new URLSearchParams({
    token,
    f: "json",
  })}`;
  console.log("Fetching", url);
  const layersResponse = await fetch(url, { headers });
  if (!layersResponse.ok) throw new Error(layersResponse.statusText + ": " + (await layersResponse.text()));
  const { layers }: { layers: ArcGisLayer[] } = await layersResponse.json();
  const layer = layers.find((l) => l.name.trim() === layerName && l.type === "Feature Layer");

  url = `${API}/rest/services/APPS_DVT/lwdkip/mapserver/${layer.id}/query?${new URLSearchParams({
    token,
    where: `BEOBDATUM > TIMESTAMP '${formatDate(startDate)}' AND BEOBDATUM < TIMESTAMP '${formatDate(endDate)}'`,
    outFields: "*",
    datumTransformation: "5891",
    f: "geojson",
  })}`;
  console.log("Fetching", url);
  const response = await fetch(url, { headers });
  if (!response.ok) throw new Error(response.statusText + ": " + (await response.text()));
  return await response.json();
}

function formatDate(d: dayjs.Dayjs) {
  return d.toISOString().slice(0, "2006-01-02T15:04:05".length).replace("T", " ");
}
