import type {
  LolaRainBoundaryElevationTolerance,
  LolaRainBoundaryElevationPeriod,
} from "../../../observations-api/src/fetch/observations/lola-kronos.model";
import * as Enums from "../enums/enums";
import { AuthenticationService } from "../providers/authentication-service/authentication.service";
import { AspectsComponent } from "../shared/aspects.component";
import { AvalancheProblemIconsComponent } from "../shared/avalanche-problem-icons.component";
import { GeocodingProperties, GeocodingService } from "./geocoding.service";
import {
  GenericObservation,
  genericObservationSchema,
  ImportantObservation,
  ObservationSource,
  ObservationType,
  PersonInvolvement,
} from "./models/generic-observation.model";
import { CommonModule } from "@angular/common";
import { AfterViewInit, Component, ElementRef, viewChild, input, inject, signal } from "@angular/core";
import { FormsModule, ReactiveFormsModule } from "@angular/forms";
import { TranslateModule, TranslateService } from "@ngx-translate/core";
import { DangerSourcesService } from "app/danger-sources/danger-sources.service";
import { DangerSourceModel } from "app/danger-sources/models/danger-source.model";
import { CoordinateDataService } from "app/providers/map-service/coordinate-data.service";
import { zodCssClass } from "app/shared/zod-css-class";
import { orderBy, xor } from "es-toolkit";
import { Feature, Point } from "geojson";
import { geocoders } from "leaflet-control-geocoder";
import { TypeaheadMatch, TypeaheadModule } from "ngx-bootstrap/typeahead";
import { Observable, Observer, Subscription, map, of, switchMap } from "rxjs";

@Component({
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    TranslateModule,
    TypeaheadModule,
    AspectsComponent,
    AvalancheProblemIconsComponent,
  ],
  selector: "app-observation-editor",
  templateUrl: "observation-editor.component.html",
})
export class ObservationEditorComponent implements AfterViewInit {
  private geocodingService = inject(GeocodingService);
  private coordinateDataService = inject(CoordinateDataService);
  private authenticationService = inject(AuthenticationService);
  private dangerSourcesService = inject(DangerSourcesService);
  readonly translateService = inject(TranslateService);

  readonly observation = input<GenericObservation>(undefined);
  readonly eventDateDate = viewChild<ElementRef<HTMLInputElement>>("eventDateDate");
  readonly eventDateTime = viewChild<ElementRef<HTMLInputElement>>("eventDateTime");
  readonly reportDateDate = viewChild<ElementRef<HTMLInputElement>>("reportDateDate");
  readonly reportDateTime = viewChild<ElementRef<HTMLInputElement>>("reportDateTime");
  readonly dangerSources = signal<DangerSourceModel[]>([]);
  private pendingDangerSources: Subscription;
  avalancheProblems: Enums.AvalancheProblem[] = this.authenticationService.getActiveRegionAvalancheProblems();
  dangerPatterns = Object.values(Enums.DangerPattern);
  importantObservations = Object.values(ImportantObservation);
  snowpackStabilityValues = Object.values(Enums.SnowpackStability);
  personInvolvementValues = Object.values(PersonInvolvement);
  observationTypeValues = Object.values(ObservationType);
  GenericObservationSchema = genericObservationSchema;
  zodCssClass = zodCssClass;
  ObservationSource = ObservationSource;
  elevationTolerances = ["exact", "50m", "100m", "200"] satisfies LolaRainBoundaryElevationTolerance[];
  elevationPeriods = ["duringPrecipitationEvent", "observationPeriod"] satisfies LolaRainBoundaryElevationPeriod[];
  xor = xor;
  locationSuggestions$ = new Observable((observer: Observer<string | undefined>) =>
    observer.next(this.observation().locationName),
  ).pipe(
    switchMap(
      (query: string): Observable<Feature<Point, GeocodingProperties>[]> =>
        query ? this.geocodingService.searchLocation(query).pipe(map((collection) => collection.features)) : of([]),
    ),
  );

  fetchElevation() {
    const observation = this.observation();
    if (!(observation.latitude && observation.longitude)) {
      return;
    }
    const floatLat = +observation.latitude;
    const floatLng = +observation.longitude;
    this.coordinateDataService.getCoordData(floatLat, floatLng).subscribe((data) => {
      this.observation().elevation = data.height;
    });
  }

  copyLatLng() {
    navigator.clipboard.writeText(`${this.observation().latitude}, ${this.observation().longitude}`);
  }

  setObservationType() {
    const observation = this.observation();
    if (observation.$source === ObservationSource.AvalancheWarningService) {
      if (observation.personInvolvement !== undefined && observation.personInvolvement !== PersonInvolvement.Unknown) {
        observation.$type = ObservationType.Avalanche;
      } else {
        observation.$type = ObservationType.SimpleObservation;
      }
    }
  }

  get isDrySnowFallLevel(): boolean {
    return this.observation().$type === ObservationType.DrySnowfallLevel;
  }

  ngAfterViewInit() {
    // Use ElementRef to achieve a one-way binding between observation.eventDate and the two input fields.
    // To allow for modifying an existing observation, initially the observation.eventDate is written to the two input fields.
    for (const { nativeElement } of [this.eventDateDate(), this.eventDateTime()]) {
      nativeElement.valueAsDate = this.eventDate;
      nativeElement.onchange = (e) => this.handleDateEvent(e, "eventDate");
    }
    for (const { nativeElement } of [this.reportDateDate(), this.reportDateTime()]) {
      nativeElement.valueAsDate = this.reportDate;
      nativeElement.onchange = (e) => this.handleDateEvent(e, "reportDate");
    }
    this.loadDangerSources();
  }

  private loadDangerSources() {
    const date = isFinite(+this.eventDate) ? this.eventDate : new Date();
    this.pendingDangerSources?.unsubscribe();
    this.pendingDangerSources = this.dangerSourcesService
      .loadDangerSources([date, date], this.authenticationService.getActiveRegionId())
      .subscribe((dangerSources) => this.dangerSources.set(orderBy(dangerSources, [(s) => s.creationDate], ["asc"])));
  }

  get eventDate(): Date {
    const date = this.observation().eventDate;
    return isFinite(+date) ? toUTC(date) : undefined;
  }

  get reportDate(): Date {
    const date = this.observation().reportDate;
    return isFinite(+date) ? toUTC(date) : undefined;
  }

  setDate(date: Date, key: "eventDate" | "reportDate") {
    this[`${key}Date`]().nativeElement.valueAsDate = date;
    this[`${key}Time`]().nativeElement.valueAsDate = date;
    date = isFinite(+date) ? fromUTC(date) : undefined;
    this.observation()[key] = date;
    this.loadDangerSources();
  }

  handleDateEvent(event: Event, key: "eventDate" | "reportDate") {
    const type = (event.target as HTMLInputElement).type;
    let date = (event.target as HTMLInputElement).valueAsDate;
    if (date === undefined || date === null) {
      // date is null when clicking "clear" in Chrome's calendar
      this.setDate(undefined, key);
      return;
    }
    date = isFinite(+date) ? fromUTC(date) : undefined;
    if (isFinite(+this.observation()[key]) && type === "date") {
      this.observation()[key].setFullYear(date.getFullYear(), date.getMonth(), date.getDate());
    } else if (isFinite(+this.observation()[key]) && type === "time") {
      this.observation()[key].setHours(date.getHours(), date.getMinutes(), date.getSeconds());
    } else {
      this.observation()[key] = date;
    }
    this.loadDangerSources();
  }

  selectLocation(match: TypeaheadMatch<Feature<Point, GeocodingProperties>>): void {
    const feature = match.item;
    setTimeout(() => {
      // display_name	"Zischgeles, Gemeinde Sankt Sigmund im Sellrain, Bezirk Innsbruck-Land, Tirol, Österreich" -> "Zischgeles"
      const observation = this.observation();
      observation.locationName = feature.properties.display_name.replace(/,.*/, "");
      const lat = feature.geometry.coordinates[1];
      const lng = feature.geometry.coordinates[0];

      observation.latitude = lat;
      observation.longitude = lng;

      this.fetchElevation();
    }, 0);
  }

  parseContent(): void {
    const codes = {
      "ALP-LAW-NEG": PersonInvolvement.No,
      "ALP-LAW-UNKL": PersonInvolvement.Uninjured,
      "ALP-LAW-KLEIN": PersonInvolvement.Uninjured,
      "ALP-LAW-GROSS": PersonInvolvement.Uninjured,
      "ALP-LAW-FREI": PersonInvolvement.Uninjured,
    };

    setTimeout(() => {
      const content = this.observation().content;
      const observation = this.observation();
      if (!observation.authorName && content.includes("Einsatzcode") && content.includes("beschickte Einsatzmittel")) {
        observation.authorName = "Leitstelle Tirol";
      }

      const match = content.match(/Einsatzcode:\s*(.*)\n/);
      const code = match ? match[1] : "";
      if (codes[code]) observation.personInvolvement = codes[code];

      if (!observation.locationName && content.includes("Einsatzort")) {
        const match = content.match(/Einsatzort:.*\n\s+.*\s+(.*)/);
        if (match) {
          observation.locationName = match[1];
        }
      }
      if (!observation.latitude && !observation.longitude && content.includes("Koordinaten: WGS84")) {
        const match = content.match(/Koordinaten: WGS84(.*)/);
        const latlng = match && match[1] ? geocoders.parseLatLng(match[1].trim()) : "";
        if (latlng) {
          observation.latitude = latlng.lat;
          observation.longitude = latlng.lng;

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
