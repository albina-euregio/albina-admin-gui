import { fetchJSON } from "../../util/fetchJSON";
import {
  type ArcGisLayer,
  type LwdKipBeobachtung,
  type LwdKipLawinenabgang,
  type LwdKipSprengerfolg,
  convertLwdKipBeobachtung,
  convertLwdKipLawinenabgang,
  convertLwdKipSprengerfolg,
} from "./lwdkip.model";

const API = "https://gis.tirol.gv.at/arcgis";

export async function* fetchLwdKip(startDate: Date, endDate: Date) {
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

async function fetchLwdKipLayer<T>(startDate: Date, endDate: Date, layerName = ""): Promise<T> {
  const headers = { Accept: "application/json", "Content-Type": "application/x-www-form-urlencoded" };

  const { token } = await fetchJSON(`${API}/tokens/`, {
    method: "POST",
    headers,
    body: new URLSearchParams({
      username: process.env.ALBINA_LWDKIP_USERNAME,
      password: process.env.ALBINA_LWDKIP_PASSWORD,
      client: "requestip",
      f: "json",
    }),
  });

  const { layers }: { layers: ArcGisLayer[] } = await fetchJSON(
    `${API}/rest/services/APPS_DVT/lwdkip/mapserver/layers/query?${new URLSearchParams({
      token,
      f: "json",
    })}`,
    { headers },
  );
  const layer = layers.find((l) => l.name.trim() === layerName && l.type === "Feature Layer");

  return await fetchJSON(
    `${API}/rest/services/APPS_DVT/lwdkip/mapserver/${layer.id}/query?${new URLSearchParams({
      token,
      where: `BEOBDATUM > TIMESTAMP '${formatDate(startDate)}' AND BEOBDATUM < TIMESTAMP '${formatDate(endDate)}'`,
      outFields: "*",
      datumTransformation: "5891",
      f: "geojson",
    })}`,
    { headers },
  );
}

function formatDate(d: Date) {
  return d.toISOString().slice(0, "2006-01-02T15:04:05".length).replace("T", " ");
}
