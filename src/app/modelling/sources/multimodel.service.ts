import { Injectable, inject } from "@angular/core";
import { HttpClient } from "@angular/common/http";
import { Observable } from "rxjs";
import { map } from "rxjs/operators";
import { ConstantsService } from "app/providers/constants-service/constants.service";
import { augmentRegion } from "app/providers/regions-service/augmentRegion";
import { GenericObservation } from "app/observations/models/generic-observation.model";
import { formatDate } from "@angular/common";

interface MultimodelPointCsv {
  statnr: string;
  lat: string;
  lon: string;
  elev: string;
  name: string;
  code: string;
}

@Injectable()
export class MultimodelSourceService {
  private http = inject(HttpClient);
  private constantsService = inject(ConstantsService);

  private readonly URL = "https://static.avalanche.report/zamg/zamg/";

  private parseCSV<T>(text: string) {
    const lines = text
      .split(/\r?\n/)
      .filter((line) => !!line && !line.startsWith("#"))
      .map((line) => line.split(/;/));
    const [header, ...rest] = lines;
    return rest.map((row) => {
      const entries = row.map((cell, index) => [header[index], cell]);
      return Object.fromEntries(entries) as T;
    });
  }

  getZamgMultiModelPoints(): Observable<GenericObservation[]> {
    // 2025-01-24 08:11Z 2025-01-24-00UTC_snowgrid_C-LAEF_EPS_4800087_HN.png
    // 2025-01-24 20:11Z 2025-01-24-12UTC_snowgrid_C-LAEF_EPS_4800087_HN.png
    // 2025-01-25 08:11Z 2025-01-25-00UTC_snowgrid_C-LAEF_EPS_4800087_HN.png
    // 2025-01-25 20:11Z 2025-01-25-12UTC_snowgrid_C-LAEF_EPS_4800087_HN.png
    const now = new Date();
    if (now.getUTCHours() < 8 || (now.getUTCHours() === 8 && now.getUTCMinutes() < 15)) {
      // use previous day before 08:15 UTC
      now.setDate(now.getDate() - 1);
    }
    const date = formatDate(now, "yyyy-MM-dd", "en-US");
    return this.http.get(this.URL + "snowgridmultimodel_stationlist.txt", { responseType: "text" }).pipe(
      map((response) => this.parseCSV<MultimodelPointCsv>(response.toString().replace(/^#\s*/, ""))),
      map((points) =>
        points
          .map((row: MultimodelPointCsv): GenericObservation => {
            const id = row.statnr;
            return augmentRegion({
              $source: "multimodel",
              $data: row,
              $id: id,
              region: row.code,
              $extraDialogRows: [
                ...["HN", "HS"].map((type) => ({
                  label: `ECMWF ${type}`,
                  url: `${this.URL}eps_ecmwf/${date}-00UTC_snowgrid_ECMWF_EPS_${id}_${type}.png`,
                })),
                ...["HN", "HS"].map((type) => ({
                  label: `CLAEF ${type}`,
                  url: `${this.URL}eps_claef/${date}-00UTC_snowgrid_C-LAEF_EPS_${id}_${type}.png`,
                })),
              ],
              latitude: parseFloat(row.lat),
              longitude: parseFloat(row.lon),
            } as GenericObservation);
          })
          .sort((p1, p2) => p1.region.localeCompare(p2.region)),
      ),
    );
  }
}
