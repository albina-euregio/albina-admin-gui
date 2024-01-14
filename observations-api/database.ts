import mysql from "mysql2/promise";
import { GenericObservation } from "../src/app/observations/models/generic-observation.model";

export async function insertObservation(o: GenericObservation) {
  console.log("Inserting observation", o.$id, o.$source);
  const connection = await mysql.createConnection({
    host: "127.0.0.1",
    port: 3306,
    user: "ais",
    password: "MD>5:X*n%)1V",
    database: "albina_dev",
  });
  const data = {
    ID: o.$id,
    SOURCE: o.$source,
    OBS_TYPE: o.$type,
    EXTERNAL_URL: o.$externalURL ?? null,
    STABILITY: o.stability ?? null,
    ASPECTS: o.aspect ?? null,
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
    AVALANCHE_PROBLEMS: o.avalancheProblems ?? null,
    DANGER_PATTERNS: o.dangerPatterns ?? null,
    IMPORTANT_OBSERVATION: o.importantObservations ?? null,
  };
  const sql = `
  INSERT INTO generic_observations
  (${Object.keys(data).join(", ")})
  VALUES (${Object.keys(data)
    .map(() => "?")
    .join(", ")})
  ;`;
  await connection.execute(sql, Object.values(data));
}
