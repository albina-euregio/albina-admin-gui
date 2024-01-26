import mysql, { Connection, QueryError } from "mysql2/promise";
import { GenericObservation } from "../src/app/observations/models/generic-observation.model";
import type dayjs from "dayjs";

export async function createConnection() {
  return await mysql.createConnection({
    host: "127.0.0.1",
    port: 3306,
    user: "ais",
    password: "MD>5:X*n%)1V",
    database: "albina_dev",
  });
}
export async function insertObservation(connection: Connection, o: GenericObservation) {
  if (!o) return;
  console.log("Inserting observation", o.$id, o.$source);
  const data = {
    ID: o.$id,
    SOURCE: o.$source,
    OBS_TYPE: o.$type ?? null,
    EXTERNAL_URL: o.$externalURL ?? null,
    STABILITY: o.stability ?? null,
    ASPECTS: Array.isArray(o.aspect) ? o.aspect.join(",") : o.aspect ?? null,
    AUTHOR_NAME: o.authorName ?? null,
    OBS_CONTENT: o.content ?? null,
    OBS_DATA: o.$data ?? null,
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
  };
  const sql = `
  INSERT INTO generic_observations
  (${Object.keys(data).join(", ")})
  VALUES (${Object.keys(data)
    .map(() => "?")
    .join(", ")})
  ;`;
  try {
    await connection.execute(sql, Object.values(data));
  } catch (err) {
    if ((err as QueryError).code === "ER_DUP_ENTRY") {
      console.debug("Skipping existing observation", o.$id, o.$source);
      return;
    }
    throw err;
  }
}

export async function* selectObservations(
  connection: Connection,
  startDate: dayjs.Dayjs,
  endDate: dayjs.Dayjs,
): AsyncGenerator<GenericObservation, void, unknown> {
  const sql = "SELECT * FROM generic_observations WHERE event_date BETWEEN ? AND ?";
  const values = [startDate.toISOString(), endDate.toISOString()];
  const [rows, fields] = await connection.query(sql, values);
  for (const row of rows) {
    yield {
      $id: row.ID,
      $source: row.SOURCE,
      $type: row.OBS_TYPE,
      $externalURL: row.EXTERNAL_URL,
      stability: row.STABILITY,
      aspect: row.ASPECTS?.split(","),
      authorName: row.AUTHOR_NAME,
      content: row.OBS_CONTENT,
      $data: /^{.*}$/.test(row.OBS_DATA) ? JSON.parse(row.OBS_DATA) : row.OBS_DATA,
      elevation: row.ELEVATION,
      elevationLowerBound: row.ELEVATION_LOWER_BOUND,
      elevationUpperBound: row.ELEVATION_UPPER_BOUND,
      eventDate: row.EVENT_DATE,
      latitude: row.LATITUDE,
      locationName: row.LOCATION_NAME,
      longitude: row.LONGITUDE,
      region: row.REGION_ID,
      reportDate: row.REPORT_DATE,
      avalancheProblems: row.AVALANCHE_PROBLEMS?.split(","),
      dangerPatterns: row.DANGER_PATTERNS?.split(","),
      importantObservations: row.IMPORTANT_OBSERVATION?.split(","),
    } satisfies GenericObservation;
  }
}
