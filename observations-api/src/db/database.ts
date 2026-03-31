import { SQL } from "bun";

import { augmentRegion, initAugmentRegion } from "../../../src/app/providers/regions-service/augmentRegion";
import {
  findExistingObservation,
  ObservationSource,
  type Aspect,
  type AvalancheProblem,
  type DangerPattern,
  type ForecastSource,
  type GenericObservation,
  type ImportantObservation,
  type ObservationType,
  type PersonInvolvement,
  type SnowpackStability,
} from "../generic-observation";
import { augmentElevation } from "./elevation";

interface GenericObservationTable {
  REGION_ID: string;
  EVENT_DATE: string; // Date
  ASPECTS: string;
  OBS_TYPE: string;
  REPORT_DATE: string; // Date
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
  DANGER_SOURCE: string;
  OBS_DATA: string;
  LATITUDE: number;
  LOCATION_NAME: string;
  OBS_CONTENT: string;
  PERSON_INVOLVEMENT: string;
  DELETED: 0 | 1;
  ALLOW_EDIT: 0 | 1;
}

export class ObservationDatabaseConnection {
  constructor(private mysql: SQL) {}
  static async createConnection(): Promise<ObservationDatabaseConnection> {
    if (!globalThis.Temporal) {
      await import("temporal-polyfill/global");
    }

    const hostname = process.env.MYSQL_HOST || "127.0.0.1";
    const port = process.env.MYSQL_PORT ? +process.env.MYSQL_PORT : 3306;
    const username = process.env.MYSQL_USER || "observations-api";
    const password = process.env.MYSQL_PASSWORD || "EopheekeiNg1hoomo";
    const database = process.env.MYSQL_DATABASE || "albina_dev";
    const conneciton = new SQL({
      adapter: "mysql",
      hostname,
      port,
      database,
      username,
      password,
    });
    return new ObservationDatabaseConnection(conneciton);
  }

  async augmentAndInsertObservation(o: GenericObservation, existing: GenericObservation[] = []) {
    const ex = findExistingObservation(existing, o);
    if (ex?.$allowEdit) {
      console.log("Skipping observation since it is in edit mode", o.$id, o.$source);
      return;
    }
    if (ex?.$deleted) {
      console.log("Skipping observation since it is deleted", o.$id, o.$source);
      return;
    }
    if (!ex || o.latitude !== ex.latitude || o.longitude !== ex.longitude) {
      await initAugmentRegion();
      augmentRegion(o);
      await augmentElevation(o);
    }
    return await this.insertObservation(o);
  }

  async insertObservation(o: GenericObservation) {
    if (!o) return;
    console.log("Inserting observation", o.$id, o.$source);
    const data: GenericObservationTable = {
      ID: o.$id.slice(0, 191),
      SOURCE: o.$source.slice(0, 191),
      ALLOW_EDIT: o.$allowEdit ? 1 : 0,
      DELETED: o.$deleted ? 1 : 0,
      OBS_TYPE: o.$type ?? null,
      EXTERNAL_URL: o.$externalURL ?? null,
      EXTERNAL_IMG: Array.isArray(o.$externalImgs) ? o.$externalImgs.join("\n") : null,
      STABILITY: o.stability ?? null,
      ASPECTS: Array.isArray(o.aspect) ? o.aspect.join(",") : (o.aspect ?? null),
      AUTHOR_NAME: o.authorName?.slice(0, 191) ?? null,
      OBS_CONTENT: o.content ?? null,
      OBS_DATA: o.$data ? JSON.stringify(o.$data) : null,
      ELEVATION: o.elevation ?? null,
      ELEVATION_LOWER_BOUND: o.elevationLowerBound ?? null,
      ELEVATION_UPPER_BOUND: o.elevationUpperBound ?? null,
      EVENT_DATE: toSqlDateString(o.eventDate) ?? null,
      LATITUDE: o.latitude ?? null,
      LOCATION_NAME: o.locationName?.slice(0, 191) ?? null,
      LONGITUDE: o.longitude ?? null,
      REGION_ID: o.region?.slice(0, 191) ?? null,
      REPORT_DATE: toSqlDateString(o.reportDate) ?? null,
      AVALANCHE_PROBLEMS: o.avalancheProblems?.join(",") ?? null,
      DANGER_PATTERNS: o.dangerPatterns?.join(",") ?? null,
      DANGER_SOURCE: o.dangerSource?.slice(0, 191) ?? null,
      IMPORTANT_OBSERVATION: o.importantObservations?.join(",") ?? null,
      EXTRA_DIALOG_ROWS: o.$extraDialogRows ? JSON.stringify(o.$extraDialogRows) : null,
      PERSON_INVOLVEMENT: o.personInvolvement ?? null,
    };
    try {
      await this.mysql`DELETE FROM generic_observations WHERE SOURCE = ${o.$source} AND ID = ${o.$id}`;
      await this.mysql`INSERT INTO generic_observations ${this.mysql(data)}`;
    } catch (err) {
      if (err instanceof SQL.SQLError && err.message.includes("ER_DUP_ENTRY")) {
        console.debug("Skipping existing observation", o.$id, data);
        return;
      }
      console.error(err, JSON.stringify(o));
      throw err;
    }
  }

  async deleteObservation(o: GenericObservation) {
    if (!o || !o.$id) return;
    console.log("Deleting observation", o.$id, o.$source);
    try {
      await this.mysql`UPDATE generic_observations SET deleted = 1 WHERE SOURCE = ${o.$source} AND ID = ${o.$id}`;
    } catch (err) {
      console.error(err, JSON.stringify(o));
      throw err;
    }
  }

  async selectObservations(startDate: Date, endDate: Date): Promise<GenericObservation[]> {
    const rows = await this.mysql`
      SELECT *
      FROM generic_observations
      WHERE event_date BETWEEN ${startDate.toISOString()}
        AND ${endDate.toISOString()}
        AND deleted = 0`;
    return this.mapRows(rows);
  }

  async selectObservation(o: GenericObservation): Promise<GenericObservation | undefined> {
    const rows = await this.mysql`
      SELECT *
      FROM generic_observations
      WHERE SOURCE = ${o.$source} AND ID = ${o.$id}`;
    const result = this.mapRows(rows);
    return result.length ? result[0] : undefined;
  }

  private mapRows(rows: unknown) {
    return (rows as unknown as GenericObservationTable[]).map(
      (row): GenericObservation => ({
        $id: row.ID,
        $source: row.SOURCE as ObservationSource | ForecastSource,
        $allowEdit: row.ALLOW_EDIT === 1,
        $deleted: row.DELETED === 1,
        $type: (row.OBS_TYPE as ObservationType) ?? undefined,
        $externalURL: row.EXTERNAL_URL ?? undefined,
        $externalImgs: row.EXTERNAL_IMG ? row.EXTERNAL_IMG.split("\n") : undefined,
        stability: (row.STABILITY as SnowpackStability) ?? undefined,
        aspect: (row.ASPECTS?.split(",")?.[0] as Aspect) ?? undefined,
        authorName: row.AUTHOR_NAME ?? undefined,
        content: row.OBS_CONTENT ?? undefined,
        $data: /^{.*}$/.test(row.OBS_DATA) ? JSON.parse(row.OBS_DATA) : (row.OBS_DATA ?? undefined),
        $extraDialogRows: /^\[.*\]$/.test(row.EXTRA_DIALOG_ROWS)
          ? JSON.parse(row.EXTRA_DIALOG_ROWS)
          : (row.EXTRA_DIALOG_ROWS ?? undefined),
        elevation: row.ELEVATION ?? undefined,
        elevationLowerBound: row.ELEVATION_LOWER_BOUND ?? undefined,
        elevationUpperBound: row.ELEVATION_UPPER_BOUND ?? undefined,
        eventDate: fromSqlDateString(row.EVENT_DATE) ?? undefined,
        latitude: row.LATITUDE ?? undefined,
        locationName: row.LOCATION_NAME ?? undefined,
        longitude: row.LONGITUDE ?? undefined,
        region: row.REGION_ID ?? undefined,
        reportDate: fromSqlDateString(row.REPORT_DATE) ?? undefined,
        avalancheProblems: (row.AVALANCHE_PROBLEMS || undefined)?.split(",") as AvalancheProblem[],
        dangerPatterns: (row.DANGER_PATTERNS || undefined)?.split(",") as DangerPattern[],
        dangerSource: row.DANGER_SOURCE ?? undefined,
        importantObservations: (row.IMPORTANT_OBSERVATION || undefined)?.split(",") as ImportantObservation[],
        personInvolvement: (row.PERSON_INVOLVEMENT as PersonInvolvement) ?? undefined,
      }),
    );
  }

  destroy() {
    return this.mysql.close();
  }
}

function toSqlDateString(date: Date): string | null {
  return date instanceof Date
    ? date.toTemporalInstant().toZonedDateTimeISO("Europe/Vienna").toPlainDateTime().toString()
    : null;
}

function fromSqlDateString(date: string): Date | undefined {
  return typeof date === "string"
    ? new Date(Temporal.PlainDateTime.from(date).toZonedDateTime("Europe/Vienna").toInstant().epochMilliseconds)
    : undefined;
}
