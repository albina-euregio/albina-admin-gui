import { CommonModule, formatDate } from "@angular/common";
import { Component, OnInit, model, inject, signal, computed, ChangeDetectionStrategy } from "@angular/core";
import { FormsModule } from "@angular/forms";
import { TranslatePipe, TranslateService } from "@ngx-translate/core";
import { DangerSourcesService } from "app/danger-sources/danger-sources.service";
import { DangerSourceModel } from "app/danger-sources/models/danger-source.model";
import { CoordinateDataService } from "app/providers/map-service/coordinate-data.service";
import { ElevationService } from "app/providers/map-service/elevation.service";
import { ZodSchemaFormComponent } from "app/shared/zod-schema-form.component";
import { orderBy } from "es-toolkit";
import { Feature, Point } from "geojson";
import { geocoders } from "leaflet-control-geocoder";
import { TypeaheadMatch, TypeaheadModule } from "ngx-bootstrap/typeahead";
import { Observable, Observer, Subscription, map, of, switchMap } from "rxjs";

import type {
  LolaRainBoundaryElevationTolerance,
  LolaRainBoundaryElevationPeriod,
} from "../../../observations-api/src/fetch/observations/lola-kronos.model";
import { Aspect } from "../enums/enums";
import { AuthenticationService } from "../providers/authentication-service/authentication.service";
import { AspectsComponent } from "../shared/aspects.component";
import { GeocodingProperties, GeocodingService } from "./geocoding.service";
import {
  GenericObservation,
  genericObservationSchema,
  ObservationSource,
  ObservationType,
  PersonInvolvement,
  RawGenericObservation,
} from "./models/generic-observation.model";

// Fields rendered by the zod-schema-form, in display order. `locationName` sits between the two
// groups as a custom typeahead field (name-based geocoding), so it is not part of either list.
const FORM_FIELDS_BEFORE: (keyof RawGenericObservation)[] = ["eventDate", "$type", "personInvolvement", "stability"];
const FORM_FIELDS_AFTER: (keyof RawGenericObservation)[] = [
  "latitude",
  "longitude",
  "elevation",
  "elevationLowerBound",
  "elevationUpperBound",
  "authorName",
  "reportDate",
  "avalancheProblems",
  "dangerPatterns",
  "importantObservations",
  "dangerSource",
  "$externalURL",
  "content",
];

@Component({
  standalone: true,
  imports: [CommonModule, FormsModule, TypeaheadModule, TranslatePipe, AspectsComponent, ZodSchemaFormComponent],
  selector: "app-observation-editor",
  templateUrl: "observation-editor.component.html",
  changeDetection: ChangeDetectionStrategy.Eager,
  providers: [GeocodingService, CoordinateDataService, ElevationService],
})
export class ObservationEditorComponent implements OnInit {
  private geocodingService = inject(GeocodingService);
  private coordinateDataService = inject(CoordinateDataService);
  private authenticationService = inject(AuthenticationService);
  private dangerSourcesService = inject(DangerSourcesService);
  readonly translateService = inject(TranslateService);

  readonly observation = model.required<GenericObservation>();
  readonly dangerSources = signal<DangerSourceModel[]>([]);
  private pendingDangerSources?: Subscription;

  ObservationSource = ObservationSource;
  elevationTolerances = ["exact", "50m", "100m", "200"] satisfies LolaRainBoundaryElevationTolerance[];
  elevationPeriods = ["duringPrecipitationEvent", "observationPeriod"] satisfies LolaRainBoundaryElevationPeriod[];

  // Picked schemas for the two form sections around the custom location field. Each hides the
  // danger-source field when no sources are loaded; dry-snowfall-level fields are hidden via
  // the schema's `withShowIf` rules (see generic-observation.model.ts).
  readonly formSchemaBefore = computed(() => this.pickFields(FORM_FIELDS_BEFORE));
  readonly formSchemaAfter = computed(() => this.pickFields(FORM_FIELDS_AFTER));

  private pickFields(fields: (keyof RawGenericObservation)[]) {
    const hasDangerSources = this.dangerSources().length > 0;
    const visible = fields.filter((f) => f !== "dangerSource" || hasDangerSources);
    return genericObservationSchema.pick(Object.fromEntries(visible.map((f) => [f, true])) as never);
  }

  /** Location-name typeahead suggestions from the geocoding service. */
  readonly locationSuggestions$ = new Observable((observer: Observer<string | undefined>) =>
    observer.next(this.observation().locationName),
  ).pipe(
    switchMap(
      (query: string): Observable<Feature<Point, GeocodingProperties>[]> =>
        query ? this.geocodingService.searchLocation(query).pipe(map((collection) => collection.features)) : of([]),
    ),
  );

  setLocationName(locationName: string) {
    this.observation.update((o) => ({ ...o, locationName }));
  }

  setAspect(aspect: Aspect | undefined) {
    this.observation.update((o) => ({ ...o, aspect }));
  }

  /** Applies a geocoded suggestion: fills the location name, coordinates and elevation. */
  selectLocation(match: TypeaheadMatch<Feature<Point, GeocodingProperties>>): void {
    const feature = match.item;
    // Defer so this runs after the typeahead has written the raw display name back to ngModel.
    setTimeout(() => {
      // display_name "Zischgeles, Gemeinde Sankt Sigmund …" -> "Zischgeles"
      const locationName = feature.properties.display_name.replace(/,.*/, "");
      const [longitude, latitude] = feature.geometry.coordinates;
      this.observation.update((o) => ({ ...o, locationName, latitude, longitude }));
      this.fetchElevation();
    }, 0);
  }

  /** Danger-source `<select>` options for the zod-schema-form, keyed by field name. */
  get dangerSourceOptions(): Record<string, { value: string; label: string }[]> {
    const lang = this.translateService.getCurrentLang();
    return {
      dangerSource: this.dangerSources()
        .filter((ds): ds is typeof ds & { id: string } => !!ds.id)
        .map((ds) => ({
          value: ds.id,
          label: `${ds.creationDate ? formatDate(ds.creationDate, "mediumDate", lang) : ""} — ${ds.title ?? ""}`,
        })),
    };
  }

  get isDrySnowFallLevel(): boolean {
    return this.observation()?.$type === ObservationType.DrySnowfallLevel;
  }

  ngOnInit() {
    this.loadDangerSources();
  }

  /** Writes the edited value back and runs the field-specific side effects. */
  onFormChange(next: GenericObservation) {
    const prev = this.observation();
    this.observation.set(next);
    if (next.eventDate !== prev?.eventDate) this.loadDangerSources();
    if (next.personInvolvement !== prev?.personInvolvement) this.setObservationType();
    if (next.latitude !== prev?.latitude || next.longitude !== prev?.longitude) this.fetchElevation();
    if (next.content !== prev?.content) this.parseContent();
  }

  setAllowEdit(value: boolean) {
    this.observation.update((o) => ({ ...o, $allowEdit: value }));
  }

  setElevationData(key: "elevationTolerance" | "elevationPeriod", value: string) {
    this.observation.update((o) => ({ ...o, $data: { ...o.$data, [key]: value } }));
  }

  fetchElevation() {
    const observation = this.observation();
    if (!(observation.latitude && observation.longitude)) {
      return;
    }
    this.coordinateDataService.getCoordData(+observation.latitude, +observation.longitude).subscribe((data) => {
      this.observation.update((o) => ({ ...o, elevation: data.height }));
    });
  }

  setObservationType() {
    const observation = this.observation();
    if (observation.$source !== ObservationSource.AvalancheWarningService) {
      return;
    }
    const involved =
      observation.personInvolvement !== undefined && observation.personInvolvement !== PersonInvolvement.Unknown;
    const $type = involved ? ObservationType.Avalanche : ObservationType.SimpleObservation;
    this.observation.update((o) => ({ ...o, $type }));
  }

  private loadDangerSources() {
    const eventDate = this.observation()?.eventDate;
    const date = eventDate && isFinite(+eventDate) ? eventDate : new Date();
    this.pendingDangerSources?.unsubscribe();
    this.pendingDangerSources = this.dangerSourcesService
      .loadDangerSources([date, date], this.authenticationService.getActiveRegionId())
      .subscribe((dangerSources) => this.dangerSources.set(orderBy(dangerSources, [(s) => s.creationDate], ["asc"])));
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
      const observation = this.observation();
      const content = observation.content ?? "";
      const patch: Partial<GenericObservation> = {};
      if (!observation.authorName && content.includes("Einsatzcode") && content.includes("beschickte Einsatzmittel")) {
        patch.authorName = "Leitstelle Tirol";
      }

      const codeMatch = content.match(/Einsatzcode:\s*(.*)\n/);
      const code = codeMatch ? codeMatch[1] : "";
      if (codes[code]) patch.personInvolvement = codes[code];

      if (!observation.locationName && content.includes("Einsatzort")) {
        const match = content.match(/Einsatzort:.*\n\s+.*\s+(.*)/);
        if (match) patch.locationName = match[1];
      }

      let fetchedLatLng = false;
      if (!observation.latitude && !observation.longitude && content.includes("Koordinaten: WGS84")) {
        const match = content.match(/Koordinaten: WGS84(.*)/);
        const latlng = match && match[1] ? geocoders.parseLatLng(match[1].trim()) : "";
        if (latlng) {
          patch.latitude = latlng.lat;
          patch.longitude = latlng.lng;
          fetchedLatLng = true;
        }
      }

      if (Object.keys(patch).length) this.observation.update((o) => ({ ...o, ...patch }));
      if (fetchedLatLng) this.fetchElevation();
    });
  }
}
