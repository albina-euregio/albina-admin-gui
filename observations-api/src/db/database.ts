import * as mysql from "mysql2/promise";
import { augmentRegion } from "../../../src/app/providers/regions-service/augmentRegion";
import {
  findExistingObservation,
  type Aspect,
  type AvalancheProblem,
  type DangerPattern,
  type ForecastSource,
  type GenericObservation,
  type ImportantObservation,
  type ObservationSource,
  type ObservationType,
  type Stability,
} from "../models";
import { augmentElevation } from "./elevation";

type GenericObservationTable = {
  REGION_ID: string;
  EVENT_DATE: Date;
  ASPECTS: string;
  OBS_TYPE: string;
  REPORT_DATE: Date;
  STABILITY: string;
  EXTRA_DIALOG_ROWS: string;
  LONGITUDE: number;
  ELEVATION: number;
  IMPORTANT_OBSERVATION: string;
  AUTHOR_NAME: string;
  EXTERNAL_URL: string;
  ELEVATION_LOWER_BOUND: number;
  AVALANCHE_PROBLEMS: string;
  SOURCE: string;
  EXTERNAL_IMG: string;
  ELEVATION_UPPER_BOUND: number;
  ID: string;
  DANGER_PATTERNS: string;
  OBS_DATA: string;
  LATITUDE: number;
  LOCATION_NAME: string;
  OBS_CONTENT: string;
};

export async function createConnection(): Promise<mysql.Connection> {
  return await mysql.createConnection({
    host: "127.0.0.1",
    port: 3306,
    user: "ais",
    password: "MD>5:X*n%)1V",
    database: "albina_dev",
  });
}

export async function augmentAndInsertObservation(
  connection: mysql.Connection,
  o: GenericObservation,
  existing: GenericObservation[] = [],
) {
  const ex = findExistingObservation(existing, o);
  if (!ex || o.latitude !== ex.latitude || o.longitude !== ex.longitude) {
    augmentRegion(o);
    await augmentElevation(o);
  }
  return await insertObservation(connection, o);
}

export async function insertObservation(connection: mysql.Connection, o: GenericObservation) {
  if (!o) return;
  console.log("Inserting observation", o.$id, o.$source);
  const data: GenericObservationTable = {
    ID: o.$id,
    SOURCE: o.$source,
    OBS_TYPE: o.$type ?? null,
    EXTERNAL_URL: o.$externalURL ?? null,
    EXTERNAL_IMG: Array.isArray(o.$externalImgs) ? o.$externalImgs.join("\n") : null,
    STABILITY: o.stability ?? null,
    ASPECTS: Array.isArray(o.aspect) ? o.aspect.join(",") : o.aspect ?? null,
    AUTHOR_NAME: o.authorName ?? null,
    OBS_CONTENT: o.content ?? null,
    OBS_DATA: o.$data ? JSON.stringify(o.$data) : null,
    ELEVATION: o.elevation ?? null,
    ELEVATION_LOWER_BOUND: o.elevationLowerBound ?? null,
    ELEVATION_UPPER_BOUND: o.elevationUpperBound ?? null,
    EVENT_DATE: o.eventDate ?? null,
    LATITUDE: o.latitude ?? null,
    LOCATION_NAME: o.locationName ?? null,
    LONGITUDE: o.longitude ?? null,
    REGION_ID: o.region ?? null,
    REPORT_DATE: o.reportDate ?? null,
    AVALANCHE_PROBLEMS: o.avalancheProblems?.join(",") ?? null,
    DANGER_PATTERNS: o.dangerPatterns?.join(",") ?? null,
    IMPORTANT_OBSERVATION: o.importantObservations?.join(",") ?? null,
    EXTRA_DIALOG_ROWS: o.$extraDialogRows ? JSON.stringify(o.$extraDialogRows) : null,
  };
  const sql = `
  REPLACE INTO generic_observations
  (${Object.keys(data).join(", ")})
  VALUES (${Object.keys(data)
    .map(() => "?")
    .join(", ")})
  `;
  try {
    return await connection.execute(sql, Object.values(data));
  } catch (err) {
    if ((err as mysql.QueryError).code === "ER_DUP_ENTRY") {
      console.debug("Skipping existing observation", o.$id, data);
      return;
    }
    console.error(err, JSON.stringify(o));
    throw err;
  }
}

export async function deleteObservation(connection: mysql.Connection, o: GenericObservation) {
  if (!o || !o.$id) return;
  console.log("Deleting observation", o.$id, o.$source);
  const sql = "DELETE FROM generic_observations WHERE ID = ?";
  try {
    return await connection.execute(sql, [o.$id]);
  } catch (err) {
    console.error(err, JSON.stringify(o));
    throw err;
  }
}

export async function selectObservations(
  connection: mysql.Connection,
  startDate: Date,
  endDate: Date,
): Promise<GenericObservation[]> {
  const sql = "SELECT * FROM generic_observations WHERE event_date BETWEEN ? AND ?";
  const values = [startDate.toISOString(), endDate.toISOString()];
  const [rows] = await connection.query(sql, values);
  return (rows as unknown as GenericObservationTable[]).map(
    (row): GenericObservation => ({
      $id: row.ID,
      $source: row.SOURCE as ObservationSource | ForecastSource,
      $type: (row.OBS_TYPE as ObservationType) ?? undefined,
      $externalURL: row.EXTERNAL_URL ?? undefined,
      $externalImgs: row.EXTERNAL_IMG ? row.EXTERNAL_IMG.split("\n") : undefined,
      stability: (row.STABILITY as Stability) ?? undefined,
      aspect: (row.ASPECTS?.split(",")?.[0] as Aspect) ?? undefined,
      authorName: row.AUTHOR_NAME ?? undefined,
      content: row.OBS_CONTENT ?? undefined,
      $data: /^{.*}$/.test(row.OBS_DATA) ? JSON.parse(row.OBS_DATA) : row.OBS_DATA ?? undefined,
      $extraDialogRows: /^\[.*\]$/.test(row.EXTRA_DIALOG_ROWS)
        ? JSON.parse(row.EXTRA_DIALOG_ROWS)
        : row.EXTRA_DIALOG_ROWS ?? undefined,
      elevation: row.ELEVATION ?? undefined,
      elevationLowerBound: row.ELEVATION_LOWER_BOUND ?? undefined,
      elevationUpperBound: row.ELEVATION_UPPER_BOUND ?? undefined,
      eventDate: row.EVENT_DATE ?? undefined,
      latitude: row.LATITUDE ?? undefined,
      locationName: row.LOCATION_NAME ?? undefined,
      longitude: row.LONGITUDE ?? undefined,
      region: row.REGION_ID ?? undefined,
      reportDate: row.REPORT_DATE ?? undefined,
      avalancheProblems: (row.AVALANCHE_PROBLEMS || undefined)?.split(",") as AvalancheProblem[],
      dangerPatterns: (row.DANGER_PATTERNS || undefined)?.split(",") as DangerPattern[],
      importantObservations: (row.IMPORTANT_OBSERVATION || undefined)?.split(",") as ImportantObservation[],
    }),
  );
}
