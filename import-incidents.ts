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
  VictimInformation,
} from "./src/app/incidents/incident-report.model";

// Default Configuration
const EXCEL_FILE = "/tmp/incidents.xlsm";
const OUTPUT_SQL = "import_incidents.sql";

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

function getRegionId(regionName: string) {
  if (!regionName) return "AT-07"; // Fallback default region
  const name = String(regionName).trim().toLowerCase();
  return REGION_MAP[name] || "AT-07";
}

function parseExcelDate(serial: string | Date, timeStr: string): Date {
  let date = null;
  if (typeof serial === "string") {
    // parse DD.MM.YYYY
    const match = serial.trim().match(/^(\d{1,2})[/.](\d{1,2})[/.](\d{4})$/);
    if (match) {
      const [, day, month, year] = match;
      date = new Date(+year, +month - 1, +day);
    }
  }

  if (!date || isNaN(date.getTime())) {
    throw new Error(`Unsupported date ${serial}`);
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
  const regionId = getRegionId(regionName);

  const trigger = mapTrigger(row["Ausloesart"]);

  const groupInformation = getGroupInformation(row);
  const victimInformation = getVictimInformation(row, groupInformation?.[0]?.id);

  const data: IncidentReport = {
    author: "Excel Import",
    authorAffiliation: "Import",
    timestamp: new Date().toISOString(),
    dateTime: parsedDate.toISOString() as unknown as Date,
    timeAccuracy: timeStr ? "exact" : "P1D",
    sourceOfInformation: ["AWSInternal"],
    publicAvalancheWarningService: "AWS",
    dangerRating: mapDangerRating(row["regionale Gefahrenstufe"]),
    avalancheProblem: getAvalancheProblems(row),
    dangerPattern: getDangerPatterns(row),
    reportStatus: "Verified",
    publicExternalLinks: undefined,
    privateExternalLinks: undefined,
    privateExternalDatabaseLinks: undefined,
    generalInformationComment: row["Allgemeine Bemerkungen"] || "",

    location: row["Ereignisort"] || "Unknown",
    latitude: typeof row["Latitude"] === "number" ? row["Latitude"] : undefined,
    longitude: typeof row["Longitude"] === "number" ? row["Longitude"] : undefined,
    locationAccuracy: row["Koord. Verifiziiert"] === "ja" ? "exact" : "unknown",
    lineCoordinatesText: undefined,
    polygonCoordinatesText: undefined,
    country: undefined,
    region: regionName || null,
    municipality: undefined,
    avalancheRegion: row["Subregion alt"] || null,
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
    startZoneElevation:
      typeof row["Seehoehe des Anrisses [m]"] === "number" ? row["Seehoehe des Anrisses [m]"] : undefined,
    startZoneElevationAccuracy: "unknown",
    startZoneIncline:
      typeof row["max. Neigung des Anrissgebiets"] === "number" ? row["max. Neigung des Anrissgebiets"] : undefined,
    startZoneTerrainType: undefined,
    slabWidth:
      typeof row["Breite des Anrissgebiets [m]"] === "number" ? row["Breite des Anrissgebiets [m]"] : undefined,
    crownDepthAvg:
      typeof row["Anrisshoehe Durchschnitt [cm]"] === "number" ? row["Anrisshoehe Durchschnitt [cm]"] : undefined,
    crownDepthMin: typeof row["Anrisshoehe Minimum [cm]"] === "number" ? row["Anrisshoehe Minimum [cm]"] : undefined,
    crownDepthMax: typeof row["Anrisshoehe Maximum [cm]"] === "number" ? row["Anrisshoehe Maximum [cm]"] : undefined,
    avalancheLength:
      typeof row["Laenge der Lawinenbahn [m]"] === "number" ? row["Laenge der Lawinenbahn [m]"] : undefined,
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
    incidentDescription: { de: row["Detailbericht"] || row["LPD Bericht"] || "" },
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

  return {
    id: crypto.randomUUID(),
    region_id: regionId,
    created_at: parsedDate.toISOString().replace("T", " ").replace("Z", ""),
    updated_at: parsedDate.toISOString().replace("T", " ").replace("Z", ""),
    data: JSON.stringify(PartialIncidentReportSchema.parse(data))
      .replaceAll("\\t", "  ")
      .replaceAll("\\r", "")
      .replaceAll('\\"', "'")
      .replaceAll("\\", "\\\\"),
  };
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

  const sqlStatements = [
    "-- SQL script to import incidents from excel",
    "-- Generated by import-incidents.js",
    "SET FOREIGN_KEY_CHECKS=0;",
    "TRUNCATE TABLE incidents;",
  ];

  let successCount = 0;
  rows.forEach(async (row, idx) => {
    try {
      // Ignore rows that don't have a number
      if (!row["Nr."]) {
        return;
      }

      const incident = convertRowToIncidentJson(row);

      // createIncident via HTTP POST see openapi.d.ts
      // HTTP POST
      const request = await fetch("https://dev.avalanche.report/api/incidents?region=" + incident.region_id, {
        method: "POST",
        headers: {
          Authorization: "Bearer ey...",
          "Content-Type": "application/json",
        },
        body: incident.data,
      });
      console.log(incident.id, JSON.parse(incident.data)["dateTime"], request);
      if (!request.ok) {
        fs.writeFileSync(`${incident.id}.json`, incident.data);
        throw new Error(await request.text());
      }

      // Escape single quotes for SQL insertion
      const escapedData = incident.data.replace(/'/g, "''");

      const sql = `REPLACE INTO incidents (id, region_id, created_at, updated_at, data) VALUES ('${incident.id}', '${incident.region_id}', '${incident.created_at}', '${incident.updated_at}', '${escapedData}');`;
      sqlStatements.push(sql);
      successCount++;
    } catch (e) {
      console.error(`Error processing row ${idx + 2}:`, e.message);
    }
  });

  sqlStatements.push("SET FOREIGN_KEY_CHECKS=1;");

  console.log(`Writing ${successCount} SQL insert statements to: ${OUTPUT_SQL}`);
  fs.writeFileSync(OUTPUT_SQL, sqlStatements.join("\n"), "utf8");
  console.log("Done! You can import the SQL dump into your database by running:");
  console.log(`mysql -u <user> -p<password> -h <host> <dbname> < ${OUTPUT_SQL}`);
}

main();
