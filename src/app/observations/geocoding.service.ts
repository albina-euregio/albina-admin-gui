import { HttpClient } from "@angular/common/http";
import { Injectable, inject } from "@angular/core";
import { TranslateService } from "@ngx-translate/core";
import { FeatureCollection, Point } from "geojson";
import { map, Observable } from "rxjs";

@Injectable()
export class GeocodingService {
  private http = inject(HttpClient);
  private translateService = inject(TranslateService);

  private readonly osmNominatimApi = "https://nominatim.openstreetmap.org/search";
  private readonly osmNominatimReverse = "https://nominatim.openstreetmap.org/reverse";
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

  reverseGeocode(lat: number, lng: number): Observable<GeocodingAddress | null> {
    const params: Record<string, string> = {
      "accept-language": this.translateService.getCurrentLang(),
      addressdetails: "1",
      format: "geojson",
      lat: String(lat),
      lon: String(lng),
    };
    return this.http
      .get<FeatureCollection<Point, GeocodingProperties>>(this.osmNominatimReverse, { params })
      .pipe(map((fc) => fc.features[0]?.properties?.address ?? null));
  }
}

export interface GeocodingAddress {
  country?: string;
  state?: string;
  county?: string;
  municipality?: string;
  city?: string;
  town?: string;
  village?: string;
  hamlet?: string;
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
  address?: GeocodingAddress;
}
