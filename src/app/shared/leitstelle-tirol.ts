/**
 * Parser for the alarm reports of the Tyrolean dispatch centre ("Leitstelle Tirol"),
 * which are pasted verbatim into a free-text field (observation content, incident
 * general-information comment). Shared by the observation and incident editors, which
 * map the extracted fields onto their own models.
 *
 * Depending on how the report is relayed, its fields are separated either by newlines
 * or by semicolons, so both are treated as line breaks.
 */

/** Fields recognised in a pasted dispatch report. */
export interface LeitstelleTirolContent {
  /** True when the text looks like a dispatch report at all. */
  isDispatchReport: boolean;
  /** The `Einsatzcode`, e.g. `ALP-LAW-GROSS` (empty when absent). */
  code: string;
  /** Location name taken from the `Einsatzort` field. */
  locationName?: string;
  /** WGS84 coordinates taken from the `Koordinaten` field. */
  latLng?: { lat: number; lng: number };
}

// One coordinate: decimal degrees ("47.052"), degrees and decimal minutes ("N47°3.10")
// or degrees/minutes/seconds ("47°3'6\"N"), with the hemisphere on either side.
const COORDINATE = String.raw`([NSEW])?\s*(\d+(?:\.\d+)?)\s*(?:[°º]\s*(\d+(?:\.\d+)?)?\s*(?:['’′]\s*(\d+(?:\.\d+)?)?\s*["”″]?)?)?\s*([NSEW])?`;
const COORDINATES = new RegExp(`${COORDINATE}[\\s,;]+${COORDINATE}`, "i");

/** Parses a "lat lng" pair in decimal, degrees-minutes or degrees-minutes-seconds notation. */
export function parseLatLng(text: string): { lat: number; lng: number } | undefined {
  const m = text.match(COORDINATES);
  if (!m) return undefined;
  const first = degrees(m[2], m[3], m[4], m[1] ?? m[5]);
  const second = degrees(m[7], m[8], m[9], m[6] ?? m[10]);
  if (!isFinite(first.value) || !isFinite(second.value)) return undefined;
  // "E11°58.78 N47°3.10" states the longitude first.
  return first.isLongitude ? { lat: second.value, lng: first.value } : { lat: first.value, lng: second.value };
}

function degrees(deg: string, min = "0", sec = "0", hemisphere = ""): { value: number; isLongitude: boolean } {
  const value = parseFloat(deg) + parseFloat(min || "0") / 60 + parseFloat(sec || "0") / 3600;
  const h = hemisphere.toUpperCase();
  return { value: h === "S" || h === "W" ? -value : value, isLongitude: h === "E" || h === "W" };
}

export function parseLeitstelleTirol(content: string): LeitstelleTirolContent {
  // Semicolons separate the fields when the report is relayed as a single line.
  const lines = content
    .split(/[\r\n;]+/)
    .map((line) => line.trim())
    .filter((line) => line.length > 0);
  const lineIndex = (name: string) => lines.findIndex((line) => line.startsWith(`${name}:`));
  const field = (name: string) => {
    const i = lineIndex(name);
    return i < 0 ? "" : lines[i].slice(name.length + 1).trim();
  };

  const parsed: LeitstelleTirolContent = {
    isDispatchReport: content.includes("Einsatzcode") && content.includes("beschickte Einsatzmittel"),
    code: field("Einsatzcode"),
  };

  const locationIndex = lineIndex("Einsatzort");
  if (locationIndex >= 0) {
    // The location either follows the field name directly ("Einsatzort: 6290 Mayrhofen") or
    // sits on the next line as a labelled column ("Gemeinde\tNeustift im Stubaital").
    const locationName =
      field("Einsatzort") ||
      (lines[locationIndex + 1] ?? "")
        .split(/\t| {2,}/)
        .pop()
        ?.trim();
    if (locationName) parsed.locationName = locationName;
  }

  const coordinates = lines.find((line) => line.startsWith("Koordinaten:"));
  if (coordinates) parsed.latLng = parseLatLng(coordinates.replace(/^Koordinaten:\s*(WGS ?84)?/i, "").trim());

  return parsed;
}
