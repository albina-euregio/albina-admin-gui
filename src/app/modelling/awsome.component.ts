import { AfterViewInit, Component, ElementRef, inject, OnInit, viewChild } from "@angular/core";
import { FormsModule } from "@angular/forms";
import { CommonModule } from "@angular/common";
import { HttpClient } from "@angular/common/http";
import { map } from "rxjs/operators";
import { ObservationChartComponent } from "../observations/observation-chart.component";
import { TranslateModule } from "@ngx-translate/core";
import { ObservationFilterService } from "../observations/observation-filter.service";
import { FilterSelectionData, FilterSelectionSpec } from "../observations/filter-selection-data";
import { BaseMapService } from "../providers/map-service/base-map.service";
import { ObservationMarkerService } from "../observations/observation-marker.service";
import type { GenericObservation } from "../observations/models/generic-observation.model";
import { DomSanitizer, SafeHtml } from "@angular/platform-browser";
import { ActivatedRoute } from "@angular/router";
import Split from "split.js";
import { TabsModule } from "ngx-bootstrap/tabs";
import { Control, ImageOverlay, LatLngBounds, LatLngBoundsLiteral, LayerGroup } from "leaflet";
import { NgxMousetrapDirective } from "../shared/mousetrap-directive";
import { NgxEchartsDirective } from "ngx-echarts";
import type { ECElementEvent, EChartsCoreOption as EChartsOption } from "echarts/core";
import type { ScatterSeriesOption } from "echarts/charts";
import { AwsomeConfigSchema } from "./awsome.config";
import type { AwsomeConfig, AwsomeSource as AwsomeSource0 } from "./awsome.config";
import type { Subscription } from "rxjs";
import { Temporal } from "temporal-polyfill";

type AwsomeSource = AwsomeSource0 & { $loading?: Subscription };

export type FeatureProperties = GeoJSON.Feature["properties"] & {
  $sourceObject?: AwsomeSource;
  region_id: string;
} & Pick<GenericObservation, "$source" | "latitude" | "longitude" | "elevation">;

type DetailsTabLabel = string;

@Component({
  selector: "app-awsome",
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    FormsModule,
    ObservationChartComponent,
    TabsModule,
    TranslateModule,
    NgxMousetrapDirective,
    NgxEchartsDirective,
  ],
  templateUrl: "awsome.component.html",
})
export class AwsomeComponent implements AfterViewInit, OnInit {
  private route = inject(ActivatedRoute);
  filterService = inject<ObservationFilterService<FeatureProperties>>(ObservationFilterService);
  mapService = inject(BaseMapService);
  markerService = inject<ObservationMarkerService<FeatureProperties>>(ObservationMarkerService);
  private sanitizer = inject(DomSanitizer);
  private httpClient = inject(HttpClient);

  // https://gitlab.com/avalanche-warning
  configURL = "https://models.avalanche.report/dashboard/awsome.json";
  config: AwsomeConfig = {} as AwsomeConfig;
  date = "";
  layout: "map" | "chart" = "map";
  readonly mapDiv = viewChild<ElementRef<HTMLDivElement>>("observationsMap");
  observations: FeatureProperties[] = [];
  localObservations: FeatureProperties[] = [];
  selectedObservation: FeatureProperties | undefined = undefined;
  selectedObservationDetails: { label: DetailsTabLabel; html: SafeHtml }[] | undefined = undefined;
  selectedObservationActiveTabs = {} as Record<string, DetailsTabLabel>;
  sources: AwsomeSource[];
  mapLayerControl = new Control.Layers();
  mapLayer = new LayerGroup();
  mapLayerHighlight = new LayerGroup();
  hazardChart: EChartsOption | undefined;
  loading: boolean;

  async ngOnInit() {
    // this.config = (await import("./awsome.json")) as unknown as Awsome;
    this.route.queryParamMap.subscribe((params) => {
      const configURL = params.get("config");
      if (!configURL) return;
      this.configURL = configURL;
    });
    this.config = await this.fetchJSON(this.configURL)
      .toPromise()
      .then((c) => AwsomeConfigSchema.parseAsync(c));
    this.date = this.config.date;
    this.sources = this.config.sources;

    const spec = this.config.filters as FilterSelectionSpec<FeatureProperties>[];
    this.filterService.filterSelectionData = spec.map((f) => new FilterSelectionData(f));
    this.filterService.mapBounds = undefined;

    this.markerService.markerClassify = this.filterService.filterSelectionData.find(
      (f) => f.type === spec.find((f) => f.default === "classify")?.type,
    );
    this.markerService.markerLabel = this.filterService.filterSelectionData.find(
      (f) => f.type === spec.find((f) => f.default === "label")?.type,
    );
    await this.loadSources();
  }

  async loadSources() {
    this.mapLayerControl.remove();
    this.mapLayerControl = new Control.Layers();
    this.observations.length = 0;
    this.applyLocalFilter();

    this.loading = true;
    this.observations = (
      await Promise.all(
        this.sources.flatMap(
          async (source): Promise<FeatureProperties[]> =>
            await this.loadSource(source).catch((err) => {
              console.warn("Failed to load source", source, err);
              return [];
            }),
        ),
      )
    ).flat();
    this.loading = false;

    if (this.sources.some((s) => s.imageOverlays?.length)) {
      this.mapLayerControl.addTo(this.mapService.map);
    }

    this.filterService.filterSelectionData.forEach((filter) =>
      filter.buildChartsData(this.markerService.markerClassify, this.observations, (o) =>
        this.filterService.isSelected(o),
      ),
    );
    this.applyLocalFilter();
  }

  private async loadSource(source: AwsomeSource): Promise<FeatureProperties[]> {
    // replace 2023-11-12_06-00-00 with current date
    const date = this.date.replace(/T/, "_").replace(/:/g, "-");
    const url =
      date.length === "2006-01-02T03:04:05".length
        ? source.url.replace(/20\d{2}-\d{2}-\d{2}_\d{2}-\d{2}-\d{2}/, date)
        : source.url.replace(/20\d{2}-\d{2}-\d{2}_\d{2}-\d{2}/, date);

    const aspectFilter = this.filterService.filterSelectionData.find((f) => f.type === "Aspect");
    const aspects = Array.isArray(aspectFilter?.values)
      ? aspectFilter.values.map((v) => v.value)
      : ["east", "flat", "north", "south", "west"];

    source.imageOverlays?.forEach((overlay) => {
      const layer = new ImageOverlay(overlay.imageUrl, overlay.imageBounds as LatLngBoundsLiteral, overlay);
      this.mapLayerControl.addOverlay(layer, overlay.name);
    });

    source.$loading?.unsubscribe();
    return new Promise((resolve) => {
      source.$loading = this.fetchJSON<GeoJSON.FeatureCollection>(url).subscribe(({ features }) => {
        resolve(
          features.flatMap((feature: GeoJSON.Feature<GeoJSON.Geometry, FeatureProperties>): FeatureProperties[] => {
            feature.properties.$source = source.name as any;
            feature.properties.longitude ??= (feature.geometry as GeoJSON.Point).coordinates[0];
            feature.properties.latitude ??= (feature.geometry as GeoJSON.Point).coordinates[1];
            feature.properties.elevation ??= (feature.geometry as GeoJSON.Point).coordinates[2];
            feature.properties.$sourceObject = source;
            if (aspects.some((aspect) => feature.properties.snp_characteristics[aspect])) {
              return aspects
                .filter((aspect) => typeof feature.properties.snp_characteristics[aspect] === "object")
                .map((aspect) => ({
                  ...feature.properties,
                  aspect: ["__hidden__", aspect], // __hidden__ as first element does not generate a gray marker segment via makeIcon
                  snp_characteristics: feature.properties.snp_characteristics[aspect],
                }));
            }
            return [feature.properties];
          }),
        );
      });
    });
  }

  async ngAfterViewInit() {
    await this.mapService.initMaps(this.mapDiv().nativeElement);
    this.mapLayer.addTo(this.mapService.map);
    this.mapLayerHighlight.addTo(this.mapService.map);
    this.mapService.map.on("click", () => {
      this.filterService.regions = Object.fromEntries(this.mapService.getSelectedRegions().map((r) => [r, true]));
      this.applyLocalFilter();
    });
    Split([".layout-left", ".layout-right"], { onDragEnd: () => this.mapService.map.invalidateSize() });
  }

  nextDate(direction: -1 | 1) {
    const dateStepSeconds = this.config.dateStepSeconds ?? 3600;
    return Temporal.PlainDateTime.from(this.date)
      .add({ seconds: direction * dateStepSeconds })
      .toString();
  }

  async switchDate(direction: -1 | 1) {
    this.date = this.nextDate(direction);
    await this.loadSources();
  }

  applyLocalFilter() {
    this.mapLayer.clearLayers();
    this.localObservations = this.observations.filter(
      (observation) => this.filterService.isHighlighted(observation) || this.filterService.isSelected(observation),
    );
    this.localObservations.forEach((observation) => {
      this.markerService
        .createMarker(observation, this.filterService.isHighlighted(observation))
        ?.on("click", () => this.onObservationClick(observation))
        ?.addTo(this.mapLayer);
    });

    this.filterService.filterSelectionData.forEach((filter) =>
      filter.buildChartsData(this.markerService.markerClassify, this.observations, (o) =>
        this.filterService.isSelected(o),
      ),
    );

    const markerClassify = this.markerService.markerClassify;
    if (markerClassify) {
      const data = this.localObservations.map((o) => [
        // snp_characteristics.Punstable.depth
        markerClassify.getValue(o, markerClassify.key.toString().replace(/\.value$/, ".depth")) as number,
        // snp_characteristics.Punstable.value
        markerClassify.getValue(o, markerClassify.key) as number,
        // $event.data[2] as FeatureProperties
        o as unknown as number,
      ]);
      this.hazardChart = {
        xAxis: { name: "Depth" },
        yAxis: { name: markerClassify.label },
        series: [
          {
            type: "scatter",
            data,
            symbolSize: 5,
          } satisfies ScatterSeriesOption,
        ],
      };
    } else {
      this.hazardChart = undefined;
    }
  }

  chartMouseOver($event: ECElementEvent) {
    this.mapLayerHighlight.clearLayers();
    const observation = $event.data[2] as FeatureProperties;
    const marker = this.markerService.createMarker(observation, true);
    marker.options.zIndexOffset = 42_000;
    marker.addTo(this.mapLayerHighlight);
    marker.toggleTooltip();
  }

  chartMouseOut() {
    this.mapLayerHighlight.clearLayers();
  }

  private onObservationClick(observation: FeatureProperties) {
    this.selectedObservation = observation;
    this.selectedObservationDetails = observation.$sourceObject.detailsTemplates.map(({ label, template }) => ({
      label: this.markerService.formatTemplate(label, observation),
      html: this.sanitizer.bypassSecurityTrustHtml(this.markerService.formatTemplate(template, observation)),
    }));
    this.selectedObservationActiveTabs[observation.$source] ??= this.selectedObservationDetails[0]?.label;
    if (this.isMobile) {
      this.layout = "chart";
    }
  }

  closeObservation() {
    this.selectedObservation = undefined;
    this.selectedObservationDetails = undefined;
    if (this.isMobile) {
      this.layout = "map";
    }
  }

  private get isMobile() {
    // see scss/sections/_observations.scss
    return window.matchMedia("(max-width: 768px)").matches;
  }

  private fetchJSON<T>(url: string) {
    if (typeof url === "string" && !url.includes("?")) {
      url = `${url}?_=${Date.now()}`;
    }
    // FIXME const headers = { "Cache-Control": "no-cache" };
    // FIXME CORS Access-Control-Request-Headers: cache-control
    return this.httpClient.get(url, { responseType: "text" }).pipe(
      map((text) => text.replace(/\bNaN\b/g, "null")),
      map((text) => JSON.parse(text) as T),
    );
  }
}
