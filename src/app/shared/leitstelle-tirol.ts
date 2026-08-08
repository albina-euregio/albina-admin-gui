/**
 * Parser for the alarm reports of the Tyrolean dispatch centre ("Leitstelle Tirol"),
 * which are pasted verbatim into a free-text field (observation content, incident
 * general-information comment). Shared by the observation and incident editors, which
 * map the extracted fields onto their own models.
 */

/** Fields recognised in a pasted dispatch report. */
export interface LeitstelleTirolContent {
  /** True when the text looks like a dispatch report at all. */
  isDispatchReport: boolean;
  /** The `Einsatzcode`, e.g. `ALP-LAW-GROSS` (empty when absent). */
  code: string;
  /** Location name taken from the `Einsatzort` block. */
  locationName?: string;
  /** WGS84 coordinates. */
  latLng?: { lat: number; lng: number };
}

/** Parses a decimal "lat, lng" (or "lat lng") string, e.g. from a WGS84 coordinate line. */
export function parseLatLng(text: string): { lat: number; lng: number } | undefined {
  const m = text.match(/(-?\d+(?:\.\d+)?)\s*[,;\s]\s*(-?\d+(?:\.\d+)?)/);
  if (!m) return undefined;
  const lat = parseFloat(m[1]);
  const lng = parseFloat(m[2]);
  return isFinite(lat) && isFinite(lng) ? { lat, lng } : undefined;
}

export function parseLeitstelleTirol(content: string): LeitstelleTirolContent {
  const parsed: LeitstelleTirolContent = {
    isDispatchReport: content.includes("Einsatzcode") && content.includes("beschickte Einsatzmittel"),
    code: content.match(/Einsatzcode:\s*(.*)\n/)?.[1] ?? "",
  };

  if (content.includes("Einsatzort")) {
    const match = content.match(/Einsatzort:.*\n\s+.*\s+(.*)/);
    if (match) parsed.locationName = match[1];
  }

  if (content.includes("Koordinaten: WGS84")) {
    const match = content.match(/Koordinaten: WGS84(.*)/);
    if (match?.[1]) parsed.latLng = parseLatLng(match[1].trim());
  }

  return parsed;
}
