import {
  type GenericObservation,
  ObservationSource,
  ObservationType,
  SnowpackStability as Stability,
  toAspect,
} from "../../generic-observation";

export type ArcGisApi = { layers: ArcGisLayer[] } | { error: { message: string } };

// https://gis.tirol.gv.at/arcgis/rest/services/APPS_DVT/lwdkip/MapServer/layers?f=json
export interface ArcGisLayer {
  id: number;
  name: string;
  description: string;
  type: "Feature Layer" | "Group Layer" | "Mosaic Layer" | "Raster Layer";
  geometryType?: "esriGeometryPoint" | "esriGeometryPolygon" | "esriGeometryPolyline";
}

export type LwdKipBeobachtung = GeoJSON.FeatureCollection<GeoJSON.Point | undefined, BeobachtungProperties>;

export interface BeobachtungProperties {
  STANDORT: string;
  HOEHE?: number;
  BEOBDATUM: number;
  GVOUID: string;
  BEZEICHNUNG: string;
  TBEOBACHTUNGSEQ: number;
  LW_PROBLEM?: number;
  PR_NEU_EXP?: string;
  PR_NEU_TEXT?: string;
  PR_TRIEB_EXP?: string;
  PR_TRIEB_TEXT?: string;
  PR_ALT_EXP?: string;
  PR_ALT_TEXT?: string;
  PR_NASS_EXP?: string;
  PR_NASS_TEXT: null;
  PR_GLEIT_EXP?: string;
  PR_GLEIT_TEXT: null;
  LW_ABGANGS?: string;
  LW_BELASTUNG?: string;
  LW_SCHNEEBRETT?: string;
  LW_LOCCKERSCHNEE?: string;
  LW_GLEITSCHNEE?: string;
  GEFAEHRDUNG: string;
  NOTIZEN?: string;
  MN_KEINE?: string;
  MN_LAUFENDE_BEOB?: string;
  MN_ALLGEMEIN: null;
  MN_KUENSTL_AUSL?: string;
  MN_TEMP_SPERRE?: string;
  MN_TEMP_EVAK: null;
  MN_PRAEVENTIV: null;
  MN_ANDERE: null;
  MN_SCHNEEPROFIL?: string;
  BESCHREIBUNG?: string;
  BESCHLUSS?: string;
  WEITER_BGM?: string;
  WEITER_BTRL?: string;
  WEITER_POLIZEI?: string;
  WEITER_SHBDE?: string;
  WEITER_SONSTIGE?: string;
  NAECHSTESITZUNG?: number;
  MITGLIED?: string;
  MITTEILUNG?: string;
  USER_MITTTEILUNG?: string;
  WZ_TREIBEN_FEGEN?: string;
  WZ_WECHTE?: string;
  WZ_WINDGANGELN?: string;
  WZ_WINDKOLKE?: string;
  WZ_FAHNEN?: string;
  WZ_ANRAUM?: string;
  WZ_DEUNEN?: string;
  WZ_TRIEBSCHNEE?: string;
  NEUSCHNEE_24?: number;
  NEUSCHNEE_48?: number;
  NEUSCHNEE_72?: number;
  GESAMTSCHNEEHOEHE?: number;
  SD_NEUSCHNEEDECKE?: string;
  SD_ALTSCHNEEDECKE?: string;
  SD_TRAGFAEHIG?: string;
  SD_NICHT_TRAGFAEHIG?: string;
  SD_GLATT?: string;
  SD_UNREGELMAESSIG?: string;
  SD_GEB_SCHNEE?: string;
  SD_UNGEB_SCHNEE?: string;
  SD_OBERFLAECHENREIF?: string;
  SD_SCHMELZHARSCHDECKEL?: string;
  SD_WINDDECKEL?: string;
  SD_TROCKEN?: string;
  SD_FEUCHT?: string;
  SD_NASS: null;
  SCHNEE_TEMPERATUR?: number;
  GZ_RISSBILDUNG?: string;
  GZ_SETZ_GERAEUSCH: null;
  GZ_GLEITS_MAEULER?: string;
  EINZUGSGEBIET?: string;
  STURZBAHNEN?: string;
  NOTIZEN_SCHNEE?: string;
  LW_AKTIVITAET_SCHNEEBRETT?: string;
  LW_AKTIVITAET_LOCKERSCHNEE?: string;
  LW_AKTIVITAET_GLEITSCHNEE?: string;
  LW_AUSLOESE_SCHEEBRETT?: string;
  LW_AUSLOESE_LOCKERSCHNEE?: string;
  LW_ANZAHL_SCHEEBRETT?: string;
  LW_ANZAHL_LOCKERSCHNEE?: string;
  LW_ANZAHL_GLEITSCHNEE?: string;
  LW_NOTIZEN?: string;
  KUENST_AL_KEINE?: number;
  KUENST_AL_MAESSIG?: number;
  KUENST_AL_GUT?: number;
  KUENST_AL_SEHRGUT?: number;
  SB_VERBAUU?: string;
  SB_LEITWER?: string;
  SB_DAEM?: string;
  KUM_NEUSCHNEE_24?: number;
  EINSINKTIEFE?: string;
  LUFTTEMPERATUR?: number;
  TENDENZ_LT?: string;
  BEWOELKUNG?: string;
  NIEDERSCHLAG?: string;
  NS_INTENSITAET?: string;
  WINDGESCHWINDIGKEIT?: string;
  WINDRICHTUNG?: string;
  SHAPE?: null;
}

export function convertLwdKipBeobachtung(
  feature: GeoJSON.Feature<GeoJSON.Point | undefined, BeobachtungProperties>,
): GenericObservation {
  let eventDate = feature.properties.BEOBDATUM;
  eventDate += 60_000 * new Date(feature.properties.BEOBDATUM).getTimezoneOffset();
  return {
    $id: `Beobachtung-${feature.properties.TBEOBACHTUNGSEQ}`,
    $data: feature.properties,
    $extraDialogRows: Object.keys(feature.properties)
      .map((label) =>
        typeof feature.properties[label] === "string" ? { label, value: feature.properties[label] } : undefined,
      )
      .filter((row) => row !== undefined),
    $source: ObservationSource.LwdKip,
    $type: ObservationType.Evaluation,
    stability: getLwdKipBeobachtungStability(feature),
    aspect: undefined,
    authorName: feature.properties.BEZEICHNUNG,
    content: [feature.properties.BESCHREIBUNG, feature.properties.NOTIZEN].filter((s) => !!s).join(" – "),
    elevation: feature.properties.HOEHE,
    eventDate: new Date(eventDate),
    latitude: feature.geometry?.coordinates?.[1],
    locationName: feature.properties.BEZEICHNUNG,
    longitude: feature.geometry?.coordinates?.[0],
    region: undefined,
  };
}

export type LwdKipSprengerfolg = GeoJSON.FeatureCollection<GeoJSON.Point, SprengerfolgProperties>;

export interface SprengerfolgProperties {
  OBJECTID: number;
  TBEOBACHTUNGSEQ: number;
  TKOMMISSIONSEQ: number;
  MANDANTSEQ: number;
  BEOBDATUM: number;
  SPRENGERFOLGSEQ?: number;
  SPRENGERFOLG?: string;
  SEEHOEHE: number;
  EXPOSITION: number;
  NEIGUNG?: number;
  BEZEICHNUNG: string;
  SPRENGUNGZEIT?: number;
  SPRENGGRUND?: string;
  NOTIZEN?: string;
}

export function convertLwdKipSprengerfolg(
  feature: GeoJSON.Feature<GeoJSON.Point, SprengerfolgProperties>,
): GenericObservation {
  let eventDate = feature.properties.BEOBDATUM + feature.properties.SPRENGUNGZEIT;
  eventDate += 60_000 * new Date(feature.properties.BEOBDATUM).getTimezoneOffset();
  return {
    $id: `Sprengung-${feature.properties.TBEOBACHTUNGSEQ}`,
    $data: feature.properties,
    $extraDialogRows: [
      { label: "Sprengerfolg", value: feature.properties.SPRENGERFOLG },
      { label: "Sprenggrund", value: feature.properties.SPRENGGRUND },
      { label: "observations.incline", number: feature.properties.NEIGUNG },
    ],
    $source: ObservationSource.LwdKip,
    $type: ObservationType.Blasting,
    stability: getLwdKipSprengerfolgStability(feature),
    aspect: toAspect(feature.properties.EXPOSITION),
    authorName: undefined,
    content: [
      feature.properties.SPRENGERFOLG && `Sprengerfolg: ${feature.properties.SPRENGERFOLG}`,
      feature.properties.SPRENGGRUND && `Sprenggrund: ${feature.properties.SPRENGGRUND}`,
      feature.properties.NOTIZEN,
    ]
      .filter((s) => !!s)
      .join(" – "),
    elevation: feature.properties.SEEHOEHE,
    eventDate: new Date(eventDate),
    latitude: feature.geometry.coordinates[1],
    locationName: feature.properties.BEZEICHNUNG,
    longitude: feature.geometry.coordinates[0],
    region: undefined,
  };
}

export type LwdKipLawinenabgang = GeoJSON.FeatureCollection<GeoJSON.LineString, LawinenabgangProperties>;

export interface LawinenabgangProperties {
  BEZEICHNUNG: string;
  OBJECTID: number;
  BEOBDATUM: number;
  ZEIT?: number;
  LAWINENGROESSE: string;
  LAWINENART: string;
  LAWINENFEUCHTE: string;
  SPRENGUNG?: number;
  NOTIZEN?: string;
  NEIGUNG?: number;
  EXPOSITION: number;
  SHAPE?: unknown;
  TBEOBACHTUNGSEQ?: number;
  TBEOBLAWINENSTRICHSEQ?: number;
}

export function convertLwdKipLawinenabgang(
  feature: GeoJSON.Feature<GeoJSON.LineString, LawinenabgangProperties>,
): GenericObservation {
  let eventDate = feature.properties.BEOBDATUM + feature.properties.ZEIT;
  eventDate += 60_000 * new Date(feature.properties.BEOBDATUM).getTimezoneOffset();
  return {
    $id: `Lawine-${feature.properties.TBEOBLAWINENSTRICHSEQ}`,
    $data: feature.properties,
    $extraDialogRows: [
      { label: "Lawinengröße", value: feature.properties.LAWINENGROESSE },
      { label: "Lawinenart", value: feature.properties.LAWINENART },
      { label: "Lawinenfeuchte", value: feature.properties.LAWINENFEUCHTE },
      { label: "Sprengung", boolean: feature.properties.SPRENGUNG > 0 },
      { label: "observations.incline", number: feature.properties.NEIGUNG },
    ],
    $source: ObservationSource.LwdKip,
    $type: ObservationType.Avalanche,
    stability: getLwdKipLawinenabgangStability(feature),
    aspect: toAspect(feature.properties.EXPOSITION),
    authorName: undefined,
    content: [
      feature.properties.NOTIZEN,
      feature.properties.LAWINENGROESSE && `Lawinengröße: ${feature.properties.LAWINENGROESSE}`,
      feature.properties.LAWINENART && `Lawinenart: ${feature.properties.LAWINENART}`,
      feature.properties.LAWINENFEUCHTE && `Lawinenfeuchte: ${feature.properties.LAWINENFEUCHTE}`,
    ]
      .filter((s) => !!s)
      .join(" – "),
    elevation: undefined,
    eventDate: new Date(eventDate),
    latitude: feature.geometry?.coordinates?.[0]?.[1],
    locationName: feature.properties.BEZEICHNUNG,
    longitude: feature.geometry?.coordinates?.[0]?.[0],
    region: undefined,
  };
}

export interface SperreProperties {
  TKOMMISSIONSEQ: number;
  BEZEICHNUNG: string;
  SPERRETYP: string;
  SPERREBEREICH: null | string;
  OBJECTID: number;
  TSTAMMSPERRORTESEQ: number;
  MANDANTSEQ: number;
  BEGINN: number;
  ENDE: null;
  TBEOBACHTUNGSEQ?: number;
}

export type LwdKipSperren = GeoJSON.FeatureCollection<GeoJSON.LineString, SperreProperties>;

export function convertLwdKipSperren(
  feature: GeoJSON.Feature<GeoJSON.LineString, SperreProperties>,
): GenericObservation {
  return {
    $id: `Sperre-${feature.properties.TBEOBACHTUNGSEQ}`,
    $data: feature.properties,
    $source: ObservationSource.LwdKip,
    $type: ObservationType.Closure,
    stability: getLwdKipSperreStability(feature),
    aspect: undefined,
    authorName: undefined,
    content: [feature.properties.SPERRETYP, feature.properties.SPERREBEREICH].filter((s) => !!s).join(" – "),
    elevation: undefined,
    eventDate: new Date(feature.properties.BEGINN),
    latitude: feature.geometry?.coordinates?.[0]?.[1],
    locationName: feature.properties.BEZEICHNUNG,
    longitude: feature.geometry?.coordinates?.[0]?.[0],
    region: undefined,
  };
}

function getLwdKipBeobachtungStability(feature: GeoJSON.Feature<GeoJSON.Point, BeobachtungProperties>): Stability {
  return null;
}

function getLwdKipSprengerfolgStability(feature: GeoJSON.Feature<GeoJSON.Point, SprengerfolgProperties>): Stability {
  switch (feature.properties.SPRENGERFOLG || "") {
    case "kein Erfolg":
      return Stability.good;
    case "mäßiger Erfolg":
      return Stability.fair;
    case "guter Erfolg":
      return Stability.poor;
    case "sehr guter Erfolg":
      return Stability.very_poor;
    default:
      return null;
  }
}

function getLwdKipLawinenabgangStability(
  feature: GeoJSON.Feature<GeoJSON.LineString, LawinenabgangProperties>,
): Stability {
  return Stability.poor;
}

function getLwdKipSperreStability(feature: GeoJSON.Feature<GeoJSON.LineString, SperreProperties>): Stability {
  return Stability.very_poor;
}
