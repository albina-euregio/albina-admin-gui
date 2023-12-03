import { Injectable } from "@angular/core";
import { type HttpClient } from "@angular/common/http";
import { type TranslateService } from "@ngx-translate/core";
import { type ConstantsService } from "app/providers/constants-service/constants.service";
import { type Observable } from "rxjs";
import { type FeatureCollection, type Point } from "geojson";

@Injectable()
export class GeocodingService {
  constructor(
    public http: HttpClient,
    public translateService: TranslateService,
    public constantsService: ConstantsService,
  ) {}

  searchLocation(query: string, limit = 8): Observable<FeatureCollection<Point, GeocodingProperties>> {
    // https://nominatim.org/release-docs/develop/api/Search/
    const { osmNominatimApi, osmNominatimCountries } = this.constantsService;
    const params: Record<string, string> = {
      "accept-language": this.translateService.currentLang,
      countrycodes: osmNominatimCountries,
      format: "geojson",
      limit: String(limit),
      q: query,
    };
    return this.http.get<FeatureCollection<Point, GeocodingProperties>>(osmNominatimApi, { params });
  }
}

export interface GeocodingProperties {
  place_id: number;
  osm_type: string;
  osm_id: number;
  display_name: string;
  place_rank: number;
  category: string;
  type: string;
  importance: number;
}
