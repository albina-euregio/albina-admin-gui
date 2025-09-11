import { FilterSelectionData, FilterSelectionSpec } from "../observations/filter-selection-data";
import type { GenericObservation, ObservationSource } from "../observations/models/generic-observation.model";
import { ObservationChartComponent } from "../observations/observation-chart.component";
import { ObservationFilterService } from "../observations/observation-filter.service";
import { ObservationMarkerService } from "../observations/observation-marker.service";
import { BaseMapService } from "../providers/map-service/base-map.service";
import { RegionProperties } from "../providers/regions-service/regions.service";
import { NgxMousetrapDirective } from "../shared/mousetrap-directive";
import { AwsomeConfigSchema } from "./awsome.config";
import type { AwsomeConfig, AwsomeSource as AwsomeSource0 } from "./awsome.config";
import { CommonModule } from "@angular/common";
import { HttpClient } from "@angular/common/http";
import { AfterViewInit, Component, ElementRef, inject, OnInit, viewChild } from "@angular/core";
import { FormsModule } from "@angular/forms";
import { DomSanitizer, SafeHtml } from "@angular/platform-browser";
import { ActivatedRoute } from "@angular/router";
import { TranslateModule } from "@ngx-translate/core";
import type { ScatterSeriesOption } from "echarts/charts";
import type { ECElementEvent, EChartsCoreOption as EChartsOption } from "echarts/core";
import { debounce } from "es-toolkit";
import { FeatureCollection, MultiPolygon } from "geojson";
import { Control, ImageOverlay, LatLngBoundsLiteral, LayerGroup, MarkerOptions } from "leaflet";
import { TabsModule } from "ngx-bootstrap/tabs";
import { NgxEchartsDirective } from "ngx-echarts";
import type { Subscription } from "rxjs";
import { map } from "rxjs/operators";
import Split from "split.js";
import { Temporal } from "temporal-polyfill";

type AwsomeSource = AwsomeSource0 & { $loading?: Subscription; $error?: unknown };

export type FeatureProperties = GeoJSON.Feature["properties"] & {
  $sourceObject?: AwsomeSource;
  $geometry: GeoJSON.Geometry;
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
  config$q: Promise<AwsomeConfig>;
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
  loadingState: "loading" | "error" | undefined;

  async ngOnInit() {
    // this.config = (await import("./awsome.json")) as unknown as Awsome;
    this.route.queryParamMap.subscribe((params) => {
      this.configURL = params.get("config") || this.configURL;
      this.date = params.get("date") || this.date;
    });
    this.config$q = this.fetchJSON(this.configURL)
      .toPromise()
      .then((c) => AwsomeConfigSchema.parseAsync(c));
    this.config = await this.config$q;
    this.date ||= this.config.date;
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

    this.loadingState = "loading";
    this.observations = (
      await Promise.all(
        this.sources.flatMap(async (source): Promise<FeatureProperties[]> => {
          try {
            source.$error = undefined;
            return await this.loadSource(source);
          } catch (err) {
            source.$error = err;
            this.loadingState = "error";
            console.warn("Failed to load source", source, err);
            return [];
          } finally {
            source.$loading?.unsubscribe();
            source.$loading = undefined;
          }
        }),
      )
    ).flat();
    if (this.loadingState === "loading") {
      this.loadingState = undefined;
    }

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
    return new Promise((next, error) => {
      source.$loading = this.fetchJSON<GeoJSON.FeatureCollection>(url)
        .pipe(
          map(({ features }): FeatureProperties[] =>
            features.flatMap((feature: GeoJSON.Feature<GeoJSON.Geometry, FeatureProperties>): FeatureProperties[] => {
              feature.properties.$source = source.name as unknown as ObservationSource;
              feature.properties.$sourceObject = source;
              feature.properties.$geometry = feature.geometry;
              if (feature.geometry.type === "Point") {
                feature.properties.longitude ??= feature.geometry.coordinates[0];
                feature.properties.latitude ??= feature.geometry.coordinates[1];
                feature.properties.elevation ??= feature.geometry.coordinates[2];
              } else if (feature.geometry.type === "Polygon") {
                feature.properties.longitude ??= feature.geometry.coordinates[0][0][0];
                feature.properties.latitude ??= feature.geometry.coordinates[0][0][1];
                feature.properties.elevation ??= feature.geometry.coordinates[0][0][2];
              }
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
          ),
        )
        .subscribe({ next, error });
    });
  }

  async ngAfterViewInit() {
    await this.config$q;
    let regions: FeatureCollection<MultiPolygon, RegionProperties> | undefined;
    if (this.config.regions?.url) {
      regions = await this.fetchJSON<FeatureCollection<MultiPolygon, RegionProperties>>(
        this.config.regions?.url,
      ).toPromise();
    }

    await this.mapService.initMaps(this.mapDiv().nativeElement, {
      regions: regions,
      internalRegions: regions,
    });

    this.mapLayer.addTo(this.mapService.map);
    this.mapLayerHighlight.addTo(this.mapService.map);
    this.mapService.map.on({
      click: () => {
        this.filterService.regions = Object.fromEntries(this.mapService.getSelectedRegions().map((r) => [r, true]));
        this.applyLocalFilter();
      },
    });
    // Watch zoom changes
    this.mapService.map.on("zoomend", () => {
      this.updateBaseLayer();
    });

    Split([".layout-left", ".layout-right"], { onDragEnd: () => this.mapService.map.invalidateSize() });
    Split([".toolset-1", ".toolset-2"], { sizes: [33, 66], direction: "vertical" });
  }

  private updateBaseLayer(): void {
    const zoom = this.mapService.map.getZoom();

    if (zoom >= 13) {
      if (this.mapService.map.hasLayer(this.mapService.getAlbinaBaseMap())) {
        this.mapService.map.removeLayer(this.mapService.getAlbinaBaseMap());
      }
      if (!this.mapService.map.hasLayer(this.mapService.getOpenTopoBaseMap())) {
        this.mapService.map.addLayer(this.mapService.getOpenTopoBaseMap());
      }
    } else {
      if (this.mapService.map.hasLayer(this.mapService.getOpenTopoBaseMap())) {
        this.mapService.map.removeLayer(this.mapService.getOpenTopoBaseMap());
      }
      if (!this.mapService.map.hasLayer(this.mapService.getAlbinaBaseMap())) {
        this.mapService.map.addLayer(this.mapService.getAlbinaBaseMap());
      }
    }
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
      const isHighlighted = this.filterService.isHighlighted(observation);
      const marker =
        observation.$geometry.type === "Polygon"
          ? this.markerService.createPolygonMarker(observation, isHighlighted, observation.$geometry)
          : this.markerService.createMarker(observation, isHighlighted);
      marker
        ?.on({
          tooltipopen: debounce(() => this.highlightInHazardChart(observation), 500),
          tooltipclose: debounce(() => this.highlightInHazardChart(undefined), 500),
          click: () => this.onObservationClick(observation),
          contextmenu: () => this.onObservationRightClick(observation),
        })
        ?.addTo(this.mapLayer);
    });

    this.filterService.filterSelectionData.forEach((filter) =>
      filter.buildChartsData(this.markerService.markerClassify, this.observations, (o) =>
        this.filterService.isSelected(o),
      ),
    );

    const markerClassify = this.markerService.markerClassify;
    if (markerClassify) {
      const data = this.localObservations.map((o) => this.toChartData(o));
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

  private toChartData(o: FeatureProperties): number[] {
    const markerClassify = this.markerService.markerClassify;
    return [
      // snp_characteristics.Punstable.depth
      markerClassify.getValue(o, markerClassify.key.toString().replace(/\.value$/, ".depth")) as number,
      // snp_characteristics.Punstable.value
      markerClassify.getValue(o, markerClassify.key) as number,
      // $event.data[2] as FeatureProperties
      o as unknown as number,
    ];
  }

  private highlightInHazardChart(observation: FeatureProperties) {
    this.hazardChart = {
      ...this.hazardChart,
      series: [
        this.hazardChart.series[0],
        {
          type: "scatter",
          data: observation ? [this.toChartData(observation)] : [],
          symbolSize: 15,
          color: "red",
        },
      ] satisfies ScatterSeriesOption[],
    };
  }

  chartMouseOver($event: ECElementEvent) {
    this.mapLayerHighlight.clearLayers();
    const observation = $event.data[2] as FeatureProperties;
    const marker = this.markerService.createMarker(observation, true);
    (marker.options as MarkerOptions).zIndexOffset = 42_000;
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
    this.selectedObservationActiveTabs[observation.$source] = (
      this.selectedObservationDetails.find(
        ({ label }) => label === this.selectedObservationActiveTabs[observation.$source],
      ) ?? this.selectedObservationDetails[0]
    ).label;
    if (this.isMobile) {
      this.layout = "chart";
    }
  }

  private onObservationRightClick(observation: FeatureProperties) {
    this.onObservationClick(observation);
    this.filterService.regions = { [observation.region_id]: true };
    // TODO this.filterService.filterSelectionData set for elevation band, etc.
    this.applyLocalFilter();
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
