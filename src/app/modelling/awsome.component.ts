import { AfterViewInit, Component, ElementRef, OnInit, ViewChild } from "@angular/core";
import { FormsModule } from "@angular/forms";
import { CommonModule } from "@angular/common";
import { ObservationChartComponent } from "../observations/observation-chart.component";
import { ObservationGalleryComponent } from "../observations/observation-gallery.component";
import { ObservationTableComponent } from "../observations/observation-table.component";
import { TranslateModule } from "@ngx-translate/core";
import { ObservationFilterService } from "../observations/observation-filter.service";
import { FilterSelectionData, FilterSelectionSpec } from "../observations/filter-selection-data";
import { BaseMapService } from "../providers/map-service/base-map.service";
import { ObservationMarkerService } from "../observations/observation-marker.service";

type FeatureProperties = GeoJSON.Feature["properties"];

export interface Awsome {
  sources: string[];
  filters: FilterSelectionSpec<FeatureProperties>[];
}

@Component({
  selector: "app-awsome",
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    FormsModule,
    ObservationChartComponent,
    ObservationGalleryComponent,
    ObservationTableComponent,
    TranslateModule,
  ],
  templateUrl: "awsome.component.html",
})
export class AwsomeComponent implements AfterViewInit, OnInit {
  // https://gitlab.com/avalanche-warning
  layout = "map" as const;
  @ViewChild("observationsMap") mapDiv: ElementRef<HTMLDivElement>;
  observations: FeatureProperties[] = [];
  localObservations: FeatureProperties[] = [];

  constructor(
    public filterService: ObservationFilterService<FeatureProperties>,
    public mapService: BaseMapService,
    public markerService: ObservationMarkerService<FeatureProperties>,
  ) {}

  async ngOnInit() {
    const { sources, filters } = (await import("./awsome.json")).default;

    this.filterService.filterSelectionData = (filters as FilterSelectionSpec<FeatureProperties>[]).map(
      (f) => new FilterSelectionData(f),
    );
    this.markerService.markerClassify = this.filterService.filterSelectionData[0];

    const collections = await Promise.all(sources.map((url) => this.fetchJSON<GeoJSON.FeatureCollection>(url)));
    this.observations = collections
      .flatMap((c) => c.features)
      .map((feature) => {
        feature.properties.longitude ??= (feature.geometry as GeoJSON.Point).coordinates[0];
        feature.properties.latitude ??= (feature.geometry as GeoJSON.Point).coordinates[1];
        feature.properties.elevation ??= (feature.geometry as GeoJSON.Point).coordinates[2];
        return feature.properties;
      });
    this.filterService.filterSelectionData.forEach((filter) =>
      filter.buildChartsData(this.markerService.markerClassify, this.observations, (o) =>
        this.filterService.isSelected(o),
      ),
    );
    this.applyLocalFilter();
  }

  async ngAfterViewInit() {
    await this.mapService.initMaps(this.mapDiv.nativeElement, (o) => console.log(o));
  }

  applyLocalFilter() {
    Object.values(this.mapService.observationTypeLayers).forEach((layer) => layer.clearLayers());
    this.localObservations = this.observations.filter(
      (observation) => this.filterService.isHighlighted(observation) || this.filterService.isSelected(observation),
    );
    this.localObservations.forEach((observation) => {
      this.markerService
        .createMarker(observation, this.filterService.isHighlighted(observation))
        ?.on("click", () => this.onObservationClick(observation))
        ?.addTo(this.mapService.observationTypeLayers.Profile);
    });

    this.filterService.filterSelectionData.forEach((filter) =>
      filter.buildChartsData(this.markerService.markerClassify, this.observations, (o) =>
        this.filterService.isSelected(o),
      ),
    );
  }

  private onObservationClick(observation: FeatureProperties) {
    console.log(observation);
  }

  private async fetchJSON<T>(input: RequestInfo | URL): Promise<T> {
    const res = await fetch(input);
    const text = (await res.text()).replace(/\bNaN\b/g, "null");
    return JSON.parse(text);
  }
}
