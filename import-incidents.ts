#!/usr/bin/env node

import crypto from "crypto";
import fs from "fs";
import path from "path";

import XLSX from "xlsx";

import {
  AvalancheProblem,
  DangerRating,
  IncidentAvalancheSize,
  IncidentAvalancheType,
} from "./observations-api/src/generic-observation";
import {
  GroupInformation,
  IncidentReport,
  PartialIncidentReportSchema,
  toPublicIncidentReport,
  VictimInformation,
} from "./src/app/incidents/incident-report.model";

// Default Configuration
const EXCEL_FILE = "/tmp/incidents.xlsm";
const API_BASE = "https://dev.avalanche.report/api";
const HEADERS = {
  Authorization: "Bearer ey...",
  "Content-Type": "application/json",
};

// Fallback geolocation for entries without coordinates
const INNSBRUCK = { latitude: 47.2692, longitude: 11.4041 };

// Mappings Configuration
const REGION_MAP = {
  tirol: "AT-07",
  südtirol: "IT-32-BZ",
  suedtirol: "IT-32-BZ",
  trentino: "IT-32-TN",
  kärnten: "AT-02",
  kaernten: "AT-02",
  "val d'aran": "ES-CT-L",
  "val d’aran": "ES-CT-L",
};

const SUBREGIONS_MAP = {
  "Allgäuer Alpen": "AT-07-01",
  "Allgäuer Alpen Ost": "AT-07-01",
  "Ammergauer Alpen": "AT-07-02-01",
  "Ammergauer Alpen Süd": "AT-07-02-01",
  "Brandenberger Alpen": "AT-07-05",
  "Deferegger Alpen Ost": "AT-07-27",
  "Defregger Alpen Ost": "AT-07-27",
  Glocknergruppe: "AT-07-26-01",
  "Glocknergruppe Süd": "AT-07-26-01",
  Glockturmgruppe: "AT-07-19",
  Goldried: "AT-07-26-02",
  Grieskogelgruppe: "AT-07-09",
  "Gurgler Gruppe": "AT-07-21",
  "Kaisergebirge - Waidringer Alpen": "AT-07-06",
  Kalkkögel: "AT-07-14-04",
  "Karnische Alpen Osttirol": "AT-07-29-01",
  Karwendel: "AT-07-04-01",
  "Karwendel Ost": "AT-07-04-02",
  "Karwendel West": "AT-07-04-01",
  Karwendl: "AT-07-04-01",
  Kaunergrat: "AT-07-14-01",
  Kitzbühel: "AT-07-18",
  "Kitzbüheler Alpen": "AT-07-17-02",
  "Kitzbüheler Alpen Brixental": "AT-07-17-02",
  "Kitzbüheler Alpen Wildschönau": "AT-07-17-01",
  "Kitzbüheler Alpen Wildseeloder": "AT-07-18",
  "Kitzbüheler Alpen Wilschönau": "AT-07-17-01",
  "Kitzbühler Alpen Brixental": "AT-07-17-02",
  "Kitzbühler Alpen Wildschönau": "AT-07-17-01",
  "Kitzbühler Alpen Wildseeloder": "AT-07-18",
  "Kühtai - Geigenkamm": "AT-07-14-02",
  "Lasörling Gruppe": "AT-07-25",
  "Lechtaler Alpen Mitte": "AT-07-08",
  "Lechtaler Alpen Ost": "AT-07-02-02",
  "Lechtaler Alpen west": "AT-07-07",
  "Lechtaler Alpen West": "AT-07-07",
  "Lienzer Dolomiten": "AT-07-29-02",
  "Mieminger Gebirge": "AT-07-03",
  "Nördl. Ötztaler- & Stubaier Alpen": "AT-07-09",
  "Nördl. Zillertaler Alpen": "AT-07-23-01",
  "Nördliche Ötztaler- und Stubaier Alpen": "AT-07-09",
  "Nördliche Zillertaler Alpen": "AT-07-23-01",
  "Östl. Deferegger Alpen": "AT-07-27",
  "Östl. Kitzbüheler Alpen": "AT-07-18",
  "Östl. Lechtaler A. - Ammergauer A.": "AT-07-02-02",
  "Östl. Tuxer Alpen": "AT-07-16",
  "Östl. Verwallgruppe": "AT-07-11",
  "Östliche Deferegger Alpen": "AT-07-27",
  "Östliche Kitzbüheler Alpen": "AT-07-18",
  "Östliche Kitzbühler Alpen": "AT-07-18",
  "Östliche Lechtaler Alpen": "AT-07-02-02",
  "Östliche Lechtaler Alpen - Ammergebirge": "AT-07-02-02",
  "Östliche Riesenfernergruppe": "AT-07-27",
  "Östliche Rieserfernergruppe": "AT-07-27",
  "östliche Tuxer Alpen": "AT-07-16",
  "Östliche Tuxer Alpen": "AT-07-16",
  "Östliche Verwallgruppe": "AT-07-11",
  "Östliches Karwendel": "AT-07-04-02",
  Samnaungruppe: "AT-07-13",
  Schobergruppe: "AT-07-28",
  "Schobergruppe West": "AT-07-28",
  Schobergrupppe: "AT-07-28",
  "Sellrain - Alpeiner Berge": "AT-07-14-03",
  Serleskamm: "AT-07-14-05",
  Silvretta: "AT-07-12",
  "Silvretta Ost": "AT-07-12",
  "Stuabier Alpen Mitte": "AT-07-22",
  "Stubaier Alpen Mitte": "AT-07-22",
  "Tuxer Alpen Ost": "AT-07-16",
  "Tuxer Alpen West": "AT-07-15",
  "Tuxer Hauptkamm": "AT-07-16",
  Venedigergruppe: "AT-07-24",
  "Venedigergruppe Süd": "AT-07-24",
  "Verwallgruppe Mitte": "AT-07-10",
  "Verwallgruppe Ost": "AT-07-11",
  Weißkugelgruppe: "AT-07-20",
  "Westl. Kitzbüheler Alpen": "AT-07-17-01",
  "Westl. Lechtaler Alpen": "AT-07-07",
  "Westl. Tuxer Alpen": "AT-07-15",
  "Westl. Verwallgruppe": "AT-07-10",
  "Westliche Kitzbüheler Alpen": "AT-07-17-01",
  "Westliche Kitzbühler Alpen": "AT-07-17-01",
  "Westliche Lechtaler Alpen": "AT-07-07",
  "Westliche Tuxer Alpen": "AT-07-15",
  "Westliche Verwallgruppe": "AT-07-10",
  "Westliches Karwendel": "AT-07-04-01",
  "Wilder Kaiser - Waidringer Alpen": "AT-07-06",
  "Zentrale Kitzbüheler Alpen": "AT-07-17-02",
  "Zentrale Lechtaler Alpen": "AT-07-08",
  "Zentrale Stubaier Alpen": "AT-07-22",
  "Zillertaler Alpen Nordost": "AT-07-23-01",
  "Zillertaler Alpen Nordwest": "AT-07-23-02",
};

function getRegionId(regionName: string) {
  if (!regionName) return "AT-07"; // Fallback default region
  const name = String(regionName).trim().toLowerCase();
  return REGION_MAP[name] || "AT-07";
}

function parseExcelDate(serial: string | Date, timeStr: string): Date {
  let date = null;
  if (typeof serial === "string" && /^\d{5}$/.test(serial)) {
    // Excel serial date (1900 date system, incl. the fictitious 1900-02-29) → epoch 1899-12-30
    const d = new Date(Date.UTC(1899, 11, 30) + +serial * 86400000);
    const pad = (n: number) => String(n).padStart(2, "0");
    serial = `${pad(d.getUTCDate())}.${pad(d.getUTCMonth() + 1)}.${d.getUTCFullYear()}`;
  }
  if (typeof serial === "string") {
    // parse DD.MM.YYYY
    const match = serial.trim().match(/^(\d{1,2})[/.](\d{1,2})[/.](\d{4})$/);
    if (match) {
      const [, day, month, year] = match;
      date = new Date(+year, +month - 1, +day);
    }
  }

  if (!date || isNaN(date.getTime())) {
    throw new Error(`Unsupported date ${JSON.stringify(serial)}`);
  }

  if (typeof timeStr === "string") {
    date.setHours(12, 0, 0, 0); // Default to noon
    const parts = timeStr.trim().split(":");
    if (parts.length >= 2) {
      const hours = parseInt(parts[0], 10);
      const minutes = parseInt(parts[1], 10);
      if (!isNaN(hours) && !isNaN(minutes)) {
        date.setHours(hours, minutes, 0, 0);
      }
    }
  } else {
    date.setHours(12, 0, 0, 0); // Default to noon
  }
  return date;
}

function mapDangerRating(val: string | null | undefined): IncidentReport["dangerRating"] {
  if (val === undefined || val === null) return DangerRating.no_rating;
  const num = parseInt(val, 10);
  switch (num) {
    case 1:
      return DangerRating.low;
    case 2:
      return DangerRating.moderate;
    case 3:
      return DangerRating.considerable;
    case 4:
      return DangerRating.high;
    case 5:
      return DangerRating.very_high;
    default:
      return DangerRating.no_rating;
  }
}

function getAvalancheProblems(row: Record<string, string>): IncidentReport["avalancheProblems"] {
  const problems: IncidentReport["avalancheProblems"] = [];
  const p1 = row["1. relevantes Lawinenproblem"];
  const p2 = row["2. relevantes Lawinenproblem"];

  function mapProblem(prob: string): AvalancheProblem | undefined {
    if (!prob) return undefined;
    const val = String(prob).trim().toLowerCase();
    if (val.includes("triebschnee") || val.includes("wind")) return AvalancheProblem.wind_slab;
    if (val.includes("alt") || val.includes("persistent")) return AvalancheProblem.persistent_weak_layers;
    if (val.includes("gleit")) return AvalancheProblem.gliding_snow;
    if (val.includes("neu")) return AvalancheProblem.new_snow;
    if (val.includes("nass")) return AvalancheProblem.wet_snow;
    if (val.includes("wechte")) return AvalancheProblem.cornices;
    return AvalancheProblem.no_distinct_avalanche_problem;
  }

  const mp1 = mapProblem(p1);
  if (mp1) {
    problems.push({ problemType: mp1 });
  }
  const mp2 = mapProblem(p2);
  if (mp2 && mp1 !== mp2) {
    problems.push({ problemType: mp2 });
  }

  return problems;
}

function getDangerPatterns(row: Record<string, string>): IncidentReport["dangerPattern"] {
  const patterns: IncidentReport["dangerPattern"] = [];
  const cols = ["1. relevantes gm", "2. relevantes gm", "3. relevantes gm"];
  cols.forEach((col) => {
    const val = row[col];
    if (val !== undefined && val !== null) {
      const cleaned = String(val).replace(/gm/gi, "").trim();
      const num = parseInt(cleaned, 10);
      if (!isNaN(num) && num >= 1 && num <= 10) {
        patterns.push(`dp${num}`);
      }
    }
  });
  return patterns;
}

function mapAvalancheSize(size: string | null | undefined): IncidentReport["avalancheSize"] {
  if (size === undefined || size === null) return IncidentAvalancheSize.medium;
  const val = String(size).trim().toLowerCase();
  if (val === "1" || val.includes("klein")) return IncidentAvalancheSize.small;
  if (val === "2" || val.includes("mittel")) return IncidentAvalancheSize.medium;
  if (val === "3" || val.includes("groß") || val.includes("gross")) return IncidentAvalancheSize.large;
  if (val === "4" || val.includes("sehr groß") || val.includes("sehr gross")) return IncidentAvalancheSize.very_large;
  if (val === "5" || val.includes("extrem")) return IncidentAvalancheSize.extreme;
  return IncidentAvalancheSize.medium;
}

function mapAvalancheType(type: string): IncidentReport["avalancheType"] {
  if (!type) return IncidentAvalancheType.unknown;
  const val = String(type).trim().toLowerCase();
  if (val.includes("brett") || val.includes("kunstschnee")) return IncidentAvalancheType.slab;
  if (val.includes("locker")) return IncidentAvalancheType.loose;
  if (val.includes("gleit")) return IncidentAvalancheType.glide;
  return IncidentAvalancheType.unknown;
}

function mapRelevantAvalancheProblem(prob: string): IncidentReport["relevantAvalancheProblem"] {
  if (!prob) return undefined;
  const val = String(prob).trim().toLowerCase();
  if (val.includes("triebschnee")) return AvalancheProblem.wind_slab;
  if (val.includes("alt")) return AvalancheProblem.persistent_weak_layers;
  if (val.includes("gleit")) return AvalancheProblem.gliding_snow;
  if (val.includes("neu")) return AvalancheProblem.new_snow;
  if (val.includes("nass")) return AvalancheProblem.wet_snow;
  return undefined;
}

function mapTrigger(trigger: string): IncidentReport["trigger"] {
  if (!trigger) return "unknown";
  const val = String(trigger).trim().toLowerCase();
  if (val.includes("spontan") || val === "wechte" || val.includes("wechtenbruch")) {
    if (val.includes("person")) return "person";
    return "natural";
  }
  if (val.includes("person") || val.includes("gruppe") || val.includes("skifahrer")) return "person";
  if (val.includes("sprengung") || val.includes("explosiv")) return "explosives";
  if (val.includes("piste") || val.includes("gerät") || val.includes("fahrzeug")) return "vehicle";
  return "unknown";
}

function mapNaturalTrigger(trigger: string): IncidentReport["natural"] {
  if (!trigger) return undefined;
  const val = String(trigger).trim().toLowerCase();
  if (val.includes("wechte")) return "CorniceFall";
  return "Natural";
}

// Ensure trigger mappings fit schema
function mapPersonTrigger(trigger: string): IncidentReport["person"] {
  return "PersonAccidental";
}

function mapExplosivesTrigger(trigger: string): IncidentReport["explosives"] {
  return "HandThrownOrPlaced";
}

function mapVehicleTrigger(trigger: string): IncidentReport["vehicle"] {
  return "OverSnowVehicle";
}

function mapAspect(aspect: string) {
  if (!aspect) return undefined;
  const val = String(aspect).trim().toUpperCase();
  const map = {
    N: "N",
    NO: "NE",
    NE: "NE",
    O: "E",
    E: "E",
    SO: "SE",
    SE: "SE",
    S: "S",
    SW: "SW",
    W: "W",
    NW: "NW",
  };
  return map[val] || undefined;
}

function mapMoisture(moisture: string) {
  if (!moisture) return "Unknown";
  const val = String(moisture).trim().toLowerCase();
  if (val.includes("trocken") || val.includes("torcken")) return "Dry";
  if (val.includes("feucht")) return "Moist";
  if (val.includes("nass")) return "Wet";
  return "Unknown";
}

function mapTerrainType(terrain: string) {
  if (!terrain) return "Unknown";
  const val = String(terrain).trim().toLowerCase();
  if (val.includes("frei") || val.includes("variant")) return "FreeTerrain";
  if (
    val.includes("piste") ||
    val.includes("weg") ||
    val.includes("straß") ||
    val.includes("siedlung") ||
    val.includes("bahn") ||
    val.includes("loipe")
  )
    return "ControlledTerrainOpen";
  return "Unknown";
}

function mapActivity(act: string) {
  if (!act) return "Unknown";
  const val = String(act).trim().toLowerCase();
  if (val.includes("tour")) return "Touring";
  if (val.includes("freeride")) return "Freeriding";
  if (val.includes("ski") || val.includes("snowboard")) return "SkiingSnowboarding";
  if (val.includes("schneeschuh")) return "Snowshoeing";
  if (val.includes("rodel")) return "Sledging";
  if (val.includes("wandern") || val.includes("spazieren")) return "HikingOnFoot";
  if (val.includes("eisklettern")) return "IceClimbing";
  if (val.includes("bergsteigen") || val.includes("klettersteig") || val.includes("stapfen")) return "Mountaineering";
  if (val.includes("fahrt") || val.includes("verkehr") || val.includes("räumen")) return "InsideVehicle";
  return "Unknown";
}

function mapTravelDirection(dir: string) {
  if (!dir) return undefined;
  const val = String(dir).trim().toLowerCase();
  if (val.includes("aufstieg") || val.includes("aufsteig")) return "Ascending";
  if (val.includes("abfahrt") || val.includes("abstieg")) return "Descending";
  if (val.includes("stehen")) return "Stationary";
  return undefined;
}

function mapGear(gear: string) {
  if (!gear) return "Unknown";
  const val = String(gear).trim().toLowerCase();
  if (val === "ja") return "All";
  if (val === "nein") return "None";
  if (val === "teilweise" || val === "einige") return "Some";
  return "Unknown";
}

function mapCountry(nat: string) {
  if (!nat) return "Austria";
  const val = String(nat).trim().toLowerCase();
  if (val.includes("oesterreich") || val.includes("österreich") || val === "at") return "Austria";
  if (val.includes("deutsch") || val === "de") return "Germany";
  if (val.includes("italien") || val === "it") return "Italy";
  if (val.includes("schweiz") || val === "ch") return "Switzerland";
  return "Austria";
}

function getGroupInformation(row: Record<string, string>): GroupInformation[] {
  const involvement = row["Personenbeteiligung"];
  if (involvement !== "ja" && involvement !== "Ja") return [];

  return [
    {
      id: crypto.randomUUID(),
      anonymousGroupIdentifier: "group_1",
      groupType: row["gefuehrte Tour"] === "ja" ? "Club" : "RecreationalFamilyFriends",
      groupSize: typeof row["beteiligte Personen [N]"] === "number" ? row["beteiligte Personen [N]"] : undefined,
      groupSizeAccuracy: typeof row["beteiligte Personen [N]"] === "number" ? "Exact" : "Unknown",
      incidentTerrainType: mapTerrainType(row["Gelaende"]),
      typeOfControlledTerrain: undefined,
      incidentActivity: mapActivity(row["Taetigkeit"]),
      travelDirection: mapTravelDirection(row["Aufstieg/Abfahrt"]),
      vehicleType: "Unknown",
      avalancheGear: mapGear(row["Standardausruestung"]),
      groupInformationComment: undefined,
    },
  ];
}

function getVictimInformation(row: Record<string, string>, groupId: VictimInformation["groupId"]) {
  const victims = [];
  const fatalCount = parseInt(row["getoetete Personen"], 10) || 0;
  const injuredCount = parseInt(row["verletzte Personen"], 10) || 0;
  const uninjuredCount = parseInt(row["unverletzte Personen"], 10) || 0;

  const totalVictims = fatalCount + injuredCount + uninjuredCount;
  if (totalVictims === 0) return [];

  let fullyBuriedLeft = parseInt(row["totalverschuettete Personen"], 10) || 0;
  let partlyBuriedLeft = parseInt(row["teilverschuettete Personen"], 10) || 0;

  function createVictim(status: VictimInformation["fatalInjured"]): VictimInformation {
    return {
      id: crypto.randomUUID(),
      anonymousVictimIdentifier: `victim_${victims.length + 1}`,
      groupId,
      caught: "Involved",
      fatalInjured: status,
      burialDegree: "Unknown",
      // age: "Unknown",
      gender: "Other",
      country: mapCountry(row["Nationalität"]),
      workingAtTime: "No",
      leaderAtTime: "No",
      professionalCertification: "None",
      avalancheTraining: "None",
      // yearsActive: "Unknown",
      // transceiver: "Unknown",
      // shovel: "Unknown",
      // probe: "Unknown",
      // airbag: "Unknown",
      // helmet: "Unknown",
      terrainTrap: "None",
      burialDepth: undefined,
      burialDuration: undefined,
      primaryLocationMethod: "Unknown",
      rescuedBy: "Unknown",
      medicalIntervention: "None",
      // estimatedTimeOfDeath: "Unknown",
      causeOfDeath: "Unknown",
      // respiratoryCavity: "Unknown",
      injurySeverity: status === "Fatal" ? "Major" : status === "Injured" ? "Moderate" : "Minor",
      victimInformationComment: undefined,
    };
  }

  // Create victim records based on severity counts
  for (let i = 0; i < fatalCount; i++) victims.push(createVictim("Fatal"));
  for (let i = 0; i < injuredCount; i++) victims.push(createVictim("Injured"));
  for (let i = 0; i < uninjuredCount; i++) victims.push(createVictim("Uninjured"));

  // Distribute burial status
  victims.forEach((v) => {
    if (fullyBuriedLeft > 0) {
      v.burialDegree = "FullyBuried";
      fullyBuriedLeft--;
    } else if (partlyBuriedLeft > 0) {
      v.burialDegree = "PartlyBuried";
      partlyBuriedLeft--;
    } else {
      v.burialDegree = "NotBuried";
    }

    if (row["LVS aktiviert"] === "ja") v.transceiver = "TransceiverOn";
    else if (row["LVS aktiviert"] === "nein") v.transceiver = "NoTransceiver";

    if (row["Airbagsystem"] === "ja") v.airbag = "AirbagDeployed";
    else if (row["Airbagsystem"] === "nein") v.airbag = "NoAirbag";
  });

  return victims;
}

function convertRowToIncidentJson(row: Record<string, string>) {
  const serialDate = row["Datum"];
  const timeStr = row["Uhrzeit"];
  const parsedDate = parseExcelDate(serialDate, timeStr);

  const regionName = row["Region"];

  const trigger = mapTrigger(row["Ausloesart"]);

  const groupInformation = getGroupInformation(row);
  const victimInformation = getVictimInformation(row, groupInformation?.[0]?.id);

  function number(value: string | number): number | undefined {
    const n = +value;
    return isFinite(n) ? n : undefined;
  }

  const hasCoordinates = number(row["Latitude"]) && number(row["Longitude"]);

  const data: IncidentReport = {
    author: "LE_Gesamtübersicht__seit_1992_",
    authorAffiliation: "LWD Tirol",
    timestamp: new Date().toISOString(),
    dateTime: parsedDate.toISOString() as unknown as Date,
    timeAccuracy: timeStr ? "exact" : "P1D",
    sourceOfInformation: ["AWSInternal"],
    publicAvalancheWarningService: "LWD Tirol",
    dangerRating: mapDangerRating(row["regionale Gefahrenstufe"]),
    avalancheProblem: getAvalancheProblems(row),
    dangerPattern: getDangerPatterns(row),
    reportStatus: hasCoordinates ? "Verified" : "InReview",
    publicExternalLinks: undefined,
    privateExternalLinks: undefined,
    privateExternalDatabaseLinks: undefined,
    generalInformationComment: row["Allgemeine Bemerkungen"] || "",

    location: row["Ereignisort"] || "Unknown",
    latitude: number(row["Latitude"]) || INNSBRUCK.latitude,
    longitude: number(row["Longitude"]) || INNSBRUCK.longitude,
    locationAccuracy: hasCoordinates ? (row["Koord. Verifiziiert"] === "ja" ? "exact" : "unknown") : "within50km",
    lineCoordinatesText: undefined,
    polygonCoordinatesText: undefined,
    country: undefined,
    region: regionName || null,
    municipality: undefined,
    avalancheRegion: SUBREGIONS_MAP[row["Subregion neu"]?.trim() ?? "xxx"] || null,
    locationInformationComment: undefined,

    multipleAvalanches: undefined,
    avalancheSize: mapAvalancheSize(row["Lawinengroesse"]),
    avalancheType: mapAvalancheType(row["Lawinentyp"]),
    relevantAvalancheProblem: mapRelevantAvalancheProblem(row["1. relevantes Lawinenproblem"]),
    trigger: trigger,
    natural: trigger === "natural" ? mapNaturalTrigger(row["Ausloesart"]) : undefined,
    person: trigger === "person" ? mapPersonTrigger(row["Ausloesart"]) : undefined,
    additionalLoad: undefined,
    explosives: trigger === "explosives" ? mapExplosivesTrigger(row["Ausloesart"]) : undefined,
    vehicle: trigger === "vehicle" ? mapVehicleTrigger(row["Ausloesart"]) : undefined,
    accidentalControlled: undefined,
    remoteTriggering: row["Fernausloesung"] === "ja" ? "Yes" : "No",
    startZoneAspect: mapAspect(row["Exposition des Anrissgebiets"]),
    startZoneAspectAccuracy: row["Exposition des Anrissgebiets"] ? "Accurate" : "Uncertain",
    startZoneElevation: number(row["Seehoehe des Anrisses [m]"]),
    startZoneElevationAccuracy: "unknown",
    startZoneIncline: number(row["max. Neigung des Anrissgebiets"]),
    startZoneTerrainType: undefined,
    slabWidth: number(row["Breite des Anrissgebiets [m]"]),
    crownDepthAvg: number(row["Anrisshoehe Durchschnitt [cm]"]),
    crownDepthMin: number(row["Anrisshoehe Minimum [cm]"]),
    crownDepthMax: number(row["Anrisshoehe Maximum [cm]"]),
    avalancheLength: number(row["Laenge der Lawinenbahn [m]"]),
    weakLayerName: undefined,
    weakLayerGrainType1: undefined,
    weakLayerGrainSize1: undefined,
    weakLayerGrainType2: undefined,
    weakLayerGrainSize2: undefined,
    weakLayerLocation: undefined,
    bedSurfaceStepped: undefined,
    avalancheMoistureStartZone: mapMoisture(row["Lawinenfeuchtigkeit"]),
    avalancheMoistureDeposit: undefined,
    depositHeight: undefined,
    depositWidth: undefined,
    depositElevation: undefined,
    debrisType: undefined,
    debrisDensity: undefined,
    avalancheDetailsComment: undefined,

    personInvolvement:
      row["Personenbeteiligung"] === "ja" || row["Personenbeteiligung"] === "Ja"
        ? "Yes"
        : row["Personenbeteiligung"] === "nein"
          ? "No"
          : "Unknown",
    otherDamages: "No",
    damagedAssets: [],
    otherDamagesComment: undefined,

    groupInformation,
    victimInformation,

    recentSlabAvalanches: undefined,
    signsOfInstability: undefined,
    recentLoading: undefined,
    criticalWarming: undefined,
    incidentLedePublic: true,
    incidentLede: undefined,
    incidentDescriptionPublic: true,
    incidentDescription: { de: row["Detailbericht"] || "" },
    weatherDescriptionPublic: true,
    weatherDescription: undefined,
    avalancheDescriptionPublic: true,
    avalancheDescription: undefined,
    snowpackDescriptionPublic: true,
    snowpackDescription: undefined,
    takeAwaysPublic: true,
    takeAways: undefined,
    incidentAnalysisComment: row["Bemerkungen Lawinensituation"] || null,
    attachments: [],
  };

  return data;
}

function main() {
  console.log("Loading workbook from:", EXCEL_FILE);
  if (!fs.existsSync(EXCEL_FILE)) {
    console.error(`Error: File not found at ${EXCEL_FILE}`);
    process.exit(1);
  }

  const workbook = XLSX.readFile(EXCEL_FILE, { dateNF: "dd.mm.yyyy" });
  const sheet = workbook.Sheets["++LE_Gesamtübersicht (seit 1992"];
  if (!sheet) {
    console.error("Error: Could not find sheet 'incidents' in workbook");
    process.exit(1);
  }

  const rows = XLSX.utils.sheet_to_json(sheet, { raw: false });
  console.log(`Parsed ${rows.length} rows from Excel sheet.`);

  rows.forEach(async (row, idx) => {
    try {
      const incident = convertRowToIncidentJson(row);
      const regionId = getRegionId(row["Region"]);
      const data = JSON.stringify(PartialIncidentReportSchema.parse(incident));

      // createIncident via HTTP POST see openapi.d.ts
      const request = await fetch(`${API_BASE}/incidents?region=${regionId}`, {
        method: "POST",
        headers: HEADERS,
        body: data,
      });
      console.log(JSON.parse(data)["dateTime"], request);
      if (!request.ok) {
        throw new Error(await request.text());
      }

      const created = (await request.json()) as { id?: string };
      if (incident.reportStatus === "Verified" && created.id) {
        const publicIncident = JSON.stringify(toPublicIncidentReport(incident));
        // publishIncident via HTTP POST see openapi.d.ts
        const publishRequest = await fetch(`${API_BASE}/incidents/${created.id}/publish`, {
          method: "POST",
          headers: HEADERS,
          body: publicIncident,
        });
        console.log(JSON.parse(data)["dateTime"], "published", created.id, publishRequest);
        if (!publishRequest.ok) {
          throw new Error(await publishRequest.text());
        }
      }
    } catch (e) {
      console.error(`Error processing row ${idx + 2}:`, e.message);
      const id = crypto.randomUUID();
      fs.writeFileSync(`${id}.json`, JSON.stringify({ ...row, error: e.message }));
    }
  });
}

main();
