import { CommonModule } from "@angular/common";
import { Component, Input } from "@angular/core";
import { FormsModule } from "@angular/forms";
import { TranslateModule } from "@ngx-translate/core";
import { CoordinateDataService } from "app/providers/map-service/coordinate-data.service";
import { Feature, Point } from "geojson";
import { geocoders } from "leaflet-control-geocoder";
import { TypeaheadMatch, TypeaheadModule } from "ngx-bootstrap/typeahead";
import { Observable, Observer, map, of, switchMap } from "rxjs";
import * as Enums from "../enums/enums";
import { AuthenticationService } from "../providers/authentication-service/authentication.service";
import { AspectsComponent } from "../shared/aspects.component";
import { AvalancheProblemIconsComponent } from "../shared/avalanche-problem-icons.component";
import { GeocodingProperties, GeocodingService } from "./geocoding.service";
import { GenericObservation, ImportantObservation, PersonInvolvement } from "./models/generic-observation.model";
import { xor } from "lodash";

@Component({
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    TranslateModule,
    TypeaheadModule,
    AspectsComponent,
    AvalancheProblemIconsComponent,
  ],
  selector: "app-observation-editor",
  templateUrl: "observation-editor.component.html",
})
export class ObservationEditorComponent {
  constructor(
    authenticationService: AuthenticationService,
    private geocodingService: GeocodingService,
    private coordinateDataService: CoordinateDataService,
  ) {
    this.avalancheProblems = authenticationService.getActiveRegionAvalancheProblems();
  }

  @Input() observation: GenericObservation;
  avalancheProblems: Enums.AvalancheProblem[];
  dangerPatterns = Object.values(Enums.DangerPattern);
  importantObservations = Object.values(ImportantObservation);
  snowpackStabilityValues = Object.values(Enums.SnowpackStability);
  personInvolvementValues = Object.values(PersonInvolvement);
  xor = xor;
  locationSuggestions$ = new Observable((observer: Observer<string | undefined>) =>
    observer.next(this.observation.locationName),
  ).pipe(
    switchMap(
      (query: string): Observable<Feature<Point, GeocodingProperties>[]> =>
        query ? this.geocodingService.searchLocation(query).pipe(map((collection) => collection.features)) : of([]),
    ),
  );

  fetchElevation() {
    if (!(this.observation.latitude && this.observation.longitude)) {
      return;
    }
    const floatLat = +this.observation.latitude;
    const floatLng = +this.observation.longitude;
    this.coordinateDataService.getCoordData(floatLat, floatLng).subscribe((data) => {
      this.observation.elevation = data.height;
    });
  }

  copyLatLng() {
    navigator.clipboard.writeText(`${this.observation.latitude}, ${this.observation.longitude}`);
  }

  get eventDate(): Date {
    const date = this.observation.eventDate;
    return isFinite(+date) ? toUTC(date) : undefined;
  }

  set eventDate(date: Date | Event) {
    this.setDate(date, "eventDate");
  }

  get reportDate(): Date {
    const date = this.observation.reportDate;
    return isFinite(+date) ? toUTC(date) : undefined;
  }

  set reportDate(date: Date | Event) {
    this.setDate(date, "reportDate");
  }

  private setDate(date: Date | Event, key: "eventDate" | "reportDate") {
    if (date === undefined) {
      this.observation[key] = undefined;
      return;
    }
    let type = "";
    if (date instanceof Event) {
      type = (date.target as HTMLInputElement).type;
      date = (date.target as HTMLInputElement).valueAsDate;
    }
    date = isFinite(+date) ? fromUTC(date) : undefined;
    if (isFinite(+this.observation[key]) && type === "date") {
      this.observation[key].setFullYear(date.getFullYear(), date.getMonth(), date.getDate());
    } else if (isFinite(+this.observation[key]) && type === "time") {
      this.observation[key].setHours(date.getHours(), date.getMinutes(), date.getSeconds());
    } else {
      this.observation[key] = date;
    }
  }

  setLatitude(event: Event) {
    this.observation.latitude = (event.target as HTMLInputElement).value as unknown as number;
    this.fetchElevation();
  }

  setLongitude(event: Event) {
    this.observation.longitude = (event.target as HTMLInputElement).value as unknown as number;
    this.fetchElevation();
  }

  selectLocation(match: TypeaheadMatch<Feature<Point, GeocodingProperties>>): void {
    const feature = match.item;
    setTimeout(() => {
      // display_name	"Zischgeles, Gemeinde Sankt Sigmund im Sellrain, Bezirk Innsbruck-Land, Tirol, Österreich" -> "Zischgeles"
      this.observation.locationName = feature.properties.display_name.replace(/,.*/, "");
      const lat = feature.geometry.coordinates[1];
      const lng = feature.geometry.coordinates[0];

      this.observation.latitude = lat;
      this.observation.longitude = lng;

      this.fetchElevation();
    }, 0);
  }

  parseContent($event: { clipboardData: DataTransfer }): void {
    // const codes = {
    //   "ALP-LAW-NEG": EventType.PersonNo,
    //   "ALP-LAW-UNKL": EventType.PersonUninjured,
    //   "ALP-LAW-KLEIN": EventType.PersonUninjured,
    //   "ALP-LAW-GROSS": EventType.PersonUninjured,
    //   "ALP-LAW-FREI": EventType.PersonUninjured,
    // };

    setTimeout(() => {
      const content = this.observation.content;
      if (
        !this.observation.authorName &&
        content.includes("Einsatzcode") &&
        content.includes("beschickte Einsatzmittel")
      ) {
        this.observation.authorName = "Leitstelle Tirol";
      }
      if (!this.observation.locationName && content.includes("Einsatzort")) {
        const match = content.match(/Einsatzort:.*\n\s+.*\s+(.*)/);
        if (match) {
          this.observation.locationName = match[1];
        }
      }
      if (!this.observation.latitude && !this.observation.longitude && content.includes("Koordinaten: WGS84")) {
        const match = content.match(/Koordinaten: WGS84(.*)/);
        const latlng = match && match[1] ? geocoders.parseLatLng(match[1].trim()) : "";
        if (latlng) {
          this.observation.latitude = latlng.lat;
          this.observation.longitude = latlng.lng;

          this.fetchElevation();
        }
      }
    });
  }
}

function toUTC(value: Date) {
  return new Date(
    Date.UTC(
      value.getFullYear(),
      value.getMonth(),
      value.getDate(),
      value.getHours(),
      value.getMinutes(),
      value.getSeconds(),
    ),
  );
}

function fromUTC(value: Date) {
  return new Date(
    value.getUTCFullYear(),
    value.getUTCMonth(),
    value.getUTCDate(),
    value.getUTCHours(),
    value.getUTCMinutes(),
    value.getUTCSeconds(),
  );
}
