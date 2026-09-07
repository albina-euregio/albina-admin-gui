import { CommonModule } from "@angular/common";
import { HttpClient } from "@angular/common/http";
import {
  AfterViewInit,
  Component,
  ElementRef,
  HostListener,
  inject,
  OnInit,
  viewChild,
  ChangeDetectionStrategy,
} from "@angular/core";
import { FormsModule } from "@angular/forms";
import { DomSanitizer, SafeHtml } from "@angular/platform-browser";
import { ActivatedRoute } from "@angular/router";
import { TranslatePipe, TranslateService } from "@ngx-translate/core";
import { AuthenticationService } from "app/providers/authentication-service/authentication.service";
import type { ScatterSeriesOption } from "echarts/charts";
import type { GridComponentOption } from "echarts/components";
import type { ECElementEvent, ECharts, EChartsCoreOption as EChartsOption } from "echarts/core";
import type {
  CallbackDataParams,
  LineSeriesOption,
  MarkLineOption,
  TooltipOption,
  XAXisOption,
  YAXisOption,
} from "echarts/types/dist/shared";
import { Feature, FeatureCollection, Geometry, MultiPolygon } from "geojson";
import { GeoJSONSource, Map as MlMap, MapLayerMouseEvent, Marker as MlMarker, Popup } from "maplibre-gl";
import { TabsModule } from "ngx-bootstrap/tabs";
import { NgxEchartsDirective } from "ngx-echarts";
import { firstValueFrom, forkJoin, type Subscription } from "rxjs";
import { map } from "rxjs/operators";
import Split from "split.js";
import * as z from "zod/v4";

import { environment } from "../../environments/environment";
import { LayerToggleControl } from "../map/controls/layer-toggle-control";
import { RegionMapService } from "../map/region-map.service";
import { addTerrainControl } from "../map/terrain";
import type { FilterSelectionValue } from "../observations/filter-selection-config";
import { FilterSelectionData, FilterSelectionSpec } from "../observations/filter-selection-data";
import type { GenericObservation, ObservationSource } from "../observations/models/generic-observation.model";
import { ObservationChartComponent } from "../observations/observation-chart.component";
import { ObservationFilterService } from "../observations/observation-filter.service";
import { ObsMarkerElement, ObservationMarkerService } from "../observations/observation-marker.service";
import { RegionProperties } from "../providers/regions-service/regions.service";
import { NgxMousetrapDirective } from "../shared/mousetrap-directive";
import { AwsomeConfigSchema } from "./awsome.config";
import type { AwsomeConfig, AwsomeSource as AwsomeSource0 } from "./awsome.config";

type AwsomeSource = AwsomeSource0 & { $loading?: Subscription; $error?: unknown };
interface SourceGroup {
  label: string;
  groups: SourceGroup[];
  sources: AwsomeSource[];
}

export type FeatureProperties = GeoJSON.Feature["properties"] & {
  $date: string;
  $stabilityIndex: string;
  $sourceObject?: AwsomeSource;
  $geometry: GeoJSON.Geometry;
  region_id: string;
  location?: string;
} & Pick<GenericObservation, "$source" | "latitude" | "longitude" | "elevation">;

type DetailsTabLabel = string;

const MEDIAN_COLOR = "green";
const ASPECT_FILE = /\.[A-Za-z]+\.json(\?|$)/;
const MEDIAN_SERIES = 1;
const SPLIT_LINE = { lineStyle: { color: "#e8e8e8" } };

const IndexSchema = z.object({
  depth: z.number().nullish().array(),
  size_estimate: z.number().nullish().array(),
  lower: z.number().nullish().array(),
  lower2: z.number().nullish().array().optional(),
  mean: z.number().nullish().array(),
  upper: z.number().nullish().array(),
  upper2: z.number().nullish().array().optional(),
});
const TimeseriesSchema = z.object({
  indexes: z.record(z.string(), IndexSchema),
  timestamps: z.coerce.date().array(),
});
type Timeseries = z.infer<typeof TimeseriesSchema>;

@Component({
  selector: "app-awsome",
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    FormsModule,
    ObservationChartComponent,
    TabsModule,
    TranslatePipe,
    NgxMousetrapDirective,
    NgxEchartsDirective,
  ],
  templateUrl: "awsome.component.html",
  changeDetection: ChangeDetectionStrategy.Eager,
  providers: [RegionMapService, ObservationFilterService, ObservationMarkerService],
})
export class AwsomeComponent implements AfterViewInit, OnInit {
  private route = inject(ActivatedRoute);
  filterService = inject<ObservationFilterService<FeatureProperties>>(ObservationFilterService);
  mapService = inject(RegionMapService);
  markerService = inject<ObservationMarkerService<FeatureProperties>>(ObservationMarkerService);
  private sanitizer = inject(DomSanitizer);
  private httpClient = inject(HttpClient);
  private translateService = inject(TranslateService);
  private authenticationService = inject(AuthenticationService);

  // https://gitlab.com/avalanche-warning
  private configURL = "";
  private config$q: Promise<AwsomeConfig>;
  config: AwsomeConfig = {} as AwsomeConfig;
  date = "";
  layout: "map" | "chart" | "details" = "map";
  readonly mapDiv = viewChild<ElementRef<HTMLDivElement>>("observationsMap");
  private observations: FeatureProperties[] = [];
  private localObservations: FeatureProperties[] = [];
  selectedObservation: FeatureProperties | undefined = undefined;
  selectedObservationDetails: { label: DetailsTabLabel; html: SafeHtml; source: string; frame?: string }[] | undefined =
    undefined;
  selectedObservationActiveTabs = {} as Record<string, DetailsTabLabel>;
  sources: AwsomeSource[];
  sourceTree: SourceGroup = { label: "", groups: [], sources: [] };
  private chartObservations: FeatureProperties[] = [];
  private map?: MlMap;
  private pointMarkers: MlMarker[] = [];
  private highlightMarker?: MlMarker;
  private highlightPolygon?: number;
  // a hovered circle marker takes tooltip priority over the polygon layer underneath it
  private markerHovered = false;
  private hoveredObservation?: FeatureProperties;
  private imageOverlays: { id: string; name: string }[] = [];
  private overlayControl?: LayerToggleControl;
  private readonly polygonSource = "awsome-polygons";
  private readonly tooltipPopup = new Popup({
    closeButton: false,
    closeOnClick: false,
    className: "obs-tooltip",
  }) as Popup;
  hazardChart: EChartsOption | undefined;
  hazardInstance?: ECharts;
  private hazardHighlight = -1;
  timeseriesChart: EChartsOption | undefined;
  timeseriesInstance?: ECharts;
  private timeseriesDateIndex = -1;
  private timeseries?: { url: string; data: Timeseries };
  private timeseries$loading?: { url: string; subscription: Subscription };
  loadingState: "loading" | "error" | undefined;

  t(key: string) {
    let t = this.translateService.instant(`awsome.${key}`);
    if (typeof t === "string" && t.startsWith("awsome.")) {
      t = t.slice("awsome.".length);
    }
    return t;
  }

  async ngOnInit() {
    this.configURL = this.authenticationService.getActiveRegion()?.awsomeUrl || environment.awsomeConfigUrl;
    // this.config = (await import("./awsome.json")) as unknown as Awsome;
    this.route.queryParamMap.subscribe((params) => {
      this.configURL = params.get("config") || this.configURL;
      this.date = params.get("date") || this.date;
    });
    this.config$q = firstValueFrom(this.fetchJSON(this.configURL)).then((c) => AwsomeConfigSchema.parseAsync(c));
    this.config = await this.config$q;
    this.date ||= this.config.date;
    this.sources = this.config.sources;
    this.sourceTree = this.buildSourceTree(this.sources);
    this.sources.forEach((s) => (this.filterService.observationSources[this.asSource(s)] ??= true));

    const spec = this.config.filters as FilterSelectionSpec<FeatureProperties>[];
    this.filterService.filterSelectionData = spec.map((f) => {
      f.label = f.labelI18nKey ? this.translateService.instant(f.labelI18nKey) : this.t(f.label);
      f.values.forEach((v) => {
        v.label = v.labelI18nKey ? this.translateService.instant(v.labelI18nKey) : this.t(v.label);
      });
      return new FilterSelectionData(f);
    });
    this.filterService.mapBounds = undefined;

    this.markerService.markerClassify = this.filterService.filterSelectionData.find(
      (f) => f.type === spec.find((f) => f.default === "classify")?.type,
    );
    this.markerService.markerLabel = this.filterService.filterSelectionData.find(
      (f) => f.type === spec.find((f) => f.default === "label")?.type,
    );
    await this.loadSources();
  }

  get activeSources() {
    return this.sources.filter((s) => this.filterService.observationSources[this.asSource(s)]);
  }

  private asSource(source: AwsomeSource): ObservationSource {
    return source.name as unknown as ObservationSource;
  }

  private buildSourceTree(sources: AwsomeSource[]): SourceGroup {
    const root: SourceGroup = { label: "", groups: [], sources: [] };
    for (const source of sources) {
      let node = root;
      for (const label of source.group?.split("/").filter(Boolean) ?? []) {
        node =
          node.groups.find((g) => g.label === label) ??
          node.groups[node.groups.push({ label, groups: [], sources: [] }) - 1];
      }
      node.sources.push(source);
    }
    return root;
  }

  private groupSources(group: SourceGroup): AwsomeSource[] {
    return [...group.sources, ...group.groups.flatMap((g) => this.groupSources(g))];
  }

  isGroupOn(group: SourceGroup): boolean {
    return this.groupSources(group).every((s) => this.filterService.observationSources[this.asSource(s)]);
  }

  isGroupMixed(group: SourceGroup): boolean {
    const on = this.groupSources(group).map((s) => !!this.filterService.observationSources[this.asSource(s)]);
    return on.some(Boolean) && !on.every(Boolean);
  }

  toggleGroup(group: SourceGroup, on: boolean) {
    this.groupSources(group).forEach((s) => (this.filterService.observationSources[this.asSource(s)] = on));
    this.loadSources();
  }

  async loadSources() {
    this.removeImageOverlays();
    this.observations.length = 0;
    this.timeseries = undefined;
    this.clearMap();
    this.loadHazardChart();
    this.loadTimeseriesChart();

    this.loadingState = "loading";
    this.observations = (
      await Promise.all(
        this.activeSources.flatMap(async (source): Promise<FeatureProperties[]> => {
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

    if (this.imageOverlays.length && this.map) {
      this.overlayControl = new LayerToggleControl(this.imageOverlays);
      this.map.addControl(this.overlayControl, "bottom-right");
    }

    this.applyLocalFilter();
  }

  get dateForPicker() {
    return this.date;
  }

  set dateForPicker(d: string) {
    if (this.date.length === "2006-01-02T03:04:05".length && d.length === "2006-01-02T03:04".length) {
      d += ":00";
    }
    this.date = d;
  }

  private get albinaDate() {
    return this.date.replace(/T/, "_").replace(/:/g, "-");
  }

  private setSearchParams(url: URL, sources: AwsomeSource[]): URL {
    const date = this.albinaDate;
    // replace 2023-11-12_06-00-00 with current date
    url.pathname =
      date.length === "2006-01-02T03:04:05".length
        ? url.pathname.replace(/20\d{2}-\d{2}-\d{2}_\d{2}-\d{2}-\d{2}/, date)
        : url.pathname.replace(/20\d{2}-\d{2}-\d{2}_\d{2}-\d{2}/, date);
    url.searchParams.set("ts", date);

    sources.forEach((source) => {
      if (source.name) url.searchParams.append("source", source.name);
    });

    const stabilityIndex = this.stabilityIndex;
    if (stabilityIndex) {
      url.searchParams.set("stabilityIndex", stabilityIndex.type);
    }

    this.filterService.filterSelectionData.forEach((f) =>
      f.getSelectedValues("selected").forEach((v) => url.searchParams.append(String(f.type), v.value)),
    );
    this.filterService.regions.forEach((r) => url.searchParams.append("region", r));
    return url;
  }

  private get baseURL() {
    // Relative URLs in the config are relative to the app, not to the route the
    // user happens to be on: resolve against <base href>, which is the app root
    // wherever it is mounted. location.href would be ".../modelling/awsome" and
    // would send every source, timeseries and details URL one level too deep.
    return this.configURL.endsWith("dcfg/awsome.json")
      ? new URL(this.configURL.replace("dcfg/awsome.json", ""), document.baseURI)
      : document.baseURI;
  }

  private async loadSource(source: AwsomeSource): Promise<FeatureProperties[]> {
    const date = this.albinaDate;
    const filterUrl = this.filterService.filterSelectionData.find(
      (f) => f.url && f.getSelectedValues("selected").length,
    );
    const url0 = new URL(filterUrl?.url ?? source.url, this.baseURL);
    const url = this.setSearchParams(url0, [source]).toString();

    const aspectFilter = this.filterService.filterSelectionData.find((f) => f.type === "aspect");
    const aspects = Array.isArray(aspectFilter?.values)
      ? aspectFilter.values.map((v) => v.value)
      : ["east", "flat", "north", "south", "west"];
    const selectedAspects = aspectFilter?.selected.size ? [...aspectFilter.selected] : [...aspects, "nan"];
    const urls = filterUrl ? [url] : selectedAspects.map((aspect) => url.replace(ASPECT_FILE, `.${aspect}.json$1`));

    source.imageOverlays?.forEach((overlay) => this.addImageOverlay(overlay));

    source.$loading?.unsubscribe();
    return new Promise((next, error) => {
      source.$loading = forkJoin(urls.map((u) => this.fetchJSON<GeoJSON.FeatureCollection>(u)))
        .pipe(
          map((collections): FeatureProperties[] =>
            collections
              .flatMap((c) => c.features)
              .map((feature: GeoJSON.Feature<GeoJSON.Geometry, FeatureProperties>): FeatureProperties => {
                feature.properties.$date = date;
                feature.properties.$source = this.asSource(source);
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
                } else if (feature.geometry.type === "MultiPolygon") {
                  feature.properties.longitude ??= feature.geometry.coordinates[0][0][0][0];
                  feature.properties.latitude ??= feature.geometry.coordinates[0][0][0][1];
                  feature.properties.elevation ??= feature.geometry.coordinates[0][0][0][2];
                }
                return feature.properties;
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
      // like every other URL in the config: relative to the app, not the route
      regions = await firstValueFrom(
        this.fetchJSON<FeatureCollection<MultiPolygon, RegionProperties>>(
          new URL(this.config.regions.url, this.baseURL).toString(),
        ),
      );
    }

    const map = await this.mapService.initMap(this.mapDiv().nativeElement, { clickMode: "awsome", regions });
    this.map = map;
    map.boxZoom.disable();
    addTerrainControl(map);

    const [lat, lon, zoom] = this.config.mapCenter;
    map.jumpTo({ center: [lon, lat], zoom });

    this.setupPolygonLayer(map);
    this.mapService.onSelectionChange(() => {
      this.filterService.regions = new Set(this.mapService.getSelectedRegions());
      this.applyLocalFilter();
    });
    this.applyLocalFilter();

    if (window.matchMedia("(min-width: 769px)").matches) {
      Split([".layout-left", ".layout-right"], { onDragEnd: () => map.resize() });
      Split([".toolset-1", ".toolset-2"], { sizes: [33, 66], direction: "vertical" });
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

  private clearMap() {
    this.pointMarkers.forEach((m) => m.remove());
    this.pointMarkers = [];
    this.localObservations = [];
    (this.map?.getSource(this.polygonSource) as GeoJSONSource | undefined)?.setData({
      type: "FeatureCollection",
      features: [],
    });
  }

  applyLocalFilter() {
    this.clearMap();
    const stabilityIndex = this.stabilityIndex;
    this.observations.forEach((o) => (o.$stabilityIndex = stabilityIndex?.type));
    const selected = new Set(this.observations.filter((o) => this.filterService.isSelected(o)));
    const classify = new Map(this.observations.map((o) => [o, this.markerService.markerClassify?.getValue(o)]));
    const highlighting = this.filterService.filterSelectionData.some((f) => f.highlighted.size > 0);
    this.localObservations = this.observations.filter(
      (o) => selected.has(o) || (highlighting && this.filterService.isHighlighted(o)),
    );

    const polygonFeatures: Feature[] = [];
    this.localObservations.forEach((observation, index) => {
      const isHighlighted = this.filterService.isHighlighted(observation);
      if (observation.$geometry.type === "Polygon" || observation.$geometry.type === "MultiPolygon") {
        polygonFeatures.push({
          type: "Feature",
          properties: { index, ...this.markerService.maplibrePolygonPaint(observation, isHighlighted) },
          geometry: observation.$geometry,
        });
      } else {
        const marker = this.markerService.createMaplibreMarker(observation, isHighlighted);
        if (marker && this.map) {
          this.wirePointMarker(marker, observation);
          marker.addTo(this.map);
          this.pointMarkers.push(marker);
        }
      }
    });
    (this.map?.getSource(this.polygonSource) as GeoJSONSource | undefined)?.setData({
      type: "FeatureCollection",
      features: polygonFeatures,
    });

    this.filterService.filterSelectionData.forEach((filter) =>
      filter.buildChartsData(
        this.markerService.markerClassify,
        this.observations,
        (o) => selected.has(o),
        (o) => classify.get(o),
      ),
    );

    if (this.selectedObservation) {
      // the details follow the selection: the same observation, or its stand-in after a reload
      const observation = this.localObservations.includes(this.selectedObservation)
        ? this.selectedObservation
        : (this.localObservations.find((o) => o?.location === this.selectedObservation?.location) ??
          this.selectedObservation);
      this.showObservationDetails(observation);
    }

    try {
      this.loadHazardChart();
    } catch (e) {
      console.error("Failed to load hazard chart", e);
    }

    try {
      this.loadTimeseriesChart();
    } catch (e) {
      console.error("Failed to load timeseries chart", e);
    }
  }

  private loadHazardChart() {
    const markerClassify = this.markerService.markerClassify;
    const grainType = this.filterService.filterSelectionData.find((f) => f.type === "grainType");
    const xType = this.filterService.filterSelectionData.find((f) => f.type === this.config.hazardChart.xType);
    if (!markerClassify) {
      this.hazardChart = undefined;
      return;
    }
    this.chartObservations = this.localObservations;
    this.liveHazardChart?.dispatchAction({ type: "downplay", seriesIndex: 0 });
    this.hazardHighlight = -1;
    this.hoveredObservation = undefined;
    const observations = this.chartObservations;
    const data = observations.map((o, i) => this.toChartData(o, i));
    this.hazardChart = {
      xAxis: {
        nameLocation: "center",
        name: this.t(xType.label),
        axisLabel: {
          formatter: (value) => this.config.hazardChart.xAxisLabels?.[value] ?? value,
        },
        min: xType?.chartAxisRange?.[0],
        max: xType?.chartAxisRange?.[1],
        axisPointer: { type: "line" },
        splitLine: SPLIT_LINE,
      } satisfies XAXisOption,
      yAxis: {
        name: this.t(markerClassify.label),
        min: markerClassify.chartAxisRange?.[0],
        max: markerClassify.chartAxisRange?.[1],
        axisPointer: { type: "line" },
        splitLine: SPLIT_LINE,
      } satisfies YAXisOption,
      grid: {
        left: 40,
        top: 40,
        bottom: 40,
        right: 10,
        backgroundColor: "#f7f7f7",
        show: true,
      } satisfies GridComponentOption,
      tooltip: {
        trigger: "axis",
        showContent: false,
        axisPointer: { type: "cross" },
      } satisfies TooltipOption,
      axisPointer: { triggerEmphasis: false },
      series: [
        {
          type: "scatter",
          itemStyle: {
            borderColor: "rgba(0, 0, 0, 0.3)",
            color: ({ data }) => grainType?.findForObservation(observations[data[2] as number])?.color ?? "black",
          },
          data,
          symbolSize: 7,
          emphasis: { scale: 1.8, itemStyle: { borderColor: "#000", borderWidth: 1.5 } },
          markLine: this.classLines(markerClassify, 1),
        } satisfies ScatterSeriesOption,
        {
          type: "scatter",
          data: [],
          symbol: "diamond",
          symbolSize: 25,
          color: MEDIAN_COLOR,
          itemStyle: { borderColor: "#000", borderWidth: 1 },
        } satisfies ScatterSeriesOption,
      ],
    } satisfies EChartsOption;
  }

  private toChartData(o: FeatureProperties, index: number): number[] {
    const markerClassify = this.markerService.markerClassify;
    const xType = this.filterService.filterSelectionData.find((f) => f.type === this.config.hazardChart?.xType);
    return [
      // snowpack.Punstable.size_estimate
      xType.getValue(o) as number,
      // snowpack.Punstable.value
      markerClassify.getValue(o) as number,
      // this.chartObservations[$event.data[2]]
      index,
    ];
  }

  /** Dashed lines on a filter's class boundaries, each coloured like the class listed above it. */
  private classLines(filter: FilterSelectionData<FeatureProperties>, z: number): MarkLineOption {
    const classes = filter.values.filter((v): v is FilterSelectionValue & { numericRange: number[] } =>
      Array.isArray(v.numericRange),
    );
    const data = classes.slice(1).flatMap((below, i) => {
      const above = classes[i];
      const bound = above.numericRange.find((b) => below.numericRange.includes(b));
      return bound === undefined ? [] : [{ yAxis: bound, lineStyle: { color: above.color } }];
    });
    return { z, silent: true, symbol: "none", label: { show: false }, lineStyle: { type: "dashed", width: 1.6 }, data };
  }

  /** Crosshair and emphasis on the hovered observation's point, without touching the option object. */
  private highlightInHazardChart(observation: FeatureProperties | undefined) {
    const chart = this.liveHazardChart;
    if (!chart) return;
    if (this.hazardHighlight >= 0) {
      chart.dispatchAction({ type: "downplay", seriesIndex: 0, dataIndex: this.hazardHighlight });
    }
    const dataIndex = observation ? this.chartObservations.indexOf(observation) : -1;
    this.hazardHighlight = dataIndex;
    if (dataIndex >= 0) {
      chart.dispatchAction({ type: "showTip", seriesIndex: 0, dataIndex });
      chart.dispatchAction({ type: "highlight", seriesIndex: 0, dataIndex });
    } else {
      chart.dispatchAction({ type: "updateAxisPointer", currTrigger: "leave" });
    }
  }

  private get stabilityIndex(): FilterSelectionData<FeatureProperties> | undefined {
    const markerClassify = this.markerService.markerClassify;
    if (
      markerClassify.stabilityIndex ||
      markerClassify?.type === "Punstable" ||
      markerClassify?.type === "ccl" ||
      markerClassify?.type === "lwc" ||
      markerClassify?.type === "sk38_rta"
    ) {
      return markerClassify;
    }
    return undefined;
  }

  private loadTimeseriesChart() {
    const stabilityIndex = this.stabilityIndex;
    const url0 = this.config.timeseriesChart?.url;
    if (!stabilityIndex || !url0 || !this.activeSources.length) {
      this.timeseriesChart = undefined;
      this.timeseries$loading?.subscription.unsubscribe();
      this.timeseries$loading = undefined;
      return;
    }
    const url = this.setSearchParams(new URL(url0, this.baseURL), this.activeSources).toString();
    if (this.timeseries?.url === url) {
      this.renderTimeseries(this.timeseries.data, stabilityIndex);
      return;
    }
    if (this.timeseries$loading?.url === url) {
      return;
    }
    this.timeseriesChart = undefined;
    this.timeseries$loading?.subscription.unsubscribe();
    this.timeseries$loading = {
      url,
      subscription: this.fetchJSON(url).subscribe((d) => {
        this.timeseries$loading = undefined;
        this.timeseries = { url, data: TimeseriesSchema.parse(d) };
        this.renderTimeseries(this.timeseries.data, stabilityIndex);
      }),
    };
  }

  private renderTimeseries(data: Timeseries, stabilityIndex: FilterSelectionData<FeatureProperties>) {
    const indexData = data.indexes[stabilityIndex.type];
    if (!indexData) {
      this.timeseriesChart = undefined;
      return;
    }
    this.timeseriesChart = {
      xAxis: {
        type: "time",
        nameLocation: "center",
        name: this.t("Date"),
        splitLine: SPLIT_LINE,
      } satisfies XAXisOption,
      yAxis: {
        name: this.t(stabilityIndex.label),
        position: "right",
        min: stabilityIndex.chartAxisRange?.[0],
        max: stabilityIndex.chartAxisRange?.[1],
        splitLine: SPLIT_LINE,
      } satisfies YAXisOption,
      grid: {
        left: 10,
        top: 40,
        bottom: 40,
        right: 50,
        backgroundColor: "#f7f7f7",
        show: true,
      } satisfies GridComponentOption,
      tooltip: {
        trigger: "axis",
        formatter: ([series]: CallbackDataParams[]) => `
            <dl>
              <dt>${stabilityIndex.type}</dt><dd>${indexData.mean[series.dataIndex]}</dd>
              <dt>${this.t("Depth")}<dt><dd>${indexData.depth[series.dataIndex]}</dd>
              <dt>${this.t("Size estimate")}<dt><dd>${indexData.size_estimate[series.dataIndex]}</dd>
            </dl>`,
        showContent: true,
        axisPointer: {
          type: "cross",
        },
      } satisfies TooltipOption,
      series: [
        {
          name: "mean",
          type: "line",
          color: MEDIAN_COLOR,
          emphasis: { scale: 2.5 },
          data: data.timestamps.map((t, i) => [t, indexData.mean[i]]),
          markLine: {
            silent: true,
            symbol: "none",
            label: { show: false },
            lineStyle: { color: "#000" },
            data: [{ xAxis: this.date }],
          } satisfies MarkLineOption,
        } satisfies LineSeriesOption,
        {
          name: "lower",
          type: "line",
          z: 1,
          data: data.timestamps.map((t, i) => [t, indexData.lower[i]]),
          lineStyle: { opacity: 0 },
          stack: "confidence-band",
          symbol: "none",
          markLine: this.classLines(stabilityIndex, 2),
        } satisfies LineSeriesOption,
        {
          name: "upper",
          type: "line",
          z: 1,
          data: data.timestamps.map((t, i) => [t, indexData.upper[i] - indexData.lower[i]]),
          lineStyle: { opacity: 0 },
          areaStyle: { color: "#bbb" },
          stack: "confidence-band",
          symbol: "none",
        } satisfies LineSeriesOption,
        ...(indexData.lower2
          ? [
              {
                name: "lower",
                type: "line",
                z: 1,
                data: data.timestamps.map((t, i) => [t, indexData.lower2[i]]),
                lineStyle: { opacity: 0 },
                stack: "confidence-band2",
                symbol: "none",
              } satisfies LineSeriesOption,
              {
                name: "upper",
                type: "line",
                z: 1,
                data: data.timestamps.map((t, i) => [t, indexData.upper2[i] - indexData.lower2[i]]),
                lineStyle: { opacity: 0 },
                areaStyle: { color: "#ddd" },
                stack: "confidence-band2",
                symbol: "none",
              } satisfies LineSeriesOption,
            ]
          : []),
      ],
    } satisfies EChartsOption;

    // show diamond marker in hazard chart
    if (!this.hazardChart) {
      return;
    }
    this.hazardChart = { ...this.hazardChart };
    const series: ScatterSeriesOption = this.hazardChart.series[MEDIAN_SERIES];
    const i = data.timestamps.findIndex((t) => +t === Date.parse(this.date));
    this.timeseriesDateIndex = i;
    if (this.config.hazardChart.xType === "size_estimate") {
      series.data = i >= 0 ? [[indexData.size_estimate[i], indexData.mean[i]]] : [];
    } else {
      series.data = [];
    }
  }

  /** The chart instance while its view exists; the details view disposes it without telling us. */
  private get liveHazardChart(): ECharts | undefined {
    return this.hazardInstance?.isDisposed() ? undefined : this.hazardInstance;
  }

  chartMouseOver($event: ECElementEvent) {
    this.clearHighlight();
    if ($event.seriesIndex === MEDIAN_SERIES) {
      this.emphasizeMedian("highlight");
      return;
    }
    const observation = this.chartObservations[$event.data[2] as number];
    if (observation) {
      this.highlightOnMap(observation);
    }
  }

  /** The viewer in a details frame names the location under its pointer, or null when it left. */
  @HostListener("window:message", ["$event"])
  onViewerMessage(event: MessageEvent<{ type?: string; location?: string | null; state?: Record<string, string> }>) {
    if (event.origin !== window.location.origin) return;
    if (event.data?.type === "nivix:state") {
      this.resteerFrame(event.source, event.data.state ?? {});
      return;
    }
    if (event.data?.type !== "nivix:hover") return;
    this.clearHighlight();
    const location = event.data.location;
    const observation = location && this.localObservations.find((o) => o.location === location);
    if (observation) {
      this.highlightOnMap(observation);
    }
  }

  /** A cell keeps its shape and gets a heavy outline; a point grows, in its own colour. */
  /** Both HTML hold one viewer frame on the same path: post the new query to the rendered frame. */
  // the tabs left behind lose their content; a steered one gets its current link back
  // for when it is shown again
  selectDetailsTab(tab: { label: DetailsTabLabel }) {
    this.selectedObservationActiveTabs[this.selectedObservation.$source] = tab.label;
    for (const other of this.selectedObservationDetails ?? []) {
      if (other !== tab && other.frame !== undefined && other.frame !== this.frameSrc(other.source)) {
        other.html = this.sanitizer.bypassSecurityTrustHtml(other.source);
        other.frame = this.frameSrc(other.source);
      }
    }
  }

  private frameSrc(html: string): string | undefined {
    return html.match(/<iframe[^>]*\ssrc="([^"]+)"/)?.[1]?.replace(/&amp;/g, "&");
  }

  private detailsFrames(): HTMLIFrameElement[] {
    return [...document.querySelectorAll<HTMLIFrameElement>(".layout-details iframe")];
  }

  // the frame keeps the src it was rendered with; the viewer inside follows the posted queries
  private steerFrame(frame: HTMLIFrameElement, nextHtml: string): boolean {
    const after = this.frameSrc(nextHtml);
    if (!after || !frame.contentWindow) return false;
    const [pathBefore] = (frame.getAttribute("src") ?? "").split("?");
    const [pathAfter, query] = after.split("?");
    if (pathBefore !== pathAfter || !pathAfter.includes("/nivix/") || !query) return false;
    frame.contentWindow.postMessage({ type: "nivix:query", query: `?${query}` }, window.location.origin);
    return true;
  }

  // a viewer that announces a selection other than its tab's missed a steer while it was
  // still loading: it is steered again
  private resteerFrame(source: MessageEventSource | null, shown: Record<string, string>) {
    const frame = this.detailsFrames().find((f) => f.contentWindow === source);
    const tab = frame && this.selectedObservationDetails?.find((t) => t.frame === frame.getAttribute("src"));
    const wanted = tab && this.frameSrc(tab.source)?.split("?")[1];
    if (!wanted) return;
    const params = new URLSearchParams(wanted);
    if (["file", "region", "band"].every((key) => (params.get(key) ?? "") === (shown[key] ?? ""))) return;
    frame.contentWindow?.postMessage({ type: "nivix:query", query: `?${wanted}` }, window.location.origin);
  }

  private topEdgeCentre(geometry: Geometry): [number, number] | undefined {
    const rings =
      geometry.type === "Polygon"
        ? [geometry.coordinates]
        : geometry.type === "MultiPolygon"
          ? geometry.coordinates
          : [];
    const points = rings.flatMap((polygon) => polygon[0] ?? []);
    if (!points.length) return undefined;
    const lngs = points.map((p) => p[0]);
    const lats = points.map((p) => p[1]);
    return [(Math.min(...lngs) + Math.max(...lngs)) / 2, Math.max(...lats)];
  }

  private highlightOnMap(observation: FeatureProperties) {
    if (!this.map) return;
    if (observation.$geometry.type !== "Point") {
      const index = this.localObservations.indexOf(observation);
      if (index < 0) return;
      this.map.setFeatureState({ source: this.polygonSource, id: index }, { hover: true });
      this.highlightPolygon = index;
      // the popup stands above the cell, pointing at the middle of its top edge,
      // so the cell it names stays visible
      this.tooltipPopup
        .setLngLat(this.topEdgeCentre(observation.$geometry) ?? [observation.longitude, observation.latitude])
        .setHTML(this.markerService.tooltipHtml(observation))
        .addTo(this.map);
      return;
    }
    const marker = this.markerService.createMaplibreMarker(observation);
    if (!marker) return;
    const el = marker.getElement() as ObsMarkerElement;
    el.style.zIndex = "42000";
    const size = (parseFloat(el.style.width) || 40) * 1.6;
    el.style.width = `${size}px`;
    el.style.height = `${size}px`;
    marker.addTo(this.map);
    this.highlightMarker = marker;
    this.tooltipPopup
      .setLngLat(marker.getLngLat())
      .setHTML(el.tooltipHtml ?? "")
      .addTo(this.map);
  }

  onFilterChange(filter: FilterSelectionData<FeatureProperties>) {
    if (filter.type === "aspect") {
      this.loadSources();
    } else {
      this.applyLocalFilter();
    }
  }

  chartMouseOut() {
    this.clearHighlight();
    this.emphasizeMedian("downplay");
  }

  private emphasizeMedian(type: "highlight" | "downplay") {
    if (this.timeseriesDateIndex >= 0) {
      this.timeseriesInstance?.dispatchAction({ type, seriesIndex: 0, dataIndex: this.timeseriesDateIndex });
    }
  }

  chartClick($event: ECElementEvent) {
    const observation = this.chartObservations[$event.data[2] as number];
    if (observation) {
      this.showObservationDetails(observation);
    }
  }

  private clearHighlight() {
    this.highlightMarker?.remove();
    this.highlightMarker = undefined;
    if (this.highlightPolygon !== undefined) {
      this.map?.removeFeatureState({ source: this.polygonSource, id: this.highlightPolygon });
      this.highlightPolygon = undefined;
    }
    this.tooltipPopup.remove();
  }

  private setupPolygonLayer(map: MlMap) {
    map.addSource(this.polygonSource, {
      type: "geojson",
      promoteId: "index",
      data: { type: "FeatureCollection", features: [] },
    });
    map.addLayer({
      id: `${this.polygonSource}-fill`,
      type: "fill",
      source: this.polygonSource,
      paint: {
        "fill-color": ["get", "fillColor"],
        "fill-opacity": ["case", ["boolean", ["feature-state", "hover"], false], 1, ["get", "fillOpacity"]],
      },
    });
    map.addLayer({
      id: `${this.polygonSource}-line`,
      type: "line",
      source: this.polygonSource,
      paint: {
        "line-color": ["case", ["boolean", ["feature-state", "hover"], false], "#000", ["get", "color"]],
        "line-width": ["case", ["boolean", ["feature-state", "hover"], false], 4, ["get", "weight"]],
        "line-opacity": ["case", ["boolean", ["feature-state", "hover"], false], 1, ["get", "opacity"]],
      },
    });
    const fillId = `${this.polygonSource}-fill`;
    const obsAt = (e: MapLayerMouseEvent): FeatureProperties | undefined =>
      this.localObservations[e.features?.[0]?.properties?.["index"] as number];
    const hover = (e: MapLayerMouseEvent) => {
      if (this.markerHovered) return; // prefer the circle marker's tooltip
      map.getCanvas().style.cursor = "pointer";
      const o = obsAt(e);
      if (!o) return;
      this.tooltipPopup.setLngLat(e.lngLat);
      if (o === this.hoveredObservation) return;
      this.hoveredObservation = o;
      this.tooltipPopup.setHTML(this.markerService.tooltipHtml(o)).addTo(map);
      this.highlightInHazardChart(o);
    };
    map.on("mouseenter", fillId, hover);
    map.on("mousemove", fillId, hover);
    map.on("mouseleave", fillId, () => {
      map.getCanvas().style.cursor = "";
      this.hoveredObservation = undefined;
      this.tooltipPopup.remove();
      this.highlightInHazardChart(undefined);
    });
    map.on("click", fillId, (e) => {
      const o = obsAt(e);
      if (o) this.onObservationClick(o, e.originalEvent);
    });
    map.on("contextmenu", fillId, (e) => {
      const o = obsAt(e);
      if (o) this.showObservationDetails(o);
    });
  }

  private wirePointMarker(marker: MlMarker, observation: FeatureProperties) {
    const el = marker.getElement() as ObsMarkerElement;
    el.style.cursor = "pointer";
    el.addEventListener("mouseenter", () => {
      if (!this.map) return;
      this.markerHovered = true;
      this.tooltipPopup
        .setLngLat(marker.getLngLat())
        .setHTML(el.tooltipHtml ?? "")
        .addTo(this.map);
      this.highlightInHazardChart(observation);
    });
    el.addEventListener("mouseleave", () => {
      this.markerHovered = false;
      this.tooltipPopup.remove();
      this.highlightInHazardChart(undefined);
    });
    el.addEventListener("click", (e) => {
      // stop the click from also reaching the region layer underneath the marker
      e.stopPropagation();
      this.onObservationClick(observation, e);
    });
    el.addEventListener("contextmenu", (e) => {
      e.preventDefault();
      e.stopPropagation();
      this.showObservationDetails(observation);
    });
  }

  private addImageOverlay(overlay: { imageUrl?: string; imageBounds: number[][]; name: string }) {
    const map = this.map;
    if (!map || !overlay.imageUrl) return;
    const id = `awsome-overlay-${this.imageOverlays.length}`;
    const [[south, west], [north, east]] = overlay.imageBounds as [[number, number], [number, number]];
    map.addSource(id, {
      type: "image",
      url: overlay.imageUrl,
      coordinates: [
        [west, north],
        [east, north],
        [east, south],
        [west, south],
      ],
    });
    map.addLayer({ id, type: "raster", source: id, layout: { visibility: "none" } });
    this.imageOverlays.push({ id, name: overlay.name });
  }

  private removeImageOverlays() {
    const map = this.map;
    if (this.overlayControl && map) {
      map.removeControl(this.overlayControl);
    }
    this.overlayControl = undefined;
    for (const o of this.imageOverlays) {
      if (map?.getLayer(o.id)) map.removeLayer(o.id);
      if (map?.getSource(o.id)) map.removeSource(o.id);
    }
    this.imageOverlays = [];
  }

  /**
   * @see BaseMapService.handleClick
   */
  private onObservationClick(observation: FeatureProperties, e: MouseEvent) {
    const id = observation.region_id;

    if (e.shiftKey) {
      this.mapService.toggleSelectedRegions([id]);
    } else if (this.mapService.isRegionSelected(id)) {
      this.mapService.clearSelectedRegions();
    } else {
      this.mapService.setSelectedRegions([id]);
    }
    this.filterService.regions = new Set(this.mapService.getSelectedRegions());
    this.applyLocalFilter();

    if (this.isMobile) {
      this.layout = "details";
    }
  }

  private showObservationDetails(observation: FeatureProperties) {
    const previous =
      this.selectedObservation?.$source === observation.$source ? (this.selectedObservationDetails ?? []) : [];
    const active = this.selectedObservationActiveTabs[observation.$source];
    const activeIndex = previous.findIndex((p) => p.label === active);
    this.selectedObservation = observation;
    const regions = [...this.filterService.regions].sort();
    const band = this.filterService.filterSelectionData.find((f) => f.key === "band");
    // a template may address the selection: the selected regions (else the observation's) and bands
    const context = {
      ...observation,
      $regions: (regions.length ? regions : [observation.region_id]).join(","),
      $bands: [...(band?.selected ?? [])].sort().join(","),
    };
    this.selectedObservationDetails = observation.$sourceObject.detailsTemplates.map(({ label, template }, index) => {
      let html = this.markerService.formatTemplate(template, context);
      try {
        const dom = new DOMParser().parseFromString(html, "text/html");
        dom.querySelectorAll("[src]").forEach((node) => {
          node.setAttribute("src", new URL(node.getAttribute("src"), this.baseURL).toString());
        });
        html = dom.body.innerHTML;
      } catch (e) {
        console.warn("Failed update URLs using DOMParser", html, e);
      }
      const tab = { label: this.markerService.formatTemplate(label, context), source: html };
      // an unchanged tab keeps its object, so its content is not re-rendered; a tab whose
      // viewer frame is on the page and only got another query keeps it too and re-points
      // the frame; a steered tab that is not shown is rebuilt, for when it is
      const prev = previous[index];
      if (prev) {
        const steered = prev.frame !== undefined && prev.frame !== this.frameSrc(prev.source);
        const frame = prev.frame && this.detailsFrames().find((f) => f.getAttribute("src") === prev.frame);
        if (prev.source === tab.source && (!steered || frame)) return prev;
        if (frame && this.steerFrame(frame, html)) {
          prev.label = tab.label;
          prev.source = html;
          return prev;
        }
      }
      return { ...tab, html: this.sanitizer.bypassSecurityTrustHtml(html), frame: this.frameSrc(html) };
    });
    this.selectedObservationActiveTabs[observation.$source] = (
      this.selectedObservationDetails[activeIndex] ??
      this.selectedObservationDetails.find(({ label }) => label === active) ??
      this.selectedObservationDetails[0]
    ).label;
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
    return this.httpClient.get<T>(url, { cache: "no-cache" });
  }

  requestFullscreen($event: MouseEvent) {
    ($event.target as HTMLElement).parentElement.parentElement.requestFullscreen();
  }
}
