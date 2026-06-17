#!/usr/bin/env node

const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

let XLSX = require("xlsx");

// Default Configuration
const EXCEL_FILE = "incidents.xlsm";
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

function getRegionId(regionName) {
  if (!regionName) return "AT-07"; // Fallback default region
  const name = String(regionName).trim().toLowerCase();
  return REGION_MAP[name] || "AT-07";
}

function parseExcelDate(serial, timeStr) {
  let date = null;
  if (typeof serial === "number") {
    const utc_days = Math.floor(serial - 25569);
    const utc_value = utc_days * 86400;
    date = new Date(utc_value * 1000);
  } else if (typeof serial === "string") {
    date = new Date(serial);
  }

  if (!date || isNaN(date.getTime())) {
    date = new Date();
  }

  if (timeStr && typeof timeStr === "string") {
    const parts = timeStr.trim().split(":");
    if (parts.length >= 2) {
      const hours = parseInt(parts[0], 10);
      const minutes = parseInt(parts[1], 10);
      if (!isNaN(hours) && !isNaN(minutes)) {
        date.setUTCHours(hours, minutes, 0, 0);
        return date;
      }
    }
  }
  date.setUTCHours(12, 0, 0, 0); // Default to noon
  return date;
}

function mapDangerRating(val) {
  if (val === undefined || val === null) return "no_rating";
  const num = parseInt(val, 10);
  switch (num) {
    case 1:
      return "low";
    case 2:
      return "moderate";
    case 3:
      return "considerable";
    case 4:
      return "high";
    case 5:
      return "very_high";
    default:
      return "no_rating";
  }
}

function getAvalancheProblems(row) {
  const problems = [];
  const p1 = row["1. relevantes Lawinenproblem"];
  const p2 = row["2. relevantes Lawinenproblem"];

  function mapProblem(prob) {
    if (!prob) return null;
    const val = String(prob).trim().toLowerCase();
    if (val.includes("triebschnee") || val.includes("wind")) return "wind_slab";
    if (val.includes("alt") || val.includes("persistent")) return "persistent_weak_layers";
    if (val.includes("gleit")) return "gliding_snow";
    if (val.includes("neu")) return "new_snow";
    if (val.includes("nass")) return "wet_snow";
    if (val.includes("wechte")) return "cornices";
    return "no_distinct_avalanche_problem";
  }

  const mp1 = mapProblem(p1);
  if (mp1) problems.push(mp1);
  const mp2 = mapProblem(p2);
  if (mp2 && !problems.includes(mp2)) problems.push(mp2);

  return problems;
}

function getDangerPatterns(row) {
  const patterns = [];
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

function mapAvalancheSize(size) {
  if (size === undefined || size === null) return "medium";
  const val = String(size).trim().toLowerCase();
  if (val === "1" || val.includes("klein")) return "small";
  if (val === "2" || val.includes("mittel")) return "medium";
  if (val === "3" || val.includes("groß") || val.includes("gross")) return "large";
  if (val === "4" || val.includes("sehr groß") || val.includes("sehr gross")) return "very_large";
  if (val === "5" || val.includes("extrem")) return "extreme";
  return "medium";
}

function mapAvalancheType(type) {
  if (!type) return "unknown";
  const val = String(type).trim().toLowerCase();
  if (val.includes("brett") || val.includes("kunstschnee")) return "slab";
  if (val.includes("locker")) return "loose";
  if (val.includes("gleit")) return "glide";
  return "unknown";
}

function mapRelevantAvalancheProblem(prob) {
  if (!prob) return null;
  const val = String(prob).trim().toLowerCase();
  if (val.includes("triebschnee")) return "wind_slab";
  if (val.includes("alt")) return "persistent_weak_layers";
  if (val.includes("gleit")) return "gliding_snow";
  if (val.includes("neu")) return "new_snow";
  if (val.includes("nass")) return "wet_snow";
  return null;
}

function mapTrigger(trigger) {
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

function mapNaturalTrigger(trigger) {
  if (!trigger) return null;
  const val = String(trigger).trim().toLowerCase();
  if (val.includes("wechte")) return "CorniceFall";
  return "Natural";
}

// Ensure trigger mappings fit schema
function mapPersonTrigger(trigger) {
  return "PersonAccidental";
}

function mapExplosivesTrigger(trigger) {
  return "HandThrownOrPlaced";
}

function mapVehicleTrigger(trigger) {
  return "OverSnowVehicle";
}

function mapAspect(aspect) {
  if (!aspect) return null;
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
  return map[val] || null;
}

function mapMoisture(moisture) {
  if (!moisture) return "Unknown";
  const val = String(moisture).trim().toLowerCase();
  if (val.includes("trocken") || val.includes("torcken")) return "Dry";
  if (val.includes("feucht")) return "Moist";
  if (val.includes("nass")) return "Wet";
  return "Unknown";
}

function mapTerrainType(terrain) {
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

function mapActivity(act) {
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

function mapTravelDirection(dir) {
  if (!dir) return null;
  const val = String(dir).trim().toLowerCase();
  if (val.includes("aufstieg") || val.includes("aufsteig")) return "Ascending";
  if (val.includes("abfahrt") || val.includes("abstieg")) return "Descending";
  if (val.includes("stehen")) return "Stationary";
  return null;
}

function mapGear(gear) {
  if (!gear) return "Unknown";
  const val = String(gear).trim().toLowerCase();
  if (val === "ja") return "All";
  if (val === "nein") return "None";
  if (val === "teilweise" || val === "einige") return "Some";
  return "Unknown";
}

function mapCountry(nat) {
  if (!nat) return "Austria";
  const val = String(nat).trim().toLowerCase();
  if (val.includes("oesterreich") || val.includes("österreich") || val === "at") return "Austria";
  if (val.includes("deutsch") || val === "de") return "Germany";
  if (val.includes("italien") || val === "it") return "Italy";
  if (val.includes("schweiz") || val === "ch") return "Switzerland";
  return "Austria";
}

function getGroupInformation(row) {
  const involvement = row["Personenbeteiligung"];
  if (involvement !== "ja" && involvement !== "Ja") return [];

  return [
    {
      anonymousGroupIdentifier: "group_1",
      groupType: row["gefuehrte Tour"] === "ja" ? "Club" : "RecreationalFamilyFriends",
      groupSize: typeof row["beteiligte Personen [N]"] === "number" ? row["beteiligte Personen [N]"] : null,
      groupSizeAccuracy: typeof row["beteiligte Personen [N]"] === "number" ? "Exact" : "Unknown",
      incidentTerrainType: mapTerrainType(row["Gelaende"]),
      typeOfControlledTerrain: null,
      incidentActivity: mapActivity(row["Taetigkeit"]),
      travelDirection: mapTravelDirection(row["Aufstieg/Abfahrt"]),
      vehicleType: null,
      avalancheGear: mapGear(row["Standardausruestung"]),
      groupInformationComment: null,
    },
  ];
}

function getVictimInformation(row) {
  const victims = [];
  const fatalCount = parseInt(row["getoetete Personen"], 10) || 0;
  const injuredCount = parseInt(row["verletzte Personen"], 10) || 0;
  const uninjuredCount = parseInt(row["unverletzte Personen"], 10) || 0;

  const totalVictims = fatalCount + injuredCount + uninjuredCount;
  if (totalVictims === 0) return [];

  let fullyBuriedLeft = parseInt(row["totalverschuettete Personen"], 10) || 0;
  let partlyBuriedLeft = parseInt(row["teilverschuettete Personen"], 10) || 0;

  function createVictim(status) {
    return {
      anonymousVictimIdentifier: `victim_${victims.length + 1}`,
      anonymousGroupIdentifier: "group_1",
      caught: "Involved",
      fatalInjured: status,
      burialDegree: "Unknown",
      age: "Unknown",
      gender: "Other",
      country: mapCountry(row["Nationalität"]),
      workingAtTime: "No",
      leaderAtTime: "No",
      professionalCertification: "None",
      avalancheTraining: "None",
      yearsActive: "Unknown",
      transceiver: "Unknown",
      shovel: "Unknown",
      probe: "Unknown",
      airbag: "Unknown",
      helmet: "Unknown",
      terrainTrap: "None",
      burialDepth: null,
      burialDuration: null,
      primaryLocationMethod: "Unknown",
      rescuedBy: "Unknown",
      medicalIntervention: "None",
      estimatedTimeOfDeath: "Unknown",
      causeOfDeath: "Unknown",
      respiratoryCavity: "Unknown",
      injurySeverity: status === "Fatal" ? "Major" : status === "Injured" ? "Moderate" : "Minor",
      victimInformationComment: null,
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

function convertRowToIncidentJson(row) {
  const serialDate = row["Datum"];
  const timeStr = row["Uhrzeit"];
  const parsedDate = parseExcelDate(serialDate, timeStr);

  const regionName = row["Region"];
  const regionId = getRegionId(regionName);

  const trigger = mapTrigger(row["Ausloesart"]);

  const data = {
    author: "Excel Import",
    authorAffiliation: "Import",
    timestamp: new Date().toISOString(),
    dateTime: parsedDate.toISOString(),
    timeAccuracy: timeStr ? "exact" : "P1D",
    sourceOfInformation: ["AWSInternal"],
    publicAvalancheWarningService: "AWS",
    dangerRating: mapDangerRating(row["regionale Gefahrenstufe"]),
    avalancheProblem: getAvalancheProblems(row),
    dangerPattern: getDangerPatterns(row),
    reportStatus: "Verified",
    publicExternalLinks: null,
    privateExternalLinks: null,
    privateExternalDatabaseLinks: null,
    generalInformationComment: row["Allgemeine Bemerkungen"] || null,

    location: row["Ereignisort"] || "Unknown",
    latitude: typeof row["Latitude"] === "number" ? row["Latitude"] : null,
    longitude: typeof row["Longitude"] === "number" ? row["Longitude"] : null,
    locationAccuracy: row["Koord. Verifiziiert"] === "ja" ? "exact" : "unknown",
    lineCoordinatesText: null,
    polygonCoordinatesText: null,
    country: null,
    region: regionName || null,
    municipality: null,
    avalancheRegion: row["Subregion alt"] || null,
    locationInformationComment: null,

    multipleAvalanches: null,
    avalancheSize: mapAvalancheSize(row["Lawinengroesse"]),
    avalancheType: mapAvalancheType(row["Lawinentyp"]),
    relevantAvalancheProblem: mapRelevantAvalancheProblem(row["1. relevantes Lawinenproblem"]),
    trigger: trigger,
    natural: trigger === "natural" ? mapNaturalTrigger(row["Ausloesart"]) : null,
    person: trigger === "person" ? mapPersonTrigger(row["Ausloesart"]) : null,
    additionalLoad: null,
    explosives: trigger === "explosives" ? mapExplosivesTrigger(row["Ausloesart"]) : null,
    vehicle: trigger === "vehicle" ? mapVehicleTrigger(row["Ausloesart"]) : null,
    accidentalControlled: null,
    remoteTriggering: row["Fernausloesung"] === "ja" ? "Yes" : "No",
    startZoneAspect: mapAspect(row["Exposition des Anrissgebiets"]),
    startZoneAspectAccuracy: row["Exposition des Anrissgebiets"] ? "Accurate" : "Uncertain",
    startZoneElevation: typeof row["Seehoehe des Anrisses [m]"] === "number" ? row["Seehoehe des Anrisses [m]"] : null,
    startZoneElevationAccuracy: "unknown",
    startZoneIncline:
      typeof row["max. Neigung des Anrissgebiets"] === "number" ? row["max. Neigung des Anrissgebiets"] : null,
    startZoneTerrainType: null,
    slabWidth: typeof row["Breite des Anrissgebiets [m]"] === "number" ? row["Breite des Anrissgebiets [m]"] : null,
    crownDepthAvg:
      typeof row["Anrisshoehe Durchschnitt [cm]"] === "number" ? row["Anrisshoehe Durchschnitt [cm]"] : null,
    crownDepthMin: typeof row["Anrisshoehe Minimum [cm]"] === "number" ? row["Anrisshoehe Minimum [cm]"] : null,
    crownDepthMax: typeof row["Anrisshoehe Maximum [cm]"] === "number" ? row["Anrisshoehe Maximum [cm]"] : null,
    avalancheLength: typeof row["Laenge der Lawinenbahn [m]"] === "number" ? row["Laenge der Lawinenbahn [m]"] : null,
    weakLayerName: null,
    weakLayerGrainType1: null,
    weakLayerGrainSize1: null,
    weakLayerGrainType2: null,
    weakLayerGrainSize2: null,
    weakLayerLocation: null,
    bedSurfaceStepped: null,
    avalancheMoistureStartZone: mapMoisture(row["Lawinenfeuchtigkeit"]),
    avalancheMoistureDeposit: null,
    depositHeight: null,
    depositWidth: null,
    depositElevation: null,
    debrisType: null,
    debrisDensity: null,
    avalancheDetailsComment: null,

    personInvolvement:
      row["Personenbeteiligung"] === "ja" || row["Personenbeteiligung"] === "Ja"
        ? "Yes"
        : row["Personenbeteiligung"] === "nein"
          ? "No"
          : "Unknown",
    otherDamages: "No",
    damagedAssets: null,
    otherDamagesComment: null,

    groupInformation: getGroupInformation(row),
    victimInformation: getVictimInformation(row),

    recentSlabAvalanches: null,
    signsOfInstability: null,
    recentLoading: null,
    criticalWarming: null,
    incidentLedePublic: true,
    incidentLede: null,
    incidentDescriptionPublic: true,
    incidentDescription: row["Detailbericht"] || row["LPD Bericht"] || null,
    weatherDescriptionPublic: true,
    weatherDescription: null,
    avalancheDescriptionPublic: true,
    avalancheDescription: null,
    snowpackDescriptionPublic: true,
    snowpackDescription: null,
    takeAwaysPublic: true,
    takeAways: null,
    incidentAnalysisComment: row["Bemerkungen Lawinensituation"] || null,
    attachments: [],
  };

  return {
    id: crypto.randomUUID(),
    region_id: regionId,
    created_at: parsedDate.toISOString().replace("T", " ").replace("Z", ""),
    updated_at: new Date().toISOString().replace("T", " ").replace("Z", ""),
    data: JSON.stringify(data),
  };
}

function main() {
  console.log("Loading workbook from:", EXCEL_FILE);
  if (!fs.existsSync(EXCEL_FILE)) {
    console.error(`Error: File not found at ${EXCEL_FILE}`);
    process.exit(1);
  }

  const workbook = XLSX.readFile(EXCEL_FILE);
  const sheet = workbook.Sheets["incidents"];
  if (!sheet) {
    console.error("Error: Could not find sheet 'incidents' in workbook");
    process.exit(1);
  }

  const rows = XLSX.utils.sheet_to_json(sheet);
  console.log(`Parsed ${rows.length} rows from Excel sheet.`);

  const sqlStatements = [
    "-- SQL script to import incidents from excel",
    "-- Generated by import-incidents.js",
    "SET FOREIGN_KEY_CHECKS=0;",
    "TRUNCATE TABLE incidents;",
  ];

  let successCount = 0;
  rows.forEach((row, idx) => {
    try {
      // Ignore rows that don't have a number
      if (!row["Nr."]) {
        return;
      }

      const incident = convertRowToIncidentJson(row);

      // Escape single quotes for SQL insertion
      const escapedData = incident.data.replace(/'/g, "''");

      const sql = `INSERT INTO incidents (id, region_id, created_at, updated_at, data) VALUES ('${incident.id}', '${incident.region_id}', '${incident.created_at}', '${incident.updated_at}', '${escapedData}');`;
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
