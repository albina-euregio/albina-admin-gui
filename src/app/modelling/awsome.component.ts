import { environment } from "../../environments/environment";
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
import { TranslateModule, TranslateService } from "@ngx-translate/core";
import type { ScatterSeriesOption } from "echarts/charts";
import type { GridComponentOption } from "echarts/components";
import type { ECElementEvent, EChartsCoreOption as EChartsOption } from "echarts/core";
import type {
  CallbackDataParams,
  LineSeriesOption,
  MarkLineOption,
  TooltipOption,
  XAXisOption,
  YAXisOption,
} from "echarts/types/dist/shared";
import { debounce } from "es-toolkit";
import { FeatureCollection, MultiPolygon } from "geojson";
import { Control, ImageOverlay, LatLngBoundsLiteral, LayerGroup, MarkerOptions } from "leaflet";
import { TabsModule } from "ngx-bootstrap/tabs";
import { NgxEchartsDirective } from "ngx-echarts";
import { firstValueFrom, type Subscription } from "rxjs";
import { map } from "rxjs/operators";
import Split from "split.js";
import * as z from "zod/v4";

type AwsomeSource = AwsomeSource0 & { $loading?: Subscription; $error?: unknown };

export type FeatureProperties = GeoJSON.Feature["properties"] & {
  $date: string;
  $stabilityIndex: string;
  $sourceObject?: AwsomeSource;
  $geometry: GeoJSON.Geometry;
  region_id: string;
  vstation?: string;
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
  private translateService = inject(TranslateService);

  // https://gitlab.com/avalanche-warning
  private configURL = environment.awsomeConfigUrl;
  private config$q: Promise<AwsomeConfig>;
  config: AwsomeConfig = {} as AwsomeConfig;
  date = "";
  layout: "map" | "chart" | "details" = "map";
  readonly mapDiv = viewChild<ElementRef<HTMLDivElement>>("observationsMap");
  private observations: FeatureProperties[] = [];
  private localObservations: FeatureProperties[] = [];
  selectedObservation: FeatureProperties | undefined = undefined;
  selectedObservationDetails: { label: DetailsTabLabel; html: SafeHtml }[] | undefined = undefined;
  selectedObservationActiveTabs = {} as Record<string, DetailsTabLabel>;
  sources: AwsomeSource[];
  private mapLayerControl = new Control.Layers();
  private mapLayer = new LayerGroup();
  private mapLayerHighlight = new LayerGroup();
  hazardChart: EChartsOption | undefined;
  timeseriesChart: EChartsOption | undefined;
  timeseriesChart$loading: Subscription;
  loadingState: "loading" | "error" | undefined;

  t(key: string) {
    let t = this.translateService.instant(`awsome.${key}`);
    if (typeof t === "string" && t.startsWith("awsome.")) {
      t = t.slice("awsome.".length);
    }
    return t;
  }

  async ngOnInit() {
    if (!globalThis.Temporal) {
      await import("temporal-polyfill/global");
    }

    // this.config = (await import("./awsome.json")) as unknown as Awsome;
    this.route.queryParamMap.subscribe((params) => {
      this.configURL = params.get("config") || this.configURL;
      this.date = params.get("date") || this.date;
    });
    this.config$q = firstValueFrom(this.fetchJSON(this.configURL)).then((c) => AwsomeConfigSchema.parseAsync(c));
    this.config = await this.config$q;
    this.date ||= this.config.date;
    this.sources = this.config.sources;

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
    return this.sources.filter((s) => this.filterService.inObservationSources(this.asSource(s)));
  }

  private asSource(source: AwsomeSource): ObservationSource {
    return source.name as unknown as ObservationSource;
  }

  async loadSources() {
    this.mapLayerControl.remove();
    this.mapLayerControl = new Control.Layers();
    this.observations.length = 0;
    this.applyLocalFilter();

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

    if (this.activeSources.some((s) => s.imageOverlays?.length)) {
      this.mapLayerControl.addTo(this.mapService.map);
    }

    this.filterService.filterSelectionData.forEach((filter) =>
      filter.buildChartsData(this.markerService.markerClassify, this.observations, (o) =>
        this.filterService.isSelected(o),
      ),
    );
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
      if (!source.domain) return;
      if (!source.toolchain) return;
      url.searchParams.append("domain", source.domain);
      url.searchParams.append("toolchain", source.toolchain);
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

  private async loadSource(source: AwsomeSource): Promise<FeatureProperties[]> {
    const date = this.albinaDate;
    const filterUrl = this.filterService.filterSelectionData.find(
      (f) => f.url && f.getSelectedValues("selected").length,
    );
    const url0 = new URL(filterUrl?.url ?? source.url, location.href);
    const url = this.setSearchParams(url0, [source]).toString();

    const aspectFilter = this.filterService.filterSelectionData.find((f) => f.type === "aspect");
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
              if (aspects.some((aspect) => feature.properties.snp_characteristics?.[aspect])) {
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
      regions = await firstValueFrom(
        this.fetchJSON<FeatureCollection<MultiPolygon, RegionProperties>>(this.config.regions?.url),
      );
    }

    await this.mapService.initMaps(this.mapDiv().nativeElement, {
      regions: regions,
      internalRegions: regions,
      clickMode: "awsome",
    });

    const [lat, lon, zoom] = this.config.mapCenter;
    this.mapService.map.setView([lat, lon], zoom);

    this.mapLayer.addTo(this.mapService.map);
    this.mapLayerHighlight.addTo(this.mapService.map);
    this.mapService.map.on({
      click: () => {
        this.filterService.regions = new Set(this.mapService.getSelectedRegions());
        this.applyLocalFilter();
      },
    });

    if (window.matchMedia("(min-width: 769px)").matches) {
      Split([".layout-left", ".layout-right"], { onDragEnd: () => this.mapService.map.invalidateSize() });
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

  applyLocalFilter() {
    this.mapLayer.clearLayers();
    const stabilityIndex = this.stabilityIndex;
    this.observations.forEach((o) => (o.$stabilityIndex = stabilityIndex?.type));
    this.localObservations = this.observations.filter(
      (observation) => this.filterService.isHighlighted(observation) || this.filterService.isSelected(observation),
    );
    this.localObservations.forEach((observation) => {
      const isHighlighted = this.filterService.isHighlighted(observation);
      const marker =
        observation.$geometry.type === "Polygon" || observation.$geometry.type === "MultiPolygon"
          ? this.markerService.createPolygonMarker(observation, isHighlighted, observation.$geometry)
          : this.markerService.createMarker(observation, isHighlighted);
      marker
        ?.on({
          tooltipopen: debounce(() => this.highlightInHazardChart(observation), 500),
          tooltipclose: debounce(() => this.highlightInHazardChart(undefined), 500),
          click: ($event) => this.onObservationClick(observation, $event.originalEvent),
          contextmenu: () => this.onObservationRightClick(observation),
        })
        ?.addTo(this.mapLayer);
    });

    this.filterService.filterSelectionData.forEach((filter) =>
      filter.buildChartsData(this.markerService.markerClassify, this.observations, (o) =>
        this.filterService.isSelected(o),
      ),
    );

    if (this.selectedObservation && !this.localObservations.includes(this.selectedObservation)) {
      const observation = this.localObservations.find((o) => o?.vstation === this.selectedObservation?.vstation);
      this.onObservationRightClick(observation);
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
    const data = this.localObservations.map((o) => this.toChartData(o));
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
      } satisfies XAXisOption,
      yAxis: {
        name: this.t(markerClassify.label),
        min: markerClassify.chartAxisRange?.[0],
        max: markerClassify.chartAxisRange?.[1],
        axisPointer: { type: "line" },
      } satisfies YAXisOption,
      grid: {
        left: 40,
        top: 40,
        bottom: 40,
        right: 40,
        backgroundColor: "#f7f7f7",
        show: true,
      } satisfies GridComponentOption,
      tooltip: {
        trigger: "axis",
        showContent: false,
        axisPointer: { type: "cross" },
      } satisfies TooltipOption,
      series: [
        {
          type: "scatter",
          itemStyle: {
            borderColor: "rgba(0, 0, 0, 0.3)",
            color: ({ data }) => grainType?.findForObservation(data[2] as FeatureProperties)?.color ?? "black",
          },
          data,
          symbolSize: 7,
        } satisfies ScatterSeriesOption,
        {
          type: "scatter",
          data: [],
          symbolSize: 15,
          color: "red",
        } satisfies ScatterSeriesOption,
        {
          type: "scatter",
          data: [],
          symbol: "diamond",
          symbolSize: 25,
          color: "green",
        } satisfies ScatterSeriesOption,
      ],
    } satisfies EChartsOption;
  }

  private toChartData(o: FeatureProperties): number[] {
    const markerClassify = this.markerService.markerClassify;
    const xType = this.filterService.filterSelectionData.find((f) => f.type === this.config.hazardChart?.xType);
    return [
      // snp_characteristics.Punstable.size_estimate
      xType.getValue(o) as number,
      // snp_characteristics.Punstable.value
      markerClassify.getValue(o) as number,
      // $event.data[2] as FeatureProperties
      o as unknown as number,
    ];
  }

  private highlightInHazardChart(observation: FeatureProperties) {
    this.hazardChart = { ...this.hazardChart };
    const series: ScatterSeriesOption = this.hazardChart.series[1];
    const xAxis: XAXisOption = this.hazardChart.xAxis;
    const yAxis: YAXisOption = this.hazardChart.yAxis;
    if (observation) {
      const data = this.toChartData(observation);
      series.data = [data];
      xAxis.axisPointer.value = data[0];
      xAxis.axisPointer.status = "show";
      yAxis.axisPointer.value = data[1];
      yAxis.axisPointer.status = "show";
    } else {
      series.data = [];
      xAxis.axisPointer.value = undefined;
      yAxis.axisPointer.value = undefined;
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
    this.timeseriesChart = undefined;
    this.timeseriesChart$loading?.unsubscribe();
    this.timeseriesChart$loading = undefined;
    const stabilityIndex = this.stabilityIndex;
    if (!stabilityIndex) {
      return;
    }

    const url0 = this.config.timeseriesChart?.url;
    if (!url0) {
      return;
    }
    const url = this.setSearchParams(new URL(url0, location.href), this.activeSources);

    this.timeseriesChart$loading = this.fetchJSON(url.toString()).subscribe((d) => {
      this.timeseriesChart$loading = undefined;
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
      const data = TimeseriesSchema.parse(d);
      const indexData = data.indexes[stabilityIndex.type];
      if (!indexData) {
        return;
      }
      this.timeseriesChart = {
        xAxis: {
          type: "time",
          nameLocation: "center",
          name: this.t("Date"),
        } satisfies XAXisOption,
        yAxis: {
          name: stabilityIndex.type,
        } satisfies YAXisOption,
        grid: {
          left: 40,
          top: 40,
          bottom: 40,
          right: 40,
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
            data: data.timestamps.map((t, i) => [t, indexData.mean[i]]),
            markLine: {
              data: [{ label: { formatter: "" }, xAxis: this.date }],
            } satisfies MarkLineOption,
          } satisfies LineSeriesOption,
          {
            name: "lower",
            type: "line",
            data: data.timestamps.map((t, i) => [t, indexData.lower[i]]),
            lineStyle: { opacity: 0 },
            stack: "confidence-band",
            symbol: "none",
          } satisfies LineSeriesOption,
          {
            name: "upper",
            type: "line",
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
                  data: data.timestamps.map((t, i) => [t, indexData.lower2[i]]),
                  lineStyle: { opacity: 0 },
                  stack: "confidence-band2",
                  symbol: "none",
                } satisfies LineSeriesOption,
                {
                  name: "upper",
                  type: "line",
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
      this.hazardChart = { ...this.hazardChart };
      const series: ScatterSeriesOption = this.hazardChart.series[2];
      if (this.config.hazardChart.xType === "size_estimate") {
        const i = data.timestamps.findIndex((t) => +t === Date.parse(this.date));
        series.data = i >= 0 ? [[indexData.size_estimate[i], indexData.mean[i]]] : [];
      } else {
        series.data = [];
      }
    });
  }

  chartMouseOver($event: ECElementEvent) {
    this.mapLayerHighlight.clearLayers();
    const observation = $event.data[2] as FeatureProperties;
    if (!observation) return;
    const marker = this.markerService.createMarker(observation, true);
    (marker.options as MarkerOptions).zIndexOffset = 42_000;
    marker.addTo(this.mapLayerHighlight);
    marker.toggleTooltip();
  }

  chartMouseOut() {
    this.mapLayerHighlight.clearLayers();
  }

  /**
   * @see BaseMapService.handleClick
   */
  private onObservationClick(observation: FeatureProperties, e: MouseEvent) {
    const id = observation.region_id;
    const editSelection = this.mapService.overlayMaps.editSelection;

    if (e.shiftKey) {
      editSelection.toggleSelectedRegions([id]);
    } else if (editSelection.isRegionSelected(id)) {
      editSelection.clearSelectedRegions();
    } else {
      editSelection.setSelectedRegions([id]);
    }
    editSelection.updateEditSelection();

    if (this.isMobile) {
      this.layout = "details";
    }
  }

  private onObservationRightClick(observation: FeatureProperties) {
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
