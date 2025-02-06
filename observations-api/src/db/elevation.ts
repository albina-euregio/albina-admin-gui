import { fetchJSON } from "../util/fetchJSON";

const API = "https://voibos.rechenraum.com/voibos/voibos";

interface VoibosRequest {
  Koordinate: string;
  CRS: string;
  name: "hoehenservice";
}

interface VoibosResponse {
  abfragestatus: "erfolgreich" | "Die Abfrage-Koordinaten befinden sich nicht in Österreich.";
  abfragekoordinaten: {
    rechtswert: number;
    hochwert: number;
    CRS: number;
  };
  hoeheDTM: number;
  hoeheDSM: number;
  einheit: string;
  datengrundlage: string;
  flugjahr: string;
  voibos: string;
}

export async function getElevation(lat: number, lng: number): Promise<number> {
  if (!isFinite(lat) || !isFinite(lng)) return;
  const params = {
    Koordinate: `${lng},${lat}`,
    CRS: "4326",
    name: "hoehenservice",
  } satisfies VoibosRequest;
  const url = `${API}?${new URLSearchParams(params)}`;
  const signal = AbortSignal.timeout(2000); // timeout after 2s
  const json: VoibosResponse = await fetchJSON(url, { signal });
  if (json.abfragestatus !== "erfolgreich") return;
  return Math.round(json.hoeheDTM);
}

export async function augmentElevation<T extends { latitude?: number; longitude?: number; elevation?: number }>(
  observation: T,
): Promise<T> {
  try {
    observation.elevation ??= await getElevation(observation.latitude, observation.longitude);
  } catch (err) {
    console.warn("Failed to fetch elevation", err);
  }
  return observation;
}
