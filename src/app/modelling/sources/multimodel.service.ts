import { Injectable } from "@angular/core";
import { HttpClient } from "@angular/common/http";
import { Observable } from "rxjs";
import { map } from "rxjs/operators";
import { ConstantsService } from "app/providers/constants-service/constants.service";
import { augmentRegion } from "app/providers/regions-service/augmentRegion";
import { ForecastSource, GenericObservation } from "app/observations/models/generic-observation.model";

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
  private readonly URL = "https://static.avalanche.report/zamg/zamg/";

  constructor(
    private http: HttpClient,
    private constantsService: ConstantsService,
  ) {}

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
                  url: `${this.URL}eps_ecmwf/snowgrid_ECMWF_EPS_${id}_${type}.png`,
                })),
                ...["HN", "HS"].map((type) => ({
                  label: `CLAEF ${type}`,
                  url: `${this.URL}eps_claef/snowgrid_C-LAEF_EPS_${id}_${type}.png`,
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
