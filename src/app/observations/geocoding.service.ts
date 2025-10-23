import { HttpClient } from "@angular/common/http";
import { Injectable, inject } from "@angular/core";
import { TranslateService } from "@ngx-translate/core";
import { FeatureCollection, Point } from "geojson";
import { Observable } from "rxjs";

@Injectable()
export class GeocodingService {
  private http = inject(HttpClient);
  private translateService = inject(TranslateService);

  private readonly osmNominatimApi = "https://nominatim.openstreetmap.org/search";
  private readonly osmNominatimCountries = "at,it";

  searchLocation(query: string, limit = 8): Observable<FeatureCollection<Point, GeocodingProperties>> {
    // https://nominatim.org/release-docs/develop/api/Search/
    const { osmNominatimApi, osmNominatimCountries } = this;
    const params: Record<string, string> = {
      "accept-language": this.translateService.getCurrentLang(),
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
