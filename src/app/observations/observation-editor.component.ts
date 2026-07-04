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
import { geocoders } from "leaflet-control-geocoder";
import { Subscription } from "rxjs";

import type {
  LolaRainBoundaryElevationTolerance,
  LolaRainBoundaryElevationPeriod,
} from "../../../observations-api/src/fetch/observations/lola-kronos.model";
import { AuthenticationService } from "../providers/authentication-service/authentication.service";
import {
  GenericObservation,
  genericObservationSchema,
  ObservationSource,
  ObservationType,
  PersonInvolvement,
} from "./models/generic-observation.model";

/** Fields rendered by the zod-schema-form, in display order. */
const FORM_FIELDS = [
  "eventDate",
  "$type",
  "personInvolvement",
  "stability",
  "locationName",
  "aspect",
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

/** Fields that do not apply to the dry-snowfall-level observation type. */
const DRY_SNOWFALL_HIDDEN_FIELDS = [
  "personInvolvement",
  "stability",
  "elevationLowerBound",
  "elevationUpperBound",
  "reportDate",
  "avalancheProblems",
  "dangerPatterns",
  "importantObservations",
];

@Component({
  standalone: true,
  imports: [CommonModule, FormsModule, TranslatePipe, ZodSchemaFormComponent],
  selector: "app-observation-editor",
  templateUrl: "observation-editor.component.html",
  changeDetection: ChangeDetectionStrategy.Eager,
  providers: [CoordinateDataService, ElevationService],
})
export class ObservationEditorComponent implements OnInit {
  private coordinateDataService = inject(CoordinateDataService);
  private authenticationService = inject(AuthenticationService);
  private dangerSourcesService = inject(DangerSourcesService);
  readonly translateService = inject(TranslateService);

  readonly observation = model.required<GenericObservation>();
  readonly dangerSources = signal<DangerSourceModel[]>([]);
  private pendingDangerSources?: Subscription;

  readonly GenericObservationSchema = genericObservationSchema;
  ObservationSource = ObservationSource;
  elevationTolerances = ["exact", "50m", "100m", "200"] satisfies LolaRainBoundaryElevationTolerance[];
  elevationPeriods = ["duringPrecipitationEvent", "observationPeriod"] satisfies LolaRainBoundaryElevationPeriod[];

  /**
   * Field list for the form: hides the danger-source field when no sources are loaded and the
   * fields that do not apply to the dry-snowfall-level observation type.
   */
  readonly formFields = computed(() => {
    const drySnowfall = this.observation().$type === ObservationType.DrySnowfallLevel;
    return FORM_FIELDS.filter(
      (f) =>
        (f !== "dangerSource" || this.dangerSources().length > 0) &&
        (!drySnowfall || !DRY_SNOWFALL_HIDDEN_FIELDS.includes(f)),
    );
  });

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
