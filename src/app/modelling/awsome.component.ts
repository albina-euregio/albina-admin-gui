import { AfterViewInit, Component, ElementRef, HostListener, OnInit, ViewChild } from "@angular/core";
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
import type { GenericObservation } from "../observations/models/generic-observation.model";
import { DomSanitizer, SafeHtml } from "@angular/platform-browser";
import { ActivatedRoute } from "@angular/router";

type FeatureProperties = GeoJSON.Feature["properties"] & { $sourceObject?: AwsomeSource } & Pick<
    GenericObservation,
    "$source" | "latitude" | "longitude" | "elevation"
  >;

export type AwsomeSource = {
  name: string;
  url: string;
  tooltipTemplate: string;
  detailsTemplate: string;
};

type Awsome = {
  date: string;
  dateStepSeconds: string;
  sources: AwsomeSource[];
  filters: FilterSelectionSpec<FeatureProperties>[];
};

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
  configURL = "https://models.avalanche.report/dashboard/awsome.json";
  config: Awsome = {} as Awsome;
  date: string = "";
  layout = "map" as const;
  @ViewChild("observationsMap") mapDiv: ElementRef<HTMLDivElement>;
  observations: FeatureProperties[] = [];
  localObservations: FeatureProperties[] = [];
  selectedObservationDetails: SafeHtml | undefined = undefined;
  sources: AwsomeSource[];

  constructor(
    private route: ActivatedRoute,
    public filterService: ObservationFilterService<FeatureProperties>,
    public mapService: BaseMapService,
    public markerService: ObservationMarkerService<FeatureProperties>,
    private sanitizer: DomSanitizer,
  ) {}

  async ngOnInit() {
    // this.config = (await import("./awsome.json")) as unknown as Awsome;
    this.route.queryParamMap.subscribe((params) => {
      const configURL = params.get("config");
      if (!configURL) return;
      this.configURL = configURL;
    });
    const configURL = this.configURL.includes("?") ? this.configURL : `${this.configURL}?_=${Date.now()}`;
    this.config = await this.fetchJSON<Awsome>(configURL);
    this.date = this.config.date;
    this.sources = this.config.sources;

    this.filterService.filterSelectionData = (this.config.filters as FilterSelectionSpec<FeatureProperties>[]).map(
      (f) => new FilterSelectionData(f),
    );
    this.markerService.markerClassify = this.filterService.filterSelectionData.at(-1);
    await this.loadSources();
  }

  async loadSources() {
    this.observations.length = 0;
    this.applyLocalFilter();

    this.observations = (
      await Promise.all(this.sources.flatMap(async (source) => await this.loadSource(source)))
    ).flat();

    this.filterService.filterSelectionData.forEach((filter) =>
      filter.buildChartsData(this.markerService.markerClassify, this.observations, (o) =>
        this.filterService.isSelected(o),
      ),
    );
    this.applyLocalFilter();
  }

  private async loadSource(source: AwsomeSource) {
    // replace 2023-11-12_06-00-00 with current date
    const date = this.date.replace(/T/, "_").replace(/:/g, "-");
    const url =
      date.length === "2006-01-02T03:04:05".length
        ? source.url.replace(/20\d{2}-\d{2}-\d{2}_\d{2}-\d{2}-\d{2}/, date)
        : source.url.replace(/20\d{2}-\d{2}-\d{2}_\d{2}-\d{2}/, date);

    const { features } = await this.fetchJSON<GeoJSON.FeatureCollection>(url);
    return features.flatMap((feature: FeatureProperties) => {
      feature.properties.$source = source.name as any;
      feature.properties.longitude ??= (feature.geometry as GeoJSON.Point).coordinates[0];
      feature.properties.latitude ??= (feature.geometry as GeoJSON.Point).coordinates[1];
      feature.properties.elevation ??= (feature.geometry as GeoJSON.Point).coordinates[2];
      feature.properties.$sourceObject = source;
      return ["east", "flat", "north", "south", "west"].map((aspect) => ({
        ...feature.properties,
        aspect,
        snp_characteristics: feature.properties.snp_characteristics[aspect],
      }));
    });
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
    const detailsTemplate = observation.$sourceObject.detailsTemplate;
    this.selectedObservationDetails = detailsTemplate
      ? this.sanitizer.bypassSecurityTrustHtml(this.markerService.formatTemplate(detailsTemplate, observation))
      : undefined;
  }

  closeObservation() {
    this.selectedObservationDetails = undefined;
  }

  @HostListener("document:keydown", ["$event"])
  handleKeyboardEvent(event: KeyboardEvent) {
    if (event.keyCode === 27) {
      this.closeObservation();
    }
  }

  private async fetchJSON<T>(input: RequestInfo | URL): Promise<T> {
    const res = await fetch(input);
    const text = (await res.text()).replace(/\bNaN\b/g, "null");
    return JSON.parse(text);
  }
}
